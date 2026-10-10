import { GLYPH, GLYPHS } from '../glyphs';

export type RGB = number; // 0xRRGGBB

/**
 * A tiny RGBA pixel canvas for drawing placeholder art in whole pixels. Works in the browser
 * (turned into a texture) and in Node (written to a PNG by tools/), with no Phaser or DOM.
 */
export class PixelBuffer {
  readonly data: Uint8ClampedArray;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  px(x: number, y: number, c: RGB, alpha = 255): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    this.data[i] = (c >> 16) & 255;
    this.data[i + 1] = (c >> 8) & 255;
    this.data[i + 2] = c & 255;
    this.data[i + 3] = alpha;
  }

  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) this.px(x + xx, y + yy, c);
  }

  /** Outline-only rectangle, 1 px wide. */
  frame(x: number, y: number, w: number, h: number, c: RGB): void {
    this.rect(x, y, w, 1, c);
    this.rect(x, y + h - 1, w, 1, c);
    this.rect(x, y, 1, h, c);
    this.rect(x + w - 1, y, 1, h, c);
  }

  /** Filled ellipse drawn as horizontal pixel runs. */
  ell(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + 0.5)) ** 2)));
      this.rect(cx - w, cy + y, w * 2 + 1, 1, c);
    }
  }

  isSet(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return this.data[(y * this.width + x) * 4 + 3]! > 0;
  }

  /** Draws a 1-bit bitmap ('#' = set) with its top-left at (x, y). */
  bitmap(rows: readonly string[], x: number, y: number, c: RGB, scale = 1): void {
    rows.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        if (ch === '#') this.rect(x + rx * scale, y + ry * scale, scale, scale, c);
      }),
    );
  }

  /** Pixel-font text, top-left at (x, y), or centred on x. */
  text(
    s: string,
    x: number,
    y: number,
    c: RGB,
    opts: { scale?: number; center?: boolean; shadow?: RGB } = {},
  ): void {
    const scale = opts.scale ?? 1;
    const str = s.toUpperCase();
    const width = this.textWidth(str, scale);
    const left = opts.center ? Math.round(x - width / 2) : x;
    const pass = (dx: number, dy: number, col: RGB) => {
      [...str].forEach((ch, i) => {
        const rows = (GLYPHS[ch] ?? GLYPHS['?'] ?? '').split(' ');
        rows.forEach((row, ry) =>
          [...row].forEach((bit, rx) => {
            if (bit === '1')
              this.rect(
                left + dx + (i * (GLYPH.width + GLYPH.spacing) + rx) * scale,
                y + dy + ry * scale,
                scale,
                scale,
                col,
              );
          }),
        );
      });
    };
    if (opts.shadow !== undefined) pass(scale, scale, opts.shadow);
    pass(0, 0, c);
  }

  textWidth(s: string, scale = 1): number {
    return s.length ? (s.length * (GLYPH.width + GLYPH.spacing) - GLYPH.spacing) * scale : 0;
  }

  /** Every empty pixel touching a filled one (4 neighbours) becomes `c`: a 1 px outline. */
  outline(c: RGB, x0 = 0, y0 = 0, w = this.width, h = this.height): void {
    const marks: [number, number][] = [];
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        if (this.isSet(x, y)) continue;
        const near = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ].some(([nx, ny]) => nx! >= x0 && nx! < x0 + w && ny! >= y0 && ny! < y0 + h && this.isSet(nx!, ny!));
        if (near) marks.push([x, y]);
      }
    for (const [x, y] of marks) this.px(x, y, c);
  }
}

/** Darken or lighten a colour by a factor (palette steps for fades and shading). */
export function shade(c: RGB, f: number): RGB {
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255);
}
