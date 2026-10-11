import type { PixelBuffer, RGB } from '../PixelBuffer';
import { dither, glow, gradient, H, seeded, stageBuffer, W } from './paint';

/** Where the castle roof's layers sit (the fighters stand on the boards at STAGE.floorY). */
const ROOF = { skyEnd: 150, wallTop: 132, wallBottom: 160, floorTop: 160 } as const;

/**
 * Placeholder fight backdrop inspired by the classic '90s arcade fighters: a wooden castle roof
 * at dusk. A sunset sky with a big pale moon, dark mountains and pines, a tiered castle with
 * curved roofs behind, a plaster wall with dark beams, red banners on poles, and a plank floor.
 */
export function paintCastle(): PixelBuffer {
  const b = stageBuffer();
  const rnd = seeded(5);

  gradient(b, 0, ROOF.skyEnd, [0x140a2a, 0x2a1048, 0x4a1858, 0x7a2460, 0xb03c5c, 0xe0604e, 0xff9a52], 1.1);
  for (let i = 0; i < 26; i++)
    b.px(Math.floor(rnd() * W), Math.floor(rnd() * 46), rnd() > 0.6 ? 0xffffff : 0xa08cdc);

  // a big pale moon on the left
  const [mx, my, mr] = [50, 56, 15];
  for (let y = my - mr - 8; y <= my + mr + 8; y++)
    for (let x = mx - mr - 8; x <= mx + mr + 8; x++) {
      const d = Math.hypot(x - mx, y - my);
      if (d <= mr) {
        const crater = Math.hypot(x - mx - 5, y - my + 4) < 4 || Math.hypot(x - mx + 6, y - my - 5) < 3;
        b.px(x, y, crater ? 0xf0d8c0 : d > mr - 1.5 ? 0xf8e0c8 : 0xfff2e0);
      } else if (d < mr + 8) glow(b, x, y, 0xfff2e0, 0.4 * (1 - (d - mr) / 8));
    }

  // far mountains, then a row of pines
  for (let x = 0; x < W; x++) {
    const top = Math.round(104 + 10 * Math.sin(x * 0.03 + 0.5) + 6 * Math.sin(x * 0.085));
    for (let y = top; y < ROOF.wallTop; y++) b.px(x, y, 0x3a1848);
    b.px(x, top, 0x5a2460);
  }
  for (let x = -4; x < W + 4; x += 7 + Math.floor(rnd() * 6)) {
    const h = 14 + Math.floor(rnd() * 14);
    const base = ROOF.wallTop;
    for (let y = 0; y < h; y++) {
      const half = Math.floor(((y + 2) / h) * 6) - (y % 4 === 0 ? 1 : 0);
      b.rect(x - half, base - h + y, half * 2 + 1, 1, 0x24102e);
    }
  }

  // the castle: a stone base and three tiers of white walls under dark curved roofs
  const cx = 158;
  const stone = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++) {
      const inset = Math.floor((y - y0) * 0.25);
      for (let x = x0 - inset; x < x0 + w + inset; x++) {
        const joint = (y - y0) % 5 === 4 || (x + Math.floor((y - y0) / 5) * 4) % 9 === 0;
        b.px(x, y, joint ? 0x3a2a48 : 0x5a4a66);
      }
    }
  };
  stone(cx - 32, 112, 64, 20);
  const tier = (y: number, w: number, wallH: number) => {
    // wall with windows
    b.rect(cx - w / 2 + 4, y, w - 8, wallH, 0xd8c8c0);
    b.rect(cx - w / 2 + 4, y + wallH - 2, w - 8, 2, 0xa89098);
    for (let x = cx - w / 2 + 9; x < cx + w / 2 - 9; x += 8) b.rect(x, y + 3, 3, 4, 0x2a1a3a);
    // roof above it: wider than the wall, edges curving up
    const rw = w / 2 + 7;
    for (let dx = -rw; dx <= rw; dx++) {
      const lift = Math.max(0, Math.abs(dx) - (rw - 6)) ** 1.4 * 0.7;
      const top = Math.round(y - 7 - lift);
      const bottom = Math.round(y - lift * 0.6);
      b.rect(cx + dx, top, 1, bottom - top, 0x2a1a3a);
      b.px(cx + dx, top, 0x6a5a86);
    }
    b.rect(cx - 1, y - 12, 3, 5, 0x2a1a3a);
    b.px(cx, y - 13, 0xffb321);
  };
  tier(98, 56, 14);
  tier(80, 40, 12);
  tier(64, 26, 10);
  // gold ornaments on the top ridge
  b.px(cx - 13, 52, 0xffb321);
  b.px(cx + 13, 52, 0xffb321);

  // the plaster wall at the back of the roof, with dark beams
  b.rect(0, ROOF.wallTop, W, ROOF.wallBottom - ROOF.wallTop, 0xe0d0c0);
  for (let y = ROOF.wallTop + 1; y < ROOF.wallBottom; y++)
    for (let x = 0; x < W; x++) if (dither(x, y, (y - ROOF.wallTop) / 40)) b.px(x, y, 0xc8b4a8);
  b.rect(0, ROOF.wallTop, W, 3, 0x3a2030);
  b.rect(0, ROOF.wallTop + 3, W, 1, 0x6a4048);
  b.rect(0, ROOF.wallBottom - 4, W, 4, 0x3a2030);
  for (let x = 0; x < W; x += 36) b.rect(x, ROOF.wallTop, 4, ROOF.wallBottom - ROOF.wallTop, 0x3a2030);

  // the plank floor: long boards with seams, darker towards the viewer
  for (let y = ROOF.floorTop; y < H; y++) {
    const board = Math.floor((y - ROOF.floorTop) / 7);
    const base: RGB = [0x9a6a42, 0x8a5c38, 0x94643e][board % 3]!;
    const dark = (y - ROOF.floorTop) / (H - ROOF.floorTop);
    for (let x = 0; x < W; x++) {
      const seam = (y - ROOF.floorTop) % 7 === 6 || (x + board * 29) % 64 === 0;
      let c: RGB = seam ? 0x4a2a1a : base;
      if (!seam && dither(x, y, dark * 0.7)) c = 0x6a4428;
      if (!seam && rnd() < 0.03) c = 0xb07a4a;
      b.px(x, y, c);
    }
  }
  b.rect(0, ROOF.floorTop, W, 1, 0xc08a58);

  // red banners on poles at both sides, with a gold disc
  const banner = (x: number) => {
    b.rect(x, 64, 2, ROOF.floorTop + 6 - 64, 0x4a2a1a);
    b.rect(x - 1, 62, 4, 2, 0xffb321);
    const bx = x + 2;
    for (let y = 68; y < 128; y++) {
      const wave = Math.round(Math.sin(y * 0.15) * 1);
      b.rect(bx + wave, y, 14, 1, y > 124 ? 0x8a1028 : 0xc8183a);
      b.px(bx + wave + 13, y, 0x8a1028);
    }
    for (let y = 0; y < 3; y++) b.rect(bx + 2 + y * 4, 128, 2, 4, 0x8a1028);
    const [dx, dy] = [bx + 7, 90];
    for (let y = -5; y <= 5; y++)
      for (let xx = -5; xx <= 5; xx++)
        if (xx * xx + y * y <= 25) b.px(dx + xx, dy + y, xx * xx + y * y > 14 ? 0xc46c14 : 0xffb321);
  };
  banner(12);
  banner(W - 30);
  return b;
}
