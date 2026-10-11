import type { Move, ExchangeOutcome, Side } from '@rps/core';
import type Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR, STAGE } from '../config/layout';
import { moveColors, palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { snap } from '../util/snap';
import { PixelText } from './PixelText';

const SIDES = ['p1', 'p2'] as const;
/** Half a badge's width minus the overlap where the two touch at the collision. */
const CONTACT_PX = 15;

/**
 * The reveal: each side's move badge pops in beside its fighter, both fly to the middle and
 * collide, the winner stays and the loser is knocked away, "ROCK WINS" slams in and the damage
 * number falls from the loser's head. The director decides when each step plays.
 */
export class ClashView {
  private readonly badges: Record<Side, Phaser.GameObjects.Image>;
  private readonly autos: Record<Side, PixelText>;
  private readonly verdict: PixelText;
  private readonly damage: PixelText;
  private moves: Record<Side, Move> = { p1: 'rock', p2: 'rock' };
  private readonly home: Record<Side, number>;
  private readonly centre = MONITOR.width / 2;
  /** Tweens on plain progress objects (the loser's flight, the damage fall), stopped by hide(). */
  private paths: Phaser.Tweens.Tween[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    const r = tuning.reveal;
    this.home = { p1: STAGE.fighterX.p1 - r.badgeOutPx, p2: STAGE.fighterX.p2 + r.badgeOutPx };
    this.badges = {
      p1: scene.add.image(this.home.p1, r.badgeY, Tex.badges, 'rock-normal').setVisible(false),
      p2: scene.add.image(this.home.p2, r.badgeY, Tex.badges, 'rock-normal').setVisible(false),
    };
    this.autos = {
      p1: this.label(this.home.p1),
      p2: this.label(this.home.p2),
    };
    this.verdict = new PixelText(scene, this.centre, r.verdictY, '', {
      size: 2,
      align: 'center',
      outline: palette.ink,
      shadow: palette.shadow,
    }).setVisible(false);
    this.damage = new PixelText(scene, 0, 0, '', {
      size: 2,
      align: 'center',
      outline: palette.ink,
    }).setVisible(false);
  }

  private label(x: number): PixelText {
    const y = tuning.reveal.badgeY - 30;
    return new PixelText(this.scene, x, y, 'AUTO', {
      color: palette.lilac,
      align: 'center',
      shadow: palette.ink,
    }).setVisible(false);
  }

  /** The badges pop in beside the fighters. */
  present(picks: Record<Side, Move>, autoPicked: Record<Side, boolean>): void {
    const r = tuning.reveal;
    this.hide();
    this.moves = picks;
    for (const side of SIDES) {
      const badge = this.badges[side]
        .setFrame(`${picks[side]}-flash`)
        .setPosition(this.home[side], r.badgeY - r.badgePopFromPx)
        .setAngle(0)
        .setVisible(true);
      this.autos[side].setVisible(autoPicked[side]);
      this.tween(badge, { y: r.badgeY }, r.badgePopMs, 'Back.easeOut');
      this.scene.time.delayedCall(r.flashMs, () => badge.setFrame(`${picks[side]}-normal`));
    }
  }

  /** Both badges fly to the middle, arriving (touching) after `ms`. */
  fly(ms: number): void {
    const r = tuning.reveal;
    for (const side of SIDES) {
      this.autos[side].setVisible(false);
      const x = this.centre + (side === 'p1' ? -CONTACT_PX : CONTACT_PX);
      this.tween(this.badges[side], { x, y: r.clashY }, ms, 'Quad.easeIn');
    }
  }

  /** The collision: a white flash, then the loser is knocked away (or both bounce on a tie). */
  collide(outcome: ExchangeOutcome): void {
    const r = tuning.reveal;
    for (const side of SIDES) {
      const badge = this.badges[side];
      badge.setFrame(`${this.moves[side]}-flash`);
      this.scene.time.delayedCall(r.flashMs, () => badge.setFrame(`${this.moves[side]}-normal`));
    }
    if (outcome.kind === 'tie') {
      for (const side of SIDES) {
        const out = side === 'p1' ? -1 : 1;
        this.tween(
          this.badges[side],
          { x: this.badges[side].x + out * r.tieBouncePx },
          r.tieBounceMs,
          'Quad.easeOut',
        );
      }
      this.slamVerdict('CLASH!', palette.lilac);
      return;
    }
    const winner = this.badges[outcome.winner];
    const loser = this.badges[outcome.loser];
    this.tween(winner, { x: this.centre }, r.tieBounceMs, 'Quad.easeOut');
    // knocked back towards its own side and up off the screen, turning in quarter steps
    const out = outcome.loser === 'p1' ? -1 : 1;
    const startX = loser.x;
    const startY = loser.y;
    const fly = { t: 0 };
    this.paths.push(
      this.scene.tweens.add({
        targets: fly,
        t: 1,
        duration: r.loserFlyMs,
        ease: 'Linear',
        onUpdate: () => {
          const t = fly.t;
          loser.setPosition(snap(startX + out * 140 * t), snap(startY - 70 * t + 90 * t * t));
          loser.setAngle(out * 90 * Math.floor((t * r.loserFlyMs) / r.loserSpinMs));
        },
        onComplete: () => loser.setVisible(false),
      }),
    );
    const move = outcome.picks[outcome.winner];
    this.slamVerdict(`${move} WINS`, moveColors[move].main);
  }

  /** "-15" in the winning move's colour hops up over the loser's head, then falls. */
  showDamage(loser: Side, amount: number, move: Move): void {
    const r = tuning.reveal;
    const y = STAGE.floorY - 80;
    this.damage
      .setText(`-${amount}`)
      .setColor(moveColors[move].main)
      .setAnchorX(STAGE.fighterX[loser] + (loser === 'p1' ? -10 : 10))
      .setY(y)
      .setVisible(true);
    const drop = { t: 0 };
    this.paths.push(
      this.scene.tweens.add({
        targets: drop,
        t: 1,
        duration: r.damageFallMs,
        ease: 'Linear',
        onUpdate: () => {
          // a small hop, then gravity: a parabola that ends damageFallPx below the start
          const t = drop.t;
          const hop = r.damageHopPx;
          const fall = r.damageFallPx;
          const v = 2 * (hop + Math.sqrt(hop * (hop + fall)));
          this.damage.setY(snap(y - v * t + (v - fall) * t * t));
        },
      }),
    );
  }

  hide(): void {
    this.paths.forEach((t) => t.stop());
    this.paths = [];
    for (const side of SIDES) {
      this.scene.tweens.killTweensOf(this.badges[side]);
      this.badges[side].setVisible(false).setAngle(0);
      this.autos[side].setVisible(false);
    }
    this.scene.tweens.killTweensOf(this.verdict);
    this.verdict.setVisible(false);
    this.damage.setVisible(false);
  }

  private slamVerdict(text: string, color: number): void {
    const y = tuning.reveal.verdictY;
    this.verdict
      .setText(text)
      .setColor(color)
      .setY(y - 24)
      .setVisible(true);
    this.tween(this.verdict, { y }, tuning.banner.slamMs, 'Back.easeOut');
  }

  private tween(
    target: { x: number; y: number },
    to: { x?: number; y?: number },
    ms: number,
    ease: string,
  ): void {
    const obj = target as Phaser.GameObjects.Components.Transform;
    this.scene.tweens.add({
      targets: obj,
      ...to,
      duration: ms,
      ease,
      onUpdate: () => {
        if (to.x !== undefined) obj.x = snap(obj.x);
        if (to.y !== undefined) obj.y = snap(obj.y);
      },
    });
  }
}
