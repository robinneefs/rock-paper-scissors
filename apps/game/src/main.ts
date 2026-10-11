import { defaultRules, defaultTimings } from '@rps/core';
import Phaser from 'phaser';
import { AudioService } from './audio/AudioService';
import { palette } from './config/palette';
import { tuning } from './config/tuning';
import { InputRouter } from './input/InputRouter';
import { PixelScaler } from './platform/PixelScaler';
import { browserStore, SettingsStore } from './platform/settings';
import { BootScene } from './scenes/BootScene';
import { CabinetScene } from './scenes/CabinetScene';
import { CabinetLights, setContext } from './scenes/context';
import { FightScene } from './scenes/FightScene';
import { SceneFlow } from './scenes/flow';
import { HomeScene } from './scenes/HomeScene';
import { LobbyScene } from './scenes/LobbyScene';
import { LogoScene } from './scenes/LogoScene';
import { OptionsScene } from './scenes/OptionsScene';
import { ResultScene } from './scenes/ResultScene';
import { TransitionScene } from './scenes/TransitionScene';
import { VERSION } from './version';

const settings = new SettingsStore(browserStore());
const scaler = new PixelScaler(settings.value.scaling);
const { width, height } = scaler.layout;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: palette.room,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: { mode: Phaser.Scale.NONE, width, height, zoom: scaler.zoom },
  // order = draw order: cabinet at the bottom, monitor screens above it, the wipe on top
  scene: [
    BootScene,
    CabinetScene,
    LogoScene,
    HomeScene,
    OptionsScene,
    LobbyScene,
    FightScene,
    ResultScene,
    TransitionScene,
  ],
});

const audio = new AudioService(game, settings);
const flow = new SceneFlow(game, audio);
setContext(game, { input: new InputRouter(), scaler, settings, flow, lights: new CabinetLights(), audio });

settings.onChange((s) => scaler.setMode(s.scaling));
scaler.onChange((l) => {
  game.scale.resize(l.width, l.height);
  game.scale.setZoom(scaler.zoom);
});

// Dev tuning panel (npm run dev only; never in a release build). Toggle with the ` key.
if (import.meta.env.DEV) {
  void import('./dev/tuningPanel').then(({ mountTuningPanel }) =>
    mountTuningPanel({
      groups: [
        { file: 'apps/game/src/config/tuning.ts', title: 'Feel (live)', tree: tuning, expanded: true },
        {
          file: 'packages/core/src/config.ts (defaultRules)',
          title: 'Rules (next match)',
          tree: defaultRules,
        },
        {
          file: 'packages/core/src/config.ts (defaultTimings)',
          title: 'Phase timings (next match)',
          tree: defaultTimings,
        },
      ],
      restartMatch: () => flow.toFight({ mode: 'cpu', cpu: 'random' }),
    }),
  );
}

// A small read-only hook for the smoke tests: which screens are running, and the match phase.
(window as unknown as { __rps: object }).__rps = {
  scenes: () => game.scene.getScenes(true).map((s) => s.scene.key),
  phase: () => flow.activeSession?.snapshot().phase ?? null,
  scale: () => scaler.layout.scale,
  music: () => audio.music,
  version: VERSION,
};
