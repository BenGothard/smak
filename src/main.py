"""Main entry point for the SMaK game."""

import random
import pygame
from player import Player, PLAYER_MAX_HEALTH
from enemy import Enemy, ENEMY_MAX_HEALTH
from projectile import Projectile, PROJECTILE_DAMAGE

# Number of enemies spawned at game start
ENEMY_SPAWN_COUNT = 6
# Distance in pixels to spawn projectiles in front of the shooter
PROJECTILE_SPAWN_OFFSET = 25

# Available fighter classes
FIGHTERS = [
    "archer",
    "axe-thrower",
    "wizard",
    "shield-bearer",
    "demon",
    "monk",
]


def choose_class() -> str:
    """Prompt the user to choose a fighter class."""
    print("Choose your fighter:")
    for idx, f in enumerate(FIGHTERS, 1):
        print(f"{idx}. {f}")
    try:
        choice = int(input("Enter number [1-6]: "))
    except Exception:
        choice = 1
    if 1 <= choice <= len(FIGHTERS):
        return FIGHTERS[choice - 1]
    return FIGHTERS[0]


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
        player_class = choose_class()
        self.player = Player(400, 300, player_class)
        enemy_choices = [c for c in FIGHTERS if c != player_class]
        # Spawn several enemies at random positions
        self.enemies = [
            Enemy(
                random.randint(50, 750),
                random.randint(50, 550),
                random.choice(enemy_choices),
            )
            for _ in range(ENEMY_SPAWN_COUNT)
        ]
        # List to hold active projectiles
        self.projectiles = []
        # Fonts for UI elements
        self.font = pygame.font.SysFont(None, 24)
        self.crown_font = pygame.font.SysFont(None, 32)
        self.champion = None

    def handle_events(self):
        """Process incoming events."""
        # Handle user input and system events.
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    x, y = self.player.rect.center
                    mx, my = pygame.mouse.get_pos()
                    dx = mx - x
                    dy = my - y
                    mag = (dx ** 2 + dy ** 2) ** 0.5 or 1
                    start_x = x + int(dx / mag * PROJECTILE_SPAWN_OFFSET)
                    start_y = y + int(dy / mag * PROJECTILE_SPAWN_OFFSET)
                    self.projectiles.append(
                        Projectile(start_x, start_y, mx - x, my - y, owner=self.player)
                    )

    def run(self):
        """Main game loop."""
        while self.running:
            # Poll events and update the screen every frame.
            self.handle_events()
            self.screen.fill((0, 0, 0))
            self.player.update()
            self.player.draw(self.screen)
            for e in self.enemies:
                others = [self.player] + [o for o in self.enemies if o is not e]
                e.update(others, self.projectiles)
                e.draw(self.screen)

            if self.player.health <= 0:
                self.running = False
                continue
            for p in self.projectiles[:]:
                p.update()
                p.draw(self.screen)
                if p.off_screen(800, 600):
                    self.projectiles.remove(p)
                    continue
                targets = self.enemies[:] + [self.player]
                for t in targets:
                    if p.owner is t:
                        continue
                    if p.rect.colliderect(t.rect):
                        if hasattr(t, "take_damage"):
                            t.take_damage(PROJECTILE_DAMAGE)
                        else:
                            t.health -= PROJECTILE_DAMAGE
                        if p in self.projectiles:
                            self.projectiles.remove(p)
                        if isinstance(t, Enemy) and t.health <= 0:
                            if t in self.enemies:
                                self.enemies.remove(t)
                        elif isinstance(t, Player) and t.health <= 0:
                            self.running = False
                        break
            # Draw health bars along the left side
            fighters = [self.player] + self.enemies
            for idx, f in enumerate(fighters):
                if f.health <= 0:
                    continue
                max_hp = PLAYER_MAX_HEALTH if isinstance(f, Player) else ENEMY_MAX_HEALTH
                bar_width = 100
                bar_height = 10
                x = 10
                y = 10 + idx * (bar_height + 10)
                pygame.draw.rect(self.screen, (80, 0, 0), (x, y, bar_width, bar_height))
                pygame.draw.rect(
                    self.screen,
                    (0, 200, 0),
                    (x, y, int(bar_width * f.health / max_hp), bar_height),
                )

            # Determine champion and draw crown when one fighter remains
            alive = [f for f in fighters if f.health > 0]
            if len(alive) == 1 and self.champion is None:
                self.champion = alive[0]
            if self.champion and self.champion.health > 0:
                crown = self.crown_font.render("\U0001F451", True, (255, 215, 0))
                cx = self.champion.rect.centerx - crown.get_width() // 2
                cy = self.champion.rect.top - 30
                self.screen.blit(crown, (cx, cy))
            pygame.display.flip()
            self.clock.tick(60)
        # Clean shutdown when the loop exits.
        pygame.quit()


if __name__ == "__main__":
    Game().run()
