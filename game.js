// game.js

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 320;
canvas.height = 240;

let monkey = { x: 50, y: 180, width: 24, height: 24, vy: 0, onGround: true };
let bananas = [];
let lions = [];
let hawks = [];
let score = 0;
let speed = 2;
let gravity = 0.8;
let jumpStrength = -12;
let gameOver = false;

let highScores = JSON.parse(localStorage.getItem('bananaHighScores')) || [];

function drawEmoji(x, y, emoji) {
  ctx.font = '20px Arial';
  ctx.fillText(emoji, x, y);
}

function spawnBanana() {
  bananas.push({ x: canvas.width, y: 160 });
}
function spawnLion() {
  lions.push({ x: canvas.width, y: 180 });
}
function spawnHawk() {
  hawks.push({ x: canvas.width, y: 100 });
}

function update() {
  if (gameOver) return;

  monkey.vy += gravity;
  monkey.y += monkey.vy;
  if (monkey.y >= 180) {
    monkey.y = 180;
    monkey.vy = 0;
    monkey.onGround = true;
  }

  bananas.forEach(b => b.x -= speed);
  lions.forEach(l => l.x -= speed);
  hawks.forEach(h => h.x -= speed + 1);

  bananas = bananas.filter(b => b.x > -20);
  lions = lions.filter(l => l.x > -20);
  hawks = hawks.filter(h => h.x > -20);

  bananas.forEach(b => {
    if (Math.abs(monkey.x - b.x) < 20 && Math.abs(monkey.y - b.y) < 20) {
      score++;
      bananas.splice(bananas.indexOf(b), 1);
      if (score % 5 === 0) speed += 0.5;
    }
  });

  lions.concat(hawks).forEach(obstacle => {
    if (Math.abs(monkey.x - obstacle.x) < 20 && Math.abs(monkey.y - obstacle.y) < 20) {
      endGame();
    }
  });

  if (Math.random() < 0.02) spawnBanana();
  if (Math.random() < 0.01) spawnLion();
  if (Math.random() < 0.01) spawnHawk();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawEmoji(monkey.x, monkey.y, '🐵');

  bananas.forEach(b => drawEmoji(b.x, b.y, '🍌'));
  lions.forEach(l => drawEmoji(l.x, l.y, '🦁'));
  hawks.forEach(h => drawEmoji(h.x, h.y, '🦅'));

  ctx.fillStyle = 'black';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);
}

function endGame() {
  gameOver = true;
  highScores.push(score);
  highScores = highScores.sort((a, b) => b - a).slice(0, 5);
  localStorage.setItem('bananaHighScores', JSON.stringify(highScores));
  setTimeout(showGameOverScreen, 500);
}

function showGameOverScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.font = '18px sans-serif';
  ctx.fillText('Game Over!', 100, 50);
  ctx.fillText('Your Score: ' + score, 90, 80);
  ctx.fillText('Top 5:', 120, 110);
  highScores.forEach((s, i) => {
    ctx.fillText(`${i + 1}. ${s}`, 140, 130 + i * 20);
  });

  ctx.fillText('[R] Replay', 100, 230);
  ctx.fillText('[M] Menu', 180, 230);
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'ArrowUp') && monkey.onGround) {
    monkey.vy = jumpStrength;
    monkey.onGround = false;
  }
  if (gameOver) {
    if (e.key.toLowerCase() === 'r') {
      location.reload();
    }
    if (e.key.toLowerCase() === 'm') {
      window.location.href = 'index.html';
    }
  }
});

loop();

