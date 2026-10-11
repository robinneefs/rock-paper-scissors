import { palette } from '../../config/palette';
import { PixelBuffer, type RGB } from './PixelBuffer';

// Chunky letters for the K.O. banner, 11 px tall before scaling ('#' = set).
const K = [
  '###....###.',
  '###...###..',
  '###..###...',
  '###.###....',
  '######.....',
  '#######....',
  '###.####...',
  '###..####..',
  '###...####.',
  '###....####',
  '###.....###',
];
const O = [
  '..#######..',
  '.#########.',
  '####...####',
  '###.....###',
  '###.....###',
  '###.....###',
  '###.....###',
  '###.....###',
  '####...####',
  '.#########.',
  '..#######..',
];
const DOT = ['###', '###', '###'];

const SCALE = 3;
const ROWS = 11;
/** How far the letters lean: one pixel to the right for every this many rows up. */
const LEAN = 3;
const EDGE = 3; // room for the outlines and the drop shadow

/** Top to bottom: pale yellow, gold, orange, red, like the K.O. of a '90s arcade fighter. */
const FILL: [number, RGB][] = [
  [0.22, 0xfff3b0],
  [0.45, 0xffd23c],
  [0.7, 0xff8c1e],
  [1, 0xe8281e],
];

export const KO_LETTERS = (() => {
  const h = ROWS * SCALE;
  const w = (11 + 2 + 3 + 2 + 11 + 2 + 3) * SCALE + Math.ceil(h / LEAN) + EDGE * 2;
  return { width: w, height: h + EDGE * 2 };
})();

/**
 * "K.O." as one picture: bold letters leaning forward, a gold-to-red fill with a white shine on
 * every top edge and a dark one under every bottom edge, a dark red then black outline, and a
 * drop shadow.
 */
export function paintKoLetters(): PixelBuffer {
  const h = ROWS * SCALE;
  const shape = new PixelBuffer(KO_LETTERS.width, KO_LETTERS.height);
  let x = 0;
  const place = (rows: string[], top: number) => {
    rows.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        if (ch !== '#') return;
        for (let sy = 0; sy < SCALE; sy++)
          for (let sx = 0; sx < SCALE; sx++) {
            const y = (top + ry) * SCALE + sy;
            shape.px(EDGE + x + rx * SCALE + sx + Math.floor((h - 1 - y) / LEAN), EDGE + y, 0xffffff);
          }
      }),
    );
    x += (rows[0]!.length + 2) * SCALE;
  };
  place(K, 0);
  place(DOT, ROWS - 3);
  place(O, 0);
  place(DOT, ROWS - 3);

  const fill = new PixelBuffer(shape.width, shape.height);
  for (let y = 0; y < shape.height; y++)
    for (let xx = 0; xx < shape.width; xx++) {
      if (!shape.isSet(xx, y)) continue;
      const t = (y - EDGE) / h;
      let c = FILL.find(([at]) => t <= at)?.[1] ?? palette.red;
      if (!shape.isSet(xx, y - 1)) c = palette.white;
      else if (!shape.isSet(xx, y + 2)) c = 0x8c1010;
      fill.px(xx, y, c);
    }
  fill.outline(0x5a0a14);
  fill.outline(palette.ink);
  fill.outline(palette.ink);

  const out = new PixelBuffer(shape.width, shape.height);
  for (let y = 0; y < out.height; y++)
    for (let xx = 0; xx < out.width; xx++) if (fill.isSet(xx, y)) out.px(xx + 2, y + 2, palette.shadow);
  for (let y = 0; y < out.height; y++)
    for (let xx = 0; xx < out.width; xx++) {
      if (!fill.isSet(xx, y)) continue;
      const i = (y * out.width + xx) * 4;
      out.px(xx, y, (fill.data[i]! << 16) | (fill.data[i + 1]! << 8) | fill.data[i + 2]!);
    }
  return out;
}
