import pygame


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
        self.health = 5

    def melee_attack(self, enemies) -> None:
        """Damage enemies within melee range."""
        attack_rect = self.rect.inflate(40, 40)
        for enemy in list(enemies):
            if attack_rect.colliderect(enemy.rect):
                enemy.health -= 1
                if enemy.health <= 0:
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

    def draw(self, screen: pygame.Surface) -> None:
        """Draw the player to the given screen."""
        screen.blit(self.image, self.rect)
