// The dev tuning panel's plumbing, kept free of Tweakpane and the DOM so it can be tested:
// reading and writing number leaves by path, remembering edits, and turning them into a
// "what changed" note to paste back into the source files.

/**
 * A nested object whose number leaves are tunable (tuning.ts, the rules, the phase timings).
 * Other leaves (like the rules' `beats` table) are left alone.
 */
export interface NumberTree {
  [key: string]: unknown;
}

/** Every number leaf as `path -> value`, e.g. `reveal.strikeAtMs -> 420`. */
export function flatten(tree: NumberTree, prefix = ''): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'number') out[path] = value;
    else if (isTree(value)) Object.assign(out, flatten(value, path));
  }
  return out;
}

export function isTree(value: unknown): value is NumberTree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Writes values back by path, in place. Unknown paths and non-numbers are ignored. */
export function assign(tree: NumberTree, values: Record<string, unknown>): void {
  for (const [path, value] of Object.entries(values)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const keys = path.split('.');
    const last = keys.pop() as string;
    let node: unknown = tree;
    for (const k of keys) node = isTree(node) ? node[k] : undefined;
    if (isTree(node) && typeof node[last] === 'number') node[last] = value;
  }
}

/** Paths whose value differs from the defaults. */
export function changes(
  defaults: Record<string, number>,
  current: Record<string, number>,
): { path: string; from: number; to: number }[] {
  return Object.keys(defaults)
    .filter((path) => current[path] !== undefined && current[path] !== defaults[path])
    .map((path) => ({ path, from: defaults[path]!, to: current[path]! }));
}

/** A group of values the panel edits: one source file each. */
export interface TunableGroup {
  /** Where the defaults live, shown in the copied note. */
  file: string;
  /** The live object the game reads; the panel edits it in place. */
  tree: NumberTree;
  /** Its values when the game loaded, before any saved edits. */
  defaults: Record<string, number>;
}

/** The note "Copy changes" puts on the clipboard: per file, each changed value and what it was. */
export function changeNote(groups: TunableGroup[]): string {
  const parts: string[] = [];
  for (const g of groups) {
    const diff = changes(g.defaults, flatten(g.tree));
    if (diff.length === 0) continue;
    parts.push(`// ${g.file}`, ...diff.map((c) => `${c.path}: ${c.to} (was ${c.from})`), '');
  }
  return parts.length ? parts.join('\n').trimEnd() : '// no changes from the defaults';
}

/** The part of the Web Storage API we use. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Edits survive a page reload while tuning; stored per group file. Storage failing is never fatal. */
export class TuningMemory {
  constructor(
    private readonly store: KeyValueStore | null,
    private readonly key = 'rps-fighter.dev-tuning',
  ) {}

  load(): Record<string, Record<string, number>> {
    try {
      const raw = this.store?.getItem(this.key);
      const saved: unknown = raw ? JSON.parse(raw) : {};
      return saved && typeof saved === 'object' ? (saved as Record<string, Record<string, number>>) : {};
    } catch {
      return {};
    }
  }

  save(groups: TunableGroup[]): void {
    const edits: Record<string, Record<string, number>> = {};
    for (const g of groups) {
      const diff = changes(g.defaults, flatten(g.tree));
      if (diff.length) edits[g.file] = Object.fromEntries(diff.map((c) => [c.path, c.to]));
    }
    try {
      if (Object.keys(edits).length) this.store?.setItem(this.key, JSON.stringify(edits));
      else this.store?.removeItem(this.key);
    } catch {
      // not remembered; the edit still applies until the page reloads
    }
  }
}

/** Slider limits picked from a value's name: milliseconds, pixels, health, counts. */
export function rangeFor(path: string, value: number): { min: number; max: number; step: number } {
  const key = path.split('.').pop() ?? path;
  const roomy = (floor: number) => Math.max(floor, Math.ceil((value * 3) / 10) * 10);
  if (/Ms$/.test(key)) return { min: 0, max: roomy(1000), step: 10 };
  if (key === 'startHealth') return { min: 10, max: 300, step: 5 };
  if (key === 'roundsToWin') return { min: 1, max: 5, step: 1 };
  if (path.startsWith('damage.')) return { min: 1, max: 60, step: 1 };
  return { min: 0, max: roomy(10), step: 1 };
}
