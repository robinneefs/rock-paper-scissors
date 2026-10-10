import { defaultRules } from '@rps/core';
import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { STAGE } from '../config/layout';
import { FightDirector } from '../fight/FightDirector';
import { BannerView } from '../views/BannerView';
import { FighterView } from '../views/FighterView';
import { HudView } from '../views/HudView';
import { MoveIconView } from '../views/MoveIconView';
import { getContext } from './context';
import type { FightData } from './flow';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

/** Wiring only: builds the views, connects the session, input and director, then says ready. */
export class FightScene extends Phaser.Scene {
  private fight!: FightData;
  private hud!: HudView;

  constructor() {
    super(SceneKey.fight);
  }

  init(data: FightData): void {
    this.fight = data;
  }

  create(): void {
    const { input, flow, lights } = getContext(this);
    const { session, setup } = this.fight;
    useMonitorCamera(this);
    this.add.image(0, 0, Tex.stage).setOrigin(0);

    const fighters = {
      p1: new FighterView(this, 'p1', STAGE.fighterX.p1, STAGE.floorY),
      p2: new FighterView(this, 'p2', STAGE.fighterX.p2, STAGE.floorY),
    };
    const iconY = STAGE.floorY - 78;
    const icons = {
      p1: new MoveIconView(this, STAGE.fighterX.p1, iconY),
      p2: new MoveIconView(this, STAGE.fighterX.p2, iconY),
    };
    const hud = new HudView(this, { p1: 'YOU', p2: 'CPU' }, defaultRules.startHealth);
    const banner = new BannerView(this, 96);

    new FightDirector(this, session, { fighters, icons, hud, banner }, defaultRules.roundsToWin, {
      clearPick: () => lights.select(null),
      matchOver: (winner, state) => flow.toResult({ setup, session, winner, state }),
    });

    const off = input.on('action', (a) => {
      if (!this.scene.isActive() || a.type !== 'pick') return;
      session.submitPick(a.move);
      const picked = session.snapshot().myPick;
      if (picked) lights.select(picked);
    });
    this.events.once('shutdown', () => {
      off();
      lights.select(null);
    });
    this.hud = hud;
    session.ready();
  }

  override update(): void {
    const view = this.fight.session.snapshot();
    this.hud.setTimer(view.phase === 'picking' ? view.msLeft : null);
  }
}
