import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

/**
 * Studio logo intro: fades in, holds, fades out, then the home screen. Any button or tap skips it.
 * The fade steps through a few darkened levels (pixel perfect), never a smooth alpha blend.
 * The image is assets/logo.png: replacing that file is the whole logo swap.
 */
export class LogoScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.logo);
  }

  create(): void {
    const { flow, input } = getContext(this);
    useMonitorCamera(this).setBackgroundColor(palette.black);
    const logo = this.add.image(MONITOR.width / 2, MONITOR.height / 2, Tex.logo);
    logo.setPosition(Math.round(logo.x - (logo.width % 2) / 2), Math.round(logo.y - (logo.height % 2) / 2));

    const { fadeInMs, holdMs, fadeOutMs, fadeSteps } = tuning.intro;
    const setLevel = (level: number) => {
      const v = Math.round((255 * level) / fadeSteps);
      logo.setVisible(level > 0).setTint(Phaser.Display.Color.GetColor(v, v, v));
    };
    setLevel(0);
    const timeline: [number, number][] = [];
    for (let s = 1; s <= fadeSteps; s++) timeline.push([(fadeInMs * s) / fadeSteps, s]);
    for (let s = 1; s <= fadeSteps; s++)
      timeline.push([fadeInMs + holdMs + (fadeOutMs * s) / fadeSteps, fadeSteps - s]);
    for (const [at, level] of timeline) this.time.delayedCall(at, () => setLevel(level));

    let left = false;
    const leave = () => {
      if (left) return;
      left = true;
      flow.toHome();
    };
    this.time.delayedCall(fadeInMs + holdMs + fadeOutMs + 100, leave);
    const off = input.on('action', leave);
    this.input.once('pointerdown', leave);
    this.events.once('shutdown', off);
  }
}
