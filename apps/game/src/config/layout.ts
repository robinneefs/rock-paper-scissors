// Fixed pixel geometry of the arcade cabinet (native pixels, decided 2026-10-10).
export const CABINET = { width: 270, height: 472 } as const;

/**
 * The monitor inside the cabinet: every monitor scene draws in this 216 x 216 space.
 * Experiment (rebrand branch): square screen; the 72 px it gives up went to the marquee above it.
 */
export const MONITOR = { x: 27, y: 116, width: 216, height: 216 } as const;

/** The marquee band at the top of the cabinet: its art (assets/marquee.png) sits in `art`, with a bezel above and below. */
export const MARQUEE = { y: 0, height: 104, art: { x: 8, y: 13, width: 254, height: 78 } } as const;

export const PANEL = { y: 344, height: 128 } as const;

/** Cabinet buttons (centre x) and joystick on the control panel, in cabinet pixels. */
export const BUTTONS = {
  y: PANEL.y + 50,
  x: { attack: 112, throw: 170, block: 228 },
  radius: { x: 22, y: 15 },
} as const;

export const JOYSTICK = { x: 44, y: PANEL.y + 58 } as const;

/** Where the fighters stand on the monitor. */
export const STAGE = {
  floorY: 180,
  horizonY: 110,
  fighterX: { p1: 84, p2: 132 },
} as const;
