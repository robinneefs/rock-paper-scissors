import { defaultRules, seededRng, type Move, type PhaseTimings } from '@rps/core';
import { describe, expect, it } from 'vitest';
import { FakeClock } from '../../../packages/core/test/fakeClock';
import { RandomCpu } from '../src/session/cpu/RandomCpu';
import { LocalSession } from '../src/session/LocalSession';
import type { SessionEvents } from '../src/session/MatchSession';

const timings: PhaseTimings = { roundIntroMs: 1000, pickMs: 5000, revealMs: 2000, roundOverMs: 3000 };

function setup(seed = 3) {
  const clock = new FakeClock();
  const session = new LocalSession(
    defaultRules,
    timings,
    clock,
    seededRng(seed),
    new RandomCpu({ min: 100, max: 900 }),
  );
  const seen: (keyof SessionEvents)[] = [];
  const reveals: SessionEvents['reveal'][] = [];
  for (const e of ['phase', 'locked', 'reveal', 'matchOver', 'rematchAccepted'] as const) {
    session.on(e, () => seen.push(e));
  }
  session.on('reveal', (r) => reveals.push(r));
  return { clock, session, seen, reveals };
}

describe('LocalSession', () => {
  it('starts on ready() and reports the time left in the phase', () => {
    const { clock, session } = setup();
    expect(session.snapshot().phase).toBe('idle');
    session.ready();
    expect(session.snapshot()).toMatchObject({ phase: 'roundIntro', msLeft: 1000 });
    clock.advance(1250);
    expect(session.snapshot()).toMatchObject({ phase: 'picking', msLeft: 4750, myPick: null });
  });

  it('the CPU locks in during picking, and my pick goes to my side', () => {
    const { clock, session, reveals } = setup();
    session.ready();
    clock.advance(1000);
    session.submitPick('block');
    expect(session.snapshot().myPick).toBe('block');
    clock.advance(5000);
    expect(reveals).toHaveLength(1);
    expect(reveals[0]!.picks.p1).toBe('block');
    expect(reveals[0]!.autoPicked).toEqual({ p1: false, p2: false });
  });

  it('a pick outside the picking phase is ignored', () => {
    const { session } = setup();
    session.ready();
    session.submitPick('attack');
    expect(session.snapshot().myPick).toBeNull();
  });

  it('plays a full match to matchOver, then a rematch starts fresh', () => {
    const { clock, session, seen } = setup();
    session.ready();
    for (let i = 0; i < 5000 && session.snapshot().phase !== 'matchOver'; i++) {
      if (session.snapshot().phase === 'picking') session.submitPick('attack');
      clock.advance(500);
    }
    expect(session.snapshot().phase).toBe('matchOver');
    expect(seen).toContain('matchOver');
    expect(session.snapshot().state.winner).not.toBeNull();

    session.requestRematch();
    expect(seen.at(-1)).toBe('rematchAccepted');
    session.ready();
    expect(session.snapshot()).toMatchObject({
      phase: 'roundIntro',
      state: { round: 1, roundsWon: { p1: 0, p2: 0 } },
    });
  });

  it('dispose stops everything', () => {
    const { clock, session, seen } = setup();
    session.ready();
    session.dispose();
    const count = seen.length;
    clock.advance(60_000);
    expect(seen).toHaveLength(count);
    expect(clock.pendingCount).toBe(0);
  });
});

describe('RandomCpu', () => {
  it('picks each move about a third of the time', () => {
    const clock = new FakeClock();
    const cpu = new RandomCpu({ min: 0, max: 10 });
    const rng = seededRng(42);
    const counts: Record<Move, number> = { attack: 0, throw: 0, block: 0 };
    const state = { round: 1, health: { p1: 100, p2: 100 }, roundsWon: { p1: 0, p2: 0 }, winner: null };
    for (let i = 0; i < 3000; i++) {
      cpu.onPickingStarted(
        { side: 'p2', state, deadline: clock.now() + 5000, clock, rng },
        (m) => counts[m]++,
      );
      clock.advance(20);
    }
    for (const n of Object.values(counts)) expect(n).toBeGreaterThan(900);
    expect(counts.attack + counts.throw + counts.block).toBe(3000);
  });

  it('decides before the deadline and can be cancelled', () => {
    const clock = new FakeClock();
    const cpu = new RandomCpu({ min: 4000, max: 9000 });
    const state = { round: 1, health: { p1: 100, p2: 100 }, roundsWon: { p1: 0, p2: 0 }, winner: null };
    let picked = 0;
    cpu.onPickingStarted({ side: 'p2', state, deadline: 1000, clock, rng: seededRng(1) }, () => picked++);
    clock.advance(999);
    expect(picked).toBe(1);
    cpu.onPickingStarted({ side: 'p2', state, deadline: 6000, clock, rng: seededRng(1) }, () => picked++);
    cpu.cancel();
    clock.advance(10_000);
    expect(picked).toBe(1);
  });
});
