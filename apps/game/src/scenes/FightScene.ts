import Phaser from 'phaser';
import { STAGE } from '../config/layout';
import { palette } from '../config/palette';
import { stageFor, stageTexture } from '../config/stages';
import { tuning } from '../config/tuning';
import { FightDirector } from '../fight/FightDirector';
import { BannerView } from '../views/BannerView';
import { ClashView } from '../views/ClashView';
import { FighterView } from '../views/FighterView';
import { HudView } from '../views/HudView';
import { getContext } from './context';
import type { FightData } from './flow';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

/** Wiring only: builds the views, connects the session, input and director, then says ready. */
export class FightScene extends Phaser.Scene {
  private fight!: FightData;
  private hud!: HudView;
  /** The last whole second shown on the timer, for the countdown ticks. */
  private lastSecs = 0;

  constructor() {
    super(SceneKey.fight);
  }

  init(data: FightData): void {
    this.fight = data;
  }

  create(): void {
    const { input, flow, lights, audio } = getContext(this);
    const { session, setup } = this.fight;
    useMonitorCamera(this);
    // ?stage=<id> in the address forces a stage, for trying one out
    const stage = stageFor(session.stageSeed(), new URLSearchParams(window.location.search).get('stage'));
    this.add.image(0, 0, stageTexture(stage.id)).setOrigin(0);

    const fighters = {
      p1: new FighterView(this, 'p1', STAGE.fighterX.p1, STAGE.floorY),
      p2: new FighterView(this, 'p2', STAGE.fighterX.p2, STAGE.floorY),
    };
    const hud = new HudView(this, { p1: 'YOU', p2: session.opponentName }, session.rules.startHealth);
    const clash = new ClashView(this);
    const banner = new BannerView(this, 64);

    new FightDirector(this, session, { fighters, clash, hud, banner }, audio, session.rules.roundsToWin, {
      clearPick: () => lights.select(null),
      matchOver: (winner, state) => flow.toResult({ setup, session, winner, state }),
    });

    // online only: the match ends early if the other player leaves or the connection drops
    const endEarly = (text: string) => {
      banner.show(text, { color: palette.pink, holdMs: Infinity });
      this.time.delayedCall(tuning.online.endedHoldMs, () => flow.toHome());
    };
    const offs = [
      input.on('action', (a) => {
        if (!this.scene.isActive() || a.type !== 'pick') return;
        const before = session.snapshot().myPick;
        session.submitPick(a.move);
        const picked = session.snapshot().myPick;
        if (picked) lights.select(picked);
        if (picked && picked !== before) audio.play('lockIn');
      }),
      session.on('opponentLeft', () => endEarly('RIVAL LEFT')),
      session.on('disconnected', () => endEarly('OFFLINE')),
    ];
    this.events.once('shutdown', () => {
      offs.forEach((off) => off());
      lights.select(null);
    });
    this.hud = hud;
    session.ready();
  }

  override update(): void {
    const view = this.fight.session.snapshot();
    this.hud.setTimer(view.phase === 'picking' ? view.msLeft : null);
    // a tick for each of the last seconds, higher as time runs out (quiet once you've picked)
    const secs = view.phase === 'picking' ? Math.ceil(view.msLeft / 1000) : 0;
    if (secs !== this.lastSecs && secs > 0 && view.msLeft <= tuning.hud.timerWarnMs && !view.myPick)
      getContext(this).audio.play('tick', { detune: (tuning.hud.timerWarnMs / 1000 - secs) * 200 });
    this.lastSecs = secs;
  }
}
