import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import { homeMenu } from '../menus/homeMenu';
import { FighterView } from '../views/FighterView';
import { MenuView } from '../views/MenuView';
import { PixelText } from '../views/PixelText';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';
import { VERSION } from '../version';

/** Main menu: title, both fighters idling, START GAME (VS CPU), a greyed-out ONLINE slot and OPTIONS. */
export class HomeScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.home);
  }

  create(): void {
    const { flow, input, lights } = getContext(this);
    useMonitorCamera(this);
    lights.select(null);
    const cx = MONITOR.width / 2;
    this.add.image(0, 0, Tex.stage).setOrigin(0);
    new FighterView(this, 'p1', 46, 270);
    new FighterView(this, 'p2', 170, 270);
    new PixelText(this, cx, 22, 'RPS', {
      size: 4,
      color: palette.pink,
      align: 'center',
      outline: palette.ink,
      shadow: palette.shadow,
    });
    new PixelText(this, cx, 58, 'FIGHTER', {
      size: 2,
      color: palette.cyan,
      align: 'center',
      shadow: palette.ink,
    });
    new PixelText(this, cx, 78, 'ATTACK - THROW - BLOCK', {
      color: palette.gold,
      align: 'center',
      shadow: palette.ink,
    });

    const menu = new MenuView(this, homeMenu(flow), 112, input);
    this.add.rectangle(0, menu.bottom + 5, MONITOR.width, 13, palette.panel).setOrigin(0);
    new PixelText(this, cx, menu.bottom + 8, 'STICK MOVES - BUTTON SELECTS', {
      color: palette.lilac,
      align: 'center',
      shadow: palette.ink,
    });
    new PixelText(this, MONITOR.width - 3, MONITOR.height - 10, `V${VERSION}`, {
      color: palette.dim,
      align: 'right',
      shadow: palette.ink,
    });
  }
}
