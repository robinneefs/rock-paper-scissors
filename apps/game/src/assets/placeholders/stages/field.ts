import { STAGE } from '../../../config/layout';
import type { PixelBuffer, RGB } from '../PixelBuffer';
import { dither, glow, gradient, H, seeded, stageBuffer, W } from './paint';

/** Where the field's layers sit (the fighters stand on the worn patch at STAGE.floorY). */
const FIELD = { horizon: 132, fenceTop: 138, grassTop: 156 } as const;

/**
 * Placeholder fight backdrop: a grassy field on a sunny day. Blue sky with a sun and puffy
 * clouds, rolling hills, a tree on each side, a wooden fence, and grass with flowers. The
 * fighters stand on a worn dirt patch. The top stays a deeper blue so the HUD reads well.
 */
export function paintField(): PixelBuffer {
  const b = stageBuffer();
  const rnd = seeded(23);

  gradient(b, 0, FIELD.horizon + 10, [0x1f5fc8, 0x2f74da, 0x4a90e8, 0x6aaef2, 0x92ccf8, 0xc0e8ff], 1.2);

  // the sun, high and right of the middle, with a soft halo
  const [sx, sy] = [156, 30];
  for (let y = sy - 22; y <= sy + 22; y++)
    for (let x = sx - 22; x <= sx + 22; x++) {
      const d = Math.hypot(x - sx, y - sy);
      if (d <= 9) b.px(x, y, d > 7.5 ? 0xffd94a : 0xfff6c0);
      else if (d < 22) glow(b, x, y, 0xfff6c0, 0.55 * (1 - (d - 9) / 13));
    }

  // puffy clouds: a few overlapping blobs, white on top and pale blue underneath
  const cloud = (cx: number, cy: number, w: number) => {
    const blobs: [number, number, number][] = [
      [cx - w * 0.35, cy + 2, w * 0.28],
      [cx, cy - 2, w * 0.36],
      [cx + w * 0.35, cy + 2, w * 0.26],
    ];
    for (let y = cy - w; y <= cy + w; y++)
      for (let x = cx - w; x <= cx + w; x++) {
        const inside = blobs.some(([bx, by, r]) => Math.hypot(x - bx, (y - by) * 1.4) <= r);
        if (!inside || y > cy + w * 0.22) continue;
        const under = y > cy + w * 0.05;
        b.px(x, y, under ? 0xcfe2f8 : 0xffffff);
      }
  };
  cloud(40, 54, 26);
  cloud(132, 40, 20);
  cloud(98, 92, 16);
  cloud(196, 100, 18);

  // rolling hills: far and bluish, then nearer and greener
  const hills = (base: number, amp: number, freq: number, phase: number, fill: RGB, edge: RGB) => {
    for (let x = 0; x < W; x++) {
      const top = Math.round(
        base - amp * (0.6 + 0.4 * Math.sin(x * freq + phase)) * (0.7 + 0.3 * Math.sin(x * freq * 2.3)),
      );
      for (let y = top; y < FIELD.grassTop; y++) b.px(x, y, fill);
      b.px(x, top, edge);
    }
  };
  hills(FIELD.horizon, 16, 0.035, 1.2, 0x6ab0a8, 0x8ccac0);
  hills(FIELD.horizon + 10, 12, 0.05, 3.1, 0x4c9e5a, 0x6cc070);

  // grass, darker towards the viewer, with blades and flowers
  gradient(b, FIELD.grassTop, H, [0x5cc04a, 0x4cae42, 0x3e9a3a, 0x328532], 0.9);
  for (let i = 0; i < 520; i++) {
    const x = Math.floor(rnd() * W);
    const y = FIELD.grassTop + 2 + Math.floor(rnd() * (H - FIELD.grassTop - 2));
    const light = rnd() > 0.5;
    b.px(x, y, light ? 0x7ad66a : 0x2a7030);
    b.px(x, y - 1, light ? 0x7ad66a : 0x2a7030);
  }
  // a worn dirt patch where the fighters stand
  const px0 = (STAGE.fighterX.p1 + STAGE.fighterX.p2) / 2;
  for (let y = STAGE.floorY - 10; y < STAGE.floorY + 14; y++)
    for (let x = px0 - 80; x <= px0 + 80; x++) {
      const d = Math.hypot((x - px0) / 80, (y - STAGE.floorY - 1) / 12);
      if (d < 0.75 || (d < 1 && dither(x, y, (1 - d) * 4))) b.px(x, y, d < 0.5 ? 0xc49a62 : 0xb08a5a);
    }
  for (let i = 0; i < 40; i++) {
    const x = Math.round(px0 - 50 + rnd() * 100);
    const y = Math.round(STAGE.floorY - 4 + rnd() * 10);
    b.px(x, y, 0x8a6a42);
  }
  const flowers = [0xffffff, 0xffd94a, 0xff7ab8, 0xc9b8ff];
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(rnd() * W);
    const y = FIELD.grassTop + 4 + Math.floor(rnd() * (H - FIELD.grassTop - 6));
    if (Math.hypot((x - px0) / 84, (y - STAGE.floorY) / 14) < 1) continue;
    const c = flowers[Math.floor(rnd() * flowers.length)]!;
    b.px(x, y, c);
    b.px(x - 1, y, c);
    b.px(x + 1, y, c);
    b.px(x, y - 1, c);
    b.px(x, y, 0xffb321);
    b.px(x, y + 1, 0x2a7030);
  }

  // a wooden fence along the back of the field
  b.rect(0, FIELD.fenceTop + 4, W, 3, 0xc48a4a);
  b.rect(0, FIELD.fenceTop + 7, W, 1, 0x8a5a2a);
  b.rect(0, FIELD.fenceTop + 11, W, 3, 0xc48a4a);
  b.rect(0, FIELD.fenceTop + 14, W, 1, 0x8a5a2a);
  for (let x = 6; x < W; x += 20) {
    b.rect(x, FIELD.fenceTop, 4, FIELD.grassTop - FIELD.fenceTop + 2, 0xd89c58);
    b.rect(x + 3, FIELD.fenceTop, 1, FIELD.grassTop - FIELD.fenceTop + 2, 0x8a5a2a);
    b.rect(x, FIELD.fenceTop, 4, 1, 0xf0c080);
  }

  // a big leafy tree on each side, framing the stage
  const tree = (tx: number, flip: 1 | -1) => {
    b.rect(tx - 4, 90, 9, FIELD.grassTop + 6 - 90, 0x7a4a2a);
    b.rect(tx - 4 + (flip === 1 ? 0 : 7), 90, 2, FIELD.grassTop + 6 - 90, 0x9a6a3a);
    b.rect(tx + 5 * flip - (flip === 1 ? 0 : 4), 112, 5, 3, 0x7a4a2a);
    const clumps: [number, number, number][] = [
      [tx, 52, 22],
      [tx - 16 * flip, 70, 18],
      [tx + 14 * flip, 74, 16],
      [tx, 86, 16],
      [tx + 4 * flip, 34, 14],
    ];
    for (let y = 10; y < 108; y++)
      for (let x = tx - 44; x <= tx + 44; x++) {
        let best = Infinity;
        let lit = false;
        for (const [cx, cy, r] of clumps) {
          const d = Math.hypot(x - cx, y - cy) / r;
          if (d < best) {
            best = d;
            lit = x - cx + (y - cy) < -r * 0.3;
          }
        }
        if (best > 1) continue;
        b.px(x, y, best > 0.88 ? 0x1f5a2a : lit ? 0x58c04e : dither(x, y, 0.3) ? 0x2f8a3a : 0x3a9e40);
      }
  };
  tree(14, 1);
  tree(W - 14, -1);
  return b;
}
