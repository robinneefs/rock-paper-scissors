import type { Clock } from '../src';

/** A clock that only moves when the test says so. */
export class FakeClock implements Clock {
  private t = 0;
  private timers: { at: number; fn: () => void; id: number }[] = [];
  private nextId = 0;

  now(): number {
    return this.t;
  }

  schedule(ms: number, fn: () => void): () => void {
    const id = this.nextId++;
    this.timers.push({ at: this.t + ms, fn, id });
    return () => {
      this.timers = this.timers.filter((timer) => timer.id !== id);
    };
  }

  advance(ms: number): void {
    const end = this.t + ms;
    for (;;) {
      const due = this.timers
        .filter((timer) => timer.at <= end)
        .sort((a, b) => a.at - b.at || a.id - b.id)[0];
      if (!due) break;
      this.timers = this.timers.filter((timer) => timer !== due);
      this.t = due.at;
      due.fn();
    }
    this.t = end;
  }

  get pendingCount(): number {
    return this.timers.length;
  }
}
