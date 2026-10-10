import type Phaser from 'phaser';

/**
 * Screen shake in whole pixels: the camera jumps between integer offsets that shrink to nothing.
 * Only the monitor camera shakes; the cabinet stays put.
 */
export function shake(
  scene: Phaser.Scene,
  cam: Phaser.Cameras.Scene2D.Camera,
  amplitudePx: number,
  durationMs: number,
): void {
  if (amplitudePx <= 0) return;
  const start = scene.time.now;
  const step = scene.time.addEvent({
    delay: 33,
    loop: true,
    callback: () => {
      const t = (scene.time.now - start) / durationMs;
      if (t >= 1) {
        cam.setScroll(0, 0);
        step.remove();
        return;
      }
      const a = Math.max(1, Math.round(amplitudePx * (1 - t)));
      cam.setScroll(Math.round((Math.random() * 2 - 1) * a), Math.round((Math.random() * 2 - 1) * a));
    },
  });
}
