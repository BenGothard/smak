# smak Phaser Web Build

This repository contains a Phaser 3 web port of the `smak` game. All game
graphics are generated at runtime so no binary image assets are required.

## Development

1. Install dependencies:
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

## GitHub Pages

This repository uses a GitHub Actions workflow to publish the contents of the
`docs/` directory to the `gh-pages` branch. Enable GitHub Pages from that
branch to serve the game online.
