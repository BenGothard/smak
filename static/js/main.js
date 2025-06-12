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

class Play extends Phaser.Scene {
  constructor() {
    super('Play');
    this.enemy = null;
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

    this.player = this.physics.add.sprite(400, 300, 'player');
    this.player.setCollideWorldBounds(true);

    this.enemy = this.physics.add.sprite(100, 100, 'enemy');
    this.enemy.health = 3;

    this.projectiles = this.physics.add.group();

    this.physics.add.overlap(this.projectiles, this.enemy, this.hitEnemy, null, this);
  }
  hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.health -= 1;
    if (enemy.health <= 0) {
      enemy.destroy();
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
      if (
        this.enemy.active &&
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          this.enemy.x,
          this.enemy.y,
        ) < range
      ) {
        this.hitEnemy({ destroy: () => {} }, this.enemy);
      }
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
      bullet.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
    }

    if (this.enemy.active) {
      if (this.player.x > this.enemy.x) {
        this.enemy.setVelocityX(60);
      } else if (this.player.x < this.enemy.x) {
        this.enemy.setVelocityX(-60);
      } else {
        this.enemy.setVelocityX(0);
      }
    }

    this.projectiles.children.each((b) => {
      if (b.x > 800 || b.x < 0 || b.y > 600 || b.y < 0) {
        b.destroy();
      }
    }, this);
  }
}

const config = {
  type: Phaser.CANVAS,
  width: 800,
  height: 600,
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
