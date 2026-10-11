import { moveColors, palette } from '../../config/palette';
import { PixelBuffer, shade, type RGB } from './PixelBuffer';

export const ICON = { size: 28, frames: ['rock', 'paper', 'scissors', 'unknown'] as const };
export type IconName = (typeof ICON.frames)[number];

/**
 * Flat white move symbols, 22x17, drawn on the cabinet buttons and the reveal coins (the "white
 * icons" style the user picked from docs/rebrand/mockups-round3/4-buttons.png).
 * '#' white, 'o' outline, 't' tint and 's' detail lines, both in tones of the button's colour.
 */
export const SYMBOLS: Record<IconName, string[]> = {
  rock: [
    '........oooooo........',
    '.....oooo####oooo.....',
    '....oo##########oo....',
    '...oo############oo...',
    '...o##############oo..',
    '..oo###############oo.',
    '..o#########ttttttt#o.',
    '.oo########tttttttt#o.',
    '.o#########ttttttttto.',
    '.o##########ttttttttoo',
    'oo###t######tttttttt#o',
    'o##ttttttt##ttttttttto',
    'o#ttttttttttttttttttoo',
    'ootttttttttttttttttoo.',
    '.ootttttttttttttttoo..',
    '..ootttttttttttttoo...',
    '...ooooooooooooooo....',
  ],
  paper: [
    '..oooooooooooooo......',
    '..o############oo.....',
    '..o#############oo....',
    '..o##############oo...',
    '..o###sssssssss###oo..',
    '..o################o..',
    '..o################o..',
    '..o###ssssssssssss#o..',
    '..o################o..',
    '..o################o..',
    '..o###ssssssssssss#o..',
    '..o################o..',
    '..o################o..',
    '..o###ssssssss#####o..',
    '..o################o..',
    '..o################o..',
    '..oooooooooooooooooo..',
  ],
  scissors: [
    '.ooooooo...........ooo',
    '.ottttto.........ooo#o',
    'oot#tttoo.......oo###o',
    'ottoootto.....ooo###oo',
    'ottoottto...ooo###ooo.',
    'ottootttoo.oo####oo...',
    'ootttttttooo###ooo....',
    '.otttttttt####oo......',
    '.oooooottt###ooo......',
    '.otttttttooo###ooo....',
    'oot#ttttoo.oo####oo...',
    'ottoottto...ooo###ooo.',
    'ottoootto.....ooo###oo',
    'ottoootto.......oo###o',
    'ootttttoo........ooo#o',
    '.ottttto...........ooo',
    '.ooooooo..............',
  ],
  unknown: [
    '.......oooooooo.......',
    '......oo######oo......',
    '.....oo###oo###oo.....',
    '.....o###o..o###o.....',
    '.....ooooo..o###o.....',
    '...........oo###o.....',
    '..........oo###oo.....',
    '.........oo###oo......',
    '.........o###oo.......',
    '.........o###o........',
    '.........ooooo........',
    '.........ooooo........',
    '.........o###o........',
    '.........o###o........',
    '.........o###o........',
    '.........ooooo........',
    '......................',
  ],
};
export const SYMBOL_SIZE = { width: 22, height: 17 };

/** The tones a symbol is drawn in; `white` swaps for a dimmed colour on a dimmed button. */
export interface SymbolTones {
  white: RGB;
  outline: RGB;
  tint: RGB;
  detail: RGB;
}

/** Tones for a move's symbol: outline and lines in its dark shade, the tinted parts in a light tone. */
export function symbolTones(name: IconName, dim = false): SymbolTones {
  const c = name === 'unknown' ? { main: palette.dim, shade: palette.panelEdge } : moveColors[name];
  const outline = shade(c.shade, 0.55);
  if (dim)
    return {
      white: shade(c.main, 0.5),
      outline: shade(c.shade, 0.3),
      tint: shade(c.main, 0.42),
      detail: shade(c.shade, 0.3),
    };
  return { white: palette.white, outline, tint: lighten(c.main, 0.55), detail: c.shade };
}

/** Draws a symbol with its top-left at (x, y). */
export function drawSymbol(b: PixelBuffer, name: IconName, x: number, y: number, tones: SymbolTones): void {
  const map: Record<string, RGB> = { '#': tones.white, o: tones.outline, t: tones.tint, s: tones.detail };
  SYMBOLS[name].forEach((row, ry) =>
    [...row].forEach((ch, rx) => {
      const c = map[ch];
      if (c !== undefined) b.px(x + rx, y + ry, c);
    }),
  );
}

/** Mixes a colour towards white by `f` (0 = unchanged, 1 = white). */
export function lighten(c: RGB, f: number): RGB {
  const ch = (v: number) => Math.round(v + (255 - v) * f);
  return (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255);
}

/** Move icon coins, one 28x28 frame per move plus a "?" coin. */
export function paintIcons(): PixelBuffer {
  const s = ICON.size;
  const b = new PixelBuffer(s * ICON.frames.length, s);
  ICON.frames.forEach((name, i) => {
    const colors = name === 'unknown' ? { main: palette.dim, shade: palette.panelEdge } : moveColors[name];
    const cx = i * s + 13;
    b.ell(cx, 14, 13, 12, colors.shade);
    b.ell(cx, 13, 13, 12, colors.main);
    b.ell(cx - 5, 7, 4, 2, lighten(colors.main, 0.45));
    drawSymbol(b, name, cx - 11, 5, symbolTones(name));
    b.outline(palette.ink, i * s, 0, s, s);
  });
  return b;
}
