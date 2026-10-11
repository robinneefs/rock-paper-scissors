import type { Side } from '@rps/core';
import type Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { frameRect } from '../util/gfx';
import { PixelText } from './PixelText';

const BAR = { y: 8, w: 88, h: 8, inset: 6 } as const;
const PIP = { y: 21, size: 5, gap: 3 } as const;
const TIMER = { x: MONITOR.width / 2, y: 5 } as const;

interface BarState {
  shown: number; // what the bar shows now (animates toward the target)
  trail: number; // white trail that follows behind after a short delay
  max: number;
}

/** Health bars, round pips, timer, names, "READY" markers and the pick prompt. Shows what it's told. */
export class HudView {
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly timer: PixelText;
  /** One size up, shown for a moment on each new second (the pop) and for the slam at 0. */
  private readonly timerPop: PixelText;
  private readonly timerSlam: PixelText;
  private lastSecs = 0;
  private popUntil = 0;
  private slamHide: Phaser.Time.TimerEvent | null = null;
  private readonly prompt: PixelText;
  private readonly ready: Record<Side, PixelText>;
  private readonly bars: Record<Side, BarState>;
  private roundsWon: Record<Side, number> = { p1: 0, p2: 0 };
  private roundsToWin = 2;

  constructor(
    private readonly scene: Phaser.Scene,
    names: Record<Side, string>,
    maxHealth: number,
  ) {
    this.bars = {
      p1: { shown: maxHealth, trail: maxHealth, max: maxHealth },
      p2: { shown: maxHealth, trail: maxHealth, max: maxHealth },
    };
    this.gfx = scene.add.graphics();
    // big timer between the health bars: 15x21 digits, 20x28 for the pop, both centred on TIMER
    const big = { align: 'center', outline: palette.ink, shadow: palette.shadow } as const;
    this.timer = new PixelText(scene, TIMER.x, TIMER.y, '', { ...big, size: 3, color: palette.text });
    this.timerPop = new PixelText(scene, TIMER.x, TIMER.y - 4, '', { ...big, size: 4, color: palette.white });
    this.timerSlam = new PixelText(scene, TIMER.x, TIMER.y - 4, '0', { ...big, size: 4, color: palette.red });
    this.timerPop.setVisible(false);
    this.timerSlam.setVisible(false);
    new PixelText(scene, BAR.inset, PIP.y, names.p1, { color: palette.text, shadow: palette.ink });
    new PixelText(scene, MONITOR.width - BAR.inset, PIP.y, names.p2, {
      color: palette.text,
      align: 'right',
      shadow: palette.ink,
    });
    this.ready = {
      p1: new PixelText(scene, BAR.inset, PIP.y + 10, 'READY', {
        color: palette.cyan,
        shadow: palette.ink,
      }).setVisible(false),
      p2: new PixelText(scene, MONITOR.width - BAR.inset, PIP.y + 10, 'READY', {
        color: palette.cyan,
        align: 'right',
        shadow: palette.ink,
      }).setVisible(false),
    };
    this.prompt = new PixelText(scene, MONITOR.width / 2, 58, 'PICK YOUR MOVE', {
      color: palette.text,
      align: 'center',
      shadow: palette.ink,
    }).setVisible(false);
    this.draw();
  }

  setRounds(roundsWon: Record<Side, number>, roundsToWin: number): void {
    this.roundsWon = { ...roundsWon };
    this.roundsToWin = roundsToWin;
    this.draw();
  }

  /** Jump straight to these values (new round). */
  resetHealth(health: Record<Side, number>): void {
    for (const side of ['p1', 'p2'] as const) {
      this.scene.tweens.killTweensOf(this.bars[side]);
      this.bars[side].shown = health[side];
      this.bars[side].trail = health[side];
    }
    this.draw();
  }

  /** Drain toward the health the session reported; a white trail follows. */
  setHealth(side: Side, health: number): void {
    const bar = this.bars[side];
    this.scene.tweens.killTweensOf(bar);
    this.scene.tweens.add({
      targets: bar,
      shown: health,
      duration: tuning.hud.drainMs,
      ease: 'Cubic.easeOut',
      onUpdate: () => this.draw(),
    });
    this.scene.tweens.add({
      targets: bar,
      trail: health,
      delay: tuning.hud.trailDelayMs + tuning.hud.drainMs / 2,
      duration: tuning.hud.drainMs,
      ease: 'Linear',
      onUpdate: () => this.draw(),
    });
  }

  /**
   * Seconds left, or null to hide the timer. Called every frame while picking: each new second pops
   * in one size bigger, and in the last seconds the timer turns gold, then red, and shakes.
   */
  setTimer(msLeft: number | null): void {
    const t = tuning.hud;
    if (msLeft === null) {
      this.timer.setVisible(false);
      this.timerPop.setVisible(false);
      this.lastSecs = 0;
      return;
    }
    const now = this.scene.time.now;
    const secs = Math.ceil(msLeft / 1000);
    const color =
      msLeft <= t.timerRedMs ? palette.red : msLeft <= t.timerWarnMs ? palette.gold : palette.text;
    if (secs !== this.lastSecs) {
      this.lastSecs = secs;
      this.popUntil = now + t.timerPopMs;
      this.timer.setText(String(secs));
      this.timerPop.setText(String(secs)).setColor(palette.white);
    }
    const popping = now < this.popUntil;
    this.timer.setVisible(!popping).setColor(color);
    this.timerPop.setVisible(popping);
    // whole-pixel jitter, stronger in the last second
    const amp = msLeft <= 1000 ? t.timerShakePx * 2 : msLeft <= t.timerRedMs ? t.timerShakePx : 0;
    const step = Math.floor(now / Math.max(1, t.timerShakeEveryMs));
    const jitter = (k: number) => (amp ? ((step * 7 + k * 13) % (amp * 2 + 1)) - amp : 0);
    this.timer.setAnchorX(TIMER.x + jitter(1)).setY(TIMER.y + jitter(2));
  }

  /** Time ran out: a big red 0 slams down and holds for a moment. */
  slamTimer(): void {
    const t = tuning.hud;
    this.slamHide?.remove();
    this.timer.setVisible(false);
    this.timerPop.setVisible(false);
    this.timerSlam.setVisible(true).setY(TIMER.y - 4 - t.timerSlamDropPx);
    this.scene.tweens.add({
      targets: this.timerSlam,
      y: TIMER.y - 4,
      duration: t.timerSlamMs,
      ease: 'Back.easeOut',
      onUpdate: () => this.timerSlam.setY(Math.round(this.timerSlam.y)),
    });
    this.slamHide = this.scene.time.delayedCall(t.timerSlamMs + t.timerSlamHoldMs, () =>
      this.timerSlam.setVisible(false),
    );
  }

  setReady(side: Side, ready: boolean): void {
    this.ready[side].setVisible(ready);
  }

  showPrompt(on: boolean): void {
    this.prompt.setVisible(on);
  }

  private draw(): void {
    const g = this.gfx.clear();
    for (const side of ['p1', 'p2'] as const) {
      const bar = this.bars[side];
      const x = side === 'p1' ? BAR.inset : MONITOR.width - BAR.inset - BAR.w;
      const inner = BAR.w - 2;
      const fillW = Math.round((inner * Math.max(0, bar.shown)) / bar.max);
      const trailW = Math.round((inner * Math.max(0, bar.trail)) / bar.max);
      g.fillStyle(palette.ink).fillRect(x - 1, BAR.y - 1, BAR.w + 2, BAR.h + 2);
      g.fillStyle(palette.hpBack).fillRect(x + 1, BAR.y + 1, inner, BAR.h - 2);
      const color =
        bar.shown <= tuning.hud.lowHealth
          ? palette.hpRed
          : bar.shown <= bar.max / 2
            ? palette.hpYellow
            : palette.hpGreen;
      // p1's bar is anchored on the left edge, p2's on the right: both drain toward the outside
      const anchor = (w: number) => (side === 'p1' ? x + 1 : x + 1 + inner - w);
      if (trailW > fillW) g.fillStyle(palette.hpTrail).fillRect(anchor(trailW), BAR.y + 1, trailW, BAR.h - 2);
      g.fillStyle(color).fillRect(anchor(fillW), BAR.y + 1, fillW, BAR.h - 2);
      if (fillW > 0) g.fillStyle(0xffffff, 1).fillRect(anchor(fillW), BAR.y + 1, fillW, 1);
      frameRect(g, x, BAR.y, BAR.w, BAR.h, palette.lilac);

      // round pips next to the name, toward the centre
      for (let i = 0; i < this.roundsToWin; i++) {
        const px =
          side === 'p1'
            ? BAR.inset + BAR.w - (i + 1) * (PIP.size + PIP.gap) + PIP.gap
            : MONITOR.width - BAR.inset - BAR.w + i * (PIP.size + PIP.gap);
        const won = i < this.roundsWon[side];
        g.fillStyle(palette.ink).fillRect(px - 1, PIP.y - 1, PIP.size + 2, PIP.size + 2);
        g.fillStyle(won ? palette.gold : palette.hpBack).fillRect(px, PIP.y, PIP.size, PIP.size);
      }
    }
  }
}
