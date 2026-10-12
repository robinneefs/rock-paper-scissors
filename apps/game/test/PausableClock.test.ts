import { describe, expect, it } from 'vitest';
import { FakeClock } from '../../../packages/core/test/fakeClock';
import { PausableClock } from '../src/session/PausableClock';

describe('PausableClock', () => {
  it('runs like its base clock while not paused', () => {
    const base = new FakeClock();
    const clock = new PausableClock(base);
    const fired: number[] = [];
    clock.schedule(100, () => fired.push(clock.now()));
    base.advance(150);
    expect(fired).toEqual([100]);
    expect(clock.now()).toBe(150);
  });

  it('stands still while paused and fires late timers with the time they had left', () => {
    const base = new FakeClock();
    const clock = new PausableClock(base);
    const fired: string[] = [];
    clock.schedule(100, () => fired.push('a'));
    clock.schedule(300, () => fired.push('b'));
    base.advance(60);
    clock.pause();
    base.advance(10_000);
    expect(fired).toEqual([]);
    expect(clock.now()).toBe(60);
    clock.resume();
    base.advance(39);
    expect(fired).toEqual([]);
    base.advance(1);
    expect(fired).toEqual(['a']);
    expect(clock.now()).toBe(100);
    base.advance(200);
    expect(fired).toEqual(['a', 'b']);
  });

  it('a timer scheduled while paused waits for the resume', () => {
    const base = new FakeClock();
    const clock = new PausableClock(base);
    const fired: string[] = [];
    clock.pause();
    clock.schedule(0, () => fired.push('x'));
    base.advance(500);
    expect(fired).toEqual([]);
    clock.resume();
    base.advance(0);
    expect(fired).toEqual(['x']);
  });

  it('cancelled timers never fire, paused or not', () => {
    const base = new FakeClock();
    const clock = new PausableClock(base);
    const fired: string[] = [];
    const cancel = clock.schedule(100, () => fired.push('x'));
    clock.pause();
    cancel();
    clock.resume();
    base.advance(1000);
    expect(fired).toEqual([]);
    expect(base.pendingCount).toBe(0);
  });
});
