// Every number that changes how the game *feels*. Changing these never changes who wins
// (rules and phase timings live in packages/core/src/config.ts). A magic number in a view is a bug.
export const tuning = {
  reveal: {
    /** Icons drop in above the fighters' heads. */
    iconDropMs: 320,
    iconDropFromPx: 28,
    iconBouncePx: 4,
    /** Fighters swing into their move at this point of the reveal... */
    strikeAtMs: 420,
    /** ...and the hit lands here. */
    impactAtMs: 620,
    /** Back to idle (the reveal phase itself is timed by the referee). */
    recoverAtMs: 1400,
    lungePx: 4,
  },
  hitPause: { byDamage: { 10: 50, 15: 70, 20: 90 } as Record<number, number> },
  shake: { byDamage: { 10: 2, 15: 3, 20: 4 } as Record<number, number>, durationMs: 280, koPx: 5 },
  flash: { frames: 2, frameMs: 33 },
  hud: { drainMs: 600, trailDelayMs: 120, lowHealth: 30, timerWarnMs: 3000 },
  buttons: { pressDepthPx: 5, releaseMs: 80 },
  joystick: { springBackMs: 90, tiltPx: { x: 9, y: 6 }, dragDeadzonePx: 6 },
  idle: { breatheEveryMs: 420 },
  intro: { fadeInMs: 500, holdMs: 1500, fadeOutMs: 500, fadeSteps: 4 },
  transitions: { wipeMs: 240, bandPx: 8 },
  menu: { cursorBlinkMs: 400, repeatDelayMs: 300 },
  banner: { slamMs: 180, holdMs: 900 },
  result: { delayAfterMatchMs: 400 },
} as const;
