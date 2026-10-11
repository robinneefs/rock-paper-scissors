import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MARQUEE } from '../config/layout';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import type { CabinetShake } from '../fx/cabinetShake';
import type { ScreenLayout } from '../platform/PixelScaler';
import { ButtonsView } from '../views/ButtonsView';
import { JoystickView } from '../views/JoystickView';
import { getContext } from './context';
import { SceneKey } from './keys';

/** Always running, underneath everything: the arcade room, the cabinet, its buttons and joystick. */
export class CabinetScene extends Phaser.Scene {
  private shake!: CabinetShake;

  constructor() {
    super(SceneKey.cabinet);
  }

  create(): void {
    const { input, scaler, lights, cabinetShake } = getContext(this);
    this.shake = cabinetShake;
    const room = this.add.tileSprite(0, 0, scaler.layout.width, scaler.layout.height, Tex.room).setOrigin(0);
    const cabinet = this.add.container(0, 0);
    cabinet.add(this.add.image(0, 0, Tex.cabinet).setOrigin(0));
    cabinet.add(this.add.image(MARQUEE.art.x, MARQUEE.y + MARQUEE.art.y, Tex.marquee).setOrigin(0));
    this.flickerMarquee(cabinet);

    const buttons = new ButtonsView(this, cabinet, {
      press: (m) => input.pressButton(m),
      release: (m) => input.releaseButton(m),
    });
    const stick = new JoystickView(this, cabinet, (t) => input.setStick(t.x, t.y));

    const offs = [
      input.on('button', (e) => buttons.setDown(e.move, e.down)),
      input.on('stick', (t) => stick.setTilt(t)),
      lights.onChange((m) => buttons.setSelected(m)),
    ];

    const place = (l: ScreenLayout) => {
      room.setSize(l.width, l.height);
      cabinet.setPosition(l.cabinetX + cabinetShake.offset.x, l.cabinetY + cabinetShake.offset.y);
    };
    place(scaler.layout);
    offs.push(
      scaler.onChange(place),
      cabinetShake.onMove(() => place(scaler.layout)),
    );
    this.events.once('shutdown', () => offs.forEach((off) => off()));
  }

  override update(time: number): void {
    this.shake.tick(time, tuning.cabinet.shakeStepMs);
  }

  /**
   * The marquee's backlight flickers now and then, like an old tube, whatever the game is doing:
   * a dark veil over the art blinks on and off in one of a few patterns, then waits a while.
   */
  private flickerMarquee(cabinet: Phaser.GameObjects.Container): void {
    const m = tuning.marquee;
    const { x, y, width, height } = MARQUEE.art;
    const veil = this.add
      .rectangle(x, MARQUEE.y + y, width, height, palette.black, m.dimAlpha)
      .setOrigin(0)
      .setVisible(false);
    cabinet.add(veil);
    const patterns = [
      [40, 60, 30, 140],
      [70, 50],
      [30, 40, 30, 40, 30, 260],
    ];
    const next = () => {
      const wait = m.minGapMs + Math.random() * (m.maxGapMs - m.minGapMs);
      this.time.delayedCall(wait, () => {
        const steps = patterns[Math.floor(Math.random() * patterns.length)]!;
        let at = 0;
        steps.forEach((ms, i) => {
          this.time.delayedCall(at, () => veil.setVisible(i % 2 === 0));
          at += ms;
        });
        this.time.delayedCall(at, () => {
          veil.setVisible(false);
          next();
        });
      });
    };
    next();
  }
}
