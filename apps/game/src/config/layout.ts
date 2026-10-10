// Fixed pixel geometry of the arcade cabinet (native pixels, decided 2026-10-10).
export const CABINET = { width: 270, height: 472 } as const;

/** The monitor inside the cabinet: every monitor scene draws in this 216 x 288 space. */
export const MONITOR = { x: 27, y: 44, width: 216, height: 288 } as const;

export const MARQUEE = { y: 0, height: 32 } as const;

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
  floorY: 232,
  horizonY: 150,
  fighterX: { p1: 84, p2: 132 },
} as const;
