import type Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { tuning } from '../config/tuning';

/** The menu screens' background: the backdrop with thin diagonal stripes drifting slowly over it. */
export function addMenuBackdrop(scene: Phaser.Scene): void {
  scene.add.image(0, 0, Tex.menuBackdrop).setOrigin(0);
  const stripes = scene.add.tileSprite(0, 0, MONITOR.width, MONITOR.height, Tex.menuStripes).setOrigin(0);
  scene.time.addEvent({
    delay: tuning.menu.stripeStepMs,
    loop: true,
    callback: () => stripes.setTilePosition(stripes.tilePositionX + 1, 0),
  });
}
