"""Main entry point for the SMaK game."""

import pygame
from player import Player
from enemy import Enemy
from projectile import Projectile


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
        self.enemies = [Enemy(100, 100)]
        # List to hold active projectiles
        self.projectiles = []

    def handle_events(self):
        """Process incoming events."""
        # Handle user input and system events.
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
                x, y = self.player.rect.center
                self.projectiles.append(Projectile(x, y, 1, 0))

    def run(self):
        """Main game loop."""
        while self.running:
            # Poll events and update the screen every frame.
            self.handle_events()
            self.screen.fill((0, 0, 0))
            self.player.update()
            self.player.draw(self.screen)
            for e in self.enemies:
                e.update(self.player.rect)
                e.draw(self.screen)
            for p in self.projectiles[:]:
                p.update()
                p.draw(self.screen)
                if p.off_screen(800, 600):
                    self.projectiles.remove(p)
                    continue
                for e in self.enemies[:]:
                    if p.rect.colliderect(e.rect):
                        e.health -= 1
                        if p in self.projectiles:
                            self.projectiles.remove(p)
                        if e.health <= 0:
                            self.enemies.remove(e)
                        break
            pygame.display.flip()
            self.clock.tick(60)
        # Clean shutdown when the loop exits.
        pygame.quit()


if __name__ == "__main__":
    Game().run()
