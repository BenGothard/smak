const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const classSelect = document.getElementById('classSelect');
const resultModal = document.getElementById('resultModal');
const resultText = document.getElementById('resultText');
const modalRestartBtn = document.getElementById('modalRestartBtn');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const FIGHTER_SIZE = 48;

const MIN_SPAWN_DISTANCE = 200;
const castleEmoji = '🏰';
const skullEmoji = '💀';
const crownEmoji = '👑';
const projectileEmojis = {
  wizard: '✴️',
  demon: '🔥',
  knight: '⚔️',
  archer: '🏹',
  monk: '💫',
  axe_thrower: '🪓'
};

const sprites = {
  wizard: 'images/wizard.png',
  demon: 'images/demon.png',
  knight: 'images/knight.png',
  archer: 'images/archer.png',
  monk: 'images/monk.png',
  axe_thrower: 'images/axe_thrower.png'
};

class Fighter {
  constructor(id, cls, x, y, isPlayer = false) {
    this.id = id;
    this.cls = cls;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = 10;
    this.isPlayer = isPlayer;
    this.sprite = new Image();
    this.sprite.src = sprites[cls];
    this.dead = false;
    this.hasCrown = false;
  }

  draw() {
    if (this.dead) {
      ctx.fillText(skullEmoji, this.x, this.y);
      return;
    }
    ctx.drawImage(this.sprite,
      this.x - FIGHTER_SIZE / 2,
      this.y - FIGHTER_SIZE / 2,
      FIGHTER_SIZE,
      FIGHTER_SIZE);
    if (this.hasCrown) {
      ctx.fillText(crownEmoji, this.x - 8, this.y - 24);
    }
  }
}

class Projectile {
  constructor(owner, x, y, vx, vy) {
    this.owner = owner;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.active = true;
  }

  draw() {
    ctx.fillText(projectileEmojis[this.owner.cls], this.x, this.y);
  }
}

let fighters = [];
let projectiles = [];
let running = false;
let lastTime = 0;
let keys = {};
let playerClass = 'wizard';
let nextId = 0;
let mouseX = WIDTH / 2;
let mouseY = HEIGHT / 2;

function showResults(winner) {
  const msg = winner.isPlayer ? 'You are victorious!' : `${winner.cls} wins!`;
  resultText.textContent = msg;
  resultModal.style.display = 'flex';
}

function hideResults() {
  resultModal.style.display = 'none';
}

function spawnFighters() {
  fighters = [];
  projectiles = [];
  nextId = 0;
  playerClass = classSelect.value;

  const margin = FIGHTER_SIZE + 12;
  const randomPos = () => ({
    x: Math.random() * (WIDTH - margin * 2) + margin,
    y: Math.random() * (HEIGHT - margin * 2) + margin,
  });

  fighters.push(new Fighter(nextId++, playerClass, WIDTH / 2, HEIGHT / 2, true));
  const classes = ['wizard', 'demon', 'knight', 'archer', 'monk', 'axe_thrower'];
  const remaining = classes.filter(c => c !== playerClass);
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }
  for (const cls of remaining) {
    let pos;
    let tries = 0;
    do {
      pos = randomPos();
      tries++;
    } while (
      fighters.some(f => Math.hypot(f.x - pos.x, f.y - pos.y) < MIN_SPAWN_DISTANCE) &&
      tries < 50
    );
    fighters.push(new Fighter(nextId++, cls, pos.x, pos.y));
  }
}

function drawBoard() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.font = '24px serif';
  ctx.fillText(castleEmoji, 5, 25);
  ctx.fillText(castleEmoji, WIDTH-30, 25);
  ctx.fillText(castleEmoji, 5, HEIGHT-5);
  ctx.fillText(castleEmoji, WIDTH-30, HEIGHT-5);
}

function handleInput(dt) {
  const speed = 150;
  const player = fighters[0];
  player.vx = 0;
  player.vy = 0;
  if (keys['w']) player.vy = -speed;
  if (keys['s']) player.vy = speed;
  if (keys['a']) player.vx = -speed;
  if (keys['d']) player.vx = speed;
  if (keys[' ']) {
    shoot(player, mouseX, mouseY);
    keys[' '] = false; // prevent continuous shooting
  }
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  constrain(player);
}

function aiControl(f, dt) {
  if (f.isPlayer || f.dead) return;

  const living = fighters.filter(t => !t.dead && t !== f);
  if (living.length === 0) return;

  let target = living.find(t => t.isPlayer);
  if (!target) {
    let best = Infinity;
    for (const t of living) {
      const d = Math.hypot(t.x - f.x, t.y - f.y);
      if (d < best) { best = d; target = t; }
    }
  }

  const angle = Math.atan2(target.y - f.y, target.x - f.x);
  const speed = 150;
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;
  const dist = Math.hypot(target.x - f.x, target.y - f.y);
  if (dist < 100) {
    const strafe = angle + Math.PI/2;
    vx += Math.cos(strafe) * speed * 0.5;
    vy += Math.sin(strafe) * speed * 0.5;
  }
  f.vx = vx;
  f.vy = vy;

  if (!f.aiShootTimer) f.aiShootTimer = Math.random()*0.4 + 0.3;
  f.aiShootTimer -= dt;
  if (f.aiShootTimer <= 0) {
    shoot(f, target.x, target.y);
    f.aiShootTimer = Math.random()*0.4 + 0.3;
  }

  f.x += f.vx * dt;
  f.y += f.vy * dt;
  constrain(f);
}

function constrain(f) {
  const half = FIGHTER_SIZE / 2;
  f.x = Math.max(half, Math.min(WIDTH - half, f.x));
  f.y = Math.max(half, Math.min(HEIGHT - half, f.y));
}

function shoot(f, tx = null, ty = null) {
  if (f.dead) return;
  let angle;
  if (tx !== null && ty !== null) {
    angle = Math.atan2(ty - f.y, tx - f.x);
  } else {
    angle = Math.atan2(f.vy, f.vx) || Math.random()*Math.PI*2;
  }
  const speed = 200;
  const vx = Math.cos(angle)*speed;
  const vy = Math.sin(angle)*speed;
  projectiles.push(new Projectile(f, f.x, f.y, vx, vy));
}

function updateProjectiles(dt) {
  for (const p of projectiles) {
    if (!p.active) continue;
    p.x += p.vx*dt;
    p.y += p.vy*dt;
    if (p.x < 0 || p.x > WIDTH || p.y < 0 || p.y > HEIGHT) {
      p.active = false;
      continue;
    }
    for (const f of fighters) {
      if (f === p.owner || f.dead) continue;
      if (Math.hypot(f.x - p.x, f.y - p.y) < FIGHTER_SIZE * 0.625) {
        f.hp -= 1;
        p.active = false;
        if (f.hp <= 0) {
          f.dead = true;
        }
        break;
      }
    }
  }
  projectiles = projectiles.filter(p => p.active);
}

function checkWinner() {
  const alive = fighters.filter(f=>!f.dead);
  if (alive.length === 1) {
    const winner = alive[0];
    winner.hasCrown = true;
    running = false;
    pauseBtn.textContent = 'Play';
    showResults(winner);
  }
}

function gameLoop(timestamp) {
  if (!running) { lastTime = timestamp; requestAnimationFrame(gameLoop); return; }
  const dt = (timestamp - lastTime)/1000;
  lastTime = timestamp;
  drawBoard();
  handleInput(dt);
  for (let i=1;i<fighters.length;i++) aiControl(fighters[i], dt);
  updateProjectiles(dt);
  for (const f of fighters) f.draw();
  for (const p of projectiles) p.draw();
  checkWinner();
  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e=>{ keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', e => {
  if (e.button === 0 && running) {
    const player = fighters[0];
    shoot(player, mouseX, mouseY);
  }
});

startBtn.onclick = () => {
  spawnFighters();
  running = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  restartBtn.disabled = false;
  hideResults();
};

pauseBtn.onclick = () => {
  running = !running;
  pauseBtn.textContent = running ? 'Pause' : 'Play';
};

restartBtn.onclick = () => {
  spawnFighters();
  running = true;
  pauseBtn.textContent = 'Pause';
  hideResults();
};

modalRestartBtn.onclick = () => {
  spawnFighters();
  running = true;
  pauseBtn.textContent = 'Pause';
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  restartBtn.disabled = false;
  hideResults();
};

requestAnimationFrame(gameLoop);
