import pygame
import random
from typing import List

from projectile import Projectile


class Enemy:
    """Represents an enemy that moves toward the player."""

    def __init__(self, x: int, y: int) -> None:
        """Load the enemy sprite and position it on screen."""
        # Create a red square sprite at runtime to avoid external files
        self.image = pygame.Surface((32, 32), pygame.SRCALPHA)
        self.image.fill((255, 0, 0))
        self.rect = self.image.get_rect()
        self.rect.topleft = (x, y)
        self.speed = 2
        # Amount of damage the enemy can take before being destroyed
        self.health = 3

    def update(self, targets: List[pygame.Rect], projectiles: List[Projectile]) -> None:
        """Move toward the nearest target and occasionally attack."""
        if not targets:
            return
        # Determine the closest target by Euclidean distance
        target = min(targets, key=lambda t: (self.rect.centerx - t.centerx) ** 2 + (self.rect.centery - t.centery) ** 2)
        if target.centerx > self.rect.centerx:
            self.rect.x += self.speed
        elif target.centerx < self.rect.centerx:
            self.rect.x -= self.speed
        # Keep the enemy vertically within the screen bounds.
        self.rect.y = max(0, min(600 - self.rect.height, self.rect.y))

        # Melee attack if in range
        if self.rect.inflate(40, 40).colliderect(target):
            if hasattr(target, "health"):
                target.health -= 1

        # Occasionally fire a projectile at the target
        if random.random() < 0.01:
            dx = target.centerx - self.rect.centerx
            dy = target.centery - self.rect.centery
            projectiles.append(Projectile(self.rect.centerx, self.rect.centery, dx, dy, owner=self))

    def draw(self, screen: pygame.Surface) -> None:
        """Draw the enemy to the given screen."""
        screen.blit(self.image, self.rect)
