import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { resultMenu } from '../menus/resultMenu';
import { MenuView } from '../views/MenuView';
import { PixelText } from '../views/PixelText';
import { getContext } from './context';
import type { ResultData } from './flow';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

/** Over the last fight frame: who won, the round score, and REMATCH / MAIN MENU. */
export class ResultScene extends Phaser.Scene {
  private result!: ResultData;

  constructor() {
    super(SceneKey.result);
  }

  init(data: ResultData): void {
    this.result = data;
  }

  create(): void {
    const { flow, input, audio } = getContext(this);
    const { session, setup, winner, state } = this.result;
    useMonitorCamera(this);
    const cx = MONITOR.width / 2;
    const won = winner === session.me;
    audio.play(won ? 'winJingle' : 'loseJingle');

    // dithered darkening (a checkerboard of ink pixels), not a smooth alpha overlay
    this.add.tileSprite(0, 0, MONITOR.width, 156, Tex.dither).setOrigin(0);
    new PixelText(this, cx, 26, won ? 'YOU WIN!' : `${session.opponentName} WINS`, {
      size: 3,
      color: won ? palette.gold : palette.pink,
      align: 'center',
      outline: palette.ink,
      shadow: won ? 0xb3165f : palette.shadow,
    });
    // left player's rounds first, so online both players see the same score
    new PixelText(this, cx, 58, `${state.roundsWon.p1} - ${state.roundsWon.p2}`, {
      size: 2,
      color: palette.text,
      align: 'center',
      shadow: palette.ink,
    });
    new PixelText(this, cx, 76, 'ROUNDS', { color: palette.cyan, align: 'center' });

    // online: who asked for a rematch, or why the match can't go on (blank for a CPU match)
    const note = new PixelText(this, cx, 142, '', {
      color: palette.lilac,
      align: 'center',
      shadow: palette.ink,
    });

    let leaving = false;
    let asked = false;
    const menu = new MenuView(
      this,
      resultMenu({
        retry: () => {
          if (leaving || asked) return;
          asked = true;
          note.setText('WAITING FOR RIVAL');
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
      audio,
      112,
    );
    const ended = (text: string) => {
      if (leaving) return;
      leaving = true;
      menu.lock();
      note.setText(text).setColor(palette.pink);
      this.time.delayedCall(tuning.online.endedHoldMs, () => flow.toHome());
    };
    const offs = [
      session.on('rematchAccepted', () => {
        leaving = true;
        menu.lock();
        flow.toFight(setup, session);
      }),
      session.on('rematchRequested', ({ side }) => {
        if (side !== session.me) note.setText('RIVAL WANTS A REMATCH').setColor(palette.gold);
      }),
      session.on('opponentLeft', () => ended('RIVAL LEFT')),
      session.on('disconnected', () => ended('CONNECTION LOST')),
      input.on('action', (a) => {
        if (a.type === 'back' && this.scene.isActive() && !leaving) {
          audio.play('menuBack');
          leaving = true;
          menu.lock();
          flow.toHome();
        }
      }),
    ];
    this.events.once('shutdown', () => offs.forEach((off) => off()));
  }
}
