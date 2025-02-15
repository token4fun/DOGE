// js/game.js
document.addEventListener("DOMContentLoaded", function() {
  "use strict";

  // Variáveis globais do jogo
  let gameRunning = false;
  let isPaused = false;

  // REFERÊNCIAS DOS ELEMENTOS
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  const loadingBar = document.getElementById('loadingBar');
  const splashModal = document.getElementById('splashModal');
  const instructionsModal = document.getElementById('instructionsModal');
  const startGameBtn = document.getElementById('startGameBtn');
  const pauseModal = document.getElementById('pauseModal');
  const gameInfo = document.getElementById('gameInfo');

  // Esconde splash e instruções inicialmente
  splashModal.classList.add('hidden');
  instructionsModal.classList.add('hidden');

  // Simula a evolução da barra até 90%
  let progress = 0;
  const progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += Math.random() * 5;
      if (progress > 90) progress = 90;
      updateProgress(progress);
    }
  }, 200);

  function updateProgress(value) {
    loadingBar.style.width = value + "%";
    loadingText.textContent = "Loading Game... " + Math.floor(value) + "%";
  }

  // Pré-carrega a imagem logo.png
  const logoImg = new Image();
  logoImg.src = "images/logo.png";
  logoImg.onerror = function() {
    console.error("Erro ao carregar logo.png");
    clearInterval(progressInterval);
    progress = 100;
    updateProgress(progress);
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      splashModal.classList.remove('hidden');
      setTimeout(() => { splashModal.classList.add('hidden'); }, 3500);
      setTimeout(() => { instructionsModal.classList.remove('hidden'); }, 3600);
    }, 500);
  };
  logoImg.onload = function() {
    clearInterval(progressInterval);
    progress = 100;
    updateProgress(progress);
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      splashModal.classList.remove('hidden');
      setTimeout(() => { splashModal.classList.add('hidden'); }, 3500);
      setTimeout(() => { instructionsModal.classList.remove('hidden'); }, 3600);
    }, 500);
  };

  // Botão "Play": inicia o jogo
  startGameBtn.addEventListener('click', function() {
    instructionsModal.classList.add('hidden');
    startGame();
  });

  // Listener para tecla ESC para pausar/retomar
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      if (!isPaused) {
        pauseGame();
      } else {
        resumeGame();
      }
    }
  });

  function pauseGame() {
    isPaused = true;
    gameRunning = false;
    bgMusic.pause();
    pauseModal.classList.remove('hidden');
  }

  function resumeGame() {
    isPaused = false;
    pauseModal.classList.add('hidden');
    bgMusic.play();
    gameRunning = true;
    gameLoop();
  }

  /* ===================== CONFIGURAÇÃO DO JOGO ===================== */
  const isMobile = () => window.innerWidth <= 600;
  const ballSize = isMobile() ? 35 : 50;
  const playerHeight = isMobile() ? 100 : 200;
  const paddleDistance = isMobile() ? 50 : 100;
  const MAX_SPEED = 15;

  const canvas = document.getElementById("pongCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let ballWidth = ballSize;
  let ballHeight = ballSize;
  const ball = document.getElementById("ball");
  ball.style.width = ballWidth + "px";
  ball.style.height = ballHeight + "px";

  const sherkScoreEl = document.getElementById("sherkScore");
  const bonkScoreEl = document.getElementById("bonkScore");
  const sherkMatchEl = document.getElementById("sherkMatches");
  const bonkMatchEl = document.getElementById("bonkMatches");
  const winnerMsgEl = document.getElementById("winner-message");
  const winnerTextEl = document.getElementById("winner-text");
  const winnerButton = document.getElementById("winner-button");
  const gameMessageEl = document.getElementById("game-message");

  const hitSound = document.getElementById("hitSound");
  const bgMusic = document.getElementById("bgMusic");
  const pointSound = document.getElementById("pointSound");
  const deuceSound = document.getElementById("deuceSound");
  const matchPointSound = document.getElementById("matchPointSound");
  const gameSetMatchSound = document.getElementById("gameSetMatchSound");
  bgMusic.volume = 0.3;

  let initialSpeedX = 2, initialSpeedY = 1.5;
  let ballX = canvas.width / 2, ballY = canvas.height / 2;
  let ballSpeedX = initialSpeedX, ballSpeedY = initialSpeedY, ballAngle = 0;

  let sherkY = canvas.height / 2 - playerHeight / 2;
  let bonkY = canvas.height / 2 - playerHeight / 2;

  let leftScore = 0, rightScore = 0;
  let sherkMatches = 0, bonkMatches = 0;

  // Atualiza o overlay de informações do jogo (velocidade e dificuldade)
  function updateGameInfo() {
    const avgSpeed = ((Math.abs(ballSpeedX) + Math.abs(ballSpeedY)) / 2).toFixed(2);
    let difficulty;
    if (avgSpeed <= 4) {
      difficulty = "Piece of Cake";
    } else if (avgSpeed <= 5) {
      difficulty = "Easy";
    } else if (avgSpeed <= 8) {
      difficulty = "Medium";
    } else if (avgSpeed <= 10) {
      difficulty = "Hard";
    } else {
      difficulty = "Super DOGE";
    }
    gameInfo.textContent = `Ball Speed: ${avgSpeed} | Difficulty: ${difficulty}`;
  }

  function showMessageSequence(messages) {
    if (!messages || messages.length === 0) return;
    const [first, ...rest] = messages;
    gameMessageEl.innerText = first;
    gameMessageEl.style.display = "block";
    setTimeout(() => {
      gameMessageEl.style.display = "none";
      if (rest.length > 0) showMessageSequence(rest);
    }, 1500);
  }

  document.addEventListener("mousemove", e => {
    if (gameRunning) {
      sherkY = Math.max(0, Math.min(canvas.height - playerHeight, e.clientY - playerHeight / 2));
    }
  });
  let touchStartY = 0;
  document.addEventListener("touchstart", e => {
    touchStartY = e.touches[0].clientY;
  });
  document.addEventListener("touchmove", e => {
    if (gameRunning) {
      let deltaY = e.touches[0].clientY - touchStartY;
      sherkY = Math.max(0, Math.min(canvas.height - playerHeight, sherkY + deltaY));
      touchStartY = e.touches[0].clientY;
    }
  });

  function startGame() {
    gameRunning = true;
    bgMusic.play();
    gameLoop();
  }

  function increaseBallSpeed() {
    ballSpeedX *= 1.05;
    ballSpeedY *= 1.05;
    if (Math.abs(ballSpeedX) > MAX_SPEED) {
      ballSpeedX = Math.sign(ballSpeedX) * MAX_SPEED;
    }
    if (Math.abs(ballSpeedY) > MAX_SPEED) {
      ballSpeedY = Math.sign(ballSpeedY) * MAX_SPEED;
    }
  }

  function updateScore(winner) {
    const pointMessage = `Point for ${winner}!`;
    let finalMessages = [pointMessage];
    if (winner === "Super Doge") {
      leftScore++;
    } else if (winner === "Elon Musk") {
      rightScore++;
    }
    if (leftScore === 4 && rightScore === 4) {
      finalMessages.push("Deuce!");
      if (sherkMatches === 2 || bonkMatches === 2) {
        finalMessages.push("Next point wins the Match");
      } else {
        finalMessages.push("Next point wins the Game");
      }
    } else if ((leftScore === 4 && rightScore === 3) ||
               (rightScore === 4 && leftScore === 3)) {
      const leadIsSuperDoge = (leftScore === 4 && leftScore - rightScore === 1);
      const leadIsElon = (rightScore === 4 && rightScore - leftScore === 1);
      if (leadIsSuperDoge) {
        finalMessages.push(sherkMatches === 2 ? "This is the Match point for Super Doge" : "This is the Game point for Super Doge");
      } else if (leadIsElon) {
        finalMessages.push(bonkMatches === 2 ? "This is the Match point for Elon Musk" : "This is the Game point for Elon Musk");
      }
    }
    showMessageSequence(finalMessages);
    pointSound.play();
  }

  function drawScore() {
    sherkScoreEl.innerText = leftScore;
    bonkScoreEl.innerText = rightScore;
    if (leftScore > rightScore) {
      sherkScoreEl.style.color = "blue";
      bonkScoreEl.style.color = "red";
    } else if (rightScore > leftScore) {
      sherkScoreEl.style.color = "red";
      bonkScoreEl.style.color = "blue";
    } else {
      sherkScoreEl.style.color = "#00ff00";
      bonkScoreEl.style.color = "#00ff00";
    }
    sherkMatchEl.innerText = `Matches: ${sherkMatches}`;
    bonkMatchEl.innerText = `Matches: ${bonkMatches}`;
  }

  function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 2;
    ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * 1.5;
    ballAngle = 0;
  }

  function checkChampion() {
    gameRunning = false;
    bgMusic.pause();
    gameSetMatchSound.currentTime = 0;
    gameSetMatchSound.play();
    winnerMsgEl.style.display = "block";
    winnerTextEl.innerText = "Game, Set, Match!";
    if (sherkMatches === 3 || bonkMatches === 3) {
      winnerButton.innerText = "Start New Game";
    } else {
      winnerButton.innerText = "Start Next Match Game";
    }
  }

  function updateBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    ballAngle += 5;
    ball.style.transform = `rotate(${ballAngle}deg)`;
    if (ballY <= 0) {
      ballY = 0;
      ballSpeedY = -ballSpeedY;
    } else if (ballY + ballHeight >= canvas.height) {
      ballY = canvas.height - ballHeight;
      ballSpeedY = -ballSpeedY;
    }
    if (ballX <= paddleDistance && ballY > sherkY && ballY < sherkY + playerHeight) {
      ballX = paddleDistance + 1;
      ballSpeedX = -ballSpeedX;
      increaseBallSpeed();
      hitSound.play();
    }
    if (ballX + ballWidth >= canvas.width - paddleDistance &&
        ballY > bonkY && ballY < bonkY + playerHeight) {
      ballX = canvas.width - paddleDistance - ballWidth - 1;
      ballSpeedX = -ballSpeedX;
      increaseBallSpeed();
      hitSound.play();
    }
    if (ballX < 0) {
      updateScore("Elon Musk");
      drawScore();
      if (rightScore === 5) {
        bonkMatches++;
        drawScore();
        checkChampion();
        return;
      }
      resetBall();
    } else if (ballX > canvas.width) {
      updateScore("Super Doge");
      drawScore();
      if (leftScore === 5) {
        sherkMatches++;
        drawScore();
        checkChampion();
        return;
      }
      resetBall();
    }
    moveBonk();
    movePlayers();
    updateGameInfo();
  }

  // IA: move 10% da diferença entre o paddle da IA e o alvo
  function moveBonk() {
    let targetY = ballY - playerHeight / 2;
    bonkY += (targetY - bonkY) * 0.10;
    bonkY = Math.max(0, Math.min(canvas.height - playerHeight, bonkY));
  }

  function movePlayers() {
    document.getElementById("sherk").style.top = `${sherkY}px`;
    document.getElementById("bonk").style.top = `${bonkY}px`;
    ball.style.left = `${ballX}px`;
    ball.style.top = `${ballY}px`;
  }

  function gameLoop() {
    updateBall();
    if (gameRunning) {
      requestAnimationFrame(gameLoop);
    }
  }

  function startNextAction() {
    if (sherkMatches === 3 || bonkMatches === 3) {
      sherkMatches = 0;
      bonkMatches = 0;
    }
    winnerMsgEl.style.display = "none";
    leftScore = 0;
    rightScore = 0;
    drawScore();
    resetBall();
    bgMusic.currentTime = 0;
    bgMusic.play();
    gameRunning = true;
    gameLoop();
  }

  function openDocs() {
    document.getElementById("docs-popup").style.display = "block";
  }
  function closeDocs() {
    document.getElementById("docs-popup").style.display = "none";
  }

  // Expor funções globais necessárias
  window.startNextAction = startNextAction;
  window.openDocs = openDocs;
  window.closeDocs = closeDocs;
});
