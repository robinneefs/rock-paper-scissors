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

/** Main menu (the title is on the marquee): both fighters idling, START GAME (VS CPU), a greyed-out ONLINE slot and OPTIONS. */
export class HomeScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.home);
  }

  create(): void {
    const { flow, input, lights, audio } = getContext(this);
    useMonitorCamera(this);
    lights.select(null);
    const cx = MONITOR.width / 2;
    this.add.image(0, 0, Tex.stage).setOrigin(0);
    new FighterView(this, 'p1', 46, 206);
    new FighterView(this, 'p2', 170, 206);

    const menu = new MenuView(this, homeMenu(flow), 14, input, audio);
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
