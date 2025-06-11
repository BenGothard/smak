import pygame


class Player:
    """Represents the player character."""

    def __init__(self, x: int, y: int) -> None:
        """Load the player sprite and position it on screen."""
        self.image = pygame.image.load("assets/images/player.png").convert_alpha()
        self.rect = self.image.get_rect()
        self.rect.topleft = (x, y)

    def handle_input(self) -> None:
        """Handle keyboard input for horizontal movement."""
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT]:
            self.rect.x -= 5
        if keys[pygame.K_RIGHT]:
            self.rect.x += 5

    def update(self) -> None:
        """Update the player's position and keep it on screen."""
        self.handle_input()
        self.rect.x = max(0, min(800 - self.rect.width, self.rect.x))

    def draw(self, screen: pygame.Surface) -> None:
        """Draw the player to the given screen."""
        screen.blit(self.image, self.rect)
