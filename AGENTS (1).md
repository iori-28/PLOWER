# AGENTS.md — Happy Birthday: FAAAAHHH Edition

## Mission
Build a complete, polished, mobile-first birthday surprise website in **one implementation pass**. The core experience is a single multicolor button that **throws illustrated flower bouquets** into the page, inspired by an interactive Google Search flower effect. This is a standalone website, not a Chrome extension. Do not stop at a mockup or a plan: implement, test, and document the working project.

## Product concept
- Main heading: **Happy Birthday!**
- Personality: cute, playful, slightly retro, intentionally silly, with occasional unexpected **FAAAHHH!!** moments.
- Visual language: warm pastel colors, hand-drawn/sticker-like flowers, soft shadows, cheerful typography, subtle grain or retro detailing where tasteful.
- Mobile-first portrait layout; also works on desktop.
- One **primary interactive control**: a vivid multicolor/rainbow button near the lower center of the viewport. Avoid introducing additional prominent interactive controls.
- A small visible counter tracks how many times the button was pressed.
- Flower bouquets accumulate across the screen without making the button impossible to press.

## Technology and constraints
- Use **HTML, CSS, and vanilla JavaScript**, with no backend, database, framework, or API requirement.
- Prefer a simple structure: `index.html`, `styles.css`, `script.js`, `assets/`, `README.md`.
- Make it deployable as a static site on GitHub Pages.
- Use local or self-created SVG bouquet assets, or generate bouquet shapes in SVG. Do not depend on copyrighted assets or remote image URLs. Prefer a cohesive illustration matching the reference: blue, pink, yellow and green flowers with orange/yellow wrapping.
- Avoid dependencies unless absolutely necessary. No build step should be required.

## Essential interaction: flowers must be THROWN
**This is the most important acceptance criterion.** Do not implement flowers that merely pop into existence at random positions. Every button press must visibly launch at least one bouquet **from the button's current on-screen location** and animate it through the air.

Implement the motion using requestAnimationFrame and time-based animation (or equivalent robust animation):
1. Read the button's current bounding rectangle to establish the launch origin.
2. Spawn a bouquet at the button with a small initial scale and clear visible motion.
3. Assign randomized initial horizontal and upward velocities, a gravity value, and angular velocity.
4. Animate a **ballistic/parabolic arc**: bouquet rises, drifts sideways, rotates, reaches an apex, then falls.
5. Allow a natural landing toward the lower part of the screen or an accumulated pile. Add a slight squash/bounce on impact and let the bouquet remain visible as a static sticker.
6. Vary size, horizontal direction, launch speed, spin, and landing point, while keeping movement legible and believable.
7. Make repeated taps launch independent bouquets concurrently. No input blocking while existing bouquets are in flight.
8. Keep bouquet elements `pointer-events: none`, and ensure the button remains accessible and clickable above the pile.
9. Handle resize and orientation changes gracefully; use viewport-aware bounds. Avoid bouquets disappearing abruptly at the edges unless deliberately designed as a rare effect.
10. Cap retained bouquets (e.g. 40–60, tuned for performance). Remove the oldest landed elements gracefully when over budget. Use DOM transforms (`translate3d`, `rotate`, `scale`) for performance; avoid layout thrashing.

**Do not substitute CSS fade-in, random placement, or instantaneous teleportation for the throw animation.**

## Progressive chaos
- Early taps: one bouquet per tap, gentle arcs, restrained effects.
- After several taps: slightly more dramatic throws, subtle confetti or sparkles, and increasingly lively motion.
- Later taps: occasional double/triple bouquet throws, more variation and comic energy; maintain responsiveness.
- Make progression deterministic enough to notice but not so intense that the UI becomes unusable.
- Keep the counter equal to actual button presses, not the number of spawned bouquets.
- Surprise event: show a large **FAAAHHH!!** sticker/text on some taps, with a quick wobble/shake and a playful exit. Make it relatively rare, not permanently displayed. A few alternative silly messages such as `WKWKWK`, `FLOWER ATTACK!`, or `STOPP 😭` are acceptable, but `FAAAHHH!!` must be the signature moment.
- Never autoplay loud audio. Sound is optional and should be omitted unless it meaningfully improves the experience.

## UI / layout
- Full-viewport decorative background with a large readable **Happy Birthday!** heading.
- Optional short subheading such as `Another year older, another year more chaotic.`
- One animated rainbow/multicolor button with clear pressed and hover/focus states, large enough for thumbs (at least 48x48 CSS pixels).
- Counter presented as small secondary information.
- Flowers should appear above the background and heading in places, as a playful overlay, but the text should remain recognizable at the beginning.
- Keep the button fixed or anchored in a stable position near the bottom center; account for mobile safe-area insets.
- Prevent unwanted page scrolling and horizontal overflow during throws, without breaking accessibility.
- Use a consistent illustration style for every bouquet. Individual flowers may vary in color but should still look like bouquets, not generic emoji particles.

## Accessibility and motion preferences
- Semantic HTML and an accessible name for the main button, e.g. `Throw a birthday bouquet`.
- Keyboard activation via Enter/Space, visible focus indicator, sufficient contrast.
- Respect `prefers-reduced-motion`: replace the full ballistic animation with a shorter, gentler transition while still making the interaction understandable.
- Avoid strobing, flashing, and excessive screen shake.
- Treat decorative flowers as `aria-hidden="true"`.
- Announce the counter accessibly without overwhelming screen readers on rapid taps.

## Implementation guidance
- Separate animation physics, bouquet creation, UI updates, and surprise events into small readable functions.
- Use a single requestAnimationFrame loop for all active projectiles when practical.
- Use delta time so physics feels consistent across refresh rates.
- Create an SVG bouquet asset with a transparent background and a visually rich, sticker-like silhouette.
- Consider seeded or bounded randomness only where useful; prioritize fun, natural variation.
- Avoid memory leaks: remove completed animation state, clean up DOM nodes when exceeding the retention cap, and do not create unlimited timers.
- Add comments for non-obvious motion/physics logic, not for every trivial line.

## Deliverables
1. Working `index.html`, `styles.css`, `script.js` and any local assets.
2. `README.md` with how to run locally, how to deploy on GitHub Pages, and where to adjust the heading, palette, bouquet count, gravity, and chaos thresholds.
3. A brief summary of implemented features and any limitations.

## Acceptance checklist
- [ ] Opening `index.html` shows a polished Happy Birthday screen on mobile and desktop.
- [ ] There is one obvious multicolor interactive button.
- [ ] Every tap launches a visible bouquet **from the button**, traveling in a curved upward-then-downward path.
- [ ] Bouquets rotate in flight, land/bounce, and accumulate on the screen.
- [ ] Rapid tapping produces multiple simultaneous independent throws.
- [ ] Counter increments exactly once per tap.
- [ ] Occasional **FAAAHHH!!** surprise appears with comic animation.
- [ ] Progressive chaos becomes noticeable after repeated tapping.
- [ ] The button stays tappable despite accumulated flowers.
- [ ] No console errors, runaway DOM growth, or significant lag after 100 taps.
- [ ] Keyboard use and reduced-motion preference work.
- [ ] No backend or build step is required; static hosting works.

## Agent execution instructions
Implement all phases now in a single pass. Do not ask for approval between phases. Make reasonable design decisions where details are unspecified. Inspect the resulting files, run available checks, fix obvious issues, and provide a concise final implementation report. **The throwing trajectory is non-negotiable.**
