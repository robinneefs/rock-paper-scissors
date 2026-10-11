import type { Move } from '@rps/core';
import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { BUTTON_FRAME, BUTTON_RING, type ButtonState } from '../assets/placeholders/cabinet';
import { BUTTONS } from '../config/layout';
import { tuning } from '../config/tuning';

const MOVES: readonly Move[] = ['rock', 'paper', 'scissors'];

/**
 * The three physical cabinet buttons. They press down when used. Locking in a move flashes its
 * button white and pops a ring out round it; it then stays down and lit while the others dim.
 */
export class ButtonsView {
  private readonly sprites: Record<Move, Phaser.GameObjects.Image>;
  private readonly ring: Phaser.GameObjects.Image;
  private readonly down = new Set<Move>();
  private selected: Move | null = null;
  private flashing = false;
  private lockTimer: Phaser.Time.TimerEvent | null = null;

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
    this.ring = scene.add.image(0, 0, Tex.buttonRings, 'rock-0').setOrigin(0).setVisible(false);
    parent.add(this.ring);
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
    this.stopLockIn();
    if (move) this.playLockIn(move);
    this.refresh();
  }

  /** Flash on, off, on... `lockFlashes` times, while the ring steps outwards. */
  private playLockIn(move: Move): void {
    const t = tuning.buttons;
    const flashSteps = Math.max(0, Math.round(t.lockFlashes)) * 2;
    const ringSteps = BUTTON_RING.frames;
    const stepMs = Math.max(1, Math.min(t.lockFlashMs, t.ringFrameMs));
    let elapsed = 0;
    this.ring.setPosition(BUTTONS.x[move] - BUTTON_RING.cx, BUTTONS.y - BUTTON_RING.cy);
    const tick = () => {
      const flashStep = Math.floor(elapsed / Math.max(1, t.lockFlashMs));
      const ringStep = Math.floor(elapsed / Math.max(1, t.ringFrameMs));
      this.flashing = flashStep < flashSteps && flashStep % 2 === 0;
      this.ring.setVisible(ringStep < ringSteps);
      if (ringStep < ringSteps) this.ring.setFrame(`${move}-${ringStep}`);
      this.refresh();
      if (flashStep >= flashSteps && ringStep >= ringSteps) return this.stopLockIn();
      elapsed += stepMs;
      this.lockTimer = this.scene.time.delayedCall(stepMs, tick);
    };
    tick();
  }

  private stopLockIn(): void {
    this.lockTimer?.remove();
    this.lockTimer = null;
    this.flashing = false;
    this.ring.setVisible(false);
  }

  private refresh(): void {
    for (const m of MOVES) {
      let state: ButtonState = 'up';
      if (this.selected === m) state = this.flashing ? 'flash' : 'lit';
      else if (this.down.has(m)) state = 'down';
      else if (this.selected) state = 'dim';
      this.sprites[m].setFrame(`${m}-${state}`);
    }
  }
}
