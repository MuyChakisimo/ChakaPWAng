// HaRUNbe Endless Runner Game

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameRunning = false;
let gamePaused = false;
let jumpStartTime = null;
let highScores = JSON.parse(localStorage.getItem('harunbeScores') || '[]');

const gravity = 0.8;
const maxJumpTime = 1500;
const maxJumpVelocity = -20;
let spawnTimer = 0;
let speedMultiplier = 1;

const groundY = canvas.height - 150;

const gorilla = {
  x: 100,
  y: groundY,
  width: 50,
  height: 50,
  vy: 0,
  color: 'white',
  update() {
    this.vy += gravity;
    this.y += this.vy;

    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
    }
  },
  isOnGround() {
    return this.y >= groundY;
  },
  draw() {
    ctx.font = '40px serif';
    ctx.save();
    ctx.scale(-1, 1);
    ctx.fillText('🦍', -this.x, this.y);
    ctx.restore();
  }
};

const enemies = [];
const bananas = [];
let score = 0;

function spawnEnemy() {
  if (enemies.length >= 2) return;
  const type = Math.random() < 0.5 ? 'tiger' : 'hawk';
  const y = type === 'tiger' ? groundY : 100 + Math.random() * 100;
  enemies.push({
    x: canvas.width + 50,
    y,
    type,
    width: 50,
    height: 50,
    speed: 6 * speedMultiplier
  });
}

function spawnBanana() {
  bananas.push({
    x: canvas.width + 50,
    y: 150 + Math.random() * (canvas.height - 300),
    width: 40,
    height: 40,
    speed: 4 * speedMultiplier
  });
}

function resetGame() {
  enemies.length = 0;
  bananas.length = 0;
  gorilla.y = groundY;
  gorilla.vy = 0;
  score = 0;
  speedMultiplier = 1;
  gameRunning = true;
  gamePaused = false;
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  highScores.push(score);
  highScores.sort((a, b) => b - a);
  highScores = highScores.slice(0, 5);
  localStorage.setItem('harunbeScores', JSON.stringify(highScores));
  showGameOver();
}

function showGameOver() {
  alert(`Game Over!\nYour Score: ${score}\nTop Scores: ${highScores.join(', ')}`);
}

function drawBackground() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'green';
  ctx.fillRect(0, groundY + 50, canvas.width, 100);
  ctx.font = '20px serif';
  ctx.fillText('🌱'.repeat(Math.floor(canvas.width / 20)), 0, groundY + 80);
}

function drawUI() {
  ctx.fillStyle = 'white';
  ctx.font = '24px sans-serif';
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function gameLoop() {
  if (!gameRunning || gamePaused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  gorilla.update();
  gorilla.draw();

  // Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.x -= e.speed;
    ctx.font = '40px serif';
    ctx.fillText(e.type === 'tiger' ? '🐅' : '🦅', e.x, e.y);
    if (
      e.x < gorilla.x + gorilla.width &&
      e.x + e.width > gorilla.x &&
      e.y < gorilla.y + gorilla.height &&
      e.y + e.height > gorilla.y
    ) {
      endGame();
      return;
    }
    if (e.x + e.width < 0) {
      enemies.splice(i, 1);
      score++;
      speedMultiplier += 0.02;
    }
  }

  // Bananas
  for (let i = bananas.length - 1; i >= 0; i--) {
    const b = bananas[i];
    b.x -= b.speed;
    ctx.font = '36px serif';
    ctx.fillText('🍌', b.x, b.y);
    if (
      b.x < gorilla.x + gorilla.width &&
      b.x + b.width > gorilla.x &&
      b.y < gorilla.y + gorilla.height &&
      b.y + b.height > gorilla.y
    ) {
      bananas.splice(i, 1);
      score += 3;
    }
  }

  drawUI();

  // Spawning
  spawnTimer++;
  if (spawnTimer % 90 === 0) spawnEnemy();
  if (spawnTimer % 150 === 0) spawnBanana();

  requestAnimationFrame(gameLoop);
}

// Touch controls
canvas.addEventListener('touchstart', (e) => {
  if (!gameRunning) {
    resetGame();
    return;
  }

  if (gorilla.isOnGround()) {
    jumpStartTime = Date.now();
  }
});

canvas.addEventListener('touchend', (e) => {
  if (jumpStartTime && gorilla.isOnGround()) {
    const heldTime = Math.min(Date.now() - jumpStartTime, maxJumpTime);
    const power = heldTime / maxJumpTime;
    gorilla.vy = maxJumpVelocity * power;
  }
  jumpStartTime = null;
});

// Pause button area
const pauseButton = document.createElement('button');
pauseButton.textContent = '☰';
pauseButton.id = 'pauseBtn';
pauseButton.style.position = 'absolute';
pauseButton.style.top = '10px';
pauseButton.style.left = '10px';
pauseButton.style.zIndex = '10';
document.body.appendChild(pauseButton);

pauseButton.addEventListener('click', () => {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  if (!gamePaused) requestAnimationFrame(gameLoop);
});