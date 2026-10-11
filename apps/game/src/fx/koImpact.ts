import type Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';

/**
 * The K.O. hit: the screen freezes on a white frame, then the scene plays in slow motion for a
 * moment. Timed in real milliseconds (the scene's own clock is the thing being slowed), and
 * always restores full speed, also when the scene ends early.
 */
export function koImpact(
  scene: Phaser.Scene,
  o: { freezeMs: number; flashAlpha: number; slowScale: number; slowMs: number },
): void {
  const white = scene.add
    .rectangle(0, 0, MONITOR.width, MONITOR.height, palette.white, o.flashAlpha)
    .setOrigin(0)
    .setDepth(100);
  const speed = (s: number) => {
    scene.time.timeScale = s;
    scene.tweens.timeScale = s;
  };
  const timers: ReturnType<typeof setTimeout>[] = [];
  const done = () => {
    timers.forEach(clearTimeout);
    speed(1);
    white.destroy();
  };
  speed(0);
  timers.push(
    setTimeout(() => {
      white.setVisible(false);
      speed(o.slowScale);
    }, o.freezeMs),
    setTimeout(done, o.freezeMs + o.slowMs),
  );
  scene.events.once('shutdown', done);
}
