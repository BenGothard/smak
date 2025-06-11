import pygame


class Enemy:
    """Represents an enemy that moves toward the player."""

    def __init__(self, x: int, y: int) -> None:
        """Load the enemy sprite and position it on screen."""
        self.image = pygame.image.load("assets/images/enemy.png").convert_alpha()
        self.rect = self.image.get_rect()
        self.rect.topleft = (x, y)
        self.speed = 2

    def update(self, player_rect: pygame.Rect) -> None:
        """Move horizontally toward the player's x-position."""
        if player_rect.centerx > self.rect.centerx:
            self.rect.x += self.speed
        elif player_rect.centerx < self.rect.centerx:
            self.rect.x -= self.speed
        # Keep the enemy vertically within the screen bounds.
        self.rect.y = max(0, min(600 - self.rect.height, self.rect.y))

    def draw(self, screen: pygame.Surface) -> None:
        """Draw the enemy to the given screen."""
        screen.blit(self.image, self.rect)
