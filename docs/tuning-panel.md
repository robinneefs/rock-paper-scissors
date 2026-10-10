# Dev tuning panel

A panel of sliders for the game-feel pass (added in v0.5.0). It shows every feel value, the rules and the phase timings, and lets you change them while you play. When something feels right, you copy the changes and they get written back into the code.

It only exists when the game runs with `npm run dev`. The online build and `npm run build` never include it.

## Starting it

```sh
npm install        # once, or after pulling (installs Tweakpane)
npm run dev        # opens the game at http://localhost:5173
```

The panel appears in the top-right corner. The **backquote key (`)** hides and shows it.

## What's in it

| Section | What it changes | When it applies | Where the defaults live |
|---|---|---|---|
| **Feel (live)** | Reveal timing (icon drop, strike, impact, recover, lunge), hit-pause and shake per damage, hit flash, health bar drain and low-health warning, cabinet buttons, joystick, idle breathing, logo intro, screen wipes, menu cursor, round banners, result delay | Immediately, while you play | `apps/game/src/config/tuning.ts` |
| **Rules (next match)** | Damage per move, start health, rounds to win | From the next match | `packages/core/src/config.ts` (`defaultRules`) |
| **Phase timings (next match)** | Round intro banner, pick countdown (`pickMs`), reveal length (`revealMs`), round-over pause | From the next match | `packages/core/src/config.ts` (`defaultTimings`) |

Values ending in `Ms` are milliseconds and values ending in `Px` are game pixels. The `byDamage` tables (hit-pause and shake) have one slider per damage amount, labelled `10 dmg`, `15 dmg` and `20 dmg`. Subsections start folded; click a title to open it.

The buttons at the top:

- **Restart match** starts a fresh match against the random CPU, so rules and timing changes take effect straight away.
- **Copy changes** copies a short note to the clipboard (and prints it in the browser console) listing every value that differs from the code, grouped by file. For example:

  ```
  // apps/game/src/config/tuning.ts
  shake.durationMs: 340 (was 280)
  hitPause.byDamage.20: 120 (was 90)
  ```

- **Reset all to defaults** puts every value back to what's in the code.

Your edits are remembered in this browser (localStorage), so they survive a page reload. They do **not** change the source files. Nothing is saved to the code until the changes are copied in.

## How to tune

1. Start a CPU match and keep playing rounds while you adjust values.
2. Work on one group at a time and play a few exchanges after each change. A good order:
   - **The hit:** `reveal.strikeAtMs`, `reveal.impactAtMs`, `hitPause`, `shake` and `flash`. They all fire on the same impact, so tune them together.
   - **The HUD:** `hud.drainMs` and `hud.trailDelayMs` (how the health bar empties).
   - **Pacing:** `pickMs` (the open 5 s vs 3 s question), `startHealth` (the open 100 health question) and the other phase timings. Press Restart match after each change.
   - **Menus and transitions:** buttons, joystick, wipes, banners, intro.
3. Push a value too far first, then bring it back. Doubling the shake or hit-pause shows quickly what a value does, which makes it easier to find the right level.
4. Hide the panel (`) for the final check, and try it again a little later with fresh eyes.
5. Click **Copy changes** and paste the note into the project chat (or into the files yourself). Each changed value becomes the new default in the code, in a new version.

Things to keep in mind:

- The reveal animation has to fit inside the reveal phase. If you shorten `revealMs`, keep `reveal.recoverAtMs` and the hit timings below it.
- Rules decide who wins, so changes there are balance changes, not just feel. With uneven damage the best mix of moves shifts too (see "The mind game" in the README).
- Slider ranges are picked from each value's name (milliseconds, pixels, health, counts). If a slider stops short of what you need, widen its range in `rangeFor()` (below).
- If the game seems off after a session of tuning, press **Reset all to defaults**: old edits stay in effect until you do.

## How it's set up

| Piece | What it does |
|---|---|
| `tweakpane` 4 + `@tweakpane/core` | The panel UI. Dev dependencies of `apps/game` only. |
| `apps/game/src/main.ts` | Loads the panel with a dynamic `import('./dev/tuningPanel')` inside `if (import.meta.env.DEV)`. Vite drops that branch from release builds, so neither the panel nor Tweakpane ships online. It passes the three groups (feel, rules, timings) and a restart function (`flow.toFight` against the random CPU). |
| `apps/game/src/dev/tuningPanel.ts` | Builds the Tweakpane panel: the three buttons, one folder per group, one slider per number found in each object (nested objects become subfolders). It edits the live objects in place, stops key presses in the panel from reaching the game, and toggles on backquote. |
| `apps/game/src/dev/tunables.ts` | The plain logic, with no Tweakpane or DOM so it can be tested: reading and writing numbers by path (`reveal.strikeAtMs`), finding what changed from the defaults, building the Copy changes note, remembering edits in localStorage (key `rps-fighter.dev-tuning`), and `rangeFor()`, which picks slider limits from a value's name. |
| `apps/game/test/tunables.test.ts` | Tests for `tunables.ts`. |
| `eslint.config.js` | A `no-restricted-paths` rule: only `main.ts` may import from `dev/`, so the game never depends on the panel. |

Why feel values are live but rules wait for the next match: the panel edits the `tuning` object the game reads, so a change shows the next time that effect plays (a value read when a screen is built shows once that screen opens again). Rules and timings are copied into each match session when it starts (`apps/game/src/session/createSession.ts`), so a match never changes rules halfway through. The fight HUD reads start health and rounds to win from the session, so its bars and round pips follow the edited rules.

### Adding a value to the panel

Add the number to `tuning.ts` (or to `defaultRules` / `defaultTimings` in `packages/core/src/config.ts`) and read it from there. The panel picks up every number automatically; there's nothing to register. Non-number entries (like the rules' `beats` table) are skipped. If its slider needs different limits, add a case to `rangeFor()` in `tunables.ts`.

To tune a whole new file of numbers, add another entry to the `groups` list in `main.ts` with its file path (shown in the Copy changes note), a title and the object.
