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
  /**
   * HUD. Timer: the first second is drawn at font size timerBaseSize, and each next second
   * timerGrowPerTick sizes bigger and timerDriftPx lower (towards the middle). Gold from
   * timerWarnMs (the ticks start there too), red, shaking and tilting by timerTiltDeg from
   * timerRedMs (harder in the last second). Each new second pops one size up for timerPopMs.
   * At 0 a red 0 drops timerSlamDropPx and slams down in timerSlamMs, then holds timerSlamHoldMs.
   */
  hud: {
    drainMs: 600,
    trailDelayMs: 120,
    lowHealth: 15,
    timerWarnMs: 3000,
    timerRedMs: 2000,
    timerBaseSize: 4,
    timerGrowPerTick: 1,
    timerDriftPx: 9,
    timerTiltDeg: 4,
    timerPopMs: 90,
    timerShakePx: 1,
    timerShakeEveryMs: 40,
    timerSlamDropPx: 10,
    timerSlamMs: 160,
    timerSlamHoldMs: 450,
  },
  /**
   * Cabinet buttons. releaseMs: how long a quick tap stays down. Lock-in: the chosen button flashes
   * white `lockFlashes` times (`lockFlashMs` per flash and gap) while a ring pops out round it,
   * one ring frame every `ringFrameMs`.
   */
  buttons: { pressDepthPx: 6, releaseMs: 80, lockFlashes: 2, lockFlashMs: 45, ringFrameMs: 45 },
  joystick: { springBackMs: 90, tiltPx: { x: 9, y: 6 }, dragDeadzonePx: 6 },
  idle: { breatheEveryMs: 420 },
  intro: { fadeInMs: 500, holdMs: 1500, fadeOutMs: 500, fadeSteps: 4 },
  transitions: { wipeMs: 240, bandPx: 8 },
  menu: { cursorBlinkMs: 400, repeatDelayMs: 300 },
  banner: { slamMs: 180, holdMs: 900 },
  result: { delayAfterMatchMs: 400 },
  /** Online: how long "RIVAL LEFT" and other ending messages stay up before going home; lobby text blink. */
  online: { endedHoldMs: 2500, waitBlinkMs: 500 },
} as const;
