# SMaK Game

SMaK is an open source arcade shooter written in Python with a Phaser 3 web port. The project started as a small prototype using Pygame and was later ported to run in the browser. **Both versions generate their sprites at runtime**, keeping the repository lightweight without binary assets.

## Getting Started

### Python / Pygame Prototype
1. Install Python 3 and the required dependencies:
   ```bash
   pip install pygame
   ```
2. Launch the prototype:
   ```bash
   python src/main.py
   ```
3. Watch enemies engage in a free-for-all battle where they also attack each other.

### Phaser Web Build
1. Install Node.js LTS and dependencies:
   ```bash
   npm ci
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. Open `http://localhost:8080` in your browser.
4. Build the static site (required for GitHub Pages):
   ```bash
   npm run build
   ```

This generates a `docs/` directory containing the static site. The included
GitHub Actions workflow automatically publishes this folder to the
`gh-pages` branch, so you don't need to commit it manually. Enable
**GitHub Pages** to serve from the `gh-pages` branch and the game will be
playable at:

<https://YOUR_GITHUB_USERNAME.github.io/smak>

## Repository Layout
- `src/` – Python source code for the prototype
- `static/` – Phaser 3 assets and entry point
- `assets/` – Placeholder directory for images and sounds

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
