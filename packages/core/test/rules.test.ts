import { describe, expect, it } from 'vitest';
import {
  applyExchange,
  createMatchState,
  defaultRules,
  isFinalRound,
  isRoundOver,
  MOVES,
  resolveExchange,
  startNextRound,
  type MatchState,
  type Move,
} from '../src';

// These tests count damage from a fixed 100 health, whatever the game's default is.
const cfg = { ...defaultRules, startHealth: 100 };

describe('resolveExchange', () => {
  // Every one of the 9 pairings, from p1's point of view.
  const table: [Move, Move, 'p1' | 'p2' | 'tie', number][] = [
    ['rock', 'rock', 'tie', 0],
    ['rock', 'scissors', 'p1', 15],
    ['rock', 'paper', 'p2', 10],
    ['scissors', 'rock', 'p2', 15],
    ['scissors', 'scissors', 'tie', 0],
    ['scissors', 'paper', 'p1', 20],
    ['paper', 'rock', 'p1', 10],
    ['paper', 'scissors', 'p2', 20],
    ['paper', 'paper', 'tie', 0],
  ];

  it.each(table)('%s vs %s: %s wins for %i', (p1, p2, winner, damage) => {
    const outcome = resolveExchange({ p1, p2 }, cfg);
    if (winner === 'tie') {
      expect(outcome).toEqual({ kind: 'tie', picks: { p1, p2 } });
    } else {
      expect(outcome).toEqual({
        kind: 'win',
        picks: { p1, p2 },
        winner,
        loser: winner === 'p1' ? 'p2' : 'p1',
        damage,
      });
    }
  });

  it('covers all nine pairings', () => {
    expect(table).toHaveLength(MOVES.length ** 2);
  });

  it('reads damage and beats from the config, not hard-coded', () => {
    const custom = { ...cfg, damage: { rock: 1, scissors: 2, paper: 3 } };
    expect(resolveExchange({ p1: 'scissors', p2: 'paper' }, custom)).toMatchObject({
      winner: 'p1',
      damage: 2,
    });
  });
});

describe('applyExchange', () => {
  const fresh = () => createMatchState(cfg);

  it('starts at round 1 with full health and no wins', () => {
    expect(fresh()).toEqual({
      round: 1,
      health: { p1: 100, p2: 100 },
      roundsWon: { p1: 0, p2: 0 },
      winner: null,
    });
  });

  it('only the loser takes damage', () => {
    const { state, events } = applyExchange(fresh(), { p1: 'scissors', p2: 'paper' }, cfg);
    expect(state.health).toEqual({ p1: 100, p2: 80 });
    expect(events).toEqual([{ type: 'damage', side: 'p2', amount: 20, health: 80 }]);
  });

  it('a tie deals no damage and returns the same state', () => {
    const before = fresh();
    const { state, events, outcome } = applyExchange(before, { p1: 'paper', p2: 'paper' }, cfg);
    expect(outcome.kind).toBe('tie');
    expect(events).toEqual([]);
    expect(state).toBe(before);
  });

  it('never changes the state passed in', () => {
    const before = fresh();
    const copy = JSON.parse(JSON.stringify(before)) as typeof before;
    applyExchange(before, { p1: 'rock', p2: 'scissors' }, cfg);
    expect(before).toEqual(copy);
  });

  it('health stops at 0 and a KO wins the round', () => {
    const low: MatchState = { ...fresh(), health: { p1: 100, p2: 5 } };
    const { state, events } = applyExchange(low, { p1: 'paper', p2: 'rock' }, cfg);
    expect(state.health.p2).toBe(0);
    expect(state.roundsWon).toEqual({ p1: 1, p2: 0 });
    expect(state.winner).toBeNull();
    expect(events.map((e) => e.type)).toEqual(['damage', 'ko', 'roundWon']);
    expect(isRoundOver(state)).toBe(true);
  });

  it('exact lethal damage is a KO', () => {
    const low: MatchState = { ...fresh(), health: { p1: 15, p2: 100 } };
    const { state } = applyExchange(low, { p1: 'scissors', p2: 'rock' }, cfg);
    expect(state.health.p1).toBe(0);
    expect(state.roundsWon.p2).toBe(1);
  });

  it('a 10 damage counter does not finish a fighter at 15', () => {
    const low: MatchState = { ...fresh(), health: { p1: 100, p2: 15 } };
    const { state } = applyExchange(low, { p1: 'paper', p2: 'rock' }, cfg);
    expect(state.health.p2).toBe(5);
    expect(isRoundOver(state)).toBe(false);
  });

  it('the second round win takes the match', () => {
    const matchPoint: MatchState = {
      ...fresh(),
      round: 2,
      health: { p1: 10, p2: 100 },
      roundsWon: { p1: 0, p2: 1 },
    };
    const { state, events } = applyExchange(matchPoint, { p1: 'rock', p2: 'paper' }, cfg);
    expect(state.winner).toBe('p2');
    expect(state.roundsWon.p2).toBe(2);
    expect(events.at(-1)).toEqual({ type: 'matchWon', side: 'p2' });
  });

  it('refuses to play on after a KO or after the match is won', () => {
    const ko: MatchState = { ...fresh(), health: { p1: 0, p2: 50 } };
    expect(() => applyExchange(ko, { p1: 'rock', p2: 'rock' }, cfg)).toThrow();
    const won: MatchState = { ...ko, winner: 'p2' };
    expect(() => applyExchange(won, { p1: 'rock', p2: 'rock' }, cfg)).toThrow();
  });
});

describe('rounds', () => {
  it('startNextRound resets health and moves to the next round, keeping wins', () => {
    const ko: MatchState = { round: 1, health: { p1: 0, p2: 35 }, roundsWon: { p1: 0, p2: 1 }, winner: null };
    expect(startNextRound(ko, cfg)).toEqual({
      round: 2,
      health: { p1: 100, p2: 100 },
      roundsWon: { p1: 0, p2: 1 },
      winner: null,
    });
  });

  it('startNextRound refuses mid-round or after the match', () => {
    expect(() => startNextRound(createMatchState(cfg), cfg)).toThrow();
    const done: MatchState = {
      round: 2,
      health: { p1: 0, p2: 5 },
      roundsWon: { p1: 0, p2: 2 },
      winner: 'p2',
    };
    expect(() => startNextRound(done, cfg)).toThrow();
  });

  it('the final round is when both sides have one win', () => {
    const s = createMatchState(cfg);
    expect(isFinalRound(s, cfg)).toBe(false);
    expect(isFinalRound({ ...s, roundsWon: { p1: 1, p2: 0 } }, cfg)).toBe(false);
    expect(isFinalRound({ ...s, roundsWon: { p1: 1, p2: 1 } }, cfg)).toBe(true);
  });

  it('a full best of three plays out 2-1', () => {
    let state = createMatchState(cfg);
    const playUntilKo = (picks: { p1: Move; p2: Move }) => {
      while (!isRoundOver(state)) state = applyExchange(state, picks, cfg).state;
    };
    playUntilKo({ p1: 'scissors', p2: 'paper' }); // p1 wins round 1 (5 throws)
    expect(state.roundsWon).toEqual({ p1: 1, p2: 0 });
    state = startNextRound(state, cfg);
    playUntilKo({ p1: 'rock', p2: 'paper' }); // p2 wins round 2 (10 counters)
    expect(state.roundsWon).toEqual({ p1: 1, p2: 1 });
    expect(isFinalRound(state, cfg)).toBe(true);
    state = startNextRound(state, cfg);
    playUntilKo({ p1: 'rock', p2: 'scissors' }); // p1 wins round 3 (7 attacks)
    expect(state).toEqual({
      round: 3,
      health: { p1: 100, p2: 0 },
      roundsWon: { p1: 2, p2: 1 },
      winner: 'p1',
    });
  });
});
