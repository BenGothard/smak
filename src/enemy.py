import pygame
import random
from typing import List, Protocol

from projectile import Projectile

# Sprite size for enemy images
SPRITE_SIZE = (32, 32)

# Tunable enemy constants
ENEMY_SPEED = 2
ENEMY_MAX_HEALTH = 10
REGEN_DELAY_MS = 3000
REGEN_INTERVAL_MS = 1000


class HasRect(Protocol):
    """Simple protocol for objects with a rect attribute."""

    rect: pygame.Rect


class Enemy:
    """Represents an enemy that moves toward the player."""

    def __init__(self, x: int, y: int, fighter: str) -> None:
        """Load the enemy sprite and position it on screen."""
        raw = pygame.image.load(f"assets/{fighter}").convert_alpha()
        self.image = pygame.transform.scale(raw, SPRITE_SIZE)
        self.rect = self.image.get_rect()
        self.rect.topleft = (x, y)
        self.speed = ENEMY_SPEED
        # Amount of damage the enemy can take before being destroyed
        self.health = ENEMY_MAX_HEALTH
        self.last_hit = pygame.time.get_ticks()
        self.last_regen = self.last_hit

    def take_damage(self, amount: int) -> None:
        """Apply damage and reset regen timers."""
        self.health -= amount
        self.last_hit = pygame.time.get_ticks()
        self.last_regen = self.last_hit

    def update(self, targets: List[HasRect], projectiles: List[Projectile]) -> None:
        """Move toward the nearest target and occasionally attack."""
        if not targets:
            return
        # Determine the closest target by Euclidean distance
        target = min(
            targets,
            key=lambda t: (
                (self.rect.centerx - t.rect.centerx) ** 2
                + (self.rect.centery - t.rect.centery) ** 2
            ),
        )
        if target.rect.centerx > self.rect.centerx:
            self.rect.x += self.speed
        elif target.rect.centerx < self.rect.centerx:
            self.rect.x -= self.speed
        # Keep the enemy vertically within the screen bounds.
        self.rect.y = max(0, min(600 - self.rect.height, self.rect.y))

        # Occasionally fire a projectile at the target
        if random.random() < 0.01:
            dx = target.rect.centerx - self.rect.centerx
            dy = target.rect.centery - self.rect.centery
            projectiles.append(Projectile(self.rect.centerx, self.rect.centery, dx, dy, owner=self))

        # Regenerate health over time if not recently hit
        now = pygame.time.get_ticks()
        if (
            self.health < ENEMY_MAX_HEALTH
            and now - self.last_hit > REGEN_DELAY_MS
            and now - self.last_regen > REGEN_INTERVAL_MS
        ):
            self.health += 1
            self.last_regen = now

    def draw(self, screen: pygame.Surface) -> None:
        """Draw the enemy to the given screen."""
        screen.blit(self.image, self.rect)
