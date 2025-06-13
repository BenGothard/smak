/* global Phaser */

class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  preload() {
    // Generate simple textures using graphics to avoid binary assets
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x00ff00, 1);
    g.fillRect(0, 0, 32, 32);
    g.generateTexture('player', 32, 32);
    g.clear();

    g.fillStyle(0xff0000, 1);
    g.fillRect(0, 0, 32, 32);
    g.generateTexture('enemy', 32, 32);
    g.clear();

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
const ENEMY_SPAWN_COUNT = 5;
const REGEN_DELAY = 3000;
const REGEN_INTERVAL = 1000;
const PROJECTILE_SPAWN_OFFSET = 25;
const PROJECTILE_DAMAGE = 1;

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
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.player = this.physics.add.sprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'player',
    );
    this.player.setCollideWorldBounds(true);
    this.player.health = PLAYER_MAX_HEALTH;
    this.player.lives = PLAYER_MAX_LIVES;
    this.player.lastHit = this.time.now;
    this.player.lastRegen = this.player.lastHit;
    this.player.takeDamage = (amount) => {
      this.player.health -= amount;
      this.player.lastHit = this.time.now;
      this.player.lastRegen = this.player.lastHit;
      if (this.player.health <= 0) {
        if (this.player.lives > 0) {
          this.player.lives -= 1;
          this.player.health = PLAYER_MAX_HEALTH;
          this.player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        } else {
          this.player.destroy();
        }
      }
    };

    this.enemies = this.physics.add.group();
    for (let i = 0; i < ENEMY_SPAWN_COUNT; i++) {
      const ex = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const ey = Phaser.Math.Between(50, GAME_HEIGHT - 50);
      const enemy = this.enemies.create(ex, ey, 'enemy');
      enemy.setTint(Phaser.Display.Color.RandomRGB().color);
      enemy.health = ENEMY_MAX_HEALTH;
      enemy.lastHit = this.time.now;
      enemy.lastRegen = enemy.lastHit;
    }

    this.healthGraphics = this.add.graphics();

    this.projectiles = this.physics.add.group();

    this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.projectiles, this.player, this.hitPlayer, null, this);
  }
  hitEnemy(bullet, enemy) {
    if (bullet.getData('owner') === enemy) return;
    bullet.destroy();
    if (!enemy.active) return;
    enemy.health -= PROJECTILE_DAMAGE;
    enemy.lastHit = this.time.now;
    enemy.lastRegen = enemy.lastHit;
    if (enemy.health <= 0) {
      enemy.destroy();
    }
  }
  hitPlayer(bullet, player) {
    if (bullet.getData('owner') === player) return;
    bullet.destroy();
    if (!player.active) return;
    if (typeof player.takeDamage === 'function') {
      player.takeDamage(PROJECTILE_DAMAGE);
    } else {
      player.health -= PROJECTILE_DAMAGE;
      player.lastHit = this.time.now;
      player.lastRegen = player.lastHit;
      if (player.health <= 0) {
        player.destroy();
      }
    }
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
      const range = 40;
      this.enemies.children.each((enemy) => {
        if (
          enemy.active &&
          Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) < range
        ) {
          this.hitEnemy({ destroy: () => {} }, enemy);
        }
      }, this);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
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
      let target = targets[0];
      let minDist = (enemy.x - target.x) ** 2 + (enemy.y - target.y) ** 2;
      for (const t of targets) {
        const d = (enemy.x - t.x) ** 2 + (enemy.y - t.y) ** 2;
        if (d < minDist) {
          minDist = d;
          target = t;
        }
      }
      if (target.x > enemy.x) {
        enemy.setVelocityX(60);
      } else if (target.x < enemy.x) {
        enemy.setVelocityX(-60);
      } else {
        enemy.setVelocityX(0);
      }
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y) < 40) {
        if (typeof target.takeDamage === 'function') {
          target.takeDamage(1);
        } else if (target.health !== undefined) {
          target.health -= 1;
          target.lastHit = this.time.now;
          target.lastRegen = target.lastHit;
          if (target.health <= 0) {
            target.destroy();
          }
        }
      }
      if (Math.random() < 0.01) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
        const bullet = this.projectiles.create(enemy.x, enemy.y, 'projectile');
        bullet.setData('owner', enemy);
        bullet.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
      }

      const now = this.time.now;
      if (
        enemy.health < ENEMY_MAX_HEALTH &&
        now - enemy.lastHit > REGEN_DELAY &&
        now - enemy.lastRegen > REGEN_INTERVAL
      ) {
        enemy.health += 1;
        enemy.lastRegen = now;
      }
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

function startGame() {
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
    game.destroy(true);
    game = null;
  }
  game = new Phaser.Game(config);
}

window.addEventListener('load', () => {
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('pauseBtn').addEventListener('click', pauseGame);
  document.getElementById('restartBtn').addEventListener('click', restartGame);
  // Initialize the game board immediately so the canvas is visible
  startGame();
});
