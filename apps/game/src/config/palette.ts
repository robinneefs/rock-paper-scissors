// One shared palette for all placeholder art and UI (pixel-perfect rule 6).
// Real art should come from the same colours; tools can check exported images against it.
export const palette = {
  ink: 0x1a0f2e,
  black: 0x07040f,
  white: 0xffffff,
  text: 0xf6f0ff,
  dim: 0x6e6096,
  lilac: 0xc9b8ff,
  pink: 0xff2fbf,
  cyan: 0x3ff0ff,
  gold: 0xffb321,
  red: 0xff3b6b,
  shadow: 0x5a0b4a,
  panel: 0x140a2a,
  panelEdge: 0x4a2f86,
  select: 0x3a1458,
  hpGreen: 0x5cff7a,
  hpYellow: 0xffd94a,
  hpRed: 0xff3b6b,
  hpBack: 0x2a1648,
  hpTrail: 0xffffff,
  room: 0x0b0716,
  roomLine: 0x150d2a,
} as const;

/** Colour per move: cabinet buttons, move icons and labels. */
export const moveColors = {
  rock: { main: 0xff3b6b, shade: 0xb01846 },
  paper: { main: 0xffb321, shade: 0xc46c14 },
  scissors: { main: 0x3ff0ff, shade: 0x1496be },
} as const;

/** Fighter placeholder colours (p1 white gi + red band, p2 blue gi + gold band). */
export const fighterColors = {
  p1: {
    gi: 0xf2ecff,
    giShade: 0xa99bd6,
    band: 0xff3b6b,
    belt: 0x241c3a,
    skin: 0xffcf9e,
    skinShade: 0xe09a6e,
    hair: 0x2d2452,
  },
  p2: {
    gi: 0x4a4aaa,
    giShade: 0x2c286c,
    band: 0xffcf4a,
    belt: 0xffcf4a,
    skin: 0xecaa78,
    skinShade: 0xb8704a,
    hair: 0x1e1628,
  },
} as const;

export const css = (color: number): string => '#' + color.toString(16).padStart(6, '0');
