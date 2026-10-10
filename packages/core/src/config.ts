import type { RulesConfig } from './rules/types';

/**
 * Rules: changing these changes who wins. The server (step 5) uses the same values.
 * Look-and-feel numbers live in apps/game/src/config/tuning.ts instead.
 */
export const defaultRules: RulesConfig = {
  beats: { attack: 'throw', throw: 'block', block: 'attack' },
  damage: { throw: 20, attack: 15, block: 10 },
  startHealth: 100,
  roundsToWin: 2,
};

/**
 * How long each match phase lasts. These are rules too: online, the server runs the same clock.
 * The client plays its animations inside these windows.
 */
export interface PhaseTimings {
  /** "Round 1 / Fight!" banner before the first countdown of a round. */
  roundIntroMs: number;
  /** Countdown in which both players pick. */
  pickMs: number;
  /** Icons drop, fighters act out the exchange, the loser's bar drains. */
  revealMs: number;
  /** KO and the winner's pose before the next round (or the result screen). */
  roundOverMs: number;
}

export const defaultTimings: PhaseTimings = {
  roundIntroMs: 1600,
  pickMs: 5000,
  revealMs: 1800,
  roundOverMs: 2200,
};
