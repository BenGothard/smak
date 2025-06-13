import pygame
import random
from typing import List, Protocol

from projectile import Projectile

SKULL_EMOJI = "\U0001F480"

# Sprite size for enemy images
SPRITE_SIZE = (32, 32)

# Tunable enemy constants
ENEMY_SPEED = 2
ENEMY_MAX_HEALTH = 10
ENEMY_MAX_LIVES = 1
SPEED_BOOST_PER_HP = 0.2
FIRE_BASE_CHANCE = 0.01
FIRE_BOOST_PER_HP = 0.005
REGEN_DELAY_MS = 3000
REGEN_INTERVAL_MS = 1000


class HasRect(Protocol):
    """Simple protocol for objects with a rect attribute."""

    rect: pygame.Rect


class EnemyAgent:
    """AI controller that manages an enemy's behavior."""

    def __init__(self, enemy: "Enemy") -> None:
        self.enemy = enemy

    def update(self, targets: List[HasRect], projectiles: List[Projectile]) -> None:
        enemy = self.enemy
        if not targets:
            return
        target = min(
            targets,
            key=lambda t: (
                (enemy.rect.centerx - t.rect.centerx) ** 2
                + (enemy.rect.centery - t.rect.centery) ** 2
            ),
        )
        missing_hp = ENEMY_MAX_HEALTH - enemy.health
        speed = ENEMY_SPEED + SPEED_BOOST_PER_HP * missing_hp
        if target.rect.centerx > enemy.rect.centerx:
            enemy.rect.x += int(speed)
        elif target.rect.centerx < enemy.rect.centerx:
            enemy.rect.x -= int(speed)
        enemy.rect.y = max(0, min(600 - enemy.rect.height, enemy.rect.y))

        fire_chance = FIRE_BASE_CHANCE + missing_hp * FIRE_BOOST_PER_HP
        if random.random() < fire_chance:
            dx = target.rect.centerx - enemy.rect.centerx
            dy = target.rect.centery - enemy.rect.centery
            projectiles.append(Projectile(enemy.rect.centerx, enemy.rect.centery, dx, dy, owner=enemy))

        now = pygame.time.get_ticks()
        if (
            enemy.health < ENEMY_MAX_HEALTH
            and now - enemy.last_hit > REGEN_DELAY_MS
            and now - enemy.last_regen > REGEN_INTERVAL_MS
        ):
            enemy.health += 1
            enemy.last_regen = now


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
        self.lives = ENEMY_MAX_LIVES
        self.last_hit = pygame.time.get_ticks()
        self.last_regen = self.last_hit
        self.agent = EnemyAgent(self)

    def lose_life(self) -> None:
        """Remove a life and optionally respawn."""
        if self.lives > 0:
            self.lives -= 1
        if self.lives > 0:
            self.health = ENEMY_MAX_HEALTH
            self.rect.topleft = (
                random.randint(50, 750),
                random.randint(50, 550),
            )
        else:
            self.health = 0

    def take_damage(self, amount: int) -> None:
        """Apply damage and reset regen timers."""
        self.health -= amount
        self.last_hit = pygame.time.get_ticks()
        self.last_regen = self.last_hit
        if self.health <= 0:
            self.lose_life()

    def update(self, targets: List[HasRect], projectiles: List[Projectile]) -> None:
        """Delegate behavior to the agent controller."""
        self.agent.update(targets, projectiles)

    def draw(self, screen: pygame.Surface) -> None:
        """Draw the enemy to the given screen."""
        screen.blit(self.image, self.rect)
        if self.lives <= 0:
            font = pygame.font.SysFont(None, 32)
            skull = font.render(SKULL_EMOJI, True, (255, 255, 255))
            x = self.rect.centerx - skull.get_width() // 2
            y = self.rect.top - 30
            screen.blit(skull, (x, y))
