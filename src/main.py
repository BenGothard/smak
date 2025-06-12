"""Main entry point for the SMaK game."""

import random
import pygame
from player import Player
from enemy import Enemy
from projectile import Projectile

# Number of enemies spawned at game start
ENEMY_SPAWN_COUNT = 6


class Game:
    """Encapsulates the game state and main loop."""

    def __init__(self):
        """Initialize the game window and other settings."""
        # Initialize Pygame and set up the display.
        pygame.init()
        self.screen = pygame.display.set_mode((800, 600))
        pygame.display.set_caption("SMaK")
        self.clock = pygame.time.Clock()
        self.running = True
        self.player = Player(400, 300)
        # Spawn several enemies at random positions
        self.enemies = [
            Enemy(random.randint(50, 750), random.randint(50, 550))
            for _ in range(ENEMY_SPAWN_COUNT)
        ]
        # List to hold active projectiles
        self.projectiles = []

    def handle_events(self):
        """Process incoming events."""
        # Handle user input and system events.
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    # Melee attack damages nearby enemies
                    self.player.melee_attack(self.enemies)
                if event.key in (pygame.K_LSHIFT, pygame.K_RSHIFT):
                    x, y = self.player.rect.center
                    mx, my = pygame.mouse.get_pos()
                    self.projectiles.append(Projectile(x, y, mx - x, my - y, owner=self.player))

    def run(self):
        """Main game loop."""
        while self.running:
            # Poll events and update the screen every frame.
            self.handle_events()
            self.screen.fill((0, 0, 0))
            self.player.update()
            self.player.draw(self.screen)
            for e in self.enemies:
                others = [self.player] + [o for o in self.enemies if o is not e]
                e.update(others, self.projectiles)
                e.draw(self.screen)
            for p in self.projectiles[:]:
                p.update()
                p.draw(self.screen)
                if p.off_screen(800, 600):
                    self.projectiles.remove(p)
                    continue
                targets = self.enemies[:] + [self.player]
                for t in targets:
                    if p.owner is t:
                        continue
                    if p.rect.colliderect(t.rect):
                        if hasattr(t, "take_damage"):
                            t.take_damage(1)
                        else:
                            t.health -= 1
                        if p in self.projectiles:
                            self.projectiles.remove(p)
                        if isinstance(t, Enemy) and t.health <= 0:
                            self.enemies.remove(t)
                        elif isinstance(t, Player) and t.health <= 0:
                            self.running = False
                        break
            pygame.display.flip()
            self.clock.tick(60)
        # Clean shutdown when the loop exits.
        pygame.quit()


if __name__ == "__main__":
    Game().run()
