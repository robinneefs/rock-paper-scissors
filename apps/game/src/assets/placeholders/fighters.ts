import { FighterFrames, type FighterFrame } from '../keys';
import { palette } from '../../config/palette';
import { PixelBuffer, type RGB } from './PixelBuffer';

export const FIGHTER_FRAME = { width: 80, height: 80, footX: 34 } as const;

export interface FighterColors {
  /** brawler: open shirt over an undershirt, jeans, boots. striker: wrap top, sash, ponytail. */
  kind: 'brawler' | 'striker';
  skin: RGB;
  skinShade: RGB;
  hair: RGB;
  hairLight: RGB;
  top: RGB;
  topShade: RGB;
  /** brawler: the undershirt. striker: trim and hand wraps. */
  under: RGB;
  underShade: RGB;
  legs: RGB;
  legsShade: RGB;
  legsLight: RGB;
  belt: RGB;
  buckle: RGB;
  shoes: RGB;
  shoesShade: RGB;
}

/** Body proportions in pixels (64 px tall fighters). */
interface Build {
  headW: number;
  headH: number;
  neckW: number;
  shoulderW: number;
  waistW: number;
  hipW: number;
  torsoH: number;
  upperArm: number;
  foreArm: number;
  armR: number;
  foreR: number;
  fist: number;
  thigh: number;
  shin: number;
  thighR: number;
  shinR: number;
}

const BUILDS: Record<FighterColors['kind'], Build> = {
  brawler: {
    headW: 14,
    headH: 15,
    neckW: 7,
    shoulderW: 26,
    waistW: 18,
    hipW: 18,
    torsoH: 17,
    upperArm: 10,
    foreArm: 9,
    armR: 3.4,
    foreR: 2.9,
    fist: 6,
    thigh: 13,
    shin: 12,
    thighR: 4.4,
    shinR: 3.6,
  },
  striker: {
    headW: 13,
    headH: 14,
    neckW: 5,
    shoulderW: 18,
    waistW: 12,
    hipW: 16,
    torsoH: 15,
    upperArm: 9,
    foreArm: 9,
    armR: 2.5,
    foreR: 2.2,
    fist: 5,
    thigh: 13,
    shin: 13,
    thighR: 3.7,
    shinR: 2.9,
  },
};

type Pt = readonly [number, number];
interface Pose {
  lean: number;
  drop: number;
  /** Feet x, relative to FIGHTER_FRAME.footX. */
  rearFoot: number;
  leadFoot: number;
  /** Hands relative to their shoulder, for a 19 px arm (scaled to the build). */
  nearHand: Pt;
  farHand: Pt;
  head: Pt;
  eyes: 'open' | 'shut' | 'x';
  mouth: 'set' | 'shout' | 'ouch' | 'grin';
}

const POSES: Record<Exclude<FighterFrame, 'ko'>, Pose> = {
  idle0: {
    lean: 1,
    drop: 0,
    rearFoot: -9,
    leadFoot: 8,
    nearHand: [14, 1],
    farHand: [11, -6],
    head: [0, 0],
    eyes: 'open',
    mouth: 'set',
  },
  idle1: {
    lean: 1,
    drop: 1,
    rearFoot: -9,
    leadFoot: 8,
    nearHand: [14, 2],
    farHand: [11, -5],
    head: [0, 0],
    eyes: 'open',
    mouth: 'set',
  },
  rock: {
    lean: 4,
    drop: 1,
    rearFoot: -12,
    leadFoot: 10,
    nearHand: [28, -3],
    farHand: [6, 3],
    head: [1, 0],
    eyes: 'open',
    mouth: 'shout',
  },
  scissors: {
    lean: 5,
    drop: 3,
    rearFoot: -12,
    leadFoot: 11,
    nearHand: [25, 4],
    farHand: [19, -2],
    head: [1, 1],
    eyes: 'open',
    mouth: 'set',
  },
  paper: {
    lean: -1,
    drop: 2,
    rearFoot: -9,
    leadFoot: 6,
    nearHand: [13, -14],
    farHand: [8, -13],
    head: [-1, 1],
    eyes: 'shut',
    mouth: 'set',
  },
  hurt: {
    lean: -5,
    drop: 2,
    rearFoot: -12,
    leadFoot: 4,
    nearHand: [-7, -11],
    farHand: [-2, -14],
    head: [-2, 1],
    eyes: 'x',
    mouth: 'ouch',
  },
  win: {
    lean: 0,
    drop: 0,
    rearFoot: -6,
    leadFoot: 6,
    nearHand: [9, 12],
    farHand: [9, -20],
    head: [0, -1],
    eyes: 'shut',
    mouth: 'grin',
  },
};

/**
 * Fighter sheet drawn in code: facing right, 64 px tall, one 80x80 frame per pose. Limbs are posed
 * with two-bone IK so both builds share the same poses. The real sprite sheet replaces it under the
 * same key.
 */
export function paintFighter(c: FighterColors): PixelBuffer {
  const { width: fw, height: fh } = FIGHTER_FRAME;
  const b = new PixelBuffer(fw * FighterFrames.length, fh);
  FighterFrames.forEach((frame, i) => {
    if (frame === 'ko') paintKo(b, i * fw, c, BUILDS[c.kind]);
    else paintStanding(b, i * fw, c, BUILDS[c.kind], POSES[frame]);
    b.outline(palette.ink, i * fw, 0, fw, fh);
  });
  return b;
}

/** Filled disc, used to stamp round limbs. */
function disc(b: PixelBuffer, cx: number, cy: number, r: number, col: RGB): void {
  const n = Math.ceil(r);
  for (let dy = -n; dy <= n; dy++)
    for (let dx = -n; dx <= n; dx++) if (dx * dx + dy * dy <= r * r) b.px(cx + dx, cy + dy, col);
}

/** Thick segment from a to b (a round-ended limb). */
function limb(b: PixelBuffer, a: Pt, z: Pt, r: number, col: RGB): void {
  const len = Math.hypot(z[0] - a[0], z[1] - a[1]);
  const steps = Math.max(1, Math.ceil(len * 2));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    disc(b, Math.round(a[0] + (z[0] - a[0]) * t), Math.round(a[1] + (z[1] - a[1]) * t), r, col);
  }
}

const lerpPt = (a: Pt, z: Pt, t: number): Pt => [a[0] + (z[0] - a[0]) * t, a[1] + (z[1] - a[1]) * t];

/** Two-bone IK: the middle joint for a limb from `a` reaching `t`, bending toward `bend`. */
function joint(a: Pt, t: Pt, l1: number, l2: number, bend: 'down' | 'forward'): Pt {
  const dx = t[0] - a[0];
  const dy = t[1] - a[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), 0.01), l1 + l2 - 0.01);
  const base = Math.atan2(dy, dx);
  const off = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const p1: Pt = [a[0] + l1 * Math.cos(base + off), a[1] + l1 * Math.sin(base + off)];
  const p2: Pt = [a[0] + l1 * Math.cos(base - off), a[1] + l1 * Math.sin(base - off)];
  if (bend === 'down') return p1[1] >= p2[1] ? p1 : p2;
  return p1[0] >= p2[0] ? p1 : p2;
}

function paintStanding(b: PixelBuffer, fx: number, c: FighterColors, bd: Build, p: Pose): void {
  const floor = FIGHTER_FRAME.height - 1;
  const ankleY = floor - 3;
  const footX = fx + FIGHTER_FRAME.footX;
  const hipY = ankleY - Math.round((bd.thigh + bd.shin) * 0.9) + p.drop;
  const waistY = hipY - 3;
  const shoulderY = waistY - bd.torsoH;
  const cx = footX + p.lean; // torso centre at the shoulders
  const armScale = (bd.upperArm + bd.foreArm) / 19;
  const nearShoulder: Pt = [cx - Math.floor(bd.shoulderW / 2) + 5, shoulderY + 3];
  const farShoulder: Pt = [cx + Math.floor(bd.shoulderW / 2) - 4, shoulderY + 3];
  const hand = (s: Pt, h: Pt): Pt => [Math.round(s[0] + h[0] * armScale), Math.round(s[1] + h[1] * armScale)];

  if (c.kind === 'striker') ponytail(b, c, cx + p.head[0] + Math.round(p.lean * 0.5), shoulderY, bd, p);
  arm(b, c, bd, farShoulder, hand(farShoulder, p.farHand), 'far');
  // legs: rear leg behind (shaded), lead leg in front
  leg(b, c, bd, [footX - 4, hipY], [footX + p.rearFoot, ankleY], 'rear');
  leg(b, c, bd, [footX + 4, hipY], [footX + p.leadFoot, ankleY], 'lead');
  // hips (jeans / pants seat)
  for (let y = waistY + 2; y <= hipY + 2; y++) {
    const half = Math.floor(bd.hipW / 2);
    for (let x = footX - half; x < footX + half; x++) b.px(x, y, x < footX - half + 4 ? c.legsShade : c.legs);
  }
  torso(b, c, bd, cx, footX, shoulderY, waistY);
  belt(b, c, bd, footX, waistY);
  head(b, c, bd, cx + p.head[0] + Math.round(p.lean * 0.5), shoulderY + p.head[1], p);
  arm(b, c, bd, nearShoulder, hand(nearShoulder, p.nearHand), 'near');
}

function torso(
  b: PixelBuffer,
  c: FighterColors,
  bd: Build,
  topX: number,
  waistX: number,
  top: number,
  bottom: number,
): void {
  const h = bottom - top;
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / h;
    const centre = Math.round(topX + (waistX - topX) * t);
    // broad chest that tapers to the waist, slightly rounded shoulders
    const half = Math.round((bd.shoulderW + (bd.waistW - bd.shoulderW) * t ** 0.8) / 2) - (y === top ? 2 : 0);
    for (let x = centre - half; x < centre + half; x++) {
      const u = (x - centre + 0.5) / half; // -1 back .. +1 front
      b.px(x, y, torsoColor(c, u, t, y - top));
    }
  }
}

function torsoColor(c: FighterColors, u: number, t: number, row: number): RGB {
  if (c.kind === 'brawler') {
    // open red shirt over a white undershirt that shows down the front of the chest
    const open0 = -0.08 + t * 0.12;
    const open1 = 0.5 - t * 0.12;
    if (u > open0 && u < open1) {
      if (row === 0) return c.skin; // neck line
      if (row === 6 && u > open0 + 0.12 && u < open1 - 0.12) return c.underShade; // chest line
      return u < open0 + 0.12 ? c.underShade : c.under;
    }
    if (row <= 3 && (Math.abs(u - open0) < 0.2 || Math.abs(u - open1) < 0.2)) return c.top; // collar
    if (Math.abs(u - open0) < 0.12 || Math.abs(u - open1) < 0.12) return c.topShade; // shirt edge
    return u < -0.6 ? c.topShade : c.top;
  }
  // striker: wrap top, white trim crossing from the collar down to the front
  const trim = -0.3 + t * 0.9;
  if (row === 0 && u > -0.4 && u < 0.4) return c.skin;
  if (Math.abs(u - trim) < 0.18) return c.under;
  return u < -0.55 ? c.topShade : c.top;
}

function belt(b: PixelBuffer, c: FighterColors, bd: Build, x: number, waistY: number): void {
  const half = Math.floor(Math.max(bd.waistW, bd.hipW) / 2);
  b.rect(x - half, waistY, half * 2, 3, c.belt);
  if (c.kind === 'brawler') {
    b.rect(x + 1, waistY, 4, 3, c.buckle);
    b.rect(x + 2, waistY + 1, 2, 1, c.belt);
  } else {
    // sash knot and tails on the back hip
    b.rect(x - half + 1, waistY - 1, 4, 5, c.belt);
    b.rect(x - half - 1, waistY + 3, 3, 6, c.buckle);
    b.rect(x - half + 2, waistY + 3, 2, 8, c.belt);
  }
}

function arm(b: PixelBuffer, c: FighterColors, bd: Build, sh: Pt, hand: Pt, which: 'near' | 'far'): void {
  const el = joint(sh, hand, bd.upperArm, bd.foreArm, 'down');
  const skin = which === 'near' ? c.skin : c.skinShade;
  const cloth = which === 'near' ? c.top : c.topShade;
  const wrap = which === 'near' ? c.under : c.underShade;
  // dark rim so the near arm reads over the torso
  if (which === 'near') {
    limb(b, sh, el, bd.armR + 1, palette.ink);
    limb(b, el, hand, bd.foreR + 1, palette.ink);
    disc(b, hand[0], hand[1], bd.fist / 2 + 1, palette.ink);
  }
  limb(b, sh, el, bd.armR, skin);
  limb(b, el, hand, bd.foreR, skin);
  if (c.kind === 'brawler') {
    // short rolled sleeve over a big shoulder
    limb(b, sh, lerpPt(sh, el, 0.55), bd.armR + 0.7, cloth);
  } else {
    disc(b, sh[0], sh[1], bd.armR + 0.4, cloth);
    limb(b, lerpPt(el, hand, 0.35), hand, bd.foreR + 0.3, wrap);
  }
  // fist
  const f = bd.fist;
  const fx = Math.round(hand[0] - f / 2);
  const fy = Math.round(hand[1] - f / 2);
  b.rect(fx, fy, f, f, c.kind === 'striker' ? wrap : skin);
  b.rect(fx, fy + f - 1, f, 1, c.kind === 'striker' ? c.underShade : c.skinShade);
  b.px(fx, fy, palette.ink, 0);
}

function leg(b: PixelBuffer, c: FighterColors, bd: Build, hip: Pt, ankle: Pt, which: 'rear' | 'lead'): void {
  const knee = joint(hip, ankle, bd.thigh, bd.shin, 'forward');
  const cloth = which === 'lead' ? c.legs : c.legsShade;
  limb(b, hip, knee, bd.thighR, cloth);
  limb(b, knee, ankle, bd.shinR, cloth);
  if (which === 'lead' && c.kind === 'brawler') {
    // worn-denim highlight down the front of the thigh
    const k: Pt = [knee[0] + 1, knee[1] - 2];
    limb(b, [hip[0] + 2, hip[1] + 2], k, 0.6, c.legsLight);
  }
  const shoe = which === 'lead' ? c.shoes : c.shoesShade;
  const [ax, ay] = [Math.round(ankle[0]), Math.round(ankle[1])];
  if (c.kind === 'brawler') {
    b.rect(ax - 4, ay - 1, 8, 1, which === 'lead' ? c.legsLight : c.legs); // jeans cuff
    b.rect(ax - 4, ay, 10, 3, shoe);
    b.rect(ax - 4, ay + 3, 11, 1, c.shoesShade);
  } else {
    b.rect(ax - 3, ay - 4, 7, 4, shoe); // boot shaft
    b.rect(ax - 3, ay, 9, 3, shoe);
    b.rect(ax - 3, ay + 3, 10, 1, c.shoesShade);
    b.rect(ax - 3, ay - 2, 7, 1, which === 'lead' ? c.top : c.topShade); // boot strap
  }
}

function head(b: PixelBuffer, c: FighterColors, bd: Build, cx: number, shoulderY: number, p: Pose): void {
  const w = bd.headW;
  const h = bd.headH;
  const neckTop = shoulderY - 4;
  b.rect(cx - Math.floor(bd.neckW / 2), neckTop, bd.neckW, 6, c.skinShade);
  b.rect(cx - Math.floor(bd.neckW / 2) + 2, neckTop, bd.neckW - 2, 5, c.skin);
  const x = cx - Math.floor(w / 2) + 1;
  const y = neckTop - h + 1;
  // face block with rounded corners; the brawler gets a square jaw, the striker a softer chin
  b.rect(x + 1, y, w - 2, h, c.skin);
  b.rect(x, y + 2, w, h - 4, c.skin);
  if (c.kind === 'brawler') {
    b.rect(x + 1, y + h - 3, w - 1, 3, c.skin);
    b.rect(x + 3, y + h - 1, w - 4, 1, c.skinShade);
  } else {
    b.rect(x + 3, y + h - 1, w - 5, 1, c.skinShade);
  }
  b.px(x + w, y + 8, c.skin); // nose
  b.px(x + w, y + 9, c.skinShade);
  // ear
  b.rect(x + 4, y + 6, 2, 4, c.skinShade);
  // hair
  if (c.kind === 'brawler') {
    b.rect(x, y - 1, w, 4, c.hair);
    b.rect(x - 1, y + 1, 5, 6, c.hair);
    b.rect(x + 4, y + 3, 2, 3, c.hair); // sideburn
    for (const [sx, sh] of [
      [1, 2],
      [4, 3],
      [8, 3],
      [11, 2],
    ] as const)
      b.rect(x + sx, y - 1 - sh, 3, sh, c.hair);
    b.rect(x + 5, y - 3, 5, 1, c.hairLight);
    b.rect(x + w - 4, y + 2, 3, 1, c.hair); // fringe
  } else {
    b.rect(x - 1, y - 1, w + 1, 4, c.hair);
    b.rect(x - 2, y + 1, 6, 10, c.hair);
    b.rect(x + w - 6, y + 2, 5, 2, c.hair); // bangs
    b.rect(x + w - 3, y + 4, 2, 1, c.hair);
    b.rect(x + 3, y - 1, 6, 1, c.hairLight);
    b.rect(x + 1, y + 2, 2, 2, c.belt); // hair tie
  }
  // eyes and brows (looking right)
  const ex = x + w - 4;
  const ey = y + 6;
  b.rect(ex - 1, ey - 2, 4, 1, c.kind === 'brawler' ? palette.ink : c.hair);
  if (c.kind === 'brawler') b.px(ex - 2, ey - 1, palette.ink); // heavy, angled brow
  if (p.eyes === 'open') {
    b.rect(ex, ey, 2, 2, palette.ink);
    b.px(ex + 1, ey, palette.white);
    if (c.kind === 'striker') b.px(ex - 1, ey - 1, palette.ink); // lashes
  } else if (p.eyes === 'shut') {
    b.rect(ex - 1, ey + 1, 3, 1, palette.ink);
  } else {
    b.px(ex - 1, ey, palette.ink);
    b.px(ex + 1, ey, palette.ink);
    b.px(ex, ey + 1, palette.ink);
    b.px(ex - 1, ey + 2, palette.ink);
    b.px(ex + 1, ey + 2, palette.ink);
  }
  const my = y + h - 4;
  const lip = c.kind === 'striker' ? 0xd2506e : c.skinShade;
  switch (p.mouth) {
    case 'set':
      b.rect(x + w - 4, my, 3, 1, lip);
      break;
    case 'grin':
      b.rect(x + w - 5, my, 4, 1, palette.ink);
      b.px(x + w - 6, my - 1, palette.ink);
      break;
    case 'shout':
      b.rect(x + w - 4, my - 1, 3, 3, palette.ink);
      b.rect(x + w - 4, my - 1, 3, 1, palette.white);
      break;
    case 'ouch':
      b.rect(x + w - 4, my, 3, 2, palette.ink);
      break;
  }
  if (c.kind === 'brawler') b.rect(x + 7, y + h - 2, 5, 1, c.skinShade); // stubble jaw line
}

/** The striker's high ponytail, drawn first so it sits behind the body. */
function ponytail(b: PixelBuffer, c: FighterColors, cx: number, shoulderY: number, bd: Build, p: Pose): void {
  const tieX = cx - Math.floor(bd.headW / 2) + 2;
  const tieY = shoulderY + p.head[1] - 4 - bd.headH + 4;
  // swings back when hurt, flies out when moving forward
  const swing = p.lean < 0 ? -2 : p.lean > 2 ? 3 : 0;
  const mid: Pt = [tieX - 6, tieY + 5 - swing];
  const end: Pt = [tieX - 9 - Math.abs(swing), tieY + 14 - swing * 2];
  limb(b, [tieX, tieY], mid, 2.6, c.hair);
  limb(b, mid, end, 1.8, c.hair);
  limb(b, [tieX - 1, tieY], lerpPt(mid, end, 0.3), 0.6, c.hairLight);
}

/** Knocked out: lying flat on the floor, head to the left. */
function paintKo(b: PixelBuffer, fx: number, c: FighterColors, bd: Build): void {
  const floor = FIGHTER_FRAME.height - 1;
  const thick = Math.round(bd.shoulderW * 0.5);
  const y = floor - thick;
  const hx = fx + 3;
  // head, face up
  b.rect(hx, y - 3, bd.headH, bd.headW - 2, c.skin);
  b.rect(hx, y - 3, 4, bd.headW - 2, c.hair);
  if (c.kind === 'striker') limb(b, [hx + 1, y + 6], [hx - 1, floor], 2, c.hair);
  for (const ey of [y, y + 5]) {
    b.px(hx + 7, ey, palette.ink);
    b.px(hx + 9, ey, palette.ink);
    b.px(hx + 8, ey + 1, palette.ink);
    b.px(hx + 7, ey + 2, palette.ink);
    b.px(hx + 9, ey + 2, palette.ink);
  }
  // torso
  const tx = hx + bd.headH;
  b.rect(tx, y, bd.torsoH + 2, thick + 1, c.top);
  b.rect(tx, y + thick - 2, bd.torsoH + 2, 3, c.topShade);
  if (c.kind === 'brawler') b.rect(tx + 1, y + 1, bd.torsoH, Math.round(thick / 2), c.under);
  else b.rect(tx + 2, y, 2, thick, c.under);
  b.rect(tx + bd.torsoH + 2, y, 3, thick + 1, c.belt);
  // legs and shoes
  const lx = tx + bd.torsoH + 5;
  const legLen = bd.thigh + bd.shin - 2;
  b.rect(lx, y + 1, legLen, Math.round(thick * 0.45), c.legs);
  b.rect(lx, y + Math.round(thick * 0.5) + 1, legLen, Math.round(thick * 0.45), c.legsShade);
  b.rect(lx + legLen, y - 2, 3, thick + 2, c.shoes);
  // arm flopped over the chest
  b.rect(tx + 4, y - 3, 9, 3, c.kind === 'brawler' ? c.top : c.skin);
  b.rect(tx + 12, y - 4, bd.fist, bd.fist - 1, c.kind === 'brawler' ? c.skin : c.under);
}
