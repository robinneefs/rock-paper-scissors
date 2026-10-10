import type { MatchState, Move, Phase, RefereeEvents, RulesConfig, Side, Unsubscribe } from '@rps/core';

/** What a match looks like right now, from one player's seat. */
export interface MatchView {
  phase: Phase;
  state: MatchState;
  /** Milliseconds left in the current phase (0 when it has no end). */
  msLeft: number;
  myPick: Move | null;
}

export interface SessionEvents extends Record<string, unknown> {
  phase: RefereeEvents['phase'];
  locked: RefereeEvents['locked'];
  reveal: RefereeEvents['reveal'];
  matchOver: RefereeEvents['matchOver'];
  /** Both sides agreed to play again (locally: at once). The fight screen can start over. */
  rematchAccepted: Record<string, never>;
}

/**
 * A match in progress as seen by one player. Scenes talk only to this, never to the referee,
 * so the fight screen doesn't care whether the opponent is a CPU here or a person online.
 */
export interface MatchSession {
  readonly me: Side;
  /** The rules this match is played with (start health, rounds to win, damage). */
  readonly rules: RulesConfig;
  /** The scene is listening: locally this starts the match; online it tells the server this client is ready. */
  ready(): void;
  submitPick(move: Move): void;
  requestRematch(): void;
  snapshot(): MatchView;
  on<E extends keyof SessionEvents>(event: E, fn: (payload: SessionEvents[E]) => void): Unsubscribe;
  dispose(): void;
}

/** Describes a match, so Retry can replay the same kind of match. */
export type MatchSetup = { mode: 'cpu'; cpu: CpuKind };
// Step 5 adds: | { mode: 'online'; roomCode: string }

export type CpuKind = 'random';
