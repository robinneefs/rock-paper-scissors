import type { Move } from '@rps/core';

/**
 * Every sound the game plays, by key. The files are made by tools/audio/make-audio.mjs and live in
 * public/assets/audio/. A sound with variations has files name_1..n and plays one at random, so
 * repeated hits don't sound the same.
 */
export const SFX = {
  menuMove: 1,
  menuSelect: 1,
  menuBack: 1,
  tick: 1,
  timeUp: 1,
  lockIn: 1,
  whoosh: 1,
  hitRock: 3,
  hitPaper: 3,
  hitScissors: 3,
  clash: 2,
  ko: 1,
  roundStart: 1,
  fight: 1,
  winJingle: 1,
  loseJingle: 1,
} as const satisfies Record<string, number>;

export type SfxKey = keyof typeof SFX;

export const MUSIC = ['menu', 'fight'] as const;
export type MusicKey = (typeof MUSIC)[number];

/** The hit sound for the move that landed. */
export const HIT_SFX: Record<Move, SfxKey> = { rock: 'hitRock', paper: 'hitPaper', scissors: 'hitScissors' };

/** Cache keys of the loaded files (one per variation). */
export const sfxFileKeys = (key: SfxKey): string[] =>
  SFX[key] === 1 ? [`sfx.${key}`] : Array.from({ length: SFX[key] }, (_, i) => `sfx.${key}_${i + 1}`);

export const musicFileKey = (key: MusicKey): string => `music.${key}`;

/** What to load: cache key -> URLs (music in two formats; the browser takes the first it can play). */
export function audioFiles(): { key: string; urls: string[] }[] {
  const files: { key: string; urls: string[] }[] = [];
  for (const key of Object.keys(SFX) as SfxKey[])
    for (const fileKey of sfxFileKeys(key))
      files.push({ key: fileKey, urls: [`assets/audio/sfx/${fileKey.slice('sfx.'.length)}.wav`] });
  for (const key of MUSIC)
    files.push({
      key: musicFileKey(key),
      urls: ['ogg', 'mp3'].map((ext) => `assets/audio/music/${key}.${ext}`),
    });
  return files;
}

/** The part of the audio service views and the director use: fire a sound effect. */
export interface SfxPlayer {
  /** `detune` in cents (100 = a semitone up); `volume` scales this one play. */
  play(key: SfxKey, opts?: { detune?: number; volume?: number }): void;
}
