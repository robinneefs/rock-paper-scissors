// Makes every sound in the game: chiptune sound effects (WAV) and the two music loops (OGG + MP3).
// All of it is synthesised here from scratch, so the game owns it outright (no outside samples).
//
//   node tools/audio/make-audio.mjs          (needs ffmpeg on PATH for the music files)
//
// Output: apps/game/public/assets/audio/. Keys and variation counts must match apps/game/src/audio/sounds.ts.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Buffer32,
  foldLoop,
  hz,
  normalize,
  playArp,
  playDrums,
  playLine,
  rng,
  steps,
  trim,
  voice,
  wav,
} from './synth.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = join(ROOT, 'apps/game/public/assets/audio');
const SFX_SR = 22050;
const MUSIC_SR = 44100;

// ------------------------------------------------------------------ sound effects

/** Each entry: name -> (buf, variation index, random) => void. `variations` makes name_1..n. */
const sfx = {
  menuMove: {
    len: 0.08,
    make: (b) => voice(b, 0, { f0: 880, dur: 0.05, duty: 0.25, decay: 0.03, vol: 0.4 }),
  },
  menuSelect: {
    len: 0.2,
    make: (b) => {
      voice(b, 0, { f0: hz('C6'), dur: 0.05, duty: 0.25, vol: 0.4 });
      voice(b, 0.05, { f0: hz('G6'), dur: 0.12, duty: 0.25, decay: 0.05, vol: 0.4 });
    },
  },
  menuBack: {
    len: 0.2,
    make: (b) => {
      voice(b, 0, { f0: hz('G5'), dur: 0.05, duty: 0.25, vol: 0.4 });
      voice(b, 0.05, { f0: hz('C5'), dur: 0.1, duty: 0.25, decay: 0.05, vol: 0.4 });
    },
  },
  tick: {
    len: 0.08,
    make: (b) => {
      voice(b, 0, { f0: 1760, dur: 0.04, duty: 0.5, decay: 0.015, vol: 0.45 });
      voice(b, 0, { wave: 'noise', f0: 15000, dur: 0.01, decay: 0.004, vol: 0.2 });
    },
  },
  timeUp: {
    len: 0.5,
    make: (b) => {
      voice(b, 0, { wave: 'noise', f0: 3500, f1: 600, dur: 0.4, decay: 0.12, vol: 0.6 });
      voice(b, 0, { f0: 220, f1: 50, dur: 0.35, duty: 0.5, decay: 0.12, vol: 0.45 });
      voice(b, 0, { wave: 'sine', f0: 110, f1: 38, dur: 0.4, decay: 0.15, vol: 0.7 });
    },
  },
  lockIn: {
    len: 0.25,
    make: (b) => {
      voice(b, 0, { f0: hz('C5'), f1: hz('C6'), dur: 0.06, duty: 0.125, vol: 0.4 });
      voice(b, 0.06, { f0: hz('G6'), dur: 0.16, duty: 0.125, decay: 0.06, vol: 0.35 });
      voice(b, 0.06, { f0: hz('C7'), dur: 0.12, duty: 0.5, decay: 0.04, vol: 0.12 });
    },
  },
  whoosh: {
    len: 0.3,
    make: (b) =>
      voice(b, 0, {
        wave: 'noise',
        f0: 1500,
        f1: 9000,
        dur: 0.24,
        attack: 0.12,
        decay: 0.05,
        vol: 0.4,
        lowpass: 5000,
      }),
  },
  hitRock: {
    variations: 3,
    len: 0.4,
    make: (b, v, r) => {
      const p = [1, 0.88, 1.12][v];
      voice(b, 0, { wave: 'sine', f0: 190 * p, f1: 38, sweep: 0.15, dur: 0.3, decay: 0.1, vol: 0.9 });
      voice(b, 0, { f0: 120 * p, f1: 45, dur: 0.12, duty: 0.5, decay: 0.05, vol: 0.35 });
      voice(b, 0, {
        wave: 'noise',
        f0: 2600 * p,
        f1: 900,
        dur: 0.18,
        decay: 0.05,
        vol: 0.7,
        seed: 1 + Math.floor(r() * 99),
      });
    },
  },
  hitPaper: {
    variations: 3,
    len: 0.25,
    make: (b, v, r) => {
      const p = [1, 0.9, 1.1][v];
      voice(b, 0, {
        wave: 'noise',
        f0: 16000,
        dur: 0.07,
        decay: 0.02,
        vol: 0.8,
        highpass: 1500,
        seed: 1 + Math.floor(r() * 99),
      });
      voice(b, 0.012, { wave: 'noise', f0: 6000 * p, dur: 0.12, decay: 0.035, vol: 0.5, seed: 50 + v });
      voice(b, 0, { f0: 420 * p, f1: 180, dur: 0.06, duty: 0.25, decay: 0.03, vol: 0.3 });
    },
  },
  hitScissors: {
    variations: 3,
    len: 0.4,
    make: (b, v, r) => {
      const p = [1, 0.92, 1.08][v];
      voice(b, 0, { wave: 'saw', f0: 2600 * p, f1: 500, dur: 0.12, decay: 0.06, vol: 0.35 });
      voice(b, 0, { wave: 'metal', f0: 9000 * p, dur: 0.16, decay: 0.05, vol: 0.4 });
      voice(b, 0.02, { f0: 3136 * p, dur: 0.3, duty: 0.125, decay: 0.08, vol: 0.18 });
      voice(b, 0, {
        wave: 'noise',
        f0: 12000,
        dur: 0.06,
        decay: 0.02,
        vol: 0.4,
        seed: 1 + Math.floor(r() * 99),
      });
    },
  },
  clash: {
    variations: 2,
    len: 0.7,
    make: (b, v) => {
      const p = [1, 1.06][v];
      voice(b, 0, { f0: 1318 * p, dur: 0.55, duty: 0.5, decay: 0.16, vol: 0.25 });
      voice(b, 0, { f0: 1396 * p, dur: 0.55, duty: 0.25, decay: 0.16, vol: 0.25 });
      voice(b, 0, { f0: 2093 * p, dur: 0.35, duty: 0.125, decay: 0.08, vol: 0.12 });
      voice(b, 0, { wave: 'metal', f0: 7000 * p, dur: 0.25, decay: 0.06, vol: 0.45 });
      voice(b, 0, { wave: 'noise', f0: 14000, dur: 0.05, decay: 0.015, vol: 0.5, seed: 9 + v });
    },
  },
  ko: {
    len: 1.4,
    make: (b) => {
      voice(b, 0, { wave: 'noise', f0: 5000, f1: 500, dur: 1.2, decay: 0.35, vol: 0.8, seed: 77 });
      voice(b, 0, { f0: 220, f1: 30, dur: 0.8, duty: 0.5, decay: 0.3, vol: 0.4 });
      voice(b, 0, { wave: 'sine', f0: 90, f1: 28, dur: 1.0, decay: 0.35, vol: 0.9 });
      voice(b, 0.05, { wave: 'metal', f0: 2000, f1: 400, dur: 0.6, decay: 0.2, vol: 0.2 });
    },
  },
  roundStart: {
    len: 0.8,
    make: (b) => {
      const s = 0.075;
      ['C5', 'E5', 'G5'].forEach((n, i) => voice(b, i * s, { f0: hz(n), dur: s, duty: 0.25, vol: 0.4 }));
      voice(b, 3 * s, {
        f0: hz('C6'),
        dur: 0.45,
        duty: 0.25,
        decay: 0.2,
        sustain: 0.2,
        vol: 0.4,
        vib: 0.006,
      });
      voice(b, 3 * s, { f0: hz('G5'), dur: 0.45, duty: 0.5, decay: 0.2, vol: 0.15 });
    },
  },
  fight: {
    len: 0.6,
    make: (b) => {
      voice(b, 0, { wave: 'noise', f0: 9000, dur: 0.1, decay: 0.03, vol: 0.5, seed: 4 });
      voice(b, 0, { wave: 'sine', f0: 150, f1: 40, dur: 0.2, decay: 0.07, vol: 0.8 });
      for (const n of ['A4', 'C#5', 'E5', 'A5'])
        voice(b, 0.02, { f0: hz(n), dur: 0.45, duty: 0.25, decay: 0.12, sustain: 0.1, vol: 0.2 });
    },
  },
  winJingle: { len: 2.0, make: (b) => jingle(b, true) },
  loseJingle: { len: 2.2, make: (b) => jingle(b, false) },
};

function jingle(b, won) {
  const step = 60 / 150 / 4;
  const lead = { wave: 'square', duty: 0.25, decay: 0.25, sustain: 0.5, vol: 0.32, vib: 0.006 };
  const harm = { wave: 'square', duty: 0.125, decay: 0.25, sustain: 0.4, vol: 0.16 };
  const bass = { wave: 'tri', decay: 0.4, sustain: 0.6, vol: 0.5 };
  if (won) {
    playLine(b, steps('C5 E5 G5 C6 - G5 C6 - - - - - - - - -'), step, 0, lead);
    playLine(b, steps('G4 C5 E5 G5 - E5 G5 - - - - - - - - -'), step, 0, harm);
    playLine(b, steps('C3 . . . . . G2 C3 - - - - - - - -'), step, 0, bass);
    playDrums(b, steps('k . . . s . k s . . . . . . . .'), step, 0, 0.8);
  } else {
    playLine(b, steps('E5 - D#5 - D5 - C#5 - - - - - - - - -'), step * 1.4, 0, {
      ...lead,
      vib: 0.02,
      vibRate: 5,
    });
    playLine(b, steps('A3 - G#3 - G3 - F#3 - - - - - - - - -'), step * 1.4, 0, bass);
  }
}

// ------------------------------------------------------------------ music

/** Expands a chord list (one per bar) into a bass line. */
function bassLine(chords, pattern) {
  return chords.flatMap((c) => {
    const root = c.replace(/m7?|7|5/, '');
    return pattern.map((p) => (p === 'l' ? `${root}2` : p === 'h' ? `${root}3` : p));
  });
}

function arpLine(chords) {
  return chords.flatMap((c) => [c, ...Array(15).fill('-')]);
}

function song({ bpm, chords, lead, drums, bassPattern, echoBy }) {
  const step = 60 / bpm / 4;
  const total = chords.length * 16;
  const loopSec = total * step;
  const b = new Buffer32(MUSIC_SR, loopSec + 2);
  const leadTokens = lead.flatMap(steps);
  if (leadTokens.length !== total) throw new Error(`lead is ${leadTokens.length} steps, want ${total}`);
  // the echo wraps the end of the lead around to the start, so the loop stays seamless
  const echoTokens = [...leadTokens.slice(-echoBy), ...leadTokens.slice(0, -echoBy)];
  const drumTokens = drums.flatMap(steps);
  if (drumTokens.length !== total) throw new Error(`drums are ${drumTokens.length} steps, want ${total}`);

  playLine(b, leadTokens, step, 0, {
    wave: 'square',
    duty: 0.25,
    decay: 0.18,
    sustain: 0.55,
    vol: 0.2,
    vib: 0.005,
    release: 0.015,
  });
  playLine(b, echoTokens, step, 0, { wave: 'square', duty: 0.125, decay: 0.15, sustain: 0.4, vol: 0.07 });
  playArp(b, arpLine(chords), step, 0, { wave: 'square', duty: 0.125, vol: 0.045 }, 4);
  playLine(b, bassLine(chords, bassPattern), step, 0, {
    wave: 'tri',
    decay: 0.2,
    sustain: 0.7,
    vol: 0.42,
    release: 0.01,
  });
  playDrums(b, drumTokens, step, 0, 0.75);
  return normalize(foldLoop(b, loopSec), 0.8);
}

const menuSong = () =>
  song({
    bpm: 132,
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E', 'Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'],
    echoBy: 3,
    bassPattern: steps('l . h . l . h . l . h . l . h .'),
    lead: [
      'E5 - - - A5 - G5 - E5 - D5 - C5 - D5 -',
      'C5 - - - A4 - - - C5 - D5 - C5 - A4 -',
      'E5 - - - G5 - - - E5 - G5 - C6 - - -',
      'B5 - - - A5 - G5 - D5 - - - . . G4 -',
      'E5 - - - A5 - G5 - E5 - D5 - C5 - E5 -',
      'F5 - - - E5 - D5 - C5 - - - A4 - C5 -',
      'D5 - - - B4 - D5 - G5 - - - F5 - D5 -',
      'E5 - - - - - - - G#5 - - - B5 - - -',
      'A5 - . A5 B5 - C6 - B5 - A5 - E5 - - -',
      'F5 - . F5 G5 - A5 - G5 - F5 - C5 - - -',
      'G5 - . G5 A5 - G5 - E5 - C5 - E5 - G5 -',
      'D6 - - - B5 - - - G5 - - - D5 - - -',
      'C6 - - - B5 - A5 - E5 - - - A5 - - -',
      'A5 - G5 - F5 - E5 - F5 - - - C5 - - -',
      'B4 - D5 - G5 - B5 - D6 - - - B5 - - -',
      'B5 - - - G#5 - - - E5 - - - . . . .',
    ],
    drums: [
      ...Array(7).fill('k . h . s . h . k . k h s . h .'),
      'k . h . s . h s . s . s s s s s',
      ...Array(7).fill('k . h . s . h . k . k h s . o .'),
      'k . h . s . h s k . s . s s s s',
    ],
  });

const fightSong = () =>
  song({
    bpm: 156,
    chords: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'A', 'Gm', 'Gm', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'],
    echoBy: 2,
    bassPattern: steps('l . l h l . l h l . l h l . h l'),
    lead: [
      'D5 - - - - - A4 - D5 - F5 - E5 - D5 -',
      'C5 - D5 - - - - - A4 - - - . . . .',
      'F5 - - - - - D5 - F5 - Bb5 - A5 - F5 -',
      'G5 - - - E5 - - - C5 - - - E5 - G5 -',
      'A5 - - - - - F5 - A5 - D6 - C6 - A5 -',
      'G5 - A5 - - - - - F5 - - - E5 - - -',
      'D5 - - - F5 - - - Bb5 - - - A5 - G5 -',
      'A5 - - - - - - - C#6 - - - E6 - - -',
      'D6 - . D6 C6 - Bb5 - A5 - G5 - - - D5 -',
      'G5 - - - A5 - Bb5 - A5 - G5 - F5 - G5 -',
      'A5 - . A5 G5 - F5 - E5 - D5 - - - A4 -',
      'D5 - F5 - A5 - D6 - - - - - . . . .',
      'F6 - - - D6 - - - Bb5 - - - D6 - F6 -',
      'E6 - - - C6 - - - G5 - - - C6 - E6 -',
      'C#6 - - - A5 - - - E5 - - - A5 - C#6 -',
      'E6 - - - - - - - . . . . A5 - C#6 -',
    ],
    drums: [
      ...Array(7).fill('k . h k s . h . k k h . s . h h'),
      'k . h k s . h . s s . s s s s s',
      ...Array(7).fill('k . h k s . h k k . h k s . o h'),
      'k . s k s . s . s s s s s s s s',
    ],
  });

// ------------------------------------------------------------------ write

mkdirSync(join(OUT, 'sfx'), { recursive: true });
mkdirSync(join(OUT, 'music'), { recursive: true });

for (const [name, def] of Object.entries(sfx)) {
  const count = def.variations ?? 1;
  for (let v = 0; v < count; v++) {
    const b = new Buffer32(SFX_SR, def.len);
    def.make(b, v, rng(1000 + v * 31 + name.length));
    const file = count > 1 ? `${name}_${v + 1}.wav` : `${name}.wav`;
    writeFileSync(join(OUT, 'sfx', file), wav(trim(normalize(b))));
  }
}

const tmp = mkdtempSync(join(tmpdir(), 'rps-music-'));
try {
  for (const [name, make] of [
    ['menu', menuSong],
    ['fight', fightSong],
  ]) {
    const src = join(tmp, `${name}.wav`);
    writeFileSync(src, wav(make()));
    const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, ...args]);
    ff(['-c:a', 'libvorbis', '-q:a', '4', join(OUT, 'music', `${name}.ogg`)]);
    ff(['-c:a', 'libmp3lame', '-b:a', '112k', join(OUT, 'music', `${name}.mp3`)]);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(`audio written to ${OUT}`);
