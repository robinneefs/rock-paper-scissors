import type { Side } from '@rps/core';
import type Phaser from 'phaser';
import { Tex, type FighterFrame } from '../assets/keys';
import { FIGHTER_FRAME } from '../assets/placeholders/fighters';
import { tuning } from '../config/tuning';
import { snap } from '../util/snap';

/** One fighter on the stage. Dumb: it shows the pose it is told to, and breathes while idle. */
export class FighterView {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Rectangle;
  private idle = true;
  private breath = 0;

  constructor(
    scene: Phaser.Scene,
    readonly side: Side,
    private readonly homeX: number,
    floorY: number,
  ) {
    this.shadow = scene.add.rectangle(homeX, floorY, 30, 3, 0x050014).setOrigin(0.5, 0.5);
    this.sprite = scene.add.sprite(homeX, floorY + 1, side === 'p1' ? Tex.fighterP1 : Tex.fighterP2, 'idle0');
    // feet on the floor; p2 is the same art mirrored (flipping keeps the pixel grid)
    const footX = side === 'p1' ? FIGHTER_FRAME.footX : FIGHTER_FRAME.width - 1 - FIGHTER_FRAME.footX;
    this.sprite.setDisplayOrigin(footX, FIGHTER_FRAME.height).setFlipX(side === 'p2');
    const timer = scene.time.addEvent({
      delay: tuning.idle.breatheEveryMs,
      loop: true,
      startAt: side === 'p2' ? tuning.idle.breatheEveryMs / 2 : 0,
      callback: () => {
        this.breath ^= 1;
        if (this.idle) this.sprite.setFrame(this.breath ? 'idle1' : 'idle0');
      },
    });
    scene.events.once('shutdown', () => timer.remove());
  }

  /** Facing direction: +1 looks right (p1), -1 looks left (p2). */
  get facing(): 1 | -1 {
    return this.side === 'p1' ? 1 : -1;
  }

  pose(frame: FighterFrame): void {
    this.idle = frame === 'idle0' || frame === 'idle1';
    this.sprite.setFrame(frame);
  }

  toIdle(): void {
    this.pose(this.breath ? 'idle1' : 'idle0');
    this.setOffset(0);
  }

  /** Steps toward (+) or away from (-) the opponent by whole pixels. */
  setOffset(px: number): void {
    this.sprite.x = snap(this.homeX + px * this.facing);
    this.shadow.x = this.sprite.x;
  }
}
