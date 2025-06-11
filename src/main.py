"""Main entry point for the SMaK game."""

import pygame


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

    def handle_events(self):
        """Process incoming events."""
        # Handle user input and system events.
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

    def run(self):
        """Main game loop."""
        while self.running:
            # Poll events and update the screen every frame.
            self.handle_events()
            self.screen.fill((0, 0, 0))
            pygame.display.flip()
            self.clock.tick(60)
        # Clean shutdown when the loop exits.
        pygame.quit()


if __name__ == "__main__":
    Game().run()
