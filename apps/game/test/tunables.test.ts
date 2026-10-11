import { describe, expect, it } from 'vitest';
import {
  assign,
  changeNote,
  flatten,
  rangeFor,
  TuningMemory,
  type KeyValueStore,
  type TunableGroup,
} from '../src/dev/tunables';

const sample = () => ({
  reveal: { strikeAtMs: 420, lungePx: 4 },
  shake: { byDamage: { 10: 2, 20: 4 } },
  beats: { attack: 'throw' },
});

const group = (tree = sample()): TunableGroup => ({ file: 'tuning.ts', tree, defaults: flatten(tree) });

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('dev tuning values', () => {
  it('flattens number leaves by path and skips other leaves', () => {
    expect(flatten(sample())).toEqual({
      'reveal.strikeAtMs': 420,
      'reveal.lungePx': 4,
      'shake.byDamage.10': 2,
      'shake.byDamage.20': 4,
    });
  });

  it('assigns by path in place, ignoring unknown paths and non-numbers', () => {
    const tree = sample();
    assign(tree, { 'reveal.strikeAtMs': 380, 'shake.byDamage.20': 6, 'nope.x': 1, 'beats.attack': 3 });
    expect(tree.reveal.strikeAtMs).toBe(380);
    expect(tree.shake.byDamage[20]).toBe(6);
    expect(tree.beats.attack).toBe('throw');
  });

  it('notes only the changed values, per file, with what they were', () => {
    const g = group();
    expect(changeNote([g])).toBe('// no changes from the defaults');
    assign(g.tree, { 'reveal.lungePx': 6 });
    expect(changeNote([g])).toBe('// tuning.ts\nreveal.lungePx: 6 (was 4)');
  });

  it('remembers edits between reloads and forgets them after a reset', () => {
    const store = memoryStore();
    const memory = new TuningMemory(store);
    const g = group();
    assign(g.tree, { 'reveal.strikeAtMs': 300 });
    memory.save([g]);
    expect(memory.load()).toEqual({ 'tuning.ts': { 'reveal.strikeAtMs': 300 } });
    assign(g.tree, g.defaults);
    memory.save([g]);
    expect(store.data.size).toBe(0);
  });

  it('survives broken or missing storage', () => {
    const store = memoryStore();
    store.setItem('rps-fighter.dev-tuning', '{not json');
    expect(new TuningMemory(store).load()).toEqual({});
    expect(new TuningMemory(null).load()).toEqual({});
  });

  it('picks slider limits from the value name', () => {
    expect(rangeFor('reveal.strikeAtMs', 420)).toEqual({ min: 0, max: 1260, step: 10 });
    expect(rangeFor('pickMs', 5000).max).toBe(15000);
    expect(rangeFor('startHealth', 100)).toEqual({ min: 10, max: 300, step: 5 });
    expect(rangeFor('damage.throw', 20)).toEqual({ min: 1, max: 60, step: 1 });
    expect(rangeFor('reveal.lungePx', 4)).toEqual({ min: 0, max: 20, step: 1 });
  });
});
