import pygame

# Player tuning constants
PLAYER_MAX_HEALTH = 10
PLAYER_MAX_LIVES = 10
REGEN_DELAY_MS = 3000
REGEN_INTERVAL_MS = 1000


class Player:
    """Represents the player character."""

    def __init__(self, x: int, y: int) -> None:
        """Load the player sprite and position it on screen."""
        # Create a simple green square so no external assets are required
        self.image = pygame.Surface((32, 32), pygame.SRCALPHA)
        self.image.fill((0, 255, 0))
        self.rect = self.image.get_rect()
        self.rect.topleft = (x, y)
        # Allow the player to take damage like enemies
        self.health = PLAYER_MAX_HEALTH
        self.lives = PLAYER_MAX_LIVES
        self.last_hit = pygame.time.get_ticks()
        self.last_regen = self.last_hit

    def take_damage(self, amount: int) -> None:
        """Apply damage and reset regen timers."""
        self.health -= amount
        self.last_hit = pygame.time.get_ticks()
        self.last_regen = self.last_hit
        if self.health <= 0:
            if self.lives > 0:
                self.lives -= 1
                self.health = PLAYER_MAX_HEALTH
                self.rect.topleft = (400, 300)
            else:
                self.health = 0

    def melee_attack(self, enemies) -> None:
        """Damage enemies within melee range."""
        attack_rect = self.rect.inflate(40, 40)
        for enemy in list(enemies):
            if attack_rect.colliderect(enemy.rect):
                if hasattr(enemy, "take_damage"):
                    enemy.take_damage(1)
                else:
                    enemy.health -= 1
                if enemy.health <= 0 and getattr(enemy, "lives", 0) <= 0:
                    enemies.remove(enemy)

    def handle_input(self) -> None:
        """Handle keyboard input for movement with WASD."""
        keys = pygame.key.get_pressed()
        if keys[pygame.K_a] or keys[pygame.K_LEFT]:
            self.rect.x -= 5
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
            self.rect.x += 5
        if keys[pygame.K_w] or keys[pygame.K_UP]:
            self.rect.y -= 5
        if keys[pygame.K_s] or keys[pygame.K_DOWN]:
            self.rect.y += 5

    def update(self) -> None:
        """Update the player's position and keep it on screen."""
        self.handle_input()
        self.rect.x = max(0, min(800 - self.rect.width, self.rect.x))
        self.rect.y = max(0, min(600 - self.rect.height, self.rect.y))

        now = pygame.time.get_ticks()
        if (
            self.health < PLAYER_MAX_HEALTH
            and now - self.last_hit > REGEN_DELAY_MS
            and now - self.last_regen > REGEN_INTERVAL_MS
        ):
            self.health += 1
            self.last_regen = now

    def draw(self, screen: pygame.Surface) -> None:
        """Draw the player to the given screen."""
        screen.blit(self.image, self.rect)
