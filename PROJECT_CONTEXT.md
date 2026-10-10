# Rock Paper Scissors Fighter: Project Context

_Last updated: 2026-10-10_

This is the single source of truth for the project. **Any Claude working on this project: read this file first, and update it whenever a decision is made or something changes.** Keep edits small, add to the decision log, and bump the date above.

## Folder layout (2026-10-10)

Same layout here and in the repository (the archive stays out of the repo):

| Folder | What's in it |
|---|---|
| `PROJECT_CONTEXT.md` | This file |
| `README.md` | Repository front page |
| `docs/idea/` | Original idea brief |
| `docs/design/` | Interactive design document (saved HTML) |
| `docs/architecture/` | Architecture document (`ARCHITECTURE.md`) and its diagrams (`diagrams/*.svg`) |
| `docs/screenshots/` | Screenshots of the current build, browser and phone (recapture with `node sources/screenshots/capture.mjs`) |
| `docs/mockups/cabinet/` | Arcade cabinet mock-ups drawn before the build |
| `docs/mockups/landscape-superseded/` | Old landscape mock-ups |
| `docs/art-direction/` | Art direction samples (sizes, styles, body shapes) |
| `sources/` | Code that draws the mock-ups, samples and diagrams (`landscape-mockup/`, `cabinet-mockup/`, `art-direction/`, `architecture/`) builds the interactive design document (`design-doc/`) and captures game screenshots (`screenshots/`) |
| `archive/old-draft/` | Discarded first draft (not in the repo) |

New art samples go in `docs/art-direction/` (their source in `sources/art-direction/`); new mock-ups in `docs/mockups/`.

## Links

- Game design document (Claude Doc, editable): https://claude.ai/code/artifact/3f1b261a-b2c2-4342-b7f6-22d848beccb6
- Interactive design document (HTML artifact, playable sketch): https://claude.ai/artifact/MvaJcvzYeLjAwK49YtdybZ
- Play it online: https://robinneefs.github.io/RPS-Fighter/ (GitHub Pages, from the `RPS-Fighter/` folder of `robinneefs/robinneefs.github.io`)
- Repository: https://github.com/robinneefs/rock-paper-scissors (game code in `packages/core` + `apps/game`, plus design docs, mock-ups and art samples)
- Original idea brief: `docs/idea/rock-paper-scissors-idea.md`
- Architecture document: `docs/architecture/ARCHITECTURE.md` (diagrams redrawn with `node sources/architecture/diagrams.mjs`)

## Where things stand

- Phase: **building**. First playable version built 2026-10-10 (roadmap steps 1 and 2), merged into `main` as PR #3 on 2026-10-10. The user also runs it locally from `D:\Vibe Coding Projects\rock-paper-scissors` (`npm run dev`).
- What works: placeholder logo intro (skippable), home menu (START GAME vs CPU, ONLINE greyed "SOON"), full best-of-three vs a uniformly random CPU (5s countdown, random auto-pick, icons drop, poses, hit flash, whole-pixel shake, health drain, K.O., round banners), result screen with RETRY / MAIN MENU. Keys 1/2/3 or tapping the cabinet buttons; arrows / joystick drag in menus. Works in a desktop browser and on a phone. OPTIONS on the home menu opens an Options screen with one setting, Scaling: Fill height (default since v0.3.0, fills the screen) or Pixel perfect (whole-number), remembered between visits.
- Art is **placeholder**, drawn in code (`apps/game/src/assets/placeholders/`) under the real asset keys (`assets/keys.ts`), so final sprites swap in without touching views. No sound or music yet.
- Next (step 3, order agreed with the user 2026-10-10): 1) dev tuning panel (Tweakpane), 2) juice on the placeholders (sparks, dust, hit-pause, anticipation, stronger banners), 3) sound (CC0 SFX + menu/fight loops), 4) final fighter art once the parked art direction and tool (PixelLab or Retro Diffusion) are decided. Open feel questions: 5s vs 3s timer, 100 health (rounds take about 6 to 8 exchanges).
- `archive/old-draft/` in this folder is an **earlier draft the user discarded**. Do not build on it. It is not in the repository.

## Code (2026-10-10)

| Where | What |
|---|---|
| `packages/core` | `@rps/core`: rules (`resolveExchange`, `applyExchange`, rounds) and the `Referee` phase machine with injected clock + seeded RNG. Rules config and phase timings in `src/config.ts` (pick 5000, reveal 1800, round intro 1600, round over 2200 ms). |
| `apps/game/src/session` | `MatchSession`, `LocalSession`, `RandomCpu` (think delay 0.4 to 1.6s), `createSession(setup)` |
| `apps/game/src/scenes` | Boot, Cabinet, Logo, Home, Options, Fight, Result, Transition (pixel wipe) + `flow.ts` (`SceneFlow`) |
| `apps/game/src/{views,fight,fx,menus,input,platform}` | Dumb views, `FightDirector`, shake/flash, menus as data, `InputRouter`, `PixelScaler` (two scaling modes), `SettingsStore` (`platform/settings.ts`, localStorage) |
| `apps/game/src/config/tuning.ts` | Every feel value |
| `apps/game/public/assets/logo.png` | Placeholder logo (swap this file for the company logo; regenerate the placeholder with `node tools/make-placeholder-logo.mjs`) |

Changelog: `CHANGELOG.md` at the repo root.

Commands: `npm install`, `npm run dev`, `npm test` (51 tests), `npm run test:e2e` (Playwright smoke), `npm run lint`, `npm run typecheck`, `npm run build`. CI (GitHub Actions) runs all of them.

**Versions and changelog (rule, user's request 2026-10-10):** every build that goes online gets a version bump and a `CHANGELOG.md` entry, no exceptions. Semver under 1.0: new features bump the middle number (0.2.0 → 0.3.0), fix-only builds the last (0.2.1). The version is set in one place, `apps/game/package.json`; Vite injects it (`src/version.ts`) and the home screen shows it small in the bottom-right corner. Each version is tagged `vX.Y.Z` with a GitHub release by the Release workflow (`.github/workflows/release.yml`): on every push to main it tags a package.json version that has no tag yet, using its changelog entry as the notes (cloud sessions can't push tags themselves). Current: **v0.2.0** (Options + scaling). v0.1.0 = the first playable (main @ a1a96aa).

Publishing (2026-10-10): bump the version and add the changelog entry in the PR, merge (the Release workflow tags it), `npm run build`, then replace the contents of `RPS-Fighter/` in `robinneefs/robinneefs.github.io` with `apps/game/dist/*` and push to its `main`; GitHub Pages redeploys on its own. Vite `base: './'` keeps paths relative, so no base-path change is needed. Nothing updates the online copy automatically: republish after changes the user wants online.

## The game in one paragraph

A browser fighting game built on rock paper scissors. Two pixel-art fighters stand close together in the middle of the screen. Each exchange, both players secretly pick Attack, Throw or Block within a 5 second countdown; the picks are revealed together, move icons drop in, the fighters act out their moves, and the loser of the exchange takes damage. Best of three rounds. Single player against a random computer first; online multiplayer and an Android app later.

## Core rules

| Winning move    | Beats  | Damage to loser |
|-----------------|--------|-----------------|
| Throw           | Block  | 20              |
| Attack          | Throw  | 15              |
| Block (counter) | Attack | 10              |

- Tie: no damage. Only the loser of an exchange takes damage (no double KO).
- 100 health per fighter per round (starting value, to tune).
- Round ends when a fighter hits 0. Match = best of three rounds. Health resets each round.
- Computer opponent: uniformly random pick (decided by the user; no pattern reading for now).

## The mind game (user's insight)

Uneven damage makes this different from classic RPS. Throw is the tempting big hit, Attack punishes Throw, Block punishes Attack, Throw punishes Block.

- Nash equilibrium (net damage, zero-sum): **Attack 4/9 (44%), Block 3/9 (33%), Throw 2/9 (22%)**. Throw, the biggest hit, is the rarest optimal pick.
- Low health changes stakes: at 15 HP, a 15 or 20 win ends the round but a 10 block counter doesn't.
- Rule of thumb: each move's balanced share is proportional to the damage of the move it beats (Attack ∝ Throw dmg, Throw ∝ Block dmg, Block ∝ Attack dmg).
- Vs the random CPU: Attack and Throw average +1.67 net damage per exchange, Block -3.33. A smarter CPU (equilibrium mix or pattern punishing) is a future option.

## Exchange flow

1. 5 second countdown (3s is the alternative to playtest). Player picks via tap/click or keys 1/2/3; can change until time is up.
2. Timer hits 0: anyone without a pick gets a random move. Picks hidden until both are locked.
3. Reveal: each fighter's move icon drops in above their head with a bounce, at the same time.
4. Both fighters animate their move. Winner lands with hit flash, hit sound, small screen shake. Tie = clash, no damage.
5. Loser's health bar drains.
6. Next countdown, or KO, round banner ("Round 2", "Final round"), or the result screen with Retry / Main menu (see "Menus and screen flow").

Online: the server runs the timer and the random fallback pick.

## Presentation

- Pixel art. **Vertical layout framed as an arcade cabinet** (see "Arcade cabinet layout" below); this replaces the earlier landscape 16:9 plan. Fighters about one body-width apart near the center of the monitor.
- On the monitor, top: health bars (player left, opponent right), two round-win pips each, timer in the middle.
- Move choice happens on the cabinet's control panel (three physical arcade buttons), not on on-screen buttons. Keys 1, 2, 3 on desktop.
- Animations per fighter: idle, attack, throw, block (+ counter strike), hurt, KO, win pose.
- **Art decision:** the free packs found (Jestaa free character, LuizMelo Fantasy Martial Characters, Pixel Moon Studio Fighter v2) don't look good enough and lack block/throw. Before building: find better packs (paid OK) or AI-generate our own fighters and clean them into sprite sheets.
- Move icons: Kenney (CC0) is an option.
- **Art direction (2026-10-10, in progress):** fighters stay martial artists in gi (white gi + red headband vs blue gi + gold band), but drawn cute and cartoony with a slight Japanese (chibi) feel: short, wide, big heads. Tone: arcade neon '80s (synthwave sunset, neon grid floor, neon torii). The user did not like the style of the first mock-ups. Size samples at 48, 64 and 80 px tall are in `docs/art-direction/` (source in `sources/art-direction/`). **Sprite size: medium, 64 px tall (decided).** The user is not crazy about the overall aesthetic yet and wants to revisit it later.

## Arcade cabinet layout (decided 2026-10-10)

The whole game is drawn as an upright arcade machine. This gives a vertical layout that works the same in a desktop browser and on a phone held upright.

| Part | What it shows / does |
|---|---|
| Monitor (top ~2/3) | The fight: both fighters, health bars, round pips, timer, and the move coins/icons that show each player's pick on reveal. |
| Control panel (bottom ~1/3) | Three physical arcade buttons: Attack, Throw, Block. Click/tap them or press keys 1/2/3. They press down visibly when used. |
| Joystick (left of the buttons) | No effect in a fight (just for fun); in menus it moves the cursor. Tilts in 8 directions with the arrow keys (two keys = diagonal) or by click-and-drag; springs back to center on release. |

- **Browser:** the cabinet stands centered and is scaled to fit the window height; the space around it is a dark arcade-room backdrop.
- **Phone:** portrait; the cabinet fills the screen, with the control panel in thumb reach.
- Monitor content is a 3:4 portrait screen (default picked by Claude; open to change). Game resolution 216x288 with 64 px fighters.
- **Cabinet frame 270x472 native (decided 2026-10-10):** marquee 32, bezels 12, monitor 216x288, control panel 128. Shows at 2x in a 1080p browser window and 4x on most phones. Mock-ups redrawn at this size.
- Mock-ups: `docs/mockups/cabinet/cabinet-browser-pick.png`, `cabinet-browser-reveal.png`, `cabinet-phone-pick.png`, `cabinet-phone-reveal.png`, plus the menu screens (`cabinet-phone-logo.png`, `cabinet-phone-home.png`, `cabinet-phone-result.png`, `cabinet-browser-home.png`). Source in `sources/cabinet-mockup/` (`cabinet.html#browser-pick` etc.; render with `node shotcab.mjs browser-pick phone-reveal ...`). The older landscape mock-ups (`docs/mockups/landscape-superseded/`) are superseded.

## Menus and screen flow (decided 2026-10-10)

The user asked for menu infrastructure now, so multiplayer menus can be added later without restructuring. Flow: **Boot → Logo intro → Home → Fight → Result → (Retry → Fight | Main menu → Home)**. Diagram: `docs/architecture/diagrams/7-screen-flow.svg`; details in section 6 of the architecture doc.

| Screen | What it shows / does |
|---|---|
| Logo intro | A **placeholder logo** ("YOUR STUDIO" + a simple pixel emblem) fades in, holds, fades out (about 0.5s / 1.5s / 0.5s, tunable). Any button or tap skips it. To be replaced by the company logo: swapping one image (`assets/logo.png`) is the whole change. Fades step through a few palette levels (pixel perfect, no smooth alpha). |
| Home (main menu) | Game title, both fighters idling, and a menu: **START GAME (VS CPU)**; **ONLINE** shown greyed out with "SOON" as the slot for multiplayer; **OPTIONS**. More buttons (online lobby, how to play) are added as new menu items. |
| Options (added 2026-10-10) | **SCALING**: FILL HEIGHT (default since v0.3.0) or PIXEL PERFECT; confirm or stick left/right flips it and it applies at once; **BACK** (or Esc) returns home. Two lines under the menu explain the current mode. Saved in localStorage. |
| Fight | The match vs the CPU, as before. |
| Result | Shown over the last fight frame: "YOU WIN!" or "CPU WINS", the round score (e.g. 2-1), and a menu: **RETRY** (default, new match with the same setup) and **MAIN MENU**. |

- Menu controls: joystick or arrow keys move the cursor; any of the three cabinet buttons, Enter or Space confirms; items can also be tapped/clicked on the monitor; Esc / Android back goes back. (Default picked by Claude: gives the joystick a use in menus; easy to change.)
- Structure: menus are data (`menus/homeMenu.ts`, `menus/resultMenu.ts`) drawn by one reusable `MenuView`; one `SceneFlow` handles all screen changes and transitions; a `MatchSetup` (`{ mode: 'cpu' }` now, `{ mode: 'online', roomCode }` later) is passed Home → Fight → Result so Retry replays the same kind of match (online: both players must agree to the rematch).
- Music: menu loop on Home and Result, fight loop in the fight.
- Menu text uses a 5x7 bitmap pixel font (pixel-perfect rule 5).
- Mock-ups: `docs/mockups/cabinet/cabinet-phone-logo.png`, `cabinet-phone-home.png`, `cabinet-phone-result.png`, `cabinet-browser-home.png` (source: `sources/cabinet-mockup/screens.js` + `pixfont.js`, render with `node shotcab.mjs phone-home ...`).
- Later menus (not now): online lobby (create/join room code), more options (volumes, mute), pause, how to play.

## Pixel perfect (requirement, 2026-10-10)

The user wants the game to be, or at least look, pixel perfect. Rules:

1. **One pixel size everywhere.** Fighters, backgrounds, cabinet, HUD, icons and effects all share the same pixel grid; no mixing of sizes ("mixels").
2. **Whole-number scaling only.** The game renders at its native resolution and is scaled up 2x, 3x, 4x... with nearest-neighbour (no smoothing). Leftover screen space is filled by the backdrop/border, never by stretching.
3. **Snap to whole pixels.** Sprites, camera, screen shake and tweens land on whole pixels; no sub-pixel drift or blur.
4. **No free rotation or scaling of sprites.** Turning, squash or zoom is drawn as frames, not done by the engine.
5. **Pixel UI.** Text uses a pixel font at its native size (or a whole multiple); bars, buttons and glows are drawn as pixels, not as smooth CSS/vector effects.
6. **Limited palette** shared across all art, so everything looks like one piece.

**Exception, chosen by the player (2026-10-10):** Options → Scaling → **Fill height** scales the cabinet to fill the window (height on desktop, width on a narrow phone) at a fractional scale. Still nearest-neighbour and one native grid, so no blur, but some pixel rows/columns come out one device pixel wider than others (slightly uneven lines and text). Since v0.3.0 Fill height is the default for a first visit (user's call); Pixel perfect is one press away in Options. Details in section 7 of the architecture doc.

Engine: Phaser with `pixelArt: true` / `roundPixels: true` and integer zoom. The current mock-ups break rules 1 and 5 (smooth HTML text and glows over the pixel art; the big-pixel version uses a different pixel size for the monitor and the cabinet). Real art must follow the rules.

## Polish and game feel (core goal, 2026-10-10)

Very important to the user: the final product must look and feel polished. Besides the art style this means game feel ("juice"):
- Screen shake that feels good (short, punchy, scaled to damage; whole pixels).
- Visual effects: hit flash, sparks, impact frames, dust, brief hit-pause on big hits.
- Dynamic, lively animations (anticipation, overshoot, follow-through; idle never static).
- Sound effects for every action, layered and varied.
- UI motion: buttons press down, bars drain smoothly, banners slam in.

When: a dedicated tuning pass near the end, before release, at the latest before the third version. Build systems so this is easy to tune (central tuning values for shake, hit-pause, timings).

## Audio

- SFX: countdown ticks (last 3s), lock-in, distinct hit per winning move, tie clash, KO, "Round 1, fight", win jingle. Source: OpenGameArt "37 hits/punches" (CC0).
- Music: menu loop + fight loop, mute and separate volumes. Start with a CC0 chiptune loop.
- Later: make music with Claude (composed as code, e.g. Tone.js sequences, or as MIDI rendered to audio).

## Technology (decided)

| Part | Choice |
|---|---|
| Engine | Phaser 3 (chosen over Godot) |
| Language | TypeScript |
| Build | Vite |
| Tests | Vitest |
| Online (later) | Node + Colyseus, server-authoritative |
| Android (later) | Capacitor wrapping the web build |

Architecture rules:
- **Shared rules module** in plain TypeScript: no Phaser, no timers, no network. Both moves in, result out; also tracks health, rounds, match.
- Scenes only display what the rules module returns; they never decide results.
- Moves arrive through a **move source**: now local input + random CPU; later the server.
- Online: only the server knows both picks before the reveal (anti-cheat).

**Architecture (proposed 2026-10-10, see `docs/architecture/ARCHITECTURE.md`):**
- npm workspaces monorepo: `packages/core` (rules + referee, zero dependencies), `apps/game` (Phaser client), later `apps/server` (Colyseus).
- Four layers, dependencies only point down: Platform, Presentation (scenes, director, views, fx, audio, input), Session, Core. Import rules enforced by ESLint.
- Core = pure rules functions + a `Referee` phase machine (RoundIntro, Picking, Reveal, RoundOver, MatchOver) with injected clock and seeded RNG; the same referee runs in the Colyseus room later.
- Scenes talk only to a `MatchSession` interface: `LocalSession` (referee + `RandomCpu` move source) now, `OnlineSession` later.
- Scenes wire, a `FightDirector` choreographs, views are dumb. `CabinetScene` always runs; monitor scenes (Logo, Home, Fight, Result) draw through a 216x288 camera viewport. Menus are data + one `MenuView`; `SceneFlow` owns screen changes.
- Two homes for numbers: rules and phase timings in `packages/core/src/config.ts` (shared with server); all feel values in `apps/game/src/config/tuning.ts`. Dev-only Tweakpane panel to tune live.
- Pixel scaler in `platform/`: largest whole scale in device pixels, canvas fills the window, leftover is arcade room.
- Built as proposed (2026-10-10): npm workspaces monorepo, `eslint-plugin-import` `no-restricted-paths` + `no-restricted-imports` (no Phaser in core/session, no `Referee` outside the session). Tweakpane not added yet (step 3). `MatchSession` gained `ready()` (scene is listening; local starts the match) and a `rematchAccepted` event for Retry.

## Roadmap

1. Rules core with tests (console only). **Done 2026-10-10.**
2. Playable prototype: placeholder fighters, buttons, bars, timer, best of three, plus the menu flow (logo intro, home with Start game, result with Retry / Main menu). **Done 2026-10-10.**
3. Art and juice: sprites, falling icons, hit flash, shake, SFX, music.
4. Polish and release on the web (e.g. GitHub Pages), including a dedicated game-feel pass (see "Polish and game feel").
5. Online play (Colyseus, room codes).
6. Android build (Capacitor).

## Open questions

- Fighter art: better pack or AI-generated? (no longer blocks building: placeholders are in; real art swaps in under the same asset keys)
- Overall aesthetic: the user is "not crazy about it yet" (cute chibi + neon '80s); parked, revisit later.
- Art tools (researched 2026-10-10): best fit is **PixelLab** (pixel-art AI with character directions + animations, hosted MCP at https://api.pixellab.ai/mcp, Bearer API key, plans from ~$12/mo). Alternatives: Retro Diffusion (great look, Aseprite extension, $20-65 one-time, has API), Ludo, Scenario; Aseprite for hand cleanup. Claude's cloud sessions currently cannot reach api.pixellab.ai (built-in environment blocks it): needs a cloud environment that allows the domain plus the key as a secret, or run Claude Code locally with the MCP. User wants a more attractive pixel style with slightly bigger pixels.
- Cabinet look: monitor aspect (3:4 portrait chosen as default), cabinet colours and side art.
- Architecture defaults to confirm (see section 16 of the architecture doc): monorepo, Tweakpane, lint tool for import rules.
- 100 starting health right? 5s or 3s timer?
- Game name beyond "Rock Paper Scissors Fighter"?

## How the user likes to work

- Discuss and decide first, then design docs, then build. (Building was approved 2026-10-10: "yes start that" for the first playable.)
- Keep questions short and few at a time; offer a recommendation.
- Online multiplayer readiness is "very important" to the user.
- Wants a solid, expandable base with readable, structured code (asked for the architecture document before any building).

## Artifacts

- Mock-up images (1280x720 PNG, superseded by the cabinet layout): `docs/mockups/landscape-superseded/1-pick-your-move.png`, `2-reveal-throw-beats-block.png`, `3-tie-clash.png`, `4-match-won.png`. Fighters are placeholders drawn in code.
- Interactive design document: https://claude.ai/artifact/MvaJcvzYeLjAwK49YtdybZ (rebuilt 2026-10-10 around the cabinet: a playable 270x472 cabinet running logo intro → home → fight → result, plus all chapters, menu and cabinet mock-ups, art samples and diagrams). Saved copy: `docs/design/interactive-gdd.html`. Source: `sources/design-doc/gdd.html` (page template) + `sketch.js` (the playable cabinet), using `sources/cabinet-mockup/art.js`, `pixfont.js`, `screens.js`. Build with `node sources/design-doc/build.mjs [artifact-out.html]`; the artifact copy is published with the images under `screenshots/`, `art-direction/`, `architecture/diagrams/`. The old landscape page sources stay in `sources/landscape-mockup/` (superseded).
- Keep the Claude Doc, the interactive page and this file in sync when decisions change.

## Decision log

- 2026-10-10: Discarded the first draft; restarted with features, then engine, then design doc.
- 2026-10-10: Random CPU; pure Attack/Throw/Block; buttons + bars + animated fighters; best of three.
- 2026-10-10: Pixel art; web first, Android later; online later (very important); 5s countdown with random auto-pick; falling move icons; fighters close together; hit SFX + music.
- 2026-10-10: Engine: Phaser 3 + TypeScript.
- 2026-10-10: Added the mind-game analysis (user's insight on uneven damage).
- 2026-10-10: Free art packs rejected; find better art or AI-generate before building.
- 2026-10-10: Added the project context file, 4 mock-up images and the interactive HTML design document with a playable sketch.
- 2026-10-10: Art direction: cute, short and wide chibi martial artists with a slight Japanese feel; neon '80s arcade tone. Size samples drawn (48/64/80 px).
- 2026-10-10: Sprite size medium (64 px). Overall aesthetic parked to revisit later.
- 2026-10-10: Polish and game feel is a core goal; dedicated tuning pass before release (at the latest before the third version).
- 2026-10-10: Pixel perfect is a requirement (see section).
- 2026-10-10: User approved the cabinet layout and proportions (art style to be refined).
- 2026-10-10: Organized the project files (docs/, sources/, archive/) and pushed them with a README to the repository.
- 2026-10-10: Architecture document written (`docs/architecture/ARCHITECTURE.md`): layers, monorepo, core rules + referee, MatchSession, director/views, pixel scaler, tuning, online, Android, code rules, testing. Proposal pending the user's review.
- 2026-10-10: Cabinet frame trimmed to 270x472 native (from 502) so it shows at 2x in a 1080p browser window; mock-ups redrawn.
- 2026-10-10: Layout: vertical arcade cabinet (monitor on top, control panel with 3 physical buttons + decorative joystick below), in browser and on phone. Replaces landscape 16:9.
- 2026-10-10: Menu flow added: placeholder logo intro (fade in/out, replaceable), home screen with Start game vs CPU and a greyed Online slot for later, result screen with Retry / Main menu. Menus as data so multiplayer menus slot in later. Architecture doc, design documents and mock-ups updated.
- 2026-10-10: First playable built (logo, home, best-of-three vs random CPU, result with Retry / Main menu) with placeholder art drawn in code; rules/referee/session tests, layer lint rules, Playwright smoke test and CI. PR from `claude/first-playable-8tihq6`.
- 2026-10-10: User merged-approved; PR #3 (first playable) merged into main. Next steps agreed: tuning panel, juice, sound, then final art.
- 2026-10-10: Cleared the npm install warnings: Vitest 3 → 5 (3 advisories in dev-only test tooling: `@vitest/mocker`, `tinypool`) and approved esbuild's install script in `allowScripts` (newer npm asks for it). The placeholder-logo tool now runs with plain `node`.
- 2026-10-10: Published the playable build (main @ a1a96aa) to GitHub Pages at https://robinneefs.github.io/RPS-Fighter/. Static hosting is enough until online multiplayer, which will need a separate realtime server.
- 2026-10-10: Added OPTIONS to the home menu with a Scaling setting: Pixel perfect (default) or Fill height (fractional nearest-neighbour scale that fills the screen; a player-chosen exception to pixel-perfect rule 2), remembered in localStorage. Also fixed the e2e smoke test, which was red on main because one big fake-clock jump let game time fall behind (now steps the clock in 50 ms chunks).
- 2026-10-10: Design documents and README now show screenshots of the real build instead of the mock-ups (`docs/screenshots/{browser,phone}-{logo,home,pick,reveal,result}.png`, captured by `sources/screenshots/capture.mjs` with a seeded CPU). The interactive page, the Claude Doc and the README use them; the mock-up files stay in `docs/mockups/`. Retaken after v0.2.0 (Options screen and version label).
- 2026-10-10: Versioning set up at the user's request: semver under 1.0, version in `apps/game/package.json` shown on the home screen, `CHANGELOG.md`, a git tag per build. Tagged the first playable v0.1.0; the Options build is v0.2.0. Every build gets a version bump and changelog entry.
- 2026-10-10: v0.3.0: Fill height is now the default scaling for first-time players (user's request); a saved choice still wins. README play link moved directly under the title. Doc screenshots stay Pixel perfect (the capture script sets it).
