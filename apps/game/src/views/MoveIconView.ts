import type { Move } from '@rps/core';
import type Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { PixelText } from './PixelText';

/** The move coin that drops in above a fighter's head on the reveal. */
export class MoveIconView {
  private readonly icon: Phaser.GameObjects.Image;
  private readonly auto: PixelText;
  private tween: Phaser.Tweens.Tween | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
  ) {
    this.icon = scene.add.image(x, y, Tex.icons, 'unknown').setVisible(false);
    this.auto = new PixelText(scene, x, y - 18, 'AUTO', {
      color: palette.lilac,
      align: 'center',
      shadow: palette.ink,
    }).setVisible(false);
  }

  drop(move: Move, autoPicked: boolean): void {
    const r = tuning.reveal;
    this.tween?.stop();
    this.icon
      .setFrame(move)
      .setVisible(true)
      .setY(this.y - r.iconDropFromPx);
    this.auto.setVisible(autoPicked);
    this.tween = this.scene.tweens.add({
      targets: this.icon,
      y: this.y,
      duration: r.iconDropMs,
      ease: 'Bounce.easeOut',
      onUpdate: () => this.icon.setY(Math.round(this.icon.y)),
    });
  }

  hide(): void {
    this.tween?.stop();
    this.icon.setVisible(false);
    this.auto.setVisible(false);
  }
}
