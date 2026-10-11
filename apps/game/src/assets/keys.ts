// Every texture key in one typed place, so a typo is a compile error instead of a missing sprite.
// Placeholder art is generated under these keys at boot (assets/placeholders/); real sprite sheets
// loaded under the same keys replace it without touching any view.
export const Tex = {
  logo: 'logo',
  marquee: 'marquee',
  room: 'room',
  cabinet: 'cabinet',
  stage: 'stage',
  fighterP1: 'fighter-p1',
  fighterP2: 'fighter-p2',
  icons: 'move-icons',
  buttons: 'cabinet-buttons',
  joystickBall: 'joystick-ball',
  dither: 'dither',
} as const;

/** Frames every fighter sheet provides (64 px tall fighters, facing right). */
export const FighterFrames = ['idle0', 'idle1', 'rock', 'paper', 'scissors', 'hurt', 'ko', 'win'] as const;
export type FighterFrame = (typeof FighterFrames)[number];

/** Pixel font sizes: 5x7 glyphs drawn at whole multiples (pixel-perfect rule 5). */
export const Fonts = { s1: 'pixfont-1', s2: 'pixfont-2', s3: 'pixfont-3', s4: 'pixfont-4' } as const;
export type FontSize = 1 | 2 | 3 | 4;
export const fontKey = (size: FontSize): string => Fonts[`s${size}`];
