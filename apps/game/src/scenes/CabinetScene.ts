import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import type { ScreenLayout } from '../platform/PixelScaler';
import { ButtonsView } from '../views/ButtonsView';
import { JoystickView } from '../views/JoystickView';
import { getContext } from './context';
import { SceneKey } from './keys';

/** Always running, underneath everything: the arcade room, the cabinet, its buttons and joystick. */
export class CabinetScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.cabinet);
  }

  create(): void {
    const { input, scaler, lights } = getContext(this);
    const room = this.add.tileSprite(0, 0, scaler.layout.width, scaler.layout.height, Tex.room).setOrigin(0);
    const cabinet = this.add.container(0, 0);
    cabinet.add(this.add.image(0, 0, Tex.cabinet).setOrigin(0));

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
      cabinet.setPosition(l.cabinetX, l.cabinetY);
    };
    place(scaler.layout);
    offs.push(scaler.onChange(place));
    this.events.once('shutdown', () => offs.forEach((off) => off()));
  }
}
