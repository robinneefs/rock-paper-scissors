import { Emitter } from '@rps/core';

/**
 * How the cabinet is scaled to the window.
 * - `pixelPerfect`: largest whole-number scale, every pixel the same size.
 * - `fillHeight`: the cabinet fills the window (vertically on a desktop), so the scale can be a
 *   fraction. Still nearest-neighbour, but some rows and columns of pixels come out one device
 *   pixel wider than others. The default (user's call, 2026-10-10): a deliberate exception to
 *   pixel-perfect rule 2; players who want every pixel even pick Pixel perfect in Options.
 */
export type ScalingMode = 'pixelPerfect' | 'fillHeight';

export const SCALING_MODES: readonly ScalingMode[] = ['pixelPerfect', 'fillHeight'];

/** Volumes are steps from 0 (off) to VOLUME_MAX. */
export const VOLUME_MAX = 10;

export interface Settings {
  scaling: ScalingMode;
  /** Sound off altogether (music and effects); the volumes are kept for when it's back on. */
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
}

export const DEFAULT_SETTINGS: Settings = {
  scaling: 'fillHeight',
  muted: false,
  musicVolume: 6,
  sfxVolume: 8,
};

/** The part of the Web Storage API we use (localStorage now, Capacitor Preferences later). */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

const KEY = 'rps-fighter.settings';

/** Player settings, remembered between visits. Storage failing (private mode, blocked) is never fatal. */
export class SettingsStore {
  private readonly events = new Emitter<{ change: Settings }>();
  private current: Settings;

  constructor(private readonly store: KeyValueStore | null) {
    this.current = load(store);
  }

  get value(): Settings {
    return this.current;
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    if (this.current[key] === value) return;
    this.current = { ...this.current, [key]: value };
    try {
      this.store?.setItem(KEY, JSON.stringify(this.current));
    } catch {
      // not saved; the setting still applies for this visit
    }
    this.events.emit('change', this.current);
  }

  onChange(fn: (settings: Settings) => void): () => void {
    return this.events.on('change', fn);
  }
}

function load(store: KeyValueStore | null): Settings {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<Settings>;
    return {
      scaling: SCALING_MODES.includes(saved.scaling as ScalingMode)
        ? (saved.scaling as ScalingMode)
        : DEFAULT_SETTINGS.scaling,
      muted: typeof saved.muted === 'boolean' ? saved.muted : DEFAULT_SETTINGS.muted,
      musicVolume: volume(saved.musicVolume, DEFAULT_SETTINGS.musicVolume),
      sfxVolume: volume(saved.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function volume(saved: unknown, fallback: number): number {
  return Number.isInteger(saved) && (saved as number) >= 0 && (saved as number) <= VOLUME_MAX
    ? (saved as number)
    : fallback;
}

/** One volume step up or down, kept in 0..VOLUME_MAX; `wrap` goes from the top back to 0 (menu select). */
export function stepVolume(v: number, dir: 1 | -1, wrap = false): number {
  const next = v + dir;
  if (wrap && next > VOLUME_MAX) return 0;
  return Math.max(0, Math.min(VOLUME_MAX, next));
}

/** localStorage if the browser lets us use it. */
export function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** The scaling mode after this one (the options menu flips through them). */
export function nextScalingMode(mode: ScalingMode): ScalingMode {
  return SCALING_MODES[(SCALING_MODES.indexOf(mode) + 1) % SCALING_MODES.length] ?? DEFAULT_SETTINGS.scaling;
}
