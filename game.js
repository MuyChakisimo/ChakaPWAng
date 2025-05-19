// game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameRunning = false;
let gamePaused = false;
let gameOver = false;
let countdown = 3;
let countdownInterval;

let startTime = null;
let speedMultiplier = 1;
let highScores = JSON.parse(localStorage.getItem('harunbeScores')) || [];

// Player settings
const player = {
  x: 50,
  y: 0,
  width: 50,
  height: 50,
  vy: 0,
  gravity: 1.2,
  jumpStrength: -20,
  grounded: false,
  jumpTimer: 0,
  maxJumpTime: 1500,
  jumping: false,
};

// Ground
const groundHeight = 80;

// Assets
const emojis = {
  gorilla: '🦍',
  tiger: '🐅',
  hawk: '🦅',
  banana: '🍌',
};

// Enemies and bananas
let objects = [];
let spawnTimer = 0;
const spawnInterval = 2000;

let score = 0;

function resetGame() {
  objects = [];
  player.y = canvas.height - groundHeight - player.height;
  player.vy = 0;
  score = 0;
  speedMultiplier = 1;
  gameRunning = false;
  gameOver = false;
}

function drawEmoji(emoji, x, y, size) {
  ctx.font = `${size}px serif`;
  ctx.textAlign = 'left';
  ctx.fillText(emoji, x, y);
}

function spawnObject() {
  if (objects.length >= 2) return;

  const types = ['tiger', 'hawk', 'banana'];
  const type = types[Math.floor(Math.random() * types.length)];

  const size = 50;
  let y = canvas.height - groundHeight - size;
  if (type === 'hawk') y = canvas.height / 3;
  if (type === 'banana') y = canvas.height / 2 + Math.random() * 100;

  objects.push({
    type,
    x: canvas.width,
    y,
    size,
  });
}

function update(delta) {
  if (!gameRunning || gamePaused || gameOver) return;

  // Gravity
  player.vy += player.gravity;
  player.y += player.vy;
  if (player.y >= canvas.height - groundHeight - player.height) {
    player.y = canvas.height - groundHeight - player.height;
    player.vy = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  // Objects
  objects.forEach(obj => obj.x -= 5 * speedMultiplier);
  objects = objects.filter(obj => obj.x + obj.size > 0);

  // Collision
  for (let obj of objects) {
    const collides = obj.x < player.x + player.width &&
      obj.x + obj.size > player.x &&
      obj.y < player.y + player.height &&
      obj.y + obj.size > player.y;

    if (collides) {
      if (obj.type === 'banana') {
        score++;
        speedMultiplier += 0.05;
        objects = objects.filter(o => o !== obj);
      } else {
        endGame();
        return;
      }
    }
  }

  // Spawn
  spawnTimer += delta;
  if (spawnTimer > spawnInterval / speedMultiplier) {
    spawnObject();
    spawnTimer = 0;
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Player
  ctx.save();
  ctx.translate(player.x + player.width, player.y);
  ctx.scale(-1, 1);
  drawEmoji(emojis.gorilla, 0, player.height, 50);
  ctx.restore();

  // Objects
  objects.forEach(obj => drawEmoji(emojis[obj.type], obj.x, obj.y + obj.size, obj.size));

  // Score
  ctx.fillStyle = 'white';
  ctx.font = '24px sans-serif';
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function loop(timestamp) {
  if (!startTime) startTime = timestamp;
  const delta = timestamp - startTime;
  startTime = timestamp;

  update(delta);
  render();

  requestAnimationFrame(loop);
}

function startCountdown() {
  countdown = 3;
  document.getElementById('countdown').classList.remove('hidden');
  document.getElementById('countdownText').textContent = countdown;

  countdownInterval = setInterval(() => {
    countdown--;
    if (countdown === 0) {
      clearInterval(countdownInterval);
      document.getElementById('countdown').classList.add('hidden');
      gameRunning = true;
    }
    document.getElementById('countdownText').textContent = countdown || 'Go!';
  }, 1000);
}

function endGame() {
  gameOver = true;
  gameRunning = false;

  highScores.push(score);
  highScores.sort((a, b) => b - a);
  highScores = highScores.slice(0, 5);
  localStorage.setItem('harunbeScores', JSON.stringify(highScores));

  const list = document.getElementById('scoreList');
  list.innerHTML = '';
  highScores.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    list.appendChild(li);
  });

  document.getElementById('gameOverScreen').classList.remove('hidden');
}

function jumpStart() {
  if (!player.grounded || player.jumping) return;
  player.jumping = true;
  player.jumpTimer = performance.now();
  player.vy = player.jumpStrength;
}

function jumpEnd() {
  if (!player.jumping) return;
  const held = performance.now() - player.jumpTimer;
  if (held > player.maxJumpTime) return;

  // no boost if held too long
  player.jumping = false;
}

// Event listeners

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

document.getElementById('jumpBtn').addEventListener('touchstart', e => {
  e.preventDefault();
  jumpStart();
}, { passive: false });

document.getElementById('jumpBtn').addEventListener('touchend', e => {
  e.preventDefault();
  jumpEnd();
}, { passive: false });

document.getElementById('pauseBtn').addEventListener('click', () => {
  gamePaused = true;
  document.getElementById('pauseMenu').classList.remove('hidden');
});

document.getElementById('resumeBtn').addEventListener('click', () => {
  gamePaused = false;
  document.getElementById('pauseMenu').classList.add('hidden');
});

document.getElementById('backBtn').addEventListener('click', () => {
  location.href = 'index.html';
});

document.getElementById('restartBtn').addEventListener('click', () => {
  resetGame();
  document.getElementById('gameOverScreen').classList.add('hidden');
  startCountdown();
});

// Start game
resetGame();
startCountdown();
requestAnimationFrame(loop);