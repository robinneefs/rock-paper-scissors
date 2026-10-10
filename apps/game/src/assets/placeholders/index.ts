import type Phaser from 'phaser';
import { css, fighterColors, palette } from '../../config/palette';
import { FighterFrames, Tex } from '../keys';
import { BUTTON_FRAME, paintButtons, paintCabinet, paintJoystickBall, paintRoomTile } from './cabinet';
import { FIGHTER_FRAME, paintFighter } from './fighters';
import { ICON, paintIcons } from './icons';
import type { PixelBuffer } from './PixelBuffer';
import { paintStage } from './stage';

/**
 * Generates every placeholder texture under its real asset key. When a real sprite sheet is loaded
 * under the same key in BootScene, the placeholder for it is skipped: the art swap touches no view.
 */
export function generatePlaceholders(scene: Phaser.Scene): void {
  const add = (key: string, buf: PixelBuffer, frames?: (tex: Phaser.Textures.CanvasTexture) => void) => {
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, buf.width, buf.height);
    if (!tex) throw new Error(`Could not create texture ${key}`);
    tex
      .getContext()
      .putImageData(new ImageData(new Uint8ClampedArray(buf.data), buf.width, buf.height), 0, 0);
    frames?.(tex);
    tex.refresh();
  };

  add(Tex.room, paintRoomTile());
  add(Tex.cabinet, paintCabinet());
  add(Tex.stage, paintStage());
  add(Tex.joystickBall, paintJoystickBall());
  add(Tex.buttons, paintButtons(), (tex) => {
    (['attack', 'throw', 'block'] as const).forEach((m, row) =>
      BUTTON_FRAME.states.forEach((state, i) =>
        tex.add(
          `${m}-${state}`,
          0,
          i * BUTTON_FRAME.width,
          row * BUTTON_FRAME.height,
          BUTTON_FRAME.width,
          BUTTON_FRAME.height,
        ),
      ),
    );
  });
  add(Tex.icons, paintIcons(), (tex) =>
    ICON.frames.forEach((name, i) => tex.add(name, 0, i * ICON.size, 0, ICON.size, ICON.size)),
  );
  for (const [key, colors] of [
    [Tex.fighterP1, fighterColors.p1],
    [Tex.fighterP2, fighterColors.p2],
  ] as const) {
    add(key, paintFighter(colors), (tex) =>
      FighterFrames.forEach((frame, i) =>
        tex.add(frame, 0, i * FIGHTER_FRAME.width, 0, FIGHTER_FRAME.width, FIGHTER_FRAME.height),
      ),
    );
  }
  if (!scene.textures.exists(Tex.dither)) {
    const d = scene.textures.createCanvas(Tex.dither, 2, 2);
    if (d) {
      d.getContext().fillStyle = css(palette.panel);
      d.getContext().fillRect(0, 0, 1, 1);
      d.getContext().fillRect(1, 1, 1, 1);
      d.refresh();
    }
  }
}
