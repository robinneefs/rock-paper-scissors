import { BUTTONS, CABINET, JOYSTICK, MARQUEE, MONITOR, PANEL } from '../../config/layout';
import { moveColors, palette } from '../../config/palette';
import { drawSymbol, lighten, symbolTones } from './icons';
import { PixelBuffer, shade } from './PixelBuffer';

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
  const mx = 8;
  const my = MARQUEE.y + 3;
  const mw = W - 16;
  const mh = 98;
  b.rect(mx, my, mw, mh, 0x181028);
  b.rect(mx, my, mw, 1, 0x3a2a5c); // highlight top and left
  b.rect(mx, my, 1, mh, 0x3a2a5c);
  b.rect(mx, my + mh - 1, mw, 1, 0x0b0716); // shade bottom and right
  b.rect(mx + mw - 1, my, 1, mh, 0x0b0716);
  const n = { x: mx + 4, y: my + 4, w: mw - 8, h: mh - 8 }; // neon loop, halfway into the bezel
  b.frame(n.x, n.y, n.w, n.h, palette.pink);
  b.frame(n.x + 1, n.y + 1, n.w - 2, n.h - 2, 0x5a1450);
  b.rect(art.x - 1, MARQUEE.y + art.y - 1, art.width + 2, art.height + 2, palette.black);

  // monitor bezel (the monitor scenes draw inside it)
  b.rect(15, MARQUEE.height, MONITOR.width + 24, MONITOR.height + 24, 0x0b0716);
  b.rect(MONITOR.x - 3, MONITOR.y - 3, MONITOR.width + 6, MONITOR.height + 6, 0x181028);
  b.rect(MONITOR.x, MONITOR.y, MONITOR.width, MONITOR.height, palette.black);

  // control panel
  b.rect(0, PANEL.y, W, PANEL.height, PANEL_TOP);
  b.rect(0, PANEL.y, W, 2, PANEL_EDGE);
  [palette.pink, palette.gold, palette.cyan].forEach((c, i) => b.rect(8, PANEL.y + 98 + i * 5, W - 16, 2, c));
  b.rect(0, PANEL.y + 116, W, 12, BODY_DARK);
  b.rect(0, PANEL.y + 116, W, 1, PANEL_EDGE);

  // joystick base (the stick and ball are drawn live by JoystickView)
  b.ell(JOYSTICK.x, JOYSTICK.y + 4, 20, 12, 0x140a28);
  b.ell(JOYSTICK.x, JOYSTICK.y + 2, 17, 10, 0x241642);
  b.ell(JOYSTICK.x, JOYSTICK.y + 2, 6, 3, 0x0c0618);

  // button wells, labels and key hints
  (['rock', 'paper', 'scissors'] as const).forEach((m, i) => {
    const x = BUTTONS.x[m];
    b.ell(x, BUTTONS.y + 9, 25, 16, 0x120822);
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
  /** up; pressed down; lit (the locked-in move); dim (another move is locked in); flash (lock-in flash). */
  states: ['up', 'down', 'lit', 'dim', 'flash'] as const,
};
export type ButtonState = (typeof BUTTON_FRAME.states)[number];

/** How far the top travels when pressed, and how much side shows when it is up. */
const TRAVEL = { upSide: 7, downSide: 1 };

/** One frame per move and state, in the flat style of the round 3 mock-ups: dark rim, flat top, white icon. */
export function paintButtons(): PixelBuffer {
  const { width: fw, height: fh, states } = BUTTON_FRAME;
  const moves = ['rock', 'paper', 'scissors'] as const;
  const b = new PixelBuffer(fw * states.length, fh * moves.length);
  moves.forEach((m, row) => {
    const { main, shade: dark } = moveColors[m];
    states.forEach((state, i) => {
      const cx = i * fw + BUTTON_FRAME.topX;
      const base = row * fh + BUTTON_FRAME.topY;
      const pressed = state !== 'up' && state !== 'dim';
      const dim = state === 'dim';
      const side = pressed ? TRAVEL.downSide : TRAVEL.upSide;
      const top = base + TRAVEL.upSide - side;
      const k = dim ? 0.4 : 1;
      // dark rim, then the side, then the flat top with a thin shade ring and a highlight
      b.ell(cx, top + side + 1, 23, 16, palette.ink);
      for (let s = side; s >= 0; s--) b.ell(cx, top + s, 22, 15, shade(dark, 0.75 * k));
      b.ell(cx, top, 23, 16, palette.ink);
      if (state === 'flash') {
        b.ell(cx, top, 22, 15, palette.white);
        drawSymbol(b, m, cx - 11, top - 8, { white: main, outline: dark, tint: main, detail: dark });
        return;
      }
      const lit = state === 'lit';
      b.ell(cx, top, 22, 15, dim ? shade(dark, 0.45) : lit ? lighten(main, 0.7) : dark);
      b.ell(cx, top - 1, 21, 14, dim ? shade(main, 0.4) : lit ? lighten(main, 0.12) : main);
      if (!dim) b.ell(cx - 10, top - 9, 5, 2, lighten(main, lit ? 0.85 : 0.6));
      drawSymbol(b, m, cx - 11, top - 9, symbolTones(m, dim));
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
