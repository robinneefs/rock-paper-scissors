import { MONITOR } from '../../../config/layout';
import { PixelBuffer, type RGB } from '../PixelBuffer';

/** Shared helpers for the stage backdrops: a buffer the monitor's size, dithered gradients and glows. */

export const W: number = MONITOR.width;
export const H: number = MONITOR.height;

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** True on a 4x4 ordered-dither pattern for a fill amount f (0..1): how gradients stay in whole colours. */
export const dither = (x: number, y: number, f: number): boolean => f * 16 > BAYER[y & 3]![x & 3]!;

export function stageBuffer(): PixelBuffer {
  return new PixelBuffer(W, H);
}

/** A seeded random number generator, so a stage paints the same every time. */
export function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Fills rows y0..y1 with a dithered gradient through `bands`; `curve` > 1 keeps the top colours longer. */
export function gradient(b: PixelBuffer, y0: number, y1: number, bands: readonly RGB[], curve = 1): void {
  for (let y = y0; y < y1; y++) {
    const t = ((y - y0) / (y1 - y0)) ** curve * (bands.length - 1);
    const i = Math.floor(t);
    for (let x = 0; x < W; x++)
      b.px(x, y, bands[Math.min(bands.length - 1, i + (dither(x, y, t - i) ? 1 : 0))]!);
  }
}

export function getPx(b: PixelBuffer, x: number, y: number): RGB {
  const i = (y * b.width + x) * 4;
  return (b.data[i]! << 16) | (b.data[i + 1]! << 8) | b.data[i + 2]!;
}

export function mix(a: RGB, c: RGB, f: number): RGB {
  const ch = (s: number) => Math.round(((a >> s) & 255) + (((c >> s) & 255) - ((a >> s) & 255)) * f);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Tints a pixel halfway towards `c` on a dither pattern of strength f (0..1): light pools, neon glow. */
export function glow(b: PixelBuffer, x: number, y: number, c: RGB, f: number): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  if (dither(x, y, f)) b.px(x, y, mix(getPx(b, x, y), c, 0.5));
}
