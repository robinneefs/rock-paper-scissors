import type { MatchState, Side } from '@rps/core';
import type Phaser from 'phaser';
import { createSession } from '../session/createSession';
import type { MatchSession, MatchSetup } from '../session/MatchSession';
import { MONITOR_SCENES, SceneKey } from './keys';
import type { TransitionScene } from './TransitionScene';

export interface FightData {
  setup: MatchSetup;
  session: MatchSession;
}

export interface ResultData extends FightData {
  winner: Side;
  state: MatchState;
}

/**
 * The one place that changes screens: Logo -> Home -> Fight -> Result -> (Retry -> Fight | Home),
 * and Home <-> Options.
 * Scenes never start each other by key. Owns the current match session's lifetime.
 */
export class SceneFlow {
  private session: MatchSession | null = null;
  private busy = false;

  constructor(private readonly game: Phaser.Game) {}

  /** The match being played or just finished, if any. */
  get activeSession(): MatchSession | null {
    return this.session;
  }

  toLogo(): void {
    this.show(SceneKey.logo);
  }

  toHome(): void {
    this.wipe(() => {
      this.endSession();
      this.show(SceneKey.home);
    });
  }

  toOptions(): void {
    this.wipe(() => this.show(SceneKey.options));
  }

  /** Starts a match; pass the existing session for a rematch (Retry). */
  toFight(setup: MatchSetup, session?: MatchSession): void {
    this.wipe(() => {
      if (session !== this.session) this.endSession();
      this.session = session ?? createSession(setup);
      const data: FightData = { setup, session: this.session };
      this.show(SceneKey.fight, data);
    });
  }

  /** The result screen opens over the last fight frame (the fight is paused, not stopped). */
  toResult(data: ResultData): void {
    this.game.scene.pause(SceneKey.fight);
    this.game.scene.run(SceneKey.result, data);
  }

  private show(key: string, data?: object): void {
    for (const k of MONITOR_SCENES) if (k !== key) this.game.scene.stop(k);
    this.game.scene.start(key, data);
    this.game.scene.bringToTop(SceneKey.transition);
  }

  private wipe(swap: () => void): void {
    if (this.busy) return;
    this.busy = true;
    const transition = this.game.scene.getScene(SceneKey.transition) as TransitionScene;
    transition.wipe(swap, () => {
      this.busy = false;
    });
  }

  private endSession(): void {
    this.session?.dispose();
    this.session = null;
  }
}
