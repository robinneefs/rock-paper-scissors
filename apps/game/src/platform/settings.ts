import { Emitter } from '@rps/core';

/**
 * How the cabinet is scaled to the window.
 * - `pixelPerfect`: largest whole-number scale, every pixel the same size (the default).
 * - `fillHeight`: the cabinet fills the window (vertically on a desktop), so the scale can be a
 *   fraction. Still nearest-neighbour, but some rows and columns of pixels come out one device
 *   pixel wider than others. A deliberate exception to pixel-perfect rule 2, chosen by the player.
 */
export type ScalingMode = 'pixelPerfect' | 'fillHeight';

export const SCALING_MODES: readonly ScalingMode[] = ['pixelPerfect', 'fillHeight'];

export interface Settings {
  scaling: ScalingMode;
}

export const DEFAULT_SETTINGS: Settings = { scaling: 'pixelPerfect' };

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
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
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
