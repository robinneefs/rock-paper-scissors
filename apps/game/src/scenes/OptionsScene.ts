import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import { optionsMenu, SCALING_HINT, SCALING_LABEL } from '../menus/optionsMenu';
import { nextScalingMode } from '../platform/settings';
import { MenuView } from '../views/MenuView';
import { PixelText } from '../views/PixelText';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

/** Options: for now one setting, how the cabinet scales to the window. Changes apply at once. */
export class OptionsScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.options);
  }

  create(): void {
    const { flow, input, settings } = getContext(this);
    useMonitorCamera(this);
    const cx = MONITOR.width / 2;
    this.add.image(0, 0, Tex.stage).setOrigin(0);
    this.add.tileSprite(0, 0, MONITOR.width, MONITOR.height, Tex.dither).setOrigin(0);
    new PixelText(this, cx, 26, 'OPTIONS', {
      size: 3,
      color: palette.cyan,
      align: 'center',
      outline: palette.ink,
      shadow: palette.shadow,
    });

    let leaving = false;
    const back = () => {
      if (leaving) return;
      leaving = true;
      menu.lock();
      flow.toHome();
    };
    const cycleScaling = () => settings.set('scaling', nextScalingMode(settings.value.scaling));
    const menu = new MenuView(
      this,
      optionsMenu(settings.value.scaling, { cycleScaling, back }),
      70,
      input,
      196,
    );

    this.add.rectangle(0, menu.bottom + 7, MONITOR.width, 25, palette.panel).setOrigin(0);
    const hint = [0, 1].map(
      (i) =>
        new PixelText(this, cx, menu.bottom + 12 + i * 10, '', {
          color: palette.lilac,
          align: 'center',
          shadow: palette.ink,
        }),
    );
    const show = () => {
      const mode = settings.value.scaling;
      menu.setTag('scaling', SCALING_LABEL[mode]);
      SCALING_HINT[mode].forEach((line, i) => hint[i]?.setText(line));
    };
    show();

    const offs = [
      settings.onChange(show),
      input.on('action', (a) => {
        if (leaving || !this.scene.isActive()) return;
        if (a.type === 'back') back();
        // left / right also flip the setting while the cursor is on it
        else if (a.type === 'nav' && (a.dir === 'left' || a.dir === 'right') && menu.selectedId === 'scaling')
          cycleScaling();
      }),
    ];
    this.events.once('shutdown', () => offs.forEach((off) => off()));
  }
}
