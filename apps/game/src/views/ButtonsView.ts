import type { Move } from '@rps/core';
import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { BUTTON_FRAME } from '../assets/placeholders/cabinet';
import { BUTTONS } from '../config/layout';
import { tuning } from '../config/tuning';

const MOVES: readonly Move[] = ['rock', 'paper', 'scissors'];

/** The three physical cabinet buttons. They press down when used and stay lit for the chosen move. */
export class ButtonsView {
  private readonly sprites: Record<Move, Phaser.GameObjects.Image>;
  private readonly down = new Set<Move>();
  private selected: Move | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    handlers: { press: (m: Move) => void; release: (m: Move) => void },
  ) {
    const make = (m: Move) => {
      const img = scene.add
        .image(BUTTONS.x[m], BUTTONS.y, Tex.buttons, `${m}-up`)
        .setDisplayOrigin(BUTTON_FRAME.topX, BUTTON_FRAME.topY)
        .setInteractive({
          useHandCursor: true,
          hitArea: new Phaser.Geom.Ellipse(
            BUTTON_FRAME.topX,
            BUTTON_FRAME.topY + 4,
            BUTTONS.radius.x * 2 + 4,
            BUTTONS.radius.y * 2 + 10,
          ),
          hitAreaCallback: Phaser.Geom.Ellipse.Contains,
        });
      img.on('pointerdown', () => handlers.press(m));
      img.on('pointerup', () => handlers.release(m));
      img.on('pointerout', () => this.down.has(m) && handlers.release(m));
      parent.add(img);
      return img;
    };
    this.sprites = { rock: make('rock'), paper: make('paper'), scissors: make('scissors') };
  }

  setDown(move: Move, down: boolean): void {
    if (down) this.down.add(move);
    else if (this.down.has(move)) {
      // stay down a moment so even a quick tap shows a press
      this.scene.time.delayedCall(tuning.buttons.releaseMs, () => {
        this.down.delete(move);
        this.refresh();
      });
      return;
    }
    this.refresh();
  }

  /** Light the player's chosen move and dim the others; null clears it. */
  setSelected(move: Move | null): void {
    this.selected = move;
    this.refresh();
  }

  private refresh(): void {
    for (const m of MOVES) {
      const state = this.down.has(m) || this.selected === m ? 'down' : this.selected ? 'dim' : 'up';
      this.sprites[m].setFrame(`${m}-${state}`);
    }
  }
}
