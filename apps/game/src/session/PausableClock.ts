import type { Cancel, Clock } from '@rps/core';

interface Timer {
  /** When it fires, on this clock. */
  at: number;
  fn: () => void;
  cancel: Cancel | null;
}

/**
 * A clock that can stop. While paused, time stands still and nothing fires; on resume every timer
 * picks up with the time it had left. A CPU match runs on one so it waits while the tab is hidden
 * (the screen stops drawing then, so the match would otherwise play on unseen).
 */
export class PausableClock implements Clock {
  private pausedAt: number | null = null;
  /** Time spent paused so far, taken off the base clock. */
  private offset = 0;
  private readonly timers = new Set<Timer>();

  constructor(private readonly base: Clock) {}

  get paused(): boolean {
    return this.pausedAt !== null;
  }

  now(): number {
    return (this.pausedAt ?? this.base.now()) - this.offset;
  }

  schedule(ms: number, fn: () => void): Cancel {
    const timer: Timer = { at: this.now() + ms, fn, cancel: null };
    this.timers.add(timer);
    this.arm(timer);
    return () => {
      timer.cancel?.();
      this.timers.delete(timer);
    };
  }

  pause(): void {
    if (this.pausedAt !== null) return;
    this.pausedAt = this.base.now();
    for (const timer of this.timers) {
      timer.cancel?.();
      timer.cancel = null;
    }
  }

  resume(): void {
    if (this.pausedAt === null) return;
    this.offset += this.base.now() - this.pausedAt;
    this.pausedAt = null;
    for (const timer of this.timers) this.arm(timer);
  }

  private arm(timer: Timer): void {
    if (this.paused) return;
    timer.cancel = this.base.schedule(Math.max(0, timer.at - this.now()), () => {
      this.timers.delete(timer);
      timer.fn();
    });
  }
}
