import type { PixelBuffer } from '../assets/placeholders/PixelBuffer';
import { paintCastle } from '../assets/placeholders/stages/castle';
import { paintField } from '../assets/placeholders/stages/field';
import { paintStreet } from '../assets/placeholders/stages/street';

/**
 * The fight stages. Each match is fought on one of these, picked at random (see stageFor).
 * To add a stage: write a painter in assets/placeholders/stages/ and add a line here.
 * To remove one: delete its line. Real art can replace a placeholder by loading an image
 * under the stage's texture key (stageTexture) in BootScene.
 */
export interface StageDef {
  /** Short and unique; also used in the texture key and the ?stage= test link. */
  id: string;
  name: string;
  /** Paints the 216x216 placeholder backdrop. The fighters stand at STAGE.floorY. */
  paint: () => PixelBuffer;
}

export const STAGES: readonly StageDef[] = [
  { id: 'street', name: 'Night Street', paint: paintStreet },
  { id: 'field', name: 'Sunny Field', paint: paintField },
  { id: 'castle', name: 'Castle Roof', paint: paintCastle },
];

export const stageTexture = (id: string): string => `stage-${id}`;

/**
 * The stage for a match. `seed` comes from the session (both online players get the same one);
 * `override` is a stage id from the ?stage= link, for trying a stage out.
 */
export function stageFor(seed: number, override?: string | null): StageDef {
  const forced = STAGES.find((s) => s.id === override);
  if (forced) return forced;
  const n = STAGES.length;
  return STAGES[((Math.floor(seed) % n) + n) % n]!;
}
