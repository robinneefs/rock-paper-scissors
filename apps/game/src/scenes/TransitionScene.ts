import Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

/** Pixel wipe over the monitor between screens: black bands close, the screen swaps, they open. */
export class TransitionScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super(SceneKey.transition);
  }

  create(): void {
    useMonitorCamera(this);
    this.gfx = this.add.graphics();
  }

  wipe(swap: () => void, done: () => void): void {
    const { wipeMs, bandPx } = tuning.transitions;
    const steps = Math.ceil(MONITOR.height / bandPx);
    const stepMs = wipeMs / 2 / steps;
    let i = 0;
    const draw = (covered: number, fromTop: boolean) => {
      const h = Math.min(MONITOR.height, covered * bandPx);
      this.gfx
        .clear()
        .fillStyle(palette.black)
        .fillRect(0, fromTop ? 0 : MONITOR.height - h, MONITOR.width, h);
    };
    this.time.addEvent({
      delay: stepMs,
      repeat: steps * 2,
      callback: () => {
        i++;
        if (i <= steps) draw(i, true);
        if (i === steps) swap();
        if (i > steps) draw(steps * 2 - i, false);
        if (i === steps * 2 + 1) {
          this.gfx.clear();
          done();
        }
      },
    });
  }
}
