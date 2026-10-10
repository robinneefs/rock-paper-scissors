import { moveColors, palette } from '../../config/palette';
import { PixelBuffer } from './PixelBuffer';

export const ICON = { size: 20, frames: ['attack', 'throw', 'block', 'unknown'] as const };

/** White 9x9 symbols drawn on each move's coin. */
export const SYMBOLS: Record<(typeof ICON.frames)[number], string[]> = {
  attack: [
    '....#....',
    '.#..#..#.',
    '..#####..',
    '..#####..',
    '#########',
    '..#####..',
    '..#####..',
    '.#..#..#.',
    '....#....',
  ],
  throw: [
    '..####...',
    '.#....#..',
    '#......#.',
    '#.....###',
    '#......#.',
    '#........',
    '.#....#..',
    '..####...',
    '.........',
  ],
  block: [
    '#########',
    '#########',
    '#########',
    '#########',
    '.#######.',
    '.#######.',
    '..#####..',
    '...###...',
    '....#....',
  ],
  unknown: [
    '..####...',
    '.#....#..',
    '......#..',
    '.....#...',
    '....#....',
    '....#....',
    '.........',
    '....#....',
    '.........',
  ],
};

/** Move icon coins, one 20x20 frame per move plus a "?" coin. */
export function paintIcons(): PixelBuffer {
  const s = ICON.size;
  const b = new PixelBuffer(s * ICON.frames.length, s);
  ICON.frames.forEach((name, i) => {
    const colors = name === 'unknown' ? { main: palette.dim, shade: palette.panelEdge } : moveColors[name];
    const cx = i * s + 9;
    b.ell(cx, 10, 8, 8, colors.shade);
    b.ell(cx, 9, 8, 8, colors.main);
    b.bitmap(SYMBOLS[name], cx - 4, 5, palette.white);
    b.outline(palette.ink, i * s, 0, s, s);
  });
  return b;
}
