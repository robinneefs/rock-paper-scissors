import { STAGE } from '../../../config/layout';
import { palette } from '../../../config/palette';
import type { PixelBuffer, RGB } from '../PixelBuffer';
import { glow as glowAt, gradient, H, seeded, stageBuffer, W } from './paint';

/** Where the street's layers sit, top to bottom (the fighters stand on the road at STAGE.floorY). */
const STREET = { skyEnd: 150, walkTop: 146, curbTop: 162, roadTop: 166, laneY: 198 } as const;

/**
 * Placeholder fight backdrop: a city street at night. A dithered sky with a moon, a far skyline
 * of lit windows, near buildings with neon signs on both sides, street lamps, a pavement and a
 * wet road that reflects the neon. The middle is kept dark and calm, where the reveal plays.
 */
export function paintStreet(): PixelBuffer {
  const b = stageBuffer();
  const rnd = seeded(11);
  const glow = (x: number, y: number, c: RGB, f: number) => glowAt(b, x, y, c, f);

  // sky: near-black at the top, a purple city glow towards the street
  gradient(b, 0, STREET.skyEnd, [0x07040f, 0x0b0620, 0x110830, 0x180a3a, 0x220c46, 0x2e0e52, 0x3c1258], 1.4);
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rnd() * W);
    const y = Math.floor(rnd() * 70);
    b.px(x, y, rnd() > 0.75 ? palette.white : 0x8070b0);
  }
  // a crescent moon, right of the middle between the verdict and the prompt
  const mx = 144;
  const my = 58;
  for (let y = -9; y <= 9; y++)
    for (let x = -9; x <= 9; x++) {
      if (x * x + y * y > 81) continue;
      if ((x + 4) ** 2 + (y - 2) ** 2 <= 64) continue;
      b.px(mx + x, my + y, x * x + y * y > 56 ? palette.lilac : 0xf6f0ff);
    }

  // far skyline: dim blocks with a scatter of small lit windows
  const windowsIn = (
    x0: number,
    top: number,
    w: number,
    bottom: number,
    step: number,
    size: number,
    lit: number,
    cols: RGB[],
  ) => {
    for (let y = top + 3; y + size < bottom - 2; y += step)
      for (let x = x0 + 2; x + size <= x0 + w - 2; x += step)
        if (rnd() < lit) b.rect(x, y, size, size, cols[Math.floor(rnd() * cols.length)]!);
  };
  for (let x = 0; x < W;) {
    const w = 8 + Math.floor(rnd() * 14);
    const mid = Math.abs(x + w / 2 - W / 2) < 50;
    const top = (mid ? 96 : 76) + Math.floor(rnd() * 26);
    b.rect(x, top, w, STREET.walkTop - top, 0x1a0c38);
    b.rect(x, top, w, 1, 0x2a1652);
    windowsIn(x, top, w, STREET.walkTop, 3, 1, 0.22, [0x6e6096, 0x8a5cc0, 0xb08a3a]);
    x += w + Math.floor(rnd() * 3);
  }
  // nearer row: darker, bigger windows, lower in the middle so the reveal has open sky
  for (let x = 30; x < W - 30;) {
    const w = 14 + Math.floor(rnd() * 16);
    const mid = Math.abs(x + w / 2 - W / 2) < 44;
    const top = (mid ? 112 : 92) + Math.floor(rnd() * 16);
    b.rect(x, top, w, STREET.walkTop - top, 0x120828);
    b.rect(x, top, w, 1, 0x241248);
    windowsIn(x, top, w, STREET.walkTop, 5, 2, 0.3, [0xffb321, 0xc46c14, 0x3ff0ff, 0x6e6096]);
    x += w + 2 + Math.floor(rnd() * 4);
  }

  // near buildings at both edges: brick walls, lit windows, a neon sign each
  const wall = (x0: number, w: number) => {
    for (let y = 0; y < STREET.walkTop; y++)
      for (let x = x0; x < x0 + w; x++) {
        const row = Math.floor(y / 3);
        const joint = y % 3 === 2 || (x + (row % 2) * 3) % 6 === 0;
        b.px(x, y, joint ? 0x1c0e34 : 0x2c1648);
      }
    const edge = x0 === 0 ? x0 + w - 1 : x0;
    b.rect(edge, 0, 1, STREET.walkTop, 0x4a2f86);
    for (let y = 40; y < STREET.walkTop - 16; y += 22)
      for (let x = x0 + 4; x + 8 <= x0 + w - 3; x += 12) {
        const lit = rnd() < 0.6;
        b.rect(x - 1, y - 1, 10, 12, 0x140a2a);
        b.rect(x, y, 8, 10, lit ? 0xffb321 : 0x2a1648);
        if (lit) {
          b.rect(x, y, 8, 2, 0xffd94a);
          b.rect(x + 3, y, 1, 10, 0xc46c14);
        }
      }
  };
  wall(0, 30);
  wall(W - 30, 30);
  const sign = (x: number, y: number, text: string, color: RGB, dark: RGB) => {
    const h = text.length * 9 + 5;
    b.rect(x - 1, y - 1, 13, h + 2, palette.ink);
    b.rect(x, y, 11, h, 0x140a2a);
    b.frame(x, y, 11, h, color);
    [...text].forEach((ch, i) => b.text(ch, x + 3, y + 4 + i * 9, color, { shadow: dark }));
    return { cx: x + 5, bottom: y + h };
  };
  const bar = sign(14, 54, 'BAR', palette.pink, 0x7a1060);
  const rps = sign(W - 26, 62, 'RPS', palette.cyan, 0x1468a0);
  for (const [s, c] of [
    [bar, palette.pink],
    [rps, palette.cyan],
  ] as const)
    for (let y = s.bottom - 40; y < s.bottom + 10; y++)
      for (let x = s.cx - 12; x <= s.cx + 12; x++) {
        const d = Math.hypot(x - s.cx, (y - (s.bottom - 16)) * 0.6);
        if (d < 14) glow(x, y, c, 0.45 * (1 - d / 14));
      }

  // pavement and curb
  for (let y = STREET.walkTop; y < STREET.curbTop; y++)
    for (let x = 0; x < W; x++) {
      const joint = (x + Math.floor((y - STREET.walkTop) / 8) * 8) % 24 === 0 || y === STREET.walkTop + 7;
      b.px(x, y, joint ? 0x1c0e34 : 0x2e1a52);
    }
  b.rect(0, STREET.walkTop, W, 1, 0x4a2f86);
  b.rect(0, STREET.curbTop, W, 1, 0x8070b0);
  b.rect(0, STREET.curbTop + 1, W, 3, 0x4a2f86);

  // road: dark asphalt with a little grain and a dashed centre line
  for (let y = STREET.roadTop; y < H; y++)
    for (let x = 0; x < W; x++) b.px(x, y, rnd() < 0.06 ? 0x1c1036 : 0x120a24);
  b.rect(0, STREET.roadTop, W, 1, 0x07040f);
  for (let x = 4; x < W; x += 28) b.rect(x, STREET.laneY, 14, 2, 0x6e6096);

  // street lamps by the edges, with pools of light
  const lamp = (x: number, dir: 1 | -1) => {
    const top = 70;
    const hx = x + dir * 8;
    // a soft halo round the lamp head and a pool of light on the pavement below it
    for (let y = top - 8; y < top + 16; y++)
      for (let xx = hx - 12; xx <= hx + 12; xx++) {
        const d = Math.hypot(xx - hx, y - top - 5);
        if (d < 12) glow(xx, y, 0xffd94a, 0.5 * (1 - d / 12));
      }
    for (let y = STREET.walkTop; y < STREET.roadTop + 8; y++)
      for (let xx = hx - 22; xx <= hx + 22; xx++) {
        const d = Math.hypot((xx - hx) / 22, (y - STREET.curbTop + 2) / 10);
        if (d < 1) glow(xx, y, 0xffd94a, 0.6 * (1 - d));
      }
    b.rect(x, top, 2, STREET.curbTop - top, 0x4a2f86);
    b.rect(x + (dir === 1 ? 0 : 1), top, 1, STREET.curbTop - top, 0x6e6096);
    b.rect(x - 2, STREET.curbTop - 4, 6, 4, 0x4a2f86);
    b.rect(Math.min(x, hx), top, 9, 2, 0x4a2f86);
    b.rect(hx - 3, top + 2, 7, 3, 0x4a2f86);
    b.rect(hx - 2, top + 5, 5, 1, 0xffd94a);
  };
  lamp(38, 1);
  lamp(W - 40, -1);

  // wet road: the neon signs and lamps reflect as broken vertical streaks
  const reflect = (cx: number, w: number, c: RGB) => {
    for (let y = STREET.roadTop + 2; y < H; y++) {
      const f = 0.7 * (1 - (y - STREET.roadTop) / (H - STREET.roadTop));
      for (let x = cx - w; x <= cx + w; x++) if (rnd() < 0.85 && (y >> 1) % 3 !== 0) glow(x, y, c, f);
    }
  };
  reflect(bar.cx, 3, palette.pink);
  reflect(rps.cx, 3, palette.cyan);
  reflect(38 + 8, 2, 0xffd94a);
  reflect(W - 40 - 8, 2, 0xffd94a);
  // a soft shadow where the fighters stand
  for (const fx of [STAGE.fighterX.p1, STAGE.fighterX.p2])
    for (let x = fx - 16; x <= fx + 16; x++) b.px(x, STAGE.floorY, 0x0b0620);
  return b;
}
