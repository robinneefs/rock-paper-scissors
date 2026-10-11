import { BUTTONS, CABINET, JOYSTICK, MARQUEE, MONITOR, PANEL } from '../../config/layout';
import { moveColors, palette } from '../../config/palette';
import { drawSymbol, lighten, symbolTones } from './icons';
import { PixelBuffer, shade, type RGB } from './PixelBuffer';

const BODY = 0x2c1658;
const BODY_DARK = 0x1c0c3c;
const PANEL_TOP = 0x3a2070;
const PANEL_EDGE = 0x5a38a0;

/** The arcade room around the cabinet: one 32x32 tile, repeated. */
export function paintRoomTile(): PixelBuffer {
  const b = new PixelBuffer(32, 32);
  b.rect(0, 0, 32, 32, palette.room);
  for (let i = 0; i < 32; i += 8) {
    b.px(i + 2, (i * 3) % 32, palette.roomLine);
    b.px((i * 5 + 13) % 32, i + 4, palette.roomLine);
  }
  b.rect(0, 31, 32, 1, palette.roomLine);
  return b;
}

const MARQUEE_BEZEL = { mx: 8, my: MARQUEE.y + 3, mw: CABINET.width - 16, mh: 98 };
/** The neon loop round the marquee art, halfway into its bezel (CabinetScene flickers it). */
export const MARQUEE_NEON = {
  x: MARQUEE_BEZEL.mx + 4,
  y: MARQUEE_BEZEL.my + 4,
  w: MARQUEE_BEZEL.mw - 8,
  h: MARQUEE_BEZEL.mh - 8,
};
/** The neon tube's colour when it is off; its inner line is always this. */
export const NEON_OFF = 0x5a1450;

/** Cabinet body, marquee, monitor bezel and control panel. Buttons and joystick are separate sprites. */
export function paintCabinet(): PixelBuffer {
  const W = CABINET.width;
  const b = new PixelBuffer(W, CABINET.height);
  b.rect(0, 0, W, CABINET.height, BODY);
  b.rect(0, 0, 6, CABINET.height, BODY_DARK);
  b.rect(W - 6, 0, 6, CABINET.height, BODY_DARK);
  b.rect(2, 0, 1, CABINET.height, palette.pink);
  b.rect(W - 3, 0, 1, CABINET.height, palette.pink);

  // marquee: a bezel all around the art window, with a neon strip running round it;
  // CabinetScene puts assets/marquee.png in the window
  const art = MARQUEE.art;
  const { mx, my, mw, mh } = MARQUEE_BEZEL;
  b.rect(mx, my, mw, mh, 0x181028);
  b.rect(mx, my, mw, 1, 0x3a2a5c); // highlight top and left
  b.rect(mx, my, 1, mh, 0x3a2a5c);
  b.rect(mx, my + mh - 1, mw, 1, 0x0b0716); // shade bottom and right
  b.rect(mx + mw - 1, my, 1, mh, 0x0b0716);
  const n = MARQUEE_NEON;
  b.frame(n.x, n.y, n.w, n.h, palette.pink);
  b.frame(n.x + 1, n.y + 1, n.w - 2, n.h - 2, NEON_OFF);
  b.rect(art.x - 1, MARQUEE.y + art.y - 1, art.width + 2, art.height + 2, palette.black);

  // monitor bezel (the monitor scenes draw inside it)
  b.rect(15, MARQUEE.height, MONITOR.width + 24, MONITOR.height + 24, 0x0b0716);
  b.rect(MONITOR.x - 3, MONITOR.y - 3, MONITOR.width + 6, MONITOR.height + 6, 0x181028);
  b.rect(MONITOR.x, MONITOR.y, MONITOR.width, MONITOR.height, palette.black);

  // control panel: a slanted top that catches light at the back, bevelled sides, a raised
  // front lip with a pink trim strip, and a dark front face that drops away below it
  const P = PANEL.y;
  const lip = P + 108; // where the slanted top meets the front lip
  b.rect(0, P - 3, W, 3, BODY_DARK); // shadow cast by the monitor bezel onto the panel
  b.rect(0, P, W, lip - P, PANEL_TOP);
  // light falls on the back of the slope and fades towards the player: bands of the panel colour,
  // each dithered into the next so the slope reads as one tilted surface
  const bands = [
    { y: P + 2, f: 1.5 },
    { y: P + 6, f: 1.32 },
    { y: P + 12, f: 1.16 },
    { y: P + 22, f: 1 },
    { y: lip - 30, f: 0.88 },
    { y: lip - 14, f: 0.76 },
  ];
  bands.forEach((band, i) => {
    const end = bands[i + 1]?.y ?? lip;
    const c = shade(PANEL_TOP, band.f);
    b.rect(0, band.y, W, end - band.y, c);
    if (i > 0) for (let x = 0; x < W; x += 2) b.px(x + (band.y % 2), band.y - 1, c);
  });
  b.rect(0, P, W, 1, shade(PANEL_EDGE, 1.6)); // back edge highlight
  b.rect(0, P + 1, W, 1, shade(PANEL_EDGE, 1.25));
  // bevelled sides: darker faces that widen towards the front
  for (let y = P; y < lip; y++) {
    const w = 3 + Math.floor(((y - P) * 5) / (lip - P));
    b.rect(0, y, w, 1, BODY_DARK);
    b.rect(W - w, y, w, 1, BODY_DARK);
    b.px(w, y, shade(PANEL_TOP, 0.7));
    b.px(W - w - 1, y, shade(PANEL_TOP, 0.7));
  }
  // corner bolts
  for (const [x, y] of [
    [14, P + 7],
    [W - 15, P + 7],
    [14, lip - 8],
    [W - 15, lip - 8],
  ] as const) {
    b.rect(x - 1, y - 1, 3, 3, BODY_DARK);
    b.px(x, y, shade(PANEL_EDGE, 1.5));
  }
  // decorative stripes on the slope
  [palette.pink, palette.gold, palette.cyan].forEach((c, i) => b.rect(24, P + 92 + i * 4, W - 48, 2, c));
  // raised front lip with a trim strip, then the front face in shadow
  b.rect(0, lip - 1, W, 1, shade(PANEL_TOP, 0.6)); // crease where the slope meets the lip
  b.rect(0, lip, W, 1, shade(PANEL_EDGE, 1.6));
  b.rect(0, lip + 1, W, 3, palette.pink);
  b.rect(0, lip + 1, W, 1, lighten(palette.pink, 0.45));
  b.rect(0, lip + 4, W, 1, palette.shadow);
  b.rect(0, lip + 5, W, CABINET.height - lip - 5, BODY_DARK);
  b.rect(0, lip + 5, W, 2, palette.ink);
  for (let x = 0; x < W; x += 2) b.px(x, CABINET.height - 6, palette.ink);
  b.rect(0, CABINET.height - 5, W, 5, palette.ink);

  // joystick base (the stick and ball are drawn live by JoystickView)
  b.ell(JOYSTICK.x, JOYSTICK.y + 5, 21, 13, shade(PANEL_TOP, 1.25));
  b.ell(JOYSTICK.x, JOYSTICK.y + 4, 20, 12, 0x140a28);
  b.ell(JOYSTICK.x, JOYSTICK.y + 2, 17, 10, 0x241642);
  b.ell(JOYSTICK.x, JOYSTICK.y + 2, 6, 3, 0x0c0618);

  // button wells with a chrome collar (light at the back, dark at the front), labels and key hints
  (['rock', 'paper', 'scissors'] as const).forEach((m, i) => {
    const x = BUTTONS.x[m];
    b.ell(x, BUTTONS.y + 11, 27, 17, palette.ink);
    b.ell(x, BUTTONS.y + 10, 27, 17, 0x56507a);
    b.ell(x, BUTTONS.y + 9, 26, 16, 0xc8c4e0);
    b.ell(x, BUTTONS.y + 10, 26, 16, 0x8e88b4);
    b.rect(x - 14, BUTTONS.y - 7, 5, 1, palette.white); // chrome glint
    b.ell(x, BUTTONS.y + 9, 24, 15, 0x120822);
    b.text(m, x, BUTTONS.y + 26, moveColors[m].main, { center: true, shadow: palette.ink });
    b.text(String(i + 1), x + 20, BUTTONS.y - 16, palette.lilac);
  });
  return b;
}

/** Frames are 52x44; the button top's centre sits at (26, 16) in each frame. */
export const BUTTON_FRAME = {
  width: 52,
  height: 44,
  topX: 26,
  topY: 16,
  /**
   * up; pressed down; lit (the locked-in move); dim (another move is locked in); flash (lock-in
   * flash); hover (pointer over it); shine0..2 (a glint sweeping across the cap).
   */
  states: ['up', 'down', 'lit', 'dim', 'flash', 'hover', 'shine0', 'shine1', 'shine2'] as const,
};
export type ButtonState = (typeof BUTTON_FRAME.states)[number];
export const BUTTON_SHINE_FRAMES = 3;

/** How far the top travels when pressed, and how much side shows when it is up. */
const TRAVEL = { upSide: 7, downSide: 1 };

/**
 * Fills an ellipse pixel by pixel, asking `color` for each one with its position inside the
 * ellipse: nx, ny from -1 to 1, and r, the distance from the centre (1 = the edge).
 */
function shadedEll(
  b: PixelBuffer,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: (nx: number, ny: number, r: number) => RGB | null,
): void {
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + 0.5)) ** 2)));
    for (let x = -w; x <= w; x++) {
      const nx = x / (rx + 0.5);
      const ny = y / (ry + 0.5);
      const c = color(nx, ny, Math.sqrt(nx * nx + ny * ny));
      if (c !== null) b.px(cx + x, cy + y, c);
    }
  }
}

/**
 * One frame per move and state, in the flat style of the round 3 mock-ups, shaded like a real
 * arcade button: a round side lit from the left, a cap with a raised rim that catches the light
 * at the back and a shallow dish inside, a hard glint top-left, and an embossed white icon.
 */
export function paintButtons(): PixelBuffer {
  const { width: fw, height: fh, states } = BUTTON_FRAME;
  const moves = ['rock', 'paper', 'scissors'] as const;
  const b = new PixelBuffer(fw * states.length, fh * moves.length);
  moves.forEach((m, row) => {
    const { main, shade: dark } = moveColors[m];
    states.forEach((state, i) => {
      const cx = i * fw + BUTTON_FRAME.topX;
      const base = row * fh + BUTTON_FRAME.topY;
      const pressed = state === 'down' || state === 'lit' || state === 'flash';
      const dim = state === 'dim';
      const lit = state === 'lit';
      const side = pressed ? TRAVEL.downSide : TRAVEL.upSide;
      const top = base + TRAVEL.upSide - side;
      // how bright the cap is: dimmed, pushed into the shadow of the well, lit up, or hovered
      const k = dim ? 0.42 : state === 'down' ? 0.86 : 1;
      const up = lit ? 0.35 : state === 'hover' ? 0.12 : 0;
      const tone = (c: RGB, f = 0) => lighten(shade(c, k), Math.min(1, up + f));

      // dark rim, then the side: a cylinder, light on the left, dark on the right
      b.ell(cx, top + side + 1, 23, 16, palette.ink);
      for (let s = side; s >= 0; s--)
        shadedEll(b, cx, top + s, 22, 15, (nx) =>
          nx < -0.55 ? tone(dark, 0.12) : nx < 0.35 ? tone(shade(dark, 0.85)) : tone(shade(dark, 0.65)),
        );
      if (side > 1) b.rect(cx - 15, top + 13, 3, side, tone(dark, 0.3)); // a soft sheen down the side
      b.ell(cx, top, 23, 16, palette.ink);

      if (state === 'flash') {
        b.ell(cx, top, 22, 15, palette.white);
        drawSymbol(b, m, cx - 11, top - 8, { white: main, outline: dark, tint: main, detail: dark });
        return;
      }
      // the cap: a rim band, light at the back and dark at the front, round a shallow dish
      shadedEll(b, cx, top, 22, 15, (nx, ny, r) => {
        if (r > 0.84) return ny < -0.1 ? tone(main, 0.3) : ny < 0.6 ? tone(main) : tone(dark);
        return r > 0.76 && ny < -0.2 ? tone(shade(main, 0.88)) : tone(main); // the rim's shadow in the dish
      });
      if (!dim) {
        // hard glint on the rim, top-left
        const glint = lighten(main, 0.85);
        b.rect(cx - 13, top - 13, 5, 1, glint);
        b.rect(cx - 16, top - 12, 3, 1, glint);
        b.px(cx - 18, top - 11, glint);
        b.px(cx - 7, top - 13, lighten(main, 0.5));
      }
      const shine = state.startsWith('shine') ? Number(state.slice(5)) : -1;
      if (shine >= 0) {
        // a diagonal band of light crossing the cap, left to right over the frames
        const at = -14 + shine * 14;
        shadedEll(b, cx, top, 21, 14, (nx, ny) => {
          const d = nx * 21 + ny * 8 - at;
          return d >= 0 && d < 7 ? lighten(main, d < 3 ? 0.75 : 0.45) : null;
        });
      }
      // the icon, embossed: its dark silhouette one pixel down and right, then the icon
      const ix = cx - 11;
      const iy = top - 9;
      const ink = dim ? shade(dark, 0.3) : shade(dark, lit ? 0.75 : 0.6);
      drawSymbol(b, m, ix + 1, iy + 1, { white: ink, outline: ink, tint: ink, detail: ink });
      drawSymbol(b, m, ix, iy, symbolTones(m, dim));
    });
  });
  return b;
}

/** The ring that pops out round a button when its move is locked in: frames 0..2, growing. */
export const BUTTON_RING = { width: 72, height: 52, cx: 36, cy: 26, frames: 3 };

export function paintButtonRings(): PixelBuffer {
  const { width: w, height: h, cx, cy, frames } = BUTTON_RING;
  const moves = ['rock', 'paper', 'scissors'] as const;
  const b = new PixelBuffer(w * frames, h * moves.length);
  moves.forEach((m, row) => {
    for (let f = 0; f < frames; f++) {
      const ring = new PixelBuffer(w, h);
      const rx = 26 + f * 4;
      const ry = 18 + f * 3;
      ring.ell(cx, cy, rx, ry, palette.white);
      const hole = new PixelBuffer(w, h);
      hole.ell(cx, cy, rx - (f === 0 ? 2 : 1), ry - (f === 0 ? 2 : 1), palette.white);
      const color = f === frames - 1 ? moveColors[m].main : lighten(moveColors[m].main, 0.5);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
          if (ring.isSet(x, y) && !hole.isSet(x, y)) b.px(f * w + x, row * h + y, color);
    }
  });
  return b;
}

/** The joystick's ball top. */
export function paintJoystickBall(): PixelBuffer {
  const b = new PixelBuffer(24, 22);
  b.ell(12, 11, 11, 10, 0x96143c);
  b.ell(11, 10, 10, 9, 0xe6285a);
  b.ell(9, 7, 4, 3, 0xff96b4);
  b.rect(7, 5, 2, 1, palette.white);
  return b;
}
