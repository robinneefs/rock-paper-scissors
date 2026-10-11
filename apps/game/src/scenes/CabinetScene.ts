import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MARQUEE_NEON, NEON_OFF } from '../assets/placeholders/cabinet';
import { MARQUEE } from '../config/layout';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import type { CabinetShake } from '../fx/cabinetShake';
import type { ScreenLayout } from '../platform/PixelScaler';
import { ButtonsView } from '../views/ButtonsView';
import { JoystickView } from '../views/JoystickView';
import { getContext } from './context';
import { SceneKey } from './keys';

/**
 * Marquee flicker patterns, one picked at random each time: steps of a level and how many ms it
 * holds. Levels: d = dip (tuning.marquee.dimAlpha), h = half a dip, D = blackout, - = lit.
 */
const FLICKERS = [
  'd40 -60 d30 -140',
  'D70 -50',
  'd30 -40 d30 -40 D30 -260',
  'd25 -25 d25 -25 d25 -25 d25',
  'D90 h30 D60 -40 d30',
  'D320 d40 D50 -30 D40',
];

/** Always running, underneath everything: the arcade room, the cabinet, its buttons and joystick. */
export class CabinetScene extends Phaser.Scene {
  private shake!: CabinetShake;

  constructor() {
    super(SceneKey.cabinet);
  }

  create(): void {
    const { input, scaler, lights, cabinetShake, audio } = getContext(this);
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
    const stick = new JoystickView(
      this,
      cabinet,
      (t) => input.setStick(t.x, t.y),
      () => audio.play('stickClick'),
    );

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
   * The marquee's backlight flickers every few seconds, like a worn tube, whatever the game is
   * doing: a dark veil over the art and the neon loop round it stutter through one of a few
   * patterns (some only dip, some black out), and a bright surge pops as the tube strikes back.
   */
  private flickerMarquee(cabinet: Phaser.GameObjects.Container): void {
    const m = tuning.marquee;
    const { x, y, width, height } = MARQUEE.art;
    const veil = this.add
      .rectangle(x, MARQUEE.y + y, width, height, palette.black)
      .setOrigin(0)
      .setAlpha(0);
    // the neon loop drawn in the cabinet (see paintCabinet), switched off in its unlit colour
    const n = MARQUEE_NEON;
    const neonOff = this.add.graphics().setAlpha(0).fillStyle(NEON_OFF);
    for (const [fx, fy, fw, fh] of [
      [n.x, n.y, n.w, 2],
      [n.x, n.y + n.h - 2, n.w, 2],
      [n.x, n.y, 2, n.h],
      [n.x + n.w - 2, n.y, 2, n.h],
    ] as const)
      neonOff.fillRect(fx, fy, fw, fh);
    const surge = this.add
      .rectangle(x, MARQUEE.y + y, width, height, palette.white)
      .setOrigin(0)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    cabinet.add([veil, neonOff, surge]);

    const set = (dark: number) => {
      veil.setAlpha(dark);
      neonOff.setAlpha(dark > 0 ? Math.min(1, dark / m.dimAlpha) : 0);
    };
    const next = () => {
      const wait = m.minGapMs + Math.random() * (m.maxGapMs - m.minGapMs);
      this.time.delayedCall(wait, () => {
        const dark = { '-': 0, h: m.dimAlpha / 2, d: m.dimAlpha, D: m.blackoutAlpha };
        const steps = FLICKERS[Math.floor(Math.random() * FLICKERS.length)]!.split(' ');
        let at = 0;
        for (const step of steps) {
          this.time.delayedCall(at, () => set(dark[step[0] as keyof typeof dark]));
          at += Number(step.slice(1));
        }
        this.time.delayedCall(at, () => {
          set(0);
          surge.setAlpha(m.surgeAlpha);
          this.time.delayedCall(m.surgeMs, () => surge.setAlpha(0));
          next();
        });
      });
    };
    next();
  }
}
