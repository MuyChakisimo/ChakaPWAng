// game.js

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameRunning = false;
let paused = false;
let score = 0;
let highScores = JSON.parse(localStorage.getItem("harunbe_scores")) || [];

let gorilla = {
  x: 100,
  y: canvas.height - 120,
  size: 60,
  vy: 0,
  gravity: 0.8,
  jumping: false,
  holdTime: 0,
  jumpPower: -18,
  onGround: true
};

let enemies = [];
let bananas = [];
let enemySpawnInterval = 2000;
let lastEnemySpawn = 0;
let speed = 5;
let lastTime = 0;

function drawGorilla() {
  ctx.save();
  ctx.translate(gorilla.x + gorilla.size, gorilla.y);
  ctx.scale(-1, 1);
  ctx.font = `${gorilla.size}px serif`;
  ctx.fillText("🦍", 0, 0);
  ctx.restore();
}

function drawEntities(entities, emoji) {
  entities.forEach(e => {
    ctx.font = `${e.size}px serif`;
    ctx.fillText(emoji, e.x, e.y);
  });
}

function updateEntities(entities, deltaTime) {
  return entities.filter(e => {
    e.x -= speed;
    return e.x + e.size > 0;
  });
}

function spawnEnemy() {
  const type = Math.random() > 0.5 ? "🐅" : "🦅";
  const size = 60;
  let y = type === "🦅" ? canvas.height / 2 : canvas.height - 120;
  enemies.push({ x: canvas.width, y, size, type });
}

function spawnBanana() {
  bananas.push({
    x: canvas.width,
    y: canvas.height / 2 + (Math.random() * 150 - 75),
    size: 40
  });
}

function detectCollision(a, b) {
  return a.x < b.x + b.size && a.x + gorilla.size > b.x && a.y < b.y && a.y + gorilla.size > b.y - b.size;
}

function handleCollisions() {
  enemies.forEach(e => {
    if (detectCollision(gorilla, e)) {
      endGame();
    }
  });

  bananas = bananas.filter(b => {
    if (detectCollision(gorilla, b)) {
      score++;
      return false;
    }
    return true;
  });
}

function gameLoop(timestamp) {
  if (!gameRunning || paused) return;
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update gorilla
  gorilla.vy += gorilla.gravity;
  gorilla.y += gorilla.vy;
  if (gorilla.y >= canvas.height - 120) {
    gorilla.y = canvas.height - 120;
    gorilla.vy = 0;
    gorilla.onGround = true;
  } else {
    gorilla.onGround = false;
  }

  // Draw ground (grass)
  ctx.fillStyle = "#4caf50";
  ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

  drawGorilla();
  drawEntities(enemies, e => e.type);
  drawEntities(bananas, "🍌");

  enemies = updateEntities(enemies, deltaTime);
  bananas = updateEntities(bananas, deltaTime);

  handleCollisions();

  // Spawn logic
  if (timestamp - lastEnemySpawn > enemySpawnInterval) {
    if (enemies.length < 2) spawnEnemy();
    if (Math.random() < 0.5) spawnBanana();
    lastEnemySpawn = timestamp;
  }

  // Increase speed gradually
  speed += 0.0005;

  requestAnimationFrame(gameLoop);
}

function startGame() {
  enemies = [];
  bananas = [];
  score = 0;
  speed = 5;
  lastTime = performance.now();
  gameRunning = true;
  document.getElementById("gameOverScreen").classList.add("hidden");
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  updateHighScores();
  document.getElementById("currentScore").textContent = score;
  renderHighScores();
  document.getElementById("gameOverScreen").classList.remove("hidden");
}

function updateHighScores() {
  highScores.push(score);
  highScores.sort((a, b) => b - a);
  highScores = highScores.slice(0, 5);
  localStorage.setItem("harunbe_scores", JSON.stringify(highScores));
}

function renderHighScores() {
  const list = document.getElementById("highScores");
  list.innerHTML = "";
  highScores.forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    list.appendChild(li);
  });
}

function pauseGame() {
  paused = true;
  document.getElementById("pauseMenu").classList.remove("hidden");
}

function resumeGame() {
  paused = false;
  document.getElementById("pauseMenu").classList.add("hidden");
  requestAnimationFrame(gameLoop);
}

function goToMenu() {
  window.location.href = "index.html";
}

function restartGame() {
  startGame();
}

document.getElementById("jumpBtn").addEventListener("touchstart", () => {
  if (gorilla.onGround && !gorilla.jumping) {
    gorilla.jumping = true;
    gorilla.holdTime = performance.now();
  }
});

document.getElementById("jumpBtn").addEventListener("touchend", () => {
  if (gorilla.jumping) {
    const held = Math.min(performance.now() - gorilla.holdTime, 1500);
    gorilla.vy = gorilla.jumpPower * (held / 1500);
    gorilla.jumping = false;
  }
});

document.getElementById("menuBtn").addEventListener("click", pauseGame);

startGame();
