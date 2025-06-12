# Repo Agent Instructions

These rules apply to all directories unless otherwise noted.

## Enemy Behavior
- When modifying enemy logic, update both `src/` for the Pygame prototype and `static/js` for the Phaser build so the behaviors stay consistent.
- Keep constants for enemy health, speed, and spawn count at the top of their respective files to simplify tuning.
- Preserve the free-for-all mechanic where enemies can damage each other and the player.

## Testing
- After changes, run `flake8`, `pytest`, `mypy`, `eslint static/js`, and `npx jest`. All must succeed before committing.
- If enemy logic changes, verify the game starts without errors by running `python src/main.py` or `npm start`.

## Pull Requests
- Summaries should highlight how the enemy controls or behaviors were affected.
- Mention any new constants or configuration options that allow controlling enemy attributes.
