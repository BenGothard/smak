import pygame

# Damage each projectile deals when it hits a fighter
PROJECTILE_DAMAGE = 1


class Projectile:
    """Simple projectile fired by a character."""

    def __init__(self, x: int, y: int, dx: float, dy: float, speed: int = 10, owner=None) -> None:
        """Create a projectile at (x, y) moving in (dx, dy) direction."""
        # Yellow square generated on the fly instead of loading an image
        self.image = pygame.Surface((8, 8), pygame.SRCALPHA)
        self.image.fill((255, 255, 0))
        self.rect = self.image.get_rect(center=(x, y))
        # Normalize direction and scale by speed
        magnitude = (dx ** 2 + dy ** 2) ** 0.5 or 1
        self.dx = dx / magnitude
        self.dy = dy / magnitude
        self.speed = speed
        self.owner = owner

    def update(self) -> None:
        """Move the projectile each frame."""
        self.rect.x += int(self.dx * self.speed)
        self.rect.y += int(self.dy * self.speed)

    def off_screen(self, width: int, height: int) -> bool:
        """Return True if projectile is outside the given screen bounds."""
        return (
            self.rect.right < 0
            or self.rect.left > width
            or self.rect.bottom < 0
            or self.rect.top > height
        )

    def draw(self, screen: pygame.Surface) -> None:
        """Draw the projectile to the screen."""
        screen.blit(self.image, self.rect)
