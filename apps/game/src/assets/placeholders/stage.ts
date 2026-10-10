import { MONITOR, STAGE } from '../../config/layout';
import { PixelBuffer } from './PixelBuffer';

/** Placeholder neon '80s backdrop for the monitor: dithered sunset, sun, mountains, grid floor. */
export function paintStage(): PixelBuffer {
  const W: number = MONITOR.width;
  const H: number = MONITOR.height;
  const hz: number = STAGE.horizonY;
  const b = new PixelBuffer(W, H);
  const bands = [0x0b0620, 0x160834, 0x280c4e, 0x461064, 0x761670, 0xaa1e70, 0xd6346e];
  const bayer = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const skyTop = Math.max(0, hz - W * 0.6);
  for (let y = 0; y < hz; y++) {
    const t = Math.max(0, (y - skyTop) / (hz - skyTop)) * (bands.length - 1);
    const i = Math.floor(t);
    const f = t - i;
    for (let x = 0; x < W; x++) {
      const up = f * 16 > bayer[y & 3]![x & 3]! ? 1 : 0;
      b.px(x, y, bands[Math.min(bands.length - 1, i + up)]!);
    }
  }
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < (W * hz) / 450; i++) {
    const x = Math.floor(rnd() * W);
    const y = Math.floor(rnd() * hz * 0.6);
    b.px(x, y, rnd() > 0.7 ? 0xffffff : 0xa08cdc);
  }
  // sun with stripes cut into its lower half
  const R = 40;
  const cx: number = W / 2;
  const cy = hz - 12;
  for (let y = cy - R; y <= cy + R && y < hz; y++) {
    const t = (y - (cy - R)) / (2 * R);
    if (t > 0.45 && (y - cy + R) % 8 < Math.max(1, Math.round(((t - 0.4) * R) / 4))) continue;
    const col = (255 << 16) | (Math.round(214 - t * 170) << 8) | Math.round(70 + t * 80);
    for (let x = cx - R; x <= cx + R; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= R * R) b.px(x, y, col);
  }
  const mountains = (pts: [number, number][], fill: number, edge: number) => {
    for (let x = 0; x < W; x++) {
      const u = (x - W / 2) / W;
      let top = hz;
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i]!;
        const [bx, by] = pts[i + 1]!;
        if (u >= ax && u <= bx) top = Math.round(hz - (ay + (by - ay) * ((u - ax) / (bx - ax))) * W);
      }
      for (let y = top; y < hz; y++) b.px(x, y, fill);
      if (top < hz) b.px(x, top, edge);
    }
  };
  mountains(
    [
      [-0.6, 0.12],
      [-0.37, 0.08],
      [-0.25, 0.14],
      [-0.1, 0],
      [0.1, 0],
      [0.3, 0.16],
      [0.46, 0.1],
      [0.6, 0.15],
    ],
    0x2c0e54,
    0xff2fbf,
  );
  mountains(
    [
      [-0.6, 0.04],
      [-0.45, 0.06],
      [-0.25, 0.02],
      [-0.1, 0],
      [0.1, 0],
      [0.3, 0.05],
      [0.6, 0.03],
    ],
    0x1c0a3c,
    0x3ff0ff,
  );
  // floor grid
  b.rect(0, hz, W, H - hz, 0x12062a);
  const depth = W * 0.4;
  for (let i = 1; i < 60; i++) {
    const y = hz + Math.round(depth * Math.pow(i / 13, 2.2));
    if (y >= H) break;
    b.rect(0, y, W, 1, i < 4 ? 0x601460 : 0xc424a0);
  }
  for (let i = -20; i <= 20; i++) {
    const xb = cx + (i * W) / 5;
    for (let y = hz; y < H; y++) {
      const t = (y - hz) / depth;
      const x = Math.round(cx + (xb - cx) * t);
      if (t > 0.06) b.px(x, y, t < 0.2 ? 0x601460 : 0xc424a0);
    }
  }
  return b;
}
