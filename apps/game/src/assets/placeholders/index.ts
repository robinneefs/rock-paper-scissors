import type Phaser from 'phaser';
import { css, fighterColors, palette } from '../../config/palette';
import { STAGES, stageTexture } from '../../config/stages';
import { FighterFrames, Tex } from '../keys';
import {
  BUTTON_FRAME,
  BUTTON_RING,
  paintButtonRings,
  paintButtons,
  paintCabinet,
  paintJoystickBall,
  paintRoomTile,
} from './cabinet';
import { FIGHTER_FRAME, paintFighter } from './fighters';
import { BADGE, paintBadges } from './icons';
import { paintKoLetters } from './koLetters';
import type { PixelBuffer } from './PixelBuffer';
import { paintMenuBackdrop, paintMenuStripes } from './menu';

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
  add(Tex.menuBackdrop, paintMenuBackdrop());
  add(Tex.menuStripes, paintMenuStripes());
  for (const stage of STAGES) add(stageTexture(stage.id), stage.paint());
  add(Tex.joystickBall, paintJoystickBall());
  add(Tex.koLetters, paintKoLetters());
  add(Tex.buttons, paintButtons(), (tex) => {
    (['rock', 'paper', 'scissors'] as const).forEach((m, row) =>
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
  add(Tex.buttonRings, paintButtonRings(), (tex) => {
    (['rock', 'paper', 'scissors'] as const).forEach((m, row) => {
      for (let f = 0; f < BUTTON_RING.frames; f++)
        tex.add(
          `${m}-${f}`,
          0,
          f * BUTTON_RING.width,
          row * BUTTON_RING.height,
          BUTTON_RING.width,
          BUTTON_RING.height,
        );
    });
  });
  add(Tex.badges, paintBadges(), (tex) =>
    BADGE.moves.forEach((m, row) =>
      BADGE.states.forEach((state, i) =>
        tex.add(`${m}-${state}`, 0, i * BADGE.size, row * BADGE.size, BADGE.size, BADGE.size),
      ),
    ),
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
