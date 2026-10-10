import { describe, expect, it } from 'vitest';
import { CABINET } from '../src/config/layout';
import { computeLayout } from '../src/platform/PixelScaler';
import { nextScalingMode, SettingsStore, type KeyValueStore } from '../src/platform/settings';

describe('computeLayout', () => {
  it('pixel perfect picks the largest whole scale that fits (1080p desktop: 2x)', () => {
    const l = computeLayout(1920, 969, 1);
    expect(l.scale).toBe(2);
    expect(l.height).toBeGreaterThanOrEqual(CABINET.height);
    expect(l.cabinetY).toBe(Math.floor((l.height - CABINET.height) / 2));
  });

  it('fill height scales the cabinet to the full window height on a desktop', () => {
    const l = computeLayout(1920, 969, 1, 'fillHeight');
    expect(l.scale).toBeCloseTo(969 / CABINET.height);
    expect(l.height).toBe(CABINET.height);
    expect(l.cabinetY).toBe(0);
    expect(l.width * l.scale).toBeGreaterThanOrEqual(1920);
  });

  it('fill height on a narrow phone fills the width instead, so nothing is cut off', () => {
    const l = computeLayout(390, 844, 3, 'fillHeight');
    expect(l.scale).toBeCloseTo((390 * 3) / CABINET.width);
    expect(l.width).toBe(CABINET.width);
    expect(l.cabinetX).toBe(0);
  });

  it('fill height is never smaller than pixel perfect, and both stay at least 1x', () => {
    for (const [w, h, dpr] of [
      [1280, 720, 1],
      [2560, 1440, 1],
      [390, 844, 3],
      [200, 300, 1],
    ] as const) {
      const pp = computeLayout(w, h, dpr).scale;
      const fill = computeLayout(w, h, dpr, 'fillHeight').scale;
      expect(Number.isInteger(pp)).toBe(true);
      expect(fill).toBeGreaterThanOrEqual(pp);
      expect(pp).toBeGreaterThanOrEqual(1);
    }
  });
});

const memoryStore = (
  initial: Record<string, string> = {},
): KeyValueStore & { data: Record<string, string> } => {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
};

describe('SettingsStore', () => {
  it('defaults to pixel perfect', () => {
    expect(new SettingsStore(memoryStore()).value.scaling).toBe('pixelPerfect');
    expect(new SettingsStore(null).value.scaling).toBe('pixelPerfect');
  });

  it('remembers the scaling choice between visits', () => {
    const store = memoryStore();
    const first = new SettingsStore(store);
    const seen: string[] = [];
    first.onChange((s) => seen.push(s.scaling));
    first.set('scaling', 'fillHeight');
    expect(seen).toEqual(['fillHeight']);
    expect(new SettingsStore(store).value.scaling).toBe('fillHeight');
  });

  it('ignores broken or unknown saved values', () => {
    expect(new SettingsStore(memoryStore({ 'rps-fighter.settings': '{nope' })).value.scaling).toBe(
      'pixelPerfect',
    );
    expect(
      new SettingsStore(memoryStore({ 'rps-fighter.settings': '{"scaling":"stretch"}' })).value.scaling,
    ).toBe('pixelPerfect');
  });

  it('still applies a setting when storage refuses to save', () => {
    const s = new SettingsStore({
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    });
    s.set('scaling', 'fillHeight');
    expect(s.value.scaling).toBe('fillHeight');
  });

  it('cycles through the scaling modes', () => {
    expect(nextScalingMode('pixelPerfect')).toBe('fillHeight');
    expect(nextScalingMode('fillHeight')).toBe('pixelPerfect');
  });
});
