import type Phaser from 'phaser';

/** Hit flash: the sprite turns solid white for a few frames. */
export function flash(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  frames: number,
  frameMs: number,
): void {
  sprite.setTintFill(0xffffff);
  scene.time.delayedCall(frames * frameMs, () => sprite.clearTint());
}
