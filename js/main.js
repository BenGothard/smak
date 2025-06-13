/* global Phaser */

class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  preload() {
    FIGHTERS.forEach((f) => {
      this.load.image(f, `assets/fighter/${f}.png`);
    });
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffff00, 1);
    g.fillRect(0, 0, 8, 8);
    g.generateTexture('projectile', 8, 8);
    g.destroy();
  }
  create() {
    this.scene.start('Play');
  }
}

const GAME_WIDTH = 1024;
const GAME_HEIGHT = 768;

// Tunable gameplay constants
const PLAYER_MAX_HEALTH = 10;
const PLAYER_MAX_LIVES = 10;
const ENEMY_MAX_HEALTH = 10;
const ENEMY_MAX_LIVES = 1;
const ENEMY_SPAWN_COUNT = 5;
const ENEMY_BASE_SPEED = 60;
const ENEMY_BOOST_PER_HP = 6;
const FIRE_BASE_CHANCE = 0.01;
const FIRE_BOOST_PER_HP = 0.005;
const SKULL_EMOJI = '\uD83D\uDC80';
const REGEN_DELAY = 3000;
const REGEN_INTERVAL = 1000;
const PROJECTILE_SPAWN_OFFSET = 25;
const PROJECTILE_DAMAGE = 1;

const FIGHTERS = [
  'archer',
  'axe-thrower',
  'wizard',
  'shield-bearer',
  'demon',
  'monk',
];
let playerClass = FIGHTERS[0];
const SPRITE_SCALE = 0.0625;

class EnemyAgent {
  constructor(enemy, scene) {
    this.enemy = enemy;
    this.scene = scene;
  }

  update(targets, projectiles) {
    if (targets.length === 0) return;
    let target = targets[0];
    let minDist = (this.enemy.x - target.x) ** 2 + (this.enemy.y - target.y) ** 2;
    for (const t of targets) {
      const d = (this.enemy.x - t.x) ** 2 + (this.enemy.y - t.y) ** 2;
      if (d < minDist) {
        minDist = d;
        target = t;
      }
    }
    const missing = ENEMY_MAX_HEALTH - this.enemy.health;
    const speed = ENEMY_BASE_SPEED + ENEMY_BOOST_PER_HP * missing;
    if (target.x > this.enemy.x) {
      this.enemy.setVelocityX(speed);
    } else if (target.x < this.enemy.x) {
      this.enemy.setVelocityX(-speed);
    } else {
      this.enemy.setVelocityX(0);
    }
    const fireChance = FIRE_BASE_CHANCE + FIRE_BOOST_PER_HP * missing;
    if (Math.random() < fireChance) {
      const angle = Phaser.Math.Angle.Between(this.enemy.x, this.enemy.y, target.x, target.y);
      const bullet = projectiles.create(this.enemy.x, this.enemy.y, 'projectile');
      bullet.setData('owner', this.enemy);
      bullet.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
    }
    const now = this.scene.time.now;
    if (
      this.enemy.health < ENEMY_MAX_HEALTH &&
      now - this.enemy.lastHit > REGEN_DELAY &&
      now - this.enemy.lastRegen > REGEN_INTERVAL
    ) {
      this.enemy.health += 1;
      this.enemy.lastRegen = now;
    }
  }
}

class Play extends Phaser.Scene {
  constructor() {
    super('Play');
    this.enemies = null;
    this.projectiles = null;
    this.healthGraphics = null;
    this.champion = null;
    this.crown = null;
  }
  create() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.player = this.physics.add.sprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      playerClass,
    ).setScale(SPRITE_SCALE);
    this.player.setCollideWorldBounds(true);
    this.player.health = PLAYER_MAX_HEALTH;
    this.player.lives = PLAYER_MAX_LIVES;
    this.player.lastHit = this.time.now;
    this.player.lastRegen = this.player.lastHit;
    this.player.loseLife = () => {
      if (this.player.lives > 0) {
        this.player.lives -= 1;
      }
      if (this.player.lives > 0) {
        this.player.health = PLAYER_MAX_HEALTH;
        this.player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2);
      } else {
        this.player.health = 0;
      }
      if (this.player.lives <= 0 && !this.player.skull) {
        this.player.skull = this.add.text(0, 0, SKULL_EMOJI, {
          fontSize: '32px',
        }).setOrigin(0.5);
        this.player.skull.setPosition(this.player.x, this.player.y - 40);
      }
    };
    this.player.takeDamage = (amount) => {
      this.player.health -= amount;
      this.player.lastHit = this.time.now;
      this.player.lastRegen = this.player.lastHit;
      if (this.player.health <= 0) {
        this.player.loseLife();
        if (this.player.lives <= 0) {
          this.player.destroy();
        }
      }
    };

    this.enemies = this.physics.add.group();
    const enemyChoices = FIGHTERS.filter((f) => f !== playerClass);
    for (let i = 0; i < ENEMY_SPAWN_COUNT; i++) {
      const ex = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const ey = Phaser.Math.Between(50, GAME_HEIGHT - 50);
      const type = Phaser.Utils.Array.GetRandom(enemyChoices);
      const enemy = this.enemies.create(ex, ey, type).setScale(SPRITE_SCALE);
      enemy.health = ENEMY_MAX_HEALTH;
      enemy.lives = ENEMY_MAX_LIVES;
      enemy.lastHit = this.time.now;
      enemy.lastRegen = enemy.lastHit;
      enemy.agent = new EnemyAgent(enemy, this);
      enemy.loseLife = () => {
        if (enemy.lives > 0) {
          enemy.lives -= 1;
        }
        if (enemy.lives > 0) {
          enemy.health = ENEMY_MAX_HEALTH;
          enemy.setPosition(
            Phaser.Math.Between(50, GAME_WIDTH - 50),
            Phaser.Math.Between(50, GAME_HEIGHT - 50),
          );
        } else {
          enemy.health = 0;
        }
        if (enemy.lives <= 0 && !enemy.skull) {
          enemy.skull = this.add.text(enemy.x, enemy.y - 40, SKULL_EMOJI, {
            fontSize: '32px',
          }).setOrigin(0.5);
        }
      };
    }

    this.healthGraphics = this.add.graphics();

    this.projectiles = this.physics.add.group();

    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this.hitEnemy,
      null,
      this,
    );
    this.physics.add.overlap(
      this.projectiles,
      this.player,
      this.hitPlayer,
      null,
      this,
    );
    this.physics.add.collider(
      this.player,
      this.enemies,
      this.fighterCollision,
      null,
      this,
    );
    this.physics.add.collider(
      this.enemies,
      this.enemies,
      this.fighterCollision,
      null,
      this,
    );
  }
  hitEnemy(bullet, enemy) {
    if (bullet.getData('owner') === enemy) return;
    if (!enemy.active || !bullet.active) return;
    bullet.destroy();
    enemy.health -= PROJECTILE_DAMAGE;
    enemy.lastHit = this.time.now;
    enemy.lastRegen = enemy.lastHit;
    if (enemy.health <= 0) {
      if (typeof enemy.loseLife === 'function') {
        enemy.loseLife();
      }
      if (enemy.lives <= 0) {
        enemy.destroy();
      }
    }
  }
  hitPlayer(bullet, player) {
    if (bullet.getData('owner') === player) return;
    if (!player.active || !bullet.active) return;
    bullet.destroy();
    if (typeof player.takeDamage === 'function') {
      player.takeDamage(PROJECTILE_DAMAGE);
    } else {
      player.health -= PROJECTILE_DAMAGE;
      player.lastHit = this.time.now;
      player.lastRegen = player.lastHit;
      if (player.health <= 0) {
        if (typeof player.loseLife === 'function') {
          player.loseLife();
        }
        if (player.lives <= 0) {
          player.destroy();
        }
      }
    }
  }

  fighterCollision(a, b) {
    if (typeof a.loseLife === 'function') {
      a.loseLife();
    }
    if (typeof b.loseLife === 'function') {
      b.loseLife();
    }
    if (a !== this.player && a.lives <= 0) a.destroy();
    if (b !== this.player && b.lives <= 0) b.destroy();
  }
  update() {
    const moveLeft = this.cursors.left.isDown || this.keys.left.isDown;
    const moveRight = this.cursors.right.isDown || this.keys.right.isDown;
    const moveUp = this.cursors.up.isDown || this.keys.up.isDown;
    const moveDown = this.cursors.down.isDown || this.keys.down.isDown;

    let vx = 0;
    let vy = 0;
    if (moveLeft) vx -= 160;
    if (moveRight) vx += 160;
    if (moveUp) vy -= 160;
    if (moveDown) vy += 160;
    this.player.setVelocity(vx, vy);

    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      const pointer = this.input.activePointer;
      const angle = Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y,
        pointer.worldX,
        pointer.worldY,
      );
      const offsetX = Math.cos(angle) * PROJECTILE_SPAWN_OFFSET;
      const offsetY = Math.sin(angle) * PROJECTILE_SPAWN_OFFSET;
      const bullet = this.projectiles.create(
        this.player.x + offsetX,
        this.player.y + offsetY,
        'projectile',
      );
      bullet.setData('owner', this.player);
      bullet.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
    }
    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      const others = this.enemies.getChildren().filter((e) => e !== enemy && e.active);
      const targets = others.concat([this.player]);
      enemy.agent.update(targets, this.projectiles);
    }, this);

    const nowPlayer = this.time.now;
    if (
      this.player.active &&
      this.player.health < PLAYER_MAX_HEALTH &&
      nowPlayer - this.player.lastHit > REGEN_DELAY &&
      nowPlayer - this.player.lastRegen > REGEN_INTERVAL
    ) {
      this.player.health += 1;
      this.player.lastRegen = nowPlayer;
    }

    this.projectiles.children.each((b) => {
      if (b.x > GAME_WIDTH || b.x < 0 || b.y > GAME_HEIGHT || b.y < 0) {
        b.destroy();
      }
    }, this);

    // Draw health bars on the right side
    this.healthGraphics.clear();
    const fighters = [this.player].concat(
      this.enemies.getChildren().filter((e) => e.active),
    );
    fighters.forEach((f, idx) => {
      const maxHp = f === this.player ? PLAYER_MAX_HEALTH : ENEMY_MAX_HEALTH;
      const barWidth = 100;
      const barHeight = 10;
      const x = GAME_WIDTH - barWidth - 10;
      const y = 10 + idx * (barHeight + 10);
      const tint = f.tintTopLeft || 0x00ff00;
      this.healthGraphics.fillStyle(0x500000, 1);
      this.healthGraphics.fillRect(x, y, barWidth, barHeight);
      this.healthGraphics.fillStyle(tint, 1);
      this.healthGraphics.fillRect(
        x,
        y,
        (barWidth * f.health) / maxHp,
        barHeight,
      );

      if (f.lives !== undefined && f.lives <= 0) {
        if (!f.skull) {
          f.skull = this.add.text(0, 0, SKULL_EMOJI, {
            fontSize: '32px',
          }).setOrigin(0.5);
        }
        f.skull.setPosition(f.x, f.y - 40);
        f.skull.setVisible(true);
      } else if (f.skull) {
        f.skull.setVisible(false);
      }
    });

    // Crown the remaining fighter when only one is left
    if (!this.champion) {
      const alive = fighters.filter((f) => f.active);
      if (alive.length === 1) {
        this.champion = alive[0];
        this.crown = this.add.text(0, 0, '\uD83D\uDC51', {
          fontSize: '32px',
        }).setOrigin(0.5);
      }
    }
    if (this.crown && this.champion && this.champion.active) {
      this.crown.setPosition(this.champion.x, this.champion.y - 40);
    }
  }
}

const config = {
  type: Phaser.CANVAS,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  canvas: document.getElementById('gameCanvas'),
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [Boot, Play],
};
let game = null;

function chooseClass() {
  const selected = document.querySelector('input[name="fighterClass"]:checked');
  if (selected && FIGHTERS.includes(selected.value)) {
    playerClass = selected.value;
    return true;
  }
  return false;
}

function startGame() {
  if (!chooseClass()) {
    alert('Please choose a fighter class first.');
    return;
  }
  if (!game) {
    game = new Phaser.Game(config);
  } else {
    game.scene.resume('Play');
  }
}

function pauseGame() {
  if (!game) return;
  const scene = game.scene.getScene('Play');
  if (scene.scene.isPaused()) {
    scene.scene.resume();
  } else {
    scene.scene.pause();
  }
}

function restartGame() {
  if (game) {
    const parent = game.canvas.parentNode;
    game.destroy(true);
    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'gameCanvas';
    parent.appendChild(newCanvas);
    config.canvas = newCanvas;
    game = null;
  }
  chooseClass();
  game = new Phaser.Game(config);
}

window.addEventListener('load', () => {
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('pauseBtn').addEventListener('click', pauseGame);
  document.getElementById('restartBtn').addEventListener('click', restartGame);
  // Game will start when the user clicks the start button after choosing a class
});
