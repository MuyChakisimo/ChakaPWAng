const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameStarted = false;
let gameOver = false;
let paused = false;
let score = 0;
let highScores = JSON.parse(localStorage.getItem('bananaHighScores') || '[]');

// Monkey properties
const monkey = {
  x: 50,
  y: 180,
  vy: 0,
  width: 40,
  height: 40,
  onGround: true
};

const gravity = 0.5;
const jumpStrength = -10;

// Touch jump logic
let jumpHoldStart = 0;
document.getElementById('jumpBtn').addEventListener('touchstart', (e) => {
  if (!gameStarted || gameOver || paused) return;
  e.preventDefault();
  jumpHoldStart = Date.now();
});

document.getElementById('jumpBtn').addEventListener('touchend', (e) => {
  if (!gameStarted || gameOver || paused) return;
  e.preventDefault();
  const holdDuration = Date.now() - jumpHoldStart;
  const jumpForce = Math.max(jumpStrength, jumpStrength * (holdDuration / 100));
  if (monkey.onGround) {
    monkey.vy = jumpForce;
    monkey.onGround = false;
  }
});

// Pause logic
document.getElementById('pauseBtn').addEventListener('click', () => {
  if (!gameStarted || gameOver) return;
  paused = true;
  document.getElementById('pauseMenu').classList.remove('hidden');
});

function resumeGame() {
  paused = false;
  document.getElementById('pauseMenu').classList.add('hidden');
  loop();
}

// Enemies
let lions = [];
let hawks = [];
let lastLionX = -999;
let lastHawkX = -999;

function spawnLion() {
  if (canvas.width - lastLionX > 120) {
    lions.push({ x: canvas.width, y: 180, width: 40, height: 40 });
    lastLionX = canvas.width;
  }
}
function spawnHawk() {
  if (canvas.width - lastHawkX > 150) {
    hawks.push({ x: canvas.width, y: 100, width: 40, height: 40 });
    lastHawkX = canvas.width;
  }
}

function update() {
  // Gravity
  monkey.vy += gravity;
  monkey.y += monkey.vy;

  // Ground collision
  if (monkey.y >= 180) {
    monkey.y = 180;
    monkey.vy = 0;
    monkey.onGround = true;
  }

  // Move enemies
  lions.forEach(l => l.x -= 5);
  hawks.forEach(h => h.x -= 7);

  // Remove off-screen
  lions = lions.filter(l => l.x + l.width > 0);
  hawks = hawks.filter(h => h.x + h.width > 0);

  // Spawn
  if (Math.random() < 0.02) spawnLion();
  if (Math.random() < 0.01) spawnHawk();

  // Collision
  [...lions, ...hawks].forEach(enemy => {
    if (
      monkey.x < enemy.x + enemy.width &&
      monkey.x + monkey.width > enemy.x &&
      monkey.y < enemy.y + enemy.height &&
      monkey.y + monkey.height > enemy.y
    ) {
      gameOver = true;
      endGame();
    }
  });

  // Score
  score++;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e0f7fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ff9800';
  ctx.fillRect(monkey.x, monkey.y, monkey.width, monkey.height);

  ctx.fillStyle = '#e53935';
  lions.forEach(l => ctx.fillRect(l.x, l.y, l.width, l.height));
  ctx.fillStyle = '#1e88e5';
  hawks.forEach(h => ctx.fillRect(h.x, h.y, h.width, h.height));

  ctx.fillStyle = 'black';
  ctx.font = '20px sans-serif';
  ctx.fillText('Score: ' + score, 10, 30);
}

function loop() {
  if (!gameStarted || gameOver || paused) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

function drawCountdown() {
  const overlay = document.getElementById('countdownOverlay');
  const text = document.getElementById('countdownText');
  overlay.classList.remove('hidden');
  text.textContent = countdown > 0 ? countdown : 'Go!';
}

function endGame() {
  document.getElementById('gameOverScreen').classList.remove('hidden');
  document.getElementById('finalScore').textContent = 'Your Score: ' + score;

  // Save score
  highScores.push(score);
  highScores.sort((a, b) => b - a);
  highScores = highScores.slice(0, 5);
  localStorage.setItem('bananaHighScores', JSON.stringify(highScores));

  const list = highScores.map((s, i) => `<p>#${i + 1}: ${s}</p>`).join('');
  document.getElementById('highScores').innerHTML = list;
}

// Countdown
let countdown = 3;
function preGameLoop() {
  drawCountdown();
  if (countdown > 0) {
    setTimeout(() => {
      countdown--;
      preGameLoop();
    }, 1000);
  } else {
    setTimeout(() => {
      document.getElementById('countdownOverlay').classList.add('hidden');
      gameStarted = true;
      loop();
    }, 1000);
  }
}

preGameLoop();
