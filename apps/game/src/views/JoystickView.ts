import type Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { JOYSTICK } from '../config/layout';
import { tuning } from '../config/tuning';
import type { StickTilt } from '../input/InputRouter';

/** The joystick: tilts in 8 directions, springs back. Drag it, or use the arrow keys. */
export class JoystickView {
  private readonly shaft: Phaser.GameObjects.Graphics;
  private readonly ball: Phaser.GameObjects.Image;
  private tilt = { x: 0, y: 0 };

  constructor(
    private readonly scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    onDrag: (tilt: StickTilt) => void,
  ) {
    this.shaft = scene.add.graphics();
    this.ball = scene.add
      .image(0, 0, Tex.joystickBall)
      .setInteractive({ useHandCursor: true, draggable: true });
    parent.add([this.shaft, this.ball]);
    let start: { x: number; y: number } | null = null;
    this.ball.on('dragstart', (p: Phaser.Input.Pointer) => (start = { x: p.x, y: p.y }));
    this.ball.on('drag', (p: Phaser.Input.Pointer) => {
      if (!start) return;
      const dz = tuning.joystick.dragDeadzonePx;
      const dx = p.x - start.x;
      const dy = p.y - start.y;
      const dir = (d: number) => (d > dz ? 1 : d < -dz ? -1 : 0) as -1 | 0 | 1;
      onDrag({ x: dir(dx), y: dir(dy) });
    });
    this.ball.on('dragend', () => {
      start = null;
      onDrag({ x: 0, y: 0 });
    });
    this.draw();
  }

  setTilt(t: StickTilt): void {
    this.scene.tweens.killTweensOf(this.tilt);
    if (t.x === 0 && t.y === 0) {
      this.scene.tweens.add({
        targets: this.tilt,
        x: 0,
        y: 0,
        duration: tuning.joystick.springBackMs,
        onUpdate: () => this.draw(),
      });
    } else {
      this.tilt = { x: t.x, y: t.y };
      this.draw();
    }
  }

  private draw(): void {
    const bx = Math.round(JOYSTICK.x + this.tilt.x * tuning.joystick.tiltPx.x);
    const by = Math.round(JOYSTICK.y - 26 + this.tilt.y * tuning.joystick.tiltPx.y);
    const g = this.shaft.clear();
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(JOYSTICK.x + (bx - JOYSTICK.x) * t - 1);
      const y = Math.round(JOYSTICK.y + (by + 6 - JOYSTICK.y) * t);
      g.fillStyle(t < 0.2 ? 0x3c3c50 : 0x9696af).fillRect(x, y, 4, 1);
    }
    this.ball.setPosition(bx, by);
  }
}
