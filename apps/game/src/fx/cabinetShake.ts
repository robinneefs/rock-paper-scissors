import { Emitter } from '@rps/core';

export interface ShakeOffset {
  x: number;
  y: number;
}

/**
 * Shakes the whole arcade cabinet (and the monitor in it) against the room, in whole pixels.
 * Shared through the GameContext: the fight kicks it, the cabinet scene ticks it every frame and
 * moves the cabinet, and every monitor camera follows the offset. Kept out of any one scene's
 * clock, so a scene ending mid-shake can't leave the cabinet off-centre.
 */
export class CabinetShake {
  private readonly events = new Emitter<{ move: ShakeOffset }>();
  private current: ShakeOffset = { x: 0, y: 0 };
  private amplitude = 0;
  private durationMs = 0;
  private startMs = 0;
  private lastStep = -1;
  private pending = false;

  get offset(): ShakeOffset {
    return this.current;
  }

  /** Starts a shake; a weaker one never cuts a stronger one short. */
  kick(amplitudePx: number, durationMs: number): void {
    if (amplitudePx <= 0) return;
    if (this.amplitude > 0 && this.amplitude > amplitudePx) return;
    this.amplitude = amplitudePx;
    this.durationMs = durationMs;
    this.pending = true;
    this.lastStep = -1;
  }

  /** Called every frame with the game's clock; moves in steps of `stepMs`, shrinking to nothing. */
  tick(nowMs: number, stepMs: number): void {
    if (this.pending) {
      this.startMs = nowMs;
      this.pending = false;
    }
    if (this.amplitude <= 0) return;
    const elapsed = nowMs - this.startMs;
    if (elapsed >= this.durationMs) {
      this.amplitude = 0;
      this.set(0, 0);
      return;
    }
    const step = Math.floor(elapsed / stepMs);
    if (step === this.lastStep) return;
    this.lastStep = step;
    const a = Math.max(1, Math.round(this.amplitude * (1 - elapsed / this.durationMs)));
    // alternate sides each step so it reads as a rattle, not a drift
    const side = step % 2 === 0 ? 1 : -1;
    this.set(side * Math.ceil(Math.random() * a), Math.round((Math.random() * 2 - 1) * a));
  }

  onMove(fn: (o: ShakeOffset) => void): () => void {
    return this.events.on('move', fn);
  }

  private set(x: number, y: number): void {
    if (x === this.current.x && y === this.current.y) return;
    this.current = { x, y };
    this.events.emit('move', this.current);
  }
}
