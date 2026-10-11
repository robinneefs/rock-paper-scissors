import { defaultRules, type Move } from '@rps/core';
import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { moveColors, palette } from '../config/palette';
import { addMenuBackdrop } from '../views/MenuBackdrop';
import { PixelText } from '../views/PixelText';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

/** The chain of who beats whom, left to right, wrapping round. */
const CHAIN: readonly Move[] = ['rock', 'scissors', 'paper'];

/** A one-card How to play: which move beats which, then the few rules. Any button goes back. */
export class HowToScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.howTo);
  }

  create(): void {
    const { flow, input, audio } = getContext(this);
    useMonitorCamera(this);
    const cx = MONITOR.width / 2;
    addMenuBackdrop(this);
    this.add.tileSprite(0, 0, MONITOR.width, MONITOR.height, Tex.dither).setOrigin(0);
    new PixelText(this, cx, 8, 'HOW TO PLAY', {
      size: 2,
      color: palette.cyan,
      align: 'center',
      outline: palette.ink,
      shadow: palette.shadow,
    });

    // ROCK > SCISSORS > PAPER > (back to ROCK): each badge beats the next
    const xs = [36, 108, 180];
    CHAIN.forEach((m, i) => {
      this.add.image(xs[i]!, 52, Tex.badges, `${m}-normal`);
      new PixelText(this, xs[i]!, 75, m.toUpperCase(), {
        color: moveColors[m].main,
        align: 'center',
        shadow: palette.ink,
      });
      if (i < CHAIN.length - 1)
        new PixelText(this, (xs[i]! + xs[i + 1]!) / 2, 48, '>', {
          size: 2,
          color: palette.gold,
          align: 'center',
          shadow: palette.ink,
        });
    });
    const beats = (a: Move, b: Move) => `${a.toUpperCase()} BEATS ${b.toUpperCase()}`;
    new PixelText(this, cx, 88, `${beats('paper', 'rock')} TOO`, {
      color: palette.text,
      align: 'center',
      shadow: palette.ink,
    });

    const lines = [
      'PICK WITH THE BUTTONS 1 2 3',
      'BEFORE THE TIMER RUNS OUT',
      'NO PICK? ONE IS PICKED FOR YOU',
      'SAME MOVE: CLASH - NO DAMAGE',
      `WIN ${defaultRules.roundsToWin} ROUNDS TO WIN THE MATCH`,
    ];
    this.add.rectangle(0, 102, MONITOR.width, lines.length * 12 + 8, palette.panel, 0.85).setOrigin(0);
    lines.forEach(
      (line, i) =>
        new PixelText(this, cx, 107 + i * 12, line, {
          color: i === lines.length - 1 ? palette.gold : palette.lilac,
          align: 'center',
          shadow: palette.ink,
        }),
    );
    const prompt = new PixelText(this, cx, 196, 'PRESS ANY BUTTON', {
      color: palette.text,
      align: 'center',
      shadow: palette.ink,
    });
    this.time.addEvent({ delay: 450, loop: true, callback: () => prompt.setVisible(!prompt.visible) });

    let leaving = false;
    const off = input.on('action', (a) => {
      if (leaving || !this.scene.isActive()) return;
      if (a.type !== 'pick' && a.type !== 'confirm' && a.type !== 'back') return;
      leaving = true;
      audio.play('menuBack');
      flow.toHome();
    });
    this.input.on('pointerdown', () => {
      if (leaving) return;
      leaving = true;
      audio.play('menuBack');
      flow.toHome();
    });
    this.events.once('shutdown', off);
  }
}
