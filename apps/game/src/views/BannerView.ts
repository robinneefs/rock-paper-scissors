import type Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { PixelText } from './PixelText';

/** Big centre text that slams in: "ROUND 1", "FIGHT!", and the K.O. letters. */
export class BannerView {
  private readonly text: PixelText;
  private readonly sub: PixelText;
  private readonly ko: Phaser.GameObjects.Image;
  private tween: Phaser.Tweens.Tween | null = null;
  private hideTimer: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly y: number,
  ) {
    this.text = new PixelText(scene, MONITOR.width / 2, y, '', {
      size: 3,
      color: palette.gold,
      align: 'center',
      outline: palette.ink,
      shadow: palette.shadow,
    }).setVisible(false);
    this.sub = new PixelText(scene, MONITOR.width / 2, y + 28, '', {
      color: palette.text,
      align: 'center',
      shadow: palette.ink,
    }).setVisible(false);
    this.ko = scene.add
      .image(MONITOR.width / 2, y, Tex.koLetters)
      .setOrigin(0.5, 0)
      .setVisible(false);
  }

  show(text: string, opts: { color?: number; sub?: string; holdMs?: number } = {}): void {
    this.tween?.stop();
    this.hideTimer?.remove();
    this.ko.setVisible(false);
    this.text
      .setText(text)
      .setColor(opts.color ?? palette.gold)
      .setVisible(true)
      .setY(this.y - 40);
    this.sub.setText(opts.sub ?? '').setVisible(Boolean(opts.sub));
    this.tween = this.scene.tweens.add({
      targets: this.text,
      y: this.y,
      duration: tuning.banner.slamMs,
      ease: 'Back.easeOut',
      onUpdate: () => this.text.setY(Math.round(this.text.y)),
    });
    if (opts.holdMs !== Infinity)
      this.hideTimer = this.scene.time.delayedCall(
        tuning.banner.slamMs + (opts.holdMs ?? tuning.banner.holdMs),
        () => this.hide(),
      );
  }

  /** "K.O." in its own big fighting-game letters; it slams in like the other banners and stays up. */
  showKo(): void {
    this.tween?.stop();
    this.hideTimer?.remove();
    this.hide();
    this.ko.setVisible(true).setY(this.y - 40);
    this.tween = this.scene.tweens.add({
      targets: this.ko,
      y: this.y - 6,
      duration: tuning.banner.slamMs,
      ease: 'Back.easeOut',
      onUpdate: () => this.ko.setY(Math.round(this.ko.y)),
    });
  }

  hide(): void {
    this.ko.setVisible(false);
    this.text.setVisible(false);
    this.sub.setVisible(false);
  }
}
