import { palette } from '../../config/palette';
import { drawSymbol, SYMBOL_SIZE, type IconName } from './icons';
import { PixelBuffer, type RGB } from './PixelBuffer';
import { dither, gradient, H, mix, W } from './stages/paint';

/** The diagonal stripe tile that drifts over the menu backdrop (see MenuBackdrop). */
export const MENU_STRIPES = { size: 16 } as const;

/**
 * Placeholder backdrop for the menus, in the style of a '90s arcade select screen: a deep purple
 * field with a soft glow in the middle, a pink "versus" slash, halftone dots in two corners, three
 * big faint move symbols, and a dark floor strip for the home screen's fighters. Kept low in
 * contrast so menu text reads on top of it.
 */
export function paintMenuBackdrop(): PixelBuffer {
  const b = new PixelBuffer(W, H);
  gradient(b, 0, H, [0x0b0716, 0x140a2a, 0x1c0c3c, 0x140a2a, 0x0b0716], 1);

  // a soft glow behind the menu
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const d = Math.hypot((x - W / 2) / 110, (y - 92) / 80);
      if (d < 1 && dither(x, y, (1 - d) * 0.9)) b.px(x, y, mix(0x1c0c3c, palette.select, 0.9));
    }

  // the versus slash: a wide band from lower left to upper right with thin pink edges
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const u = x + y - 216; // distance across the band (lines of x + y = const)
      if (Math.abs(u) < 26)
        b.px(x, y, Math.abs(u) < 24 ? (Math.abs(u) < 10 ? 0x26104a : 0x200c40) : 0x7a1060);
    }

  // halftone dots, bigger towards the top-left and bottom-right corners
  for (let y = 2; y < H; y += 6)
    for (let x = 2 + ((y / 6) % 2) * 3; x < W; x += 6) {
      const t = Math.max(1 - Math.hypot(x, y) / 120, 1 - Math.hypot(W - x, H - y) / 120);
      if (t <= 0) continue;
      const r = t > 0.6 ? 2 : t > 0.3 ? 1 : 0;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + 1) b.px(x + dx, y + dy, 0x2e1458);
    }

  // three big faint move symbols
  const ghost = (name: IconName, x: number, y: number, scale: number, c: RGB) => {
    const tmp = new PixelBuffer(SYMBOL_SIZE.width, SYMBOL_SIZE.height);
    drawSymbol(tmp, name, 0, 0, { white: c, outline: c, tint: c, detail: mix(c, 0x0b0716, 0.5) });
    for (let sy = 0; sy < tmp.height; sy++)
      for (let sx = 0; sx < tmp.width; sx++)
        if (tmp.isSet(sx, sy)) {
          const i = (sy * tmp.width + sx) * 4;
          const col = (tmp.data[i]! << 16) | (tmp.data[i + 1]! << 8) | tmp.data[i + 2]!;
          b.rect(x + sx * scale, y + sy * scale, scale, scale, col);
        }
  };
  ghost('rock', 6, 8, 3, 0x2e1656);
  ghost('paper', W - 72, 70, 3, 0x2e1656);
  ghost('scissors', 4, 128, 3, 0x2e1656);

  // a dark floor strip at the bottom, with a lit edge
  b.rect(0, H - 14, W, 14, 0x0b0716);
  b.rect(0, H - 14, W, 1, palette.panelEdge);
  for (let x = 0; x < W; x += 8) b.rect(x, H - 12, 4, 1, 0x1c0c3c);
  return b;
}

/** One tile of the drifting stripes: thin diagonal lines, transparent between them. */
export function paintMenuStripes(): PixelBuffer {
  const s = MENU_STRIPES.size;
  const b = new PixelBuffer(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) if ((x + y) % s === 0) b.px(x, y, 0x221040);
  return b;
}
