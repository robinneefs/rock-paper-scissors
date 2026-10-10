import { MOVES, type Cancel, type Move } from '@rps/core';
import type { MoveSource, PickContext } from '../MoveSource';

/** Picks uniformly at random, after a short "thinking" pause so its lock-in doesn't feel instant. */
export class RandomCpu implements MoveSource {
  private pending: Cancel | null = null;

  constructor(private readonly thinkMs: { min: number; max: number } = { min: 400, max: 1600 }) {}

  onPickingStarted(ctx: PickContext, submit: (move: Move) => void): void {
    this.cancel();
    const span = this.thinkMs.max - this.thinkMs.min;
    const delay = Math.min(
      this.thinkMs.min + Math.floor(ctx.rng.next() * span),
      ctx.deadline - ctx.clock.now() - 1,
    );
    const move = MOVES[Math.floor(ctx.rng.next() * MOVES.length)] ?? 'attack';
    this.pending = ctx.clock.schedule(Math.max(0, delay), () => {
      this.pending = null;
      submit(move);
    });
  }

  cancel(): void {
    this.pending?.();
    this.pending = null;
  }
}
