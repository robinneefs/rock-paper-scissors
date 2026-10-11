import type Phaser from 'phaser';
import { snap } from '../util/snap';

export interface BurstOptions {
  count: number;
  colors: readonly number[];
  /** Launch direction in degrees (0 = right, -90 = up) and the spread around it. */
  angleDeg: number;
  spreadDeg: number;
  /** Launch speed range in pixels per second. */
  speed: [number, number];
  /** Downward pull in pixels per second squared (negative floats up). */
  gravity: number;
  lifeMs: number;
  /** Particles start this big and shrink to 1 px over their life. */
  sizePx: number;
}

/**
 * A burst of square pixel particles (hit sparks, dust). One tween drives the whole burst, so it
 * follows the scene's tween speed (hit pause, K.O. slow motion), and every particle sits on whole
 * pixels.
 */
export function burst(scene: Phaser.Scene, x: number, y: number, o: BurstOptions): void {
  const parts = Array.from({ length: o.count }, (_, i) => {
    const a = ((o.angleDeg + (Math.random() - 0.5) * o.spreadDeg) * Math.PI) / 180;
    const v = o.speed[0] + Math.random() * (o.speed[1] - o.speed[0]);
    const rect = scene.add.rectangle(snap(x), snap(y), o.sizePx, o.sizePx, o.colors[i % o.colors.length]);
    rect.setOrigin(0.5).setDepth(50);
    return { rect, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + Math.random() * 0.4 };
  });
  scene.tweens.addCounter({
    from: 0,
    to: o.lifeMs,
    duration: o.lifeMs,
    onUpdate: (tw) => {
      const ms = tw.getValue() ?? 0;
      const t = ms / 1000;
      for (const p of parts) {
        const age = ms / (o.lifeMs * p.life);
        if (age >= 1) {
          p.rect.setVisible(false);
          continue;
        }
        const size = Math.max(1, Math.round(o.sizePx * (1 - age)));
        p.rect
          .setSize(size, size)
          .setPosition(snap(x + p.vx * t), snap(y + p.vy * t + 0.5 * o.gravity * t * t));
      }
    },
    onComplete: () => parts.forEach((p) => p.rect.destroy()),
  });
}
