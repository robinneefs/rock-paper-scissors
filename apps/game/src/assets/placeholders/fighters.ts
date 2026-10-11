import { FighterFrames, type FighterFrame } from '../keys';
import { palette } from '../../config/palette';
import { PixelBuffer, shade, type RGB } from './PixelBuffer';

export const FIGHTER_FRAME = { width: 80, height: 80, footX: 34 } as const;

export interface FighterColors {
  gi: RGB;
  giShade: RGB;
  band: RGB;
  belt: RGB;
  skin: RGB;
  skinShade: RGB;
  hair: RGB;
}

type Arms = 'guard' | 'punch' | 'grab' | 'block' | 'flail' | 'raise';
interface Pose {
  lean: number;
  drop: number;
  stance: number;
  arms: Arms;
  eyes: 'open' | 'shut' | 'x';
}

const POSES: Record<Exclude<FighterFrame, 'ko'>, Pose> = {
  idle0: { lean: 0, drop: 0, stance: 0, arms: 'guard', eyes: 'open' },
  idle1: { lean: 0, drop: 1, stance: 0, arms: 'guard', eyes: 'open' },
  rock: { lean: 3, drop: 1, stance: 3, arms: 'punch', eyes: 'shut' },
  scissors: { lean: 4, drop: 2, stance: 4, arms: 'grab', eyes: 'open' },
  paper: { lean: -1, drop: 2, stance: 1, arms: 'block', eyes: 'shut' },
  hurt: { lean: -4, drop: 1, stance: 1, arms: 'flail', eyes: 'x' },
  win: { lean: 0, drop: 0, stance: 1, arms: 'raise', eyes: 'shut' },
};

/**
 * Placeholder fighter sheet: a chunky chibi martial artist, 64 px tall, facing right, one 80x80
 * frame per pose. Deliberately simple; the real sprite sheet replaces it under the same key.
 */
export function paintFighter(c: FighterColors): PixelBuffer {
  const { width: fw, height: fh } = FIGHTER_FRAME;
  const b = new PixelBuffer(fw * FighterFrames.length, fh);
  FighterFrames.forEach((frame, i) => {
    if (frame === 'ko') paintKo(b, i * fw, c);
    else paintStanding(b, i * fw, c, POSES[frame]);
    b.outline(palette.ink, i * fw, 0, fw, fh);
  });
  return b;
}

function paintStanding(b: PixelBuffer, fx: number, c: FighterColors, p: Pose): void {
  const floor = FIGHTER_FRAME.height - 1;
  const x = fx + FIGHTER_FRAME.footX;
  const hipY = floor - 17 + p.drop;
  const torsoX = x - 11 + p.lean;
  const torsoY = hipY - 17;
  const headX = x - 13 + Math.round(p.lean * 1.5);
  const headY = torsoY - 23;

  // back arm first (behind the body)
  arms(b, c, p.arms, 'back', torsoX, torsoY);
  // legs and bare feet
  const legs: [number, RGB][] = [
    [x - 9 - p.stance, c.giShade],
    [x + 3 + p.stance, c.gi],
  ];
  for (const [lx, col] of legs) {
    b.rect(lx, hipY, 7, floor - hipY - 2, col);
    b.rect(lx - 1, floor - 2, 9, 3, c.skin);
    b.rect(lx - 1, floor, 9, 1, c.skinShade);
  }
  // torso with a V neck and belt
  b.rect(torsoX, torsoY, 22, 18, c.gi);
  b.rect(torsoX, torsoY, 3, 18, c.giShade);
  b.rect(torsoX + 9, torsoY, 6, 2, c.skin);
  b.rect(torsoX + 10, torsoY + 2, 4, 2, c.skin);
  b.rect(torsoX + 11, torsoY + 4, 2, 2, c.skin);
  b.rect(torsoX, torsoY + 13, 22, 3, c.belt);
  b.rect(torsoX + 15, torsoY + 16, 3, 4, c.belt);
  // head: big chibi head, hair, headband with tails behind
  b.rect(headX + 1, headY + 2, 24, 21, c.skin);
  b.rect(headX, headY + 4, 26, 17, c.skin);
  b.rect(headX + 1, headY + 18, 24, 3, c.skinShade);
  b.rect(headX, headY - 2, 26, 8, c.hair);
  b.rect(headX - 1, headY + 2, 6, 12, c.hair);
  for (const [sx, h] of [
    [2, 5],
    [8, 7],
    [15, 6],
    [21, 4],
  ] as const)
    b.rect(headX + sx, headY - 2 - h, 4, h, c.hair);
  b.rect(headX, headY + 5, 26, 3, c.band);
  b.rect(headX - 7, headY + 4, 7, 2, c.band);
  b.rect(headX - 9, headY + 7, 6, 2, shade(c.band, 0.7));
  // face (looking right)
  const ey = headY + 11;
  for (const ex of [headX + 14, headX + 20]) {
    if (p.eyes === 'open') {
      b.rect(ex, ey, 2, 4, palette.ink);
      b.px(ex + 1, ey, palette.white);
    } else if (p.eyes === 'shut') {
      b.rect(ex - 1, ey + 2, 4, 1, palette.ink);
    } else {
      b.px(ex - 1, ey, palette.ink);
      b.px(ex + 1, ey, palette.ink);
      b.px(ex, ey + 1, palette.ink);
      b.px(ex - 1, ey + 2, palette.ink);
      b.px(ex + 1, ey + 2, palette.ink);
    }
  }
  b.rect(headX + 17, headY + 17, 3, 1, shade(c.skinShade, 0.7));
  // front arm last (in front of the body)
  arms(b, c, p.arms, 'front', torsoX, torsoY);
}

function arms(
  b: PixelBuffer,
  c: FighterColors,
  arms: Arms,
  which: 'front' | 'back',
  tx: number,
  ty: number,
): void {
  const sleeve = which === 'front' ? c.gi : c.giShade;
  const skin = which === 'front' ? c.skin : c.skinShade;
  const fist = (x: number, y: number, s = 6) => b.rect(x, y, s, s, skin);
  const sx = which === 'front' ? tx + 15 : tx + 4; // shoulder x
  const sy = ty + 2;
  switch (arms) {
    case 'guard':
      b.rect(sx, sy, 6, 9, sleeve);
      b.rect(sx + 4, sy + 6, 7, 5, sleeve);
      fist(sx + 9, sy + (which === 'front' ? 1 : 3));
      break;
    case 'punch':
      if (which === 'front') {
        b.rect(sx, sy + 1, 22, 6, sleeve);
        fist(sx + 21, sy, 8);
      } else {
        b.rect(sx - 4, sy + 2, 7, 10, sleeve);
        fist(sx - 4, sy + 10);
      }
      break;
    case 'grab':
      b.rect(sx, sy + (which === 'front' ? 4 : 0), 16, 5, sleeve);
      fist(sx + 15, sy + (which === 'front' ? 3 : -1), 7);
      break;
    case 'block':
      b.rect(sx + 2, sy - 4, 6, 12, sleeve);
      b.rect(sx + 6 + (which === 'front' ? 0 : -3), sy - 16, 5, 16, skin);
      fist(sx + 5 + (which === 'front' ? 0 : -3), sy - 20);
      break;
    case 'flail':
      b.rect(sx - 10, sy - 4, 12, 5, sleeve);
      fist(sx - 15, sy - (which === 'front' ? 8 : 4));
      break;
    case 'raise':
      if (which === 'front') {
        b.rect(sx, sy - 18, 6, 20, sleeve);
        fist(sx, sy - 25, 7);
      } else {
        b.rect(sx, sy, 6, 10, sleeve);
        fist(sx + 1, sy + 9);
      }
      break;
  }
}

/** Knocked out: lying flat on the floor, head to the left. */
function paintKo(b: PixelBuffer, fx: number, c: FighterColors): void {
  const floor = FIGHTER_FRAME.height - 1;
  const y = floor - 14;
  b.rect(fx + 2, y - 5, 20, 19, c.skin);
  b.rect(fx + 2, y - 7, 6, 21, c.hair);
  b.rect(fx + 8, y - 5, 3, 19, c.band);
  b.rect(fx + 22, y + 1, 20, 13, c.gi);
  b.rect(fx + 22, y + 11, 20, 3, c.giShade);
  b.rect(fx + 36, y + 1, 3, 13, c.belt);
  b.rect(fx + 42, y + 3, 22, 7, c.gi);
  b.rect(fx + 42, y + 9, 22, 4, c.giShade);
  b.rect(fx + 64, y + 2, 4, 11, c.skin);
  b.rect(fx + 26, y - 3, 10, 5, c.gi);
  b.rect(fx + 34, y - 5, 5, 5, c.skin);
  for (const ey of [y + 1, y + 7]) {
    b.px(fx + 14, ey, palette.ink);
    b.px(fx + 16, ey, palette.ink);
    b.px(fx + 15, ey + 1, palette.ink);
    b.px(fx + 14, ey + 2, palette.ink);
    b.px(fx + 16, ey + 2, palette.ink);
  }
}
