import { opponentOf, type MatchState, type Side } from '@rps/core';
import type Phaser from 'phaser';
import { HIT_SFX, type SfxPlayer } from '../audio/sounds';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { flash } from '../fx/flash';
import { shake } from '../fx/shake';
import type { MatchSession, SessionEvents } from '../session/MatchSession';
import type { BannerView } from '../views/BannerView';
import type { FighterView } from '../views/FighterView';
import type { HudView } from '../views/HudView';
import type { MoveIconView } from '../views/MoveIconView';

export interface FightViews {
  fighters: Record<Side, FighterView>;
  icons: Record<Side, MoveIconView>;
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
    private readonly hooks: { clearPick: () => void; matchOver: (winner: Side, state: MatchState) => void },
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
    const { fighters, icons, hud, banner } = this.views;
    const state = this.session.snapshot().state;
    switch (e.phase) {
      case 'roundIntro': {
        this.koSide = null;
        this.firstPickOfRound = true;
        this.hooks.clearPick();
        for (const side of ['p1', 'p2'] as const) {
          fighters[side].toIdle();
          icons[side].hide();
          hud.setReady(side, false);
        }
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
          icons[side].hide();
          hud.setReady(side, false);
        }
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
          icons.p1.hide();
          icons.p2.hide();
          shake(this.scene, this.scene.cameras.main, tuning.shake.koPx, tuning.shake.durationMs * 1.5);
          this.sfx.play('ko');
          banner.show('K.O.', { color: palette.red, holdMs: Infinity });
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
    const { fighters, icons, hud } = this.views;
    const r = tuning.reveal;
    const at = (ms: number, fn: () => void) => this.scene.time.delayedCall(ms, fn);
    for (const side of ['p1', 'p2'] as const) icons[side].drop(e.picks[side], e.autoPicked[side]);
    // the slam when the timer ran out on someone, then the icons whoosh in
    if (e.autoPicked.p1 || e.autoPicked.p2) this.sfx.play('timeUp');
    this.sfx.play('whoosh', { volume: 0.7 });

    const outcome = e.outcome;
    at(r.strikeAtMs, () => {
      for (const side of ['p1', 'p2'] as const) {
        fighters[side].pose(e.picks[side]);
        const lunges = outcome.kind === 'tie' || outcome.winner === side;
        fighters[side].setOffset(lunges ? r.lungePx : 0);
      }
    });

    at(r.impactAtMs, () => {
      if (outcome.kind === 'tie') {
        shake(this.scene, this.scene.cameras.main, 1, tuning.shake.durationMs / 2);
        this.sfx.play('clash');
        this.views.banner.show('CLASH!', { color: palette.lilac, holdMs: 300 });
        return;
      }
      const loser = fighters[outcome.loser];
      loser.pose('hurt');
      loser.setOffset(-r.lungePx / 2);
      flash(this.scene, loser.sprite, tuning.flash.frames, tuning.flash.frameMs);
      this.sfx.play(HIT_SFX[e.picks[outcome.winner]], { detune: (Math.random() - 0.5) * 80 });
      const pause = tuning.hitPause.byDamage[outcome.damage] ?? 60;
      at(pause, () => {
        shake(
          this.scene,
          this.scene.cameras.main,
          tuning.shake.byDamage[outcome.damage] ?? 2,
          tuning.shake.durationMs,
        );
        hud.setHealth(outcome.loser, e.state.health[outcome.loser]);
      });
      if (e.events.some((ev) => ev.type === 'ko')) this.koSide = outcome.loser;
    });

    at(r.recoverAtMs, () => {
      for (const side of ['p1', 'p2'] as const) if (side !== this.koSide) fighters[side].toIdle();
    });
  };
}
