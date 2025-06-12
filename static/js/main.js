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

class Play extends Phaser.Scene {
  constructor() {
    super('Play');
    this.enemies = null;
    this.projectiles = null;
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

    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.health = 5;

    this.enemies = this.physics.add.group();
    for (let i = 0; i < 5; i++) {
      const ex = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const ey = Phaser.Math.Between(50, GAME_HEIGHT - 50);
      const enemy = this.enemies.create(ex, ey, 'enemy');
      enemy.health = 3;
    }

    this.projectiles = this.physics.add.group();

    this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.projectiles, this.player, this.hitPlayer, null, this);
  }
  hitEnemy(bullet, enemy) {
    if (bullet.owner === enemy) return;
    bullet.destroy();
    enemy.health -= 1;
    if (enemy.health <= 0) {
      enemy.destroy();
    }
  }
  hitPlayer(bullet, player) {
    if (bullet.owner === player) return;
    bullet.destroy();
    player.health -= 1;
    if (player.health <= 0) {
      player.destroy();
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
      const bullet = this.projectiles.create(this.player.x, this.player.y, 'projectile');
      bullet.owner = this.player;
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
        if (target.health !== undefined) {
          target.health -= 1;
          if (target.health <= 0) {
            target.destroy();
          }
        }
      }
      if (Math.random() < 0.01) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
        const bullet = this.projectiles.create(enemy.x, enemy.y, 'projectile');
        bullet.owner = enemy;
        bullet.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
      }
    }, this);

    this.projectiles.children.each((b) => {
      if (b.x > GAME_WIDTH || b.x < 0 || b.y > GAME_HEIGHT || b.y < 0) {
        b.destroy();
      }
    }, this);
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

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
