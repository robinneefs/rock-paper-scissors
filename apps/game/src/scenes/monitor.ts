import type Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { useScreenShader } from '../fx/crt';
import { getContext } from './context';

/**
 * Places a scene's main camera over the cabinet's monitor, so the scene draws in its own
 * 216 x 216 space wherever the cabinet sits in the window. Follows window resizes and the
 * cabinet shake.
 */
export function useMonitorCamera(scene: Phaser.Scene): Phaser.Cameras.Scene2D.Camera {
  const { scaler, cabinetShake } = getContext(scene);
  const cam = scene.cameras.main;
  const place = () => {
    const l = scaler.layout;
    const o = cabinetShake.offset;
    cam.setViewport(
      l.cabinetX + MONITOR.x + o.x,
      l.cabinetY + MONITOR.y + o.y,
      MONITOR.width,
      MONITOR.height,
    );
  };
  place();
  useScreenShader(cam);
  const offs = [scaler.onChange(place), cabinetShake.onMove(place)];
  scene.events.once('shutdown', () => offs.forEach((off) => off()));
  return cam;
}
