import { opponentOf, type MatchState, type Move, type Side } from '@rps/core';
import type Phaser from 'phaser';
import { HIT_SFX, type SfxPlayer } from '../audio/sounds';
import { STAGE } from '../config/layout';
import { moveColors, palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { screenPulse } from '../fx/crt';
import { flash } from '../fx/flash';
import { koImpact } from '../fx/koImpact';
import { burst } from '../fx/particles';
import { shake } from '../fx/shake';
import type { MatchSession, SessionEvents } from '../session/MatchSession';
import type { BannerView } from '../views/BannerView';
import type { ClashView } from '../views/ClashView';
import type { FighterView } from '../views/FighterView';
import type { HudView } from '../views/HudView';

export interface FightViews {
  fighters: Record<Side, FighterView>;
  clash: ClashView;
  hud: HudView;
  banner: BannerView;
}

/**
 * Turns session events into choreography over time, using tuning values. It never decides a
 * result: it plays back what the session reports, inside the referee's phase windows.
 */
export class FightDirector {
  private readonly offs: (() => void)[] = [];
  private koSide: Side | null = null;
  private firstPickOfRound = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly session: MatchSession,
    private readonly views: FightViews,
    private readonly sfx: SfxPlayer,
    private readonly roundsToWin: number,
    private readonly hooks: {
      clearPick: () => void;
      matchOver: (winner: Side, state: MatchState) => void;
      /** Rattles the whole cabinet against the room. */
      shakeCabinet: (px: number, ms: number) => void;
    },
  ) {
    this.offs.push(
      session.on('phase', this.onPhase),
      session.on('locked', ({ side }) => views.hud.setReady(side, true)),
      session.on('reveal', this.onReveal),
      session.on('matchOver', ({ winner, state }) =>
        scene.time.delayedCall(tuning.result.delayAfterMatchMs, () => hooks.matchOver(winner, state)),
      ),
    );
    scene.events.once('shutdown', () => this.offs.forEach((off) => off()));
  }

  private onPhase = (e: SessionEvents['phase']): void => {
    const { fighters, clash, hud, banner } = this.views;
    const state = this.session.snapshot().state;
    switch (e.phase) {
      case 'roundIntro': {
        this.koSide = null;
        this.firstPickOfRound = true;
        this.hooks.clearPick();
        for (const side of ['p1', 'p2'] as const) {
          fighters[side].toIdle();
          hud.setReady(side, false);
        }
        clash.hide();
        hud.resetHealth(state.health);
        hud.setRounds(state.roundsWon, this.roundsToWin);
        hud.showPrompt(false);
        this.sfx.play('roundStart');
        banner.show(e.finalRound ? 'FINAL ROUND' : `ROUND ${e.round}`, {
          color: palette.gold,
          holdMs: Infinity,
        });
        break;
      }
      case 'picking': {
        this.hooks.clearPick();
        for (const side of ['p1', 'p2'] as const) {
          fighters[side].toIdle();
          hud.setReady(side, false);
        }
        clash.hide();
        hud.showPrompt(true);
        if (this.firstPickOfRound) {
          this.sfx.play('fight');
          banner.show('FIGHT!', { color: palette.pink, holdMs: 350 });
        } else banner.hide();
        this.firstPickOfRound = false;
        break;
      }
      case 'reveal':
        hud.showPrompt(false);
        hud.setReady('p1', false);
        hud.setReady('p2', false);
        break;
      case 'roundOver': {
        this.hooks.clearPick();
        const loser = this.koSide;
        if (loser) {
          const winner = opponentOf(loser);
          fighters[loser].pose('ko');
          fighters[loser].setOffset(-tuning.reveal.lungePx);
          fighters[winner].pose('win');
          fighters[winner].setOffset(0);
          clash.hide();
          shake(this.scene, this.scene.cameras.main, tuning.shake.koPx, tuning.shake.durationMs * 1.5);
          this.hooks.shakeCabinet(tuning.cabinet.koPx, tuning.cabinet.koMs);
          this.sfx.play('ko');
          banner.showKo();
        }
        hud.setRounds(state.roundsWon, this.roundsToWin);
        break;
      }
      case 'matchOver':
        banner.hide();
        break;
      case 'idle':
        break;
    }
  };

  private onReveal = (e: SessionEvents['reveal']): void => {
    const { fighters, clash, hud } = this.views;
    const r = tuning.reveal;
    const at = (ms: number, fn: () => void) => this.scene.time.delayedCall(ms, fn);
    // the badges pop in (with the slam when the timer ran out on someone), then whoosh to the middle
    clash.present(e.picks, e.autoPicked);
    if (e.autoPicked.p1 || e.autoPicked.p2) {
      this.sfx.play('timeUp');
      hud.slamTimer();
      this.hooks.shakeCabinet(tuning.cabinet.timeUpPx, tuning.cabinet.timeUpMs);
    }
    at(r.flyAtMs, () => {
      clash.fly(r.impactAtMs - r.flyAtMs);
      this.sfx.play('whoosh', { volume: 0.7 });
    });

    const outcome = e.outcome;
    at(r.strikeAtMs, () => {
      for (const side of ['p1', 'p2'] as const) {
        fighters[side].pose(e.picks[side]);
        const lunges = outcome.kind === 'tie' || outcome.winner === side;
        fighters[side].setOffset(lunges ? r.lungePx : 0);
        if (lunges) this.dust(side);
      }
    });

    at(r.impactAtMs, () => {
      clash.collide(outcome);
      if (outcome.kind === 'tie') {
        shake(this.scene, this.scene.cameras.main, 1, tuning.shake.durationMs / 2);
        this.sfx.play('clash');
        return;
      }
      const loser = fighters[outcome.loser];
      loser.pose('hurt');
      loser.setOffset(-r.lungePx / 2);
      flash(this.scene, loser.sprite, tuning.flash.frames, tuning.flash.frameMs);
      this.sfx.play(HIT_SFX[e.picks[outcome.winner]], { detune: (Math.random() - 0.5) * 80 });
      this.sparks(outcome.loser, e.picks[outcome.winner], outcome.damage);
      const ko = e.events.some((ev) => ev.type === 'ko');
      if (ko) {
        koImpact(this.scene, tuning.ko);
        screenPulse(this.scene, 'split', tuning.crt.koSplitPx, tuning.crt.koSplitMs);
      } else if (outcome.damage >= tuning.cabinet.bigHitDamage) {
        this.hooks.shakeCabinet(tuning.cabinet.bigHitPx, tuning.cabinet.bigHitMs);
        screenPulse(this.scene, 'warp', tuning.crt.bigHitWarpPx, tuning.crt.bigHitWarpMs);
      }
      const pause = tuning.hitPause.byDamage[outcome.damage] ?? 60;
      at(pause, () => {
        shake(
          this.scene,
          this.scene.cameras.main,
          tuning.shake.byDamage[outcome.damage] ?? 2,
          tuning.shake.durationMs,
        );
        hud.setHealth(outcome.loser, e.state.health[outcome.loser]);
        const hit = e.events.find((ev) => ev.type === 'damage' && ev.side === outcome.loser);
        const amount = hit?.type === 'damage' ? hit.amount : outcome.damage;
        clash.showDamage(outcome.loser, amount, e.picks[outcome.winner]);
      });
      if (ko) this.koSide = outcome.loser;
    });

    // after a K.O. the slow motion pushes this past the round's end, where the K.O. and win poses rule
    at(r.recoverAtMs, () => {
      if (this.koSide) return;
      for (const side of ['p1', 'p2'] as const) fighters[side].toIdle();
    });
    at(r.clearAtMs, () => clash.hide());
  };

  /** Sparks fly off the hurt fighter, away from the hit, in the winning move's colours. */
  private sparks(loser: Side, move: Move, damage: number): void {
    const s = tuning.sparks;
    const away = loser === 'p2' ? 1 : -1;
    const c = moveColors[move];
    burst(this.scene, STAGE.fighterX[loser] - away * 8, STAGE.floorY - 34, {
      count: s.countByDamage[damage] ?? 10,
      colors: [palette.white, c.main, c.main, c.shade],
      angleDeg: away === 1 ? -35 : -145,
      spreadDeg: s.spreadDeg,
      speed: [s.speedMin, s.speedMax],
      gravity: s.gravity,
      lifeMs: s.lifeMs,
      sizePx: s.sizePx,
    });
  }

  /** A little dust kicks up behind a fighter's back foot as they lunge. */
  private dust(side: Side): void {
    const d = tuning.dust;
    const back = side === 'p1' ? -1 : 1;
    burst(this.scene, STAGE.fighterX[side] + back * 10, STAGE.floorY - 2, {
      count: d.count,
      colors: [0xd8c8e8, 0xb8a8d0],
      angleDeg: back === -1 ? -160 : -20,
      spreadDeg: 40,
      speed: [d.speedMin, d.speedMax],
      gravity: d.gravity,
      lifeMs: d.lifeMs,
      sizePx: d.sizePx,
    });
  }
}
