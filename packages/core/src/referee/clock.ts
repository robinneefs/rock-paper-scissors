export type Cancel = () => void;

/** Time source the referee runs on: a browser clock locally, a server clock online, a fake one in tests. */
export interface Clock {
  now(): number;
  schedule(ms: number, fn: () => void): Cancel;
}

/** Random numbers in [0, 1). Seedable so tests and replays are repeatable. */
export interface Rng {
  next(): number;
}

/** Small seedable generator (mulberry32). Good enough for picks; not for cryptography. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export const mathRandomRng: Rng = { next: () => Math.random() };
