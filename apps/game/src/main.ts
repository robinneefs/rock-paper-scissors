import Phaser from 'phaser';
import { palette } from './config/palette';
import { InputRouter } from './input/InputRouter';
import { PixelScaler } from './platform/PixelScaler';
import { browserStore, SettingsStore } from './platform/settings';
import { BootScene } from './scenes/BootScene';
import { CabinetScene } from './scenes/CabinetScene';
import { CabinetLights, setContext } from './scenes/context';
import { FightScene } from './scenes/FightScene';
import { SceneFlow } from './scenes/flow';
import { HomeScene } from './scenes/HomeScene';
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
    FightScene,
    ResultScene,
    TransitionScene,
  ],
});

const flow = new SceneFlow(game);
setContext(game, { input: new InputRouter(), scaler, settings, flow, lights: new CabinetLights() });

settings.onChange((s) => scaler.setMode(s.scaling));
scaler.onChange((l) => {
  game.scale.resize(l.width, l.height);
  game.scale.setZoom(scaler.zoom);
});

// A small read-only hook for the smoke tests: which screens are running, and the match phase.
(window as unknown as { __rps: object }).__rps = {
  scenes: () => game.scene.getScenes(true).map((s) => s.scene.key),
  phase: () => flow.activeSession?.snapshot().phase ?? null,
  scale: () => scaler.layout.scale,
  version: VERSION,
};
