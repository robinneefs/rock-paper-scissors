# Changelog

Every build that goes online gets a new version number (in `apps/game/package.json`, shown small on the home screen) and an entry here. Versions stay under 1.0 while the game is early: a new feature bumps the middle number (0.2.0 → 0.3.0), a fix-only build bumps the last (0.2.0 → 0.2.1). Each version is tagged `vX.Y.Z` with a GitHub release, made automatically from its entry here when it reaches main.

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
