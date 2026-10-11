import Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

/**
 * Between screens the monitor switches off and on like an old CRT: black closes in from the top
 * and bottom to a bright line across the middle, the line shrinks to a dot and goes out, the
 * screen swaps, then it all plays backwards to switch back on. Steps in whole pixels.
 */
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
    const { closeMs, lineMs, offMs, stepMs } = tuning.transitions;
    const W = MONITOR.width;
    const H = MONITOR.height;
    const mid = Math.floor(H / 2);
    // one frame of the switch-off: t runs 0..1 over closing, then 0..1 over the line shrinking
    const closing = (t: number) => {
      const open = Math.max(2, Math.round((H / 2) * (1 - t)));
      this.gfx
        .clear()
        .fillStyle(palette.black)
        .fillRect(0, 0, W, mid - open)
        .fillRect(0, mid + open, W, H - mid - open);
      if (t > 0.6) this.gfx.fillStyle(palette.white, (t - 0.6) / 0.4).fillRect(0, mid - open, W, open * 2);
    };
    const shrinking = (t: number) => {
      const half = Math.max(1, Math.round((W / 2) * (1 - t) ** 2));
      this.gfx
        .clear()
        .fillStyle(palette.black)
        .fillRect(0, 0, W, H)
        .fillStyle(palette.white)
        .fillRect(Math.floor(W / 2) - half, mid - 1, half * 2, 2);
    };
    const black = () => this.gfx.clear().fillStyle(palette.black).fillRect(0, 0, W, H);

    // the whole sequence as frames: [draw, duration of its part]
    const frames: (() => void)[] = [];
    const part = (ms: number, draw: (t: number) => void) => {
      const n = Math.max(1, Math.round(ms / stepMs));
      for (let i = 1; i <= n; i++) frames.push(() => draw(i / n));
    };
    part(closeMs, closing);
    part(lineMs, shrinking);
    part(offMs, black);
    const swapAt = frames.length;
    part(lineMs, (t) => shrinking(1 - t));
    part(closeMs, (t) => closing(1 - t));

    // a repeating timer catches up on missed steps if frames run slow, so the swap is never late
    let i = 0;
    frames[i++]!();
    this.time.addEvent({
      delay: stepMs,
      repeat: frames.length - 1,
      callback: () => {
        if (i === swapAt) swap();
        if (i < frames.length) frames[i]!();
        else {
          this.gfx.clear();
          done();
        }
        i++;
      },
    });
  }
}
