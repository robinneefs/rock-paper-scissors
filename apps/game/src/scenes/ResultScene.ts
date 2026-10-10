import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import { resultMenu } from '../menus/resultMenu';
import { MenuView } from '../views/MenuView';
import { PixelText } from '../views/PixelText';
import { getContext } from './context';
import type { ResultData } from './flow';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

/** Over the last fight frame: who won, the round score, and RETRY / MAIN MENU. */
export class ResultScene extends Phaser.Scene {
  private result!: ResultData;

  constructor() {
    super(SceneKey.result);
  }

  init(data: ResultData): void {
    this.result = data;
  }

  create(): void {
    const { flow, input } = getContext(this);
    const { session, setup, winner, state } = this.result;
    useMonitorCamera(this);
    const cx = MONITOR.width / 2;
    const won = winner === session.me;
    const them = session.me === 'p1' ? 'p2' : 'p1';

    // dithered darkening (a checkerboard of ink pixels), not a smooth alpha overlay
    this.add.tileSprite(0, 0, MONITOR.width, 156, Tex.dither).setOrigin(0);
    new PixelText(this, cx, 26, won ? 'YOU WIN!' : 'CPU WINS', {
      size: 3,
      color: won ? palette.gold : palette.pink,
      align: 'center',
      outline: palette.ink,
      shadow: won ? 0xb3165f : palette.shadow,
    });
    new PixelText(this, cx, 58, `${state.roundsWon[session.me]} - ${state.roundsWon[them]}`, {
      size: 2,
      color: palette.text,
      align: 'center',
      shadow: palette.ink,
    });
    new PixelText(this, cx, 76, 'ROUNDS', { color: palette.cyan, align: 'center' });

    let leaving = false;
    const menu = new MenuView(
      this,
      resultMenu({
        retry: () => {
          if (leaving) return;
          leaving = true;
          menu.lock();
          session.requestRematch(); // online: waits for the opponent; locally accepted at once
        },
        mainMenu: () => {
          if (leaving) return;
          leaving = true;
          menu.lock();
          flow.toHome();
        },
      }),
      96,
      input,
      112,
    );
    const offs = [
      session.on('rematchAccepted', () => flow.toFight(setup, session)),
      input.on('action', (a) => {
        if (a.type === 'back' && this.scene.isActive() && !leaving) {
          leaving = true;
          menu.lock();
          flow.toHome();
        }
      }),
    ];
    this.events.once('shutdown', () => offs.forEach((off) => off()));
  }
}
