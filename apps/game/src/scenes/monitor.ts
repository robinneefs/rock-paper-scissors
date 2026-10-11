import type Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { getContext } from './context';

/**
 * Places a scene's main camera over the cabinet's monitor, so the scene draws in its own
 * 216 x 216 space wherever the cabinet sits in the window. Follows window resizes.
 */
export function useMonitorCamera(scene: Phaser.Scene): Phaser.Cameras.Scene2D.Camera {
  const { scaler } = getContext(scene);
  const cam = scene.cameras.main;
  const place = () => {
    const l = scaler.layout;
    cam.setViewport(l.cabinetX + MONITOR.x, l.cabinetY + MONITOR.y, MONITOR.width, MONITOR.height);
  };
  place();
  const off = scaler.onChange(place);
  scene.events.once('shutdown', off);
  return cam;
}
