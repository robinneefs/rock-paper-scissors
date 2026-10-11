# Changelog

Every build that goes online gets a new version number (in `apps/game/package.json`, shown small on the home screen) and an entry here. Versions stay under 1.0 while the game is early: a new feature bumps the middle number (0.2.0 → 0.3.0), a fix-only build bumps the last (0.2.0 → 0.2.1). Each version is tagged `vX.Y.Z` with a GitHub release, made automatically from its entry here when it reaches main.

## 0.5.0 (2026-10-10)

- Dev tuning panel for the game-feel pass. When the game runs with `npm run dev`, a panel in the top-right corner lists every feel value (reveal timing, hit-pause, shake, flash, health bar drain, buttons, menus, banners and more) plus the rules (start health, damage, rounds to win) and phase timings (countdown length and the rest). Feel values change live while you play; rules and timings apply from the next match, and RESTART MATCH starts one at once. Edits are remembered on reload, COPY CHANGES puts a list of what changed on the clipboard to paste back into the code, and RESET ALL goes back to the defaults. The backquote key (`) hides and shows it. The online build does not include the panel. How to use it and how it's set up: `docs/tuning/TUNING-PANEL.md`, linked from the README.
- The fight screen's health bars and round pips now follow the rules of the match being played.

## 0.4.1 (2026-10-10)

- Tidier project folder: the shared TypeScript settings and the unit test setup moved from the root into a new `config/` folder, and the Prettier settings moved into `package.json`. Nothing changes in the game itself.

## 0.4.0 (2026-10-10)

- The startup intro now shows the Chain Shift studio logo, redrawn as purple pixel art in the style of the game's title (chunky pixels, light top edge, drop shadow, dark outline), replacing the placeholder logo.

## 0.3.0 (2026-10-10)

- FILL HEIGHT is now the default scaling the first time someone opens the game, so the cabinet fills the screen. PIXEL PERFECT is still in Options, and a choice already made is kept.

## 0.2.0 (2026-10-10)

- New OPTIONS item on the home menu, opening an Options screen.
- Scaling setting: PIXEL PERFECT (default, whole-number scaling, sharpest) or FILL HEIGHT (the cabinet fills the screen; pixels can be slightly uneven). Remembered between visits.
- The version number is shown small in the corner of the home screen.
- Fixed the browser smoke test so it runs reliably in CI.

## 0.1.0 (2026-10-10)

First playable version.

- Placeholder logo intro (skippable), home menu with START GAME (VS CPU) and a greyed-out ONLINE slot.
- Best-of-three match against a random CPU: 5 second countdown with a random pick if time runs out, move icons, fighter poses, hit flash, screen shake, health bars, K.O. and round banners.
- Result screen with RETRY and MAIN MENU.
- Keys 1/2/3 or the cabinet buttons to pick; arrows or the joystick in menus. Works in a desktop browser and on a phone.
- Placeholder art drawn in code; no sound yet.
