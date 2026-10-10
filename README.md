# Happy Birthday! — FAAAAHHH Edition

A handmade-looking, mobile-first birthday card. Press the rainbow button to throw illustrated flower bouquets. No dependencies, remote assets, audio, backend, or build step.

## Run

Open `index.html` directly in a modern browser. For an optional local HTTP server, run `python -m http.server 8000` from this folder and visit `http://localhost:8000`.

## GitHub Pages

Commit `index.html`, `styles.css`, `script.js`, and `assets/` to a GitHub repository. Under **Settings → Pages**, select **Deploy from a branch**, select your branch and **/(root)**, and save. Relative asset URLs support repository subpaths. No workflow or build is necessary.

## Customize

- Heading and birthday message: `index.html`, inside `.greeting`.
- Palette: the CSS variables at the top of `styles.css`; button gradient and SVG fills set the accent colors.
- Bouquet artwork: `assets/bouquet.svg`, an original local illustration.
- Retained bouquet count: `CONFIG.maxBouquets` in `script.js` (50 by default, plus at most 6 fading nodes).
- Gravity: `CONFIG.gravity` (CSS pixels per second squared). Initial upward speed is calculated to keep the apex on screen.
- Chaos: `CONFIG.sparkleAt` (6), `CONFIG.chaosAt` (14), and `CONFIG.surpriseEvery` (9). Later every third press throws two bouquets, every sixth throws three. The counter always tracks presses.
- Throw sizes, spin, rise, and pile depth: `createBouquet()`.

## Interaction and physics

Every press measures the live button rectangle. Bouquets start at its center, scale up, rotate, and follow constant-acceleration trajectories in one requestAnimationFrame loop. Side velocity is calculated from a randomized landing target and predicted flight duration. Impacts damp vertical velocity, horizontal movement, and spin, with a squash and two small bounces. Landed stickers remain. The loop stops when all flowers land.

Old landed stickers fade away at the cap. If all 50 are still flying during extreme rapid input, the oldest flying sticker is retired immediately to maintain the strict state budget. Resize clamps and repositions the pile to the new viewport. Decorative layers ignore pointer events; the button stays above them.

The semantic button supports Enter/Space and visible keyboard focus. Counter announcements debounce for 500 ms. Reduced motion replaces spinning ballistic throws with a 300 ms gentle transfer from the button to the pile, and disables sparkles and wobble. No sound plays.

## Verification

Run `node --check script.js` for syntax validation. Run `node tests/physics.test.cjs` for real headless Chrome integration checks (Node 22+ required). The test defaults to the standard Windows Chrome installation; set `CHROME_PATH` to your Chrome/Chromium executable on other systems. It starts and stops a temporary loopback HTTP server and browser, and writes ignored screenshots to `tests/artifacts/`.

Verified in Chrome: launch at the button center, upward travel, landing, Enter/Space activation, ninth-press surprise, 100 rapid presses, concurrent projectiles, bounded DOM, button hit testing above the pile, viewport resize, reduced motion, horizontal overflow, and absence of browser exceptions. Mobile (390×844) and desktop (1440×1000) screenshots were visually reviewed. Other browser engines and physical mobile devices were not tested.

