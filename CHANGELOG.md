# Changelog

Every build that goes online gets a new version number (in `apps/game/package.json`, shown small on the home screen) and an entry here. Versions stay under 1.0 while the game is early: a new feature bumps the middle number (0.2.0 → 0.3.0), a fix-only build bumps the last (0.2.0 → 0.2.1). Each version is tagged `vX.Y.Z` with a GitHub release, made automatically from its entry here when it reaches main.

## 0.10.0 (2026-10-11)

- **New fighters.** Player 1 (left) is now a strong brawler in blue jeans, brown boots and an open red shirt over a white undershirt. Player 2 (right) is a martial artist with a high ponytail, a teal wrap top with white trim, a gold sash, navy pants, white boots and wrapped hands. Both are still drawn in code at 64 px tall, with every pose (idle, rock, paper, scissors, hurt, K.O., win) redrawn; the real sprite sheets can replace them later under the same names.

## 0.9.1 (2026-10-11)

- **Online: fixed sides for both players.** The player who creates the room (the host) is always Player 1 on the left, and the player who joins is always Player 2 on the right, the same on both screens. Before, each player saw themselves on the left. The name tags now read "P1 YOU" and "P2 RIVAL" (or the other way round for the guest), and the result screen shows the score as P1's rounds - P2's rounds. Both players need this version.

## 0.9.0 (2026-10-11)

- **Flat white move icons.** The cabinet buttons and the move badges on the reveal now show big, clear white icons (a boulder, a sheet of paper, open scissors) with a dark outline, in the style picked from the round 3 mock-ups.
- **Punchier buttons.** The buttons have a dark rim and go deeper when pressed. Locking in a move flashes its button white twice while a ring pops out round it; it then stays down and lit, and the other two dim.
- New tuning values for the lock-in flash and ring (`buttons` in the dev tuning panel).
- **The control panel has depth.** Its top now looks slanted: lit at the back and darker towards you, with bevelled sides, corner bolts, button wells with a lit rim, and a raised front lip with a pink trim strip over a shadowed front face.
- **A big, juiced timer.** The pick timer is big and outlined so it stands out against the sky. Each new second is one size bigger than the last and sits a little lower, moving towards the middle of the screen, and pops in white. It is gold at 3, then red at 2 and 1, shaking and tilting from side to side (harder at 1). When time runs out a big red 0 slams down. All of this can be tuned under `hud` in the dev tuning panel.
- **Thicker health bars.** The bars are 12 pixels tall (was 8) and look like lit tubes: a shine along the top, darker bands underneath, a bright leading edge, notches every tenth, and a gold frame.
- **Fixed: a short loud burst of music on every screen change**, even with sound off. A new music track started at full volume for a moment before fading to its real level; it now starts silent and fades in.
- **Faster, shorter fights.** You now have 3 seconds to pick instead of 5, and each fighter starts a round with 50 health instead of 100, so a round takes about 3 or 4 exchanges. The health bars turn red below 15 health (was 30). Online, both players need this version.
- **A new reveal: the moves collide.** The falling move coins are gone. When both picks are in, a bigger move badge with a gold starburst pops in beside each fighter (with AUTO over it if the timer picked for that player). Both badges fly to the middle and collide with a white flash. The winning badge stays in the middle and the losing one is knocked away off the screen, turning as it goes. "ROCK WINS", "PAPER WINS" or "SCISSORS WINS" slams in above in the winning move's colour; a tie bounces both badges back and says "CLASH!". It works the same in online matches. Tune it under `reveal` in the dev tuning panel.
- **Three fight stages, picked at random.** Each match is fought on one of them, and Retry moves on to the next, so you never get the same stage twice in a row. Online, both players always see the same stage.
  - **Night Street:** brick buildings with lit windows and pink BAR and cyan RPS neon signs, a skyline and a crescent moon, street lamps, and a wet road that reflects the neon.
  - **Sunny Field:** blue sky with a sun and puffy clouds, rolling hills, a big tree on each side, a wooden fence, and grass with flowers around a worn dirt patch.
  - **Castle Roof** (a nod to the '90s arcade fighters): a sunset sky with a big moon, mountains and pines, a tiered castle, red banners, and a plank floor.
  - The menus keep the sunset backdrop. Stages are listed in `apps/game/src/config/stages.ts`, so adding or removing one is one line plus its painter. Add `?stage=field` (or `street`, `castle`) to the address to try a stage.
- **A new menu backdrop.** The home, options and online screens drop the '80s sunset for a '90s arcade select-screen look: deep purple with a soft glow behind the menu, a pink diagonal slash, halftone dots in two corners, big faint move symbols, and thin stripes drifting slowly across.
- **Evened-out sound levels.** The menu blips, the ROUND sting and the win and lose jingles were much louder than the fight sounds (most noticeable after a match, when choosing Retry or Main menu). They now play at about the same level as the rest.
- **The cabinet shakes.** The whole arcade machine rattles against the room: hard on a K.O., a little on a 20-damage hit, and once when the pick timer runs out.
- **K.O. slow motion.** The finishing hit freezes on a white flash, then plays in slow motion for a moment before the K.O. banner.
- **Hit sparks and dust.** Sparks in the winning move's colours fly off the hurt fighter (more for bigger hits), and dust kicks up behind a fighter's back foot as they lunge.
- **Low health pulse.** At 15 health or less, a health bar pulses brighter and its frame flashes red.
- **A flickering marquee.** Every few seconds the marquee's backlight flickers like an old tube, on its own, whatever is happening in the game.
- All of these are tunable in the dev panel (`cabinet`, `ko`, `sparks`, `dust`, `marquee`, and `lowPulseMs` under `hud`).
- **CRT screen.** The game screen now looks like an arcade tube: fine scanlines, a soft glow around bright colours, darker edges, rounded corners and a faint band rolling down. It is a WebGL shader on the monitor plus a scanline layer in the page; the cabinet around it stays crisp. Turn it off with the new CRT SCREEN option (on by default). Tune it under `crt` in the dev panel.
- **Impact shader effects.** On a K.O. the screen's colours split apart (red and blue pulled sideways) and settle back, and a 20-damage hit makes the screen's rows wobble for a moment. They play even with the CRT look turned off (WebGL only). Tune them under `crt` in the dev panel.
- **Falling damage numbers.** When a hit lands, the damage (like "-15") hops up next to the hurt fighter's head in the winning move's colour, then falls away.

## 0.8.0 (2026-10-11)

- **Sound and music.** 90s arcade chiptune throughout: menu blips, a tick for each of the last 3 seconds of the timer (higher each second) and a slam when it runs out, a lock-in chime when you pick, a whoosh as the icons drop, a different hit for each winning move (a heavy thud for Rock, a slap for Paper, a metal slash for Scissors, each with three variations), a clang for a tie, a big K.O., ROUND and FIGHT! stings, and win and lose jingles.
- **Music.** A menu loop on the home, options and lobby screens (and the result screen after the jingle), and a faster fight loop during matches. Browsers only allow sound after your first tap or key press, so the music starts then.
- **Options: SOUND, MUSIC and EFFECTS.** Turn all sound off, or set the music and effects volumes separately (stick left and right, from OFF to 10). They are remembered.
- Every sound is made from scratch by `tools/audio/make-audio.mjs` (`npm run audio`), so the game owns all of it. Sound list, licences and how to change a sound: `docs/audio/AUDIO.md`.

## 0.7.0 (2026-10-11)

- **The moves are Rock, Paper and Scissors again.** Rock (was Attack) beats Scissors for 15 damage, Scissors (was Throw) beats Paper for 20, and Paper (was Block) beats Rock for 10. The damage and balance are unchanged. Keys 1, 2 and 3 pick Rock, Paper and Scissors, and the cabinet buttons are red, yellow and cyan with new boulder, paper sheet and scissors icons.
- **RPS Rivals branding.** The screen is now square (216 x 216), and the space above it holds a taller marquee with the RPS Rivals logo art inside a bezel. The old "RPS FIGHTER" title on the home screen is gone, and the browser tab says RPS Rivals. Saved settings carry over.
- Online: both players need this version, since the moves have new names.

## 0.6.2 (2026-10-11)

- NEW ROOM can now be cancelled without a keyboard: a CANCEL button on the screen (tap or click it), and any cabinet button or Enter cancels too. Before, only Esc worked, so on a phone there was no way back.
- JOIN ROOM has a BACK button on the screen as well, for the same reason.

## 0.6.1 (2026-10-11)

- JOIN ROOM: typed letters now follow your keyboard layout. On an AZERTY (or any non-QWERTY) keyboard, the M key types M; before, the game read the key's position, so you had to press where M sits on a QWERTY keyboard.
- JOIN ROOM on phones: tapping the code boxes now opens the on-screen keyboard. The boxes are backed by a real (invisible) text field, which also lets you paste a code. The stick still picks letters too.

## 0.6.0 (2026-10-11)

- **Online play, first version.** ONLINE on the home menu opens a lobby: CREATE ROOM shows a four-letter room code and waits; your friend picks JOIN ROOM on their own device and enters the code (stick up and down picks letters, or type them). Then you fight a normal best of three. The match runs on a small server (a Cloudflare Worker with one room per code) using the game's own referee, so neither player can see the other's pick before the reveal, and the countdown can't be stretched by a slow connection.
- Online, you always appear on the left, your opponent shows as RIVAL, and RETRY waits until both players want a rematch ("WAITING FOR RIVAL", "RIVAL WANTS A REMATCH"). If the other player leaves or the connection drops, the screen says so and goes back to the main menu.
- Both players must be on the same version of the game to share a room.
- New publishing setup. The game now publishes itself from this repository: the `production` branch is the live game at https://robinneefs.github.io/rps-rivals/, and `main` is a staging copy at https://robinneefs.github.io/rps-rivals/staging/ for testing new builds first. Each has its own online match server. Going live means merging main into production; version tags and releases are now made at that point. The old address, robinneefs.github.io/RPS-Fighter/, will forward to the new one.
- ONLINE stays greyed out in published builds until the Cloudflare setup is done; in `npm run dev` it connects to a local server (`npm run dev:server`). Setup and deploy notes: `apps/server/README.md`.

## 0.5.4 (2026-10-11)

- The architecture doc is rewritten to match the code as it is now: real file names, types, events, phase timings and tuning values, the scenes and shared services, the lint rules and the tests, with planned parts marked. Its seven diagrams are redrawn with the current values, and two are new: a code map of every folder, and the free ways to host online matches.
- New `docs/architecture/ONLINE-OPTIONS.md`: since GitHub Pages only serves files, online matches need something live in between. It compares free options (a Cloudflare Durable Object, peer-to-peer with PeerJS, Colyseus on a free host) and recommends a Cloudflare Durable Object running the game's own referee. The architecture doc also lists what the code already gets right for online play and what still has to change.
- Nothing changes in the game itself.

## 0.5.3 (2026-10-11)

- The architecture doc now spells out what the pixel-perfect setup does and doesn't do for imported images: everything is forced onto the native pixel grid and never blurs, but a smooth image is not turned into pixel art, so art has to be made at native size in palette colours first. Nothing changes in the game itself.

## 0.5.2 (2026-10-11)

- The README now says up front, in a centered banner with badges, that RPS Rivals is an AI-developed project run by Claude. Nothing changes in the game itself.

## 0.5.1 (2026-10-11)

- The game is now called **RPS Rivals**. The README, project context, architecture doc, design docs and mock-up sources use the new name. The game itself still shows the old title until the asset rebrand.

## 0.5.0 (2026-10-11)

- Dev tuning panel for the game-feel pass. When the game runs with `npm run dev`, a panel in the top-right corner lists every feel value (reveal timing, hit-pause, shake, flash, health bar drain, buttons, menus, banners and more) plus the rules (start health, damage, rounds to win) and phase timings (countdown length and the rest). Feel values change live while you play; rules and timings apply from the next match, and RESTART MATCH starts one at once. Edits are remembered on reload, COPY CHANGES puts a list of what changed on the clipboard to paste back into the code, and RESET ALL goes back to the defaults. The backquote key (`) hides and shows it. The online build does not include the panel. How to use it and how it's set up: `docs/tuning/TUNING-PANEL.md`, linked from the README.
- The fight screen's health bars and round pips now follow the rules of the match being played.

## 0.4.2 (2026-10-11)

- Added four redesign mock-ups (two of game screens, two of fighter character styles) in `docs/mockups/redesign/`, kept for the upcoming redesign. Nothing changes in the game itself.

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
