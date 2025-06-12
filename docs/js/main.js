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
    this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

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
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.space)) {
      const bullet = this.projectiles.create(this.player.x, this.player.y, 'projectile');
      bullet.setVelocityX(300);
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
