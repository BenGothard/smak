# SMaK Game

SMaK is an open source arcade shooter written in Python with a Phaser 3 web port. The project started as a small prototype using Pygame and was later ported to run in the browser. All sprites are generated at runtime, allowing the repository to remain lightweight without binary assets.

## Getting Started

### Python / Pygame Prototype
1. Install Python 3 and Pygame:
   ```bash
   pip install pygame
   ```
2. Launch the prototype:
   ```bash
   python src/main.py
   ```

### Phaser Web Build
1. Install Node.js and dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. Open `http://localhost:8080` in your browser.
4. Build the static site (optional):
   ```bash
   npm run build
   ```

The contents of the `docs/` folder can be served via GitHub Pages. A live demo will be available at:

<https://YOUR_GITHUB_USERNAME.github.io/smak>

## Repository Layout
- `src/` – Python source code for the prototype
- `static/` – Phaser 3 assets and entry point
- `assets/` – Placeholder directory for images and sounds

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
