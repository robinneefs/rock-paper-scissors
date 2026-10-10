import { PixelBuffer, shade } from './PixelBuffer';

export const LOGO_SIZE = { width: 176, height: 112 } as const;

/**
 * The placeholder studio logo ("YOUR STUDIO" + a pixel emblem). It ships as
 * public/assets/logo.png (written by tools/make-placeholder-logo.mjs); swapping that file for the
 * company logo is the whole change.
 */
export function paintLogo(): PixelBuffer {
  const b = new PixelBuffer(LOGO_SIZE.width, LOGO_SIZE.height);
  const cx = 88;
  const cy = 30;
  for (let r = 0; r <= 22; r++) {
    const w = 22 - r;
    for (const s of [-1, 1]) {
      b.px(cx - w, cy + s * r, 0xff2fbf);
      b.px(cx + w, cy + s * r, 0x3ff0ff);
    }
  }
  for (let r = 0; r <= 18; r++) {
    const w = 18 - r;
    for (const s of [-1, 1])
      b.rect(cx - w, cy + s * r, w * 2 + 1, 1, (Math.min(255, 40 + r * 3) << 16) | (14 << 8) | (70 + r * 2));
  }
  b.bitmap(['..#..', '..#..', '#####', '.###.', '.#.#.'], cx - 10, cy - 10, 0xffd65a, 4);
  b.text('YOUR STUDIO', cx, 66, 0xf6f0ff, { scale: 2, center: true, shadow: 0x5a0b4a });
  b.text('PLACEHOLDER LOGO', cx, 92, shade(0xc9b8ff, 0.75), { center: true });
  return b;
}
