import type { Cancel, Clock, MatchState, Move, Rng, Side } from '@rps/core';

export interface PickContext {
  side: Side;
  state: MatchState;
  /** When picking ends, on the session clock. */
  deadline: number;
  clock: Clock;
  rng: Rng;
}

/**
 * Anything that can produce a pick for one side: a CPU now, a hot-seat player or the server later.
 * It calls `submit` when it decides (it may call it again to change its mind before the deadline).
 */
export interface MoveSource {
  onPickingStarted(ctx: PickContext, submit: (move: Move) => void): void;
  /** Picking ended or the match was torn down: stop any pending decision. */
  cancel(): void;
}

export type { Cancel };
