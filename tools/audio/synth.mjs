// A tiny chiptune synth: pulse, triangle, saw and NES-style noise voices with envelopes and pitch
// sweeps, a step sequencer for music, and a 16-bit WAV writer. No dependencies.

export class Buffer32 {
  constructor(sr, seconds) {
    this.sr = sr;
    this.data = new Float32Array(Math.ceil(sr * seconds));
  }
}

/** Seeded random numbers, so every run makes the same files. */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'A4' -> 440, 'C#5', 'Bb3'. */
export function hz(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  const semis = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * 2 ** ((semis - 69) / 12);
}

/**
 * Adds one voice to the buffer.
 * wave: square | tri | saw | sine | noise | metal (short-loop noise, sounds metallic)
 * f0 -> f1: pitch sweep (exponential) over `sweep` seconds (default the whole note).
 * For noise, f is the rate the noise changes value (low = rumble, high = hiss).
 * Envelope: linear attack, then exponential decay toward `sustain`, then a short release at the end.
 */
export function voice(buf, at, o) {
  const sr = buf.sr;
  const {
    wave = 'square',
    f0,
    f1 = f0,
    sweep = o.dur,
    dur,
    vol = 0.5,
    duty = 0.5,
    attack = 0.002,
    decay = Infinity,
    sustain = 0,
    release = 0.01,
    vib = 0,
    vibRate = 6,
    vibDelay = 0.12,
    lowpass = 0,
    highpass = 0,
    seed = 1,
  } = o;
  const start = Math.round(at * sr);
  const n = Math.round(dur * sr);
  const rand = rng(seed);
  let phase = 0;
  let lfsr = 1;
  let noiseVal = 1;
  let lp = 0;
  let hpPrev = 0;
  let hpOut = 0;
  const lpA = lowpass ? 1 - Math.exp((-2 * Math.PI * lowpass) / sr) : 1;
  const hpA = highpass ? 1 / (1 + (2 * Math.PI * highpass) / sr) : 0;
  for (let i = 0; i < n; i++) {
    const idx = start + i;
    if (idx < 0) continue;
    if (idx >= buf.data.length) break;
    const t = i / sr;
    let f = f0 * (f1 / f0) ** Math.min(1, t / sweep);
    if (vib && t > vibDelay) f *= 1 + vib * Math.sin(2 * Math.PI * vibRate * (t - vibDelay));
    const prev = phase;
    phase += f / sr;
    const p = phase % 1;
    let s;
    switch (wave) {
      case 'square':
        // centred on zero, so narrow pulses don't add a DC offset
        s = (p < duty ? 1 : -1) - (2 * duty - 1);
        break;
      case 'tri':
        // 16-step triangle, like the NES
        s = Math.round((4 * Math.abs(p - 0.5) - 1) * 7.5) / 7.5;
        break;
      case 'saw':
        s = 2 * p - 1;
        break;
      case 'sine':
        s = Math.sin(2 * Math.PI * p);
        break;
      case 'noise':
        if (Math.floor(phase) !== Math.floor(prev)) noiseVal = rand() * 2 - 1;
        s = noiseVal;
        break;
      case 'metal':
        // 15-bit LFSR in short mode (tap bit 6): a repeating, ringing noise
        if (Math.floor(phase) !== Math.floor(prev)) {
          const bit = (lfsr ^ (lfsr >> 6)) & 1;
          lfsr = (lfsr >> 1) | (bit << 14);
          noiseVal = lfsr & 1 ? 1 : -1;
        }
        s = noiseVal;
        break;
      default:
        throw new Error(`bad wave ${wave}`);
    }
    if (lowpass) s = lp += lpA * (s - lp);
    if (highpass) {
      hpOut = hpA * (hpOut + s - hpPrev);
      hpPrev = s;
      s = hpOut;
    }
    let env = t < attack ? t / attack : sustain + (1 - sustain) * Math.exp(-(t - attack) / decay);
    const left = dur - t;
    if (left < release) env *= left / release;
    buf.data[idx] += s * env * vol;
  }
}

/** Removes any DC offset (a 20 Hz high-pass), then scales so the loudest sample hits `peak`, with a gentle soft clip. */
export function normalize(buf, peak = 0.89) {
  const a = 1 / (1 + (2 * Math.PI * 20) / buf.sr);
  let prevIn = 0;
  let prevOut = 0;
  for (let i = 0; i < buf.data.length; i++) {
    const x = buf.data[i];
    prevOut = a * (prevOut + x - prevIn);
    prevIn = x;
    buf.data[i] = prevOut;
  }
  let max = 0;
  for (const v of buf.data) max = Math.max(max, Math.abs(v));
  if (!max) return buf;
  const g = peak / max;
  for (let i = 0; i < buf.data.length; i++) buf.data[i] = Math.tanh(buf.data[i] * g * 1.1) / Math.tanh(1.1);
  return buf;
}

/** Cut trailing silence (keeps sound effects short), with a short fade at the end. */
export function trim(buf, threshold = 0.002) {
  let end = buf.data.length;
  while (end > 1 && Math.abs(buf.data[end - 1]) < threshold) end--;
  buf.data = buf.data.slice(0, Math.min(buf.data.length, end + Math.round(buf.sr * 0.01)));
  // fade the last 10 ms out, so a sound cut off mid-note ends without a click
  const fade = Math.min(buf.data.length, Math.round(buf.sr * 0.01));
  for (let i = 0; i < fade; i++) buf.data[buf.data.length - 1 - i] *= i / fade;
  return buf;
}

export function wav(buf) {
  const n = buf.data.length;
  const out = new DataView(new ArrayBuffer(44 + n * 2));
  const str = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  out.setUint32(4, 36 + n * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true); // PCM
  out.setUint16(22, 1, true); // mono
  out.setUint32(24, buf.sr, true);
  out.setUint32(28, buf.sr * 2, true);
  out.setUint16(32, 2, true);
  out.setUint16(34, 16, true);
  str(36, 'data');
  out.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, buf.data[i]));
    out.setInt16(44 + i * 2, Math.round(v * 32767), true);
  }
  return new Uint8Array(out.buffer);
}

// ---------------------------------------------------------------- sequencer

const CHORD = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], 5: [0, 7, 12] };

/** 'Am' -> frequencies of A minor in the given octave. */
export function chord(name, octave) {
  const m = /^([A-G][#b]?)(m7|m|7|5)?$/.exec(name);
  if (!m) throw new Error(`bad chord ${name}`);
  const root = hz(`${m[1]}${octave}`);
  return CHORD[m[2] ?? ''].map((s) => root * 2 ** (s / 12));
}

/**
 * One melodic line, one token per step: a note ('E5', 'G#4') starts a note, '-' holds it,
 * '.' is silence. `patch` is the voice() options without pitch and length.
 */
export function playLine(buf, tokens, stepSec, at, patch) {
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok === '-' || tok === '.') continue;
    let len = 1;
    while (tokens[i + len] === '-') len++;
    voice(buf, at + i * stepSec, { ...patch, f0: hz(tok), dur: len * stepSec, seed: i + 1 });
  }
}

/** Arpeggiated chords (the classic chip trick): one chord name per step, '-' holds, '.' rests. */
export function playArp(buf, tokens, stepSec, at, patch, octave = 4, rate = 1 / 50) {
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok === '-' || tok === '.') continue;
    let len = 1;
    while (tokens[i + len] === '-') len++;
    const notes = chord(tok, octave);
    const total = len * stepSec;
    for (let t = 0, k = 0; t < total - 1e-6; t += rate, k++) {
      const f = notes[k % notes.length];
      voice(buf, at + i * stepSec + t, { ...patch, f0: f, dur: Math.min(rate, total - t), release: 0.002 });
    }
  }
}

/** Drum kit for the music. k kick, s snare, h hat, o open hat, '.' nothing. */
export function playDrums(buf, tokens, stepSec, at, vol = 1) {
  tokens.forEach((tok, i) => {
    const t = at + i * stepSec;
    if (tok === 'k') {
      voice(buf, t, { wave: 'tri', f0: 160, f1: 42, sweep: 0.09, dur: 0.16, decay: 0.07, vol: 0.55 * vol });
      voice(buf, t, { wave: 'noise', f0: 3000, dur: 0.012, decay: 0.004, vol: 0.12 * vol, seed: i });
    } else if (tok === 's') {
      voice(buf, t, { wave: 'noise', f0: 11000, dur: 0.16, decay: 0.05, vol: 0.32 * vol, seed: i + 7 });
      voice(buf, t, { wave: 'tri', f0: 240, f1: 150, dur: 0.07, decay: 0.03, vol: 0.3 * vol });
    } else if (tok === 'h') {
      voice(buf, t, {
        wave: 'noise',
        f0: 20000,
        dur: 0.035,
        decay: 0.012,
        vol: 0.12 * vol,
        highpass: 5000,
        seed: i + 3,
      });
    } else if (tok === 'o') {
      voice(buf, t, {
        wave: 'noise',
        f0: 20000,
        dur: 0.14,
        decay: 0.06,
        vol: 0.1 * vol,
        highpass: 5000,
        seed: i + 5,
      });
    } else if (tok !== '.') throw new Error(`bad drum ${tok}`);
  });
}

/** Splits a bar string into tokens. */
export const steps = (s) => s.trim().split(/\s+/);

/**
 * Makes a buffer loop seamlessly: everything that rings past the loop end (echoes, releases)
 * is folded back onto the start, then the buffer is cut to exactly the loop length.
 */
export function foldLoop(buf, loopSec) {
  const n = Math.round(loopSec * buf.sr);
  for (let i = n; i < buf.data.length; i++) buf.data[i - n] += buf.data[i];
  buf.data = buf.data.slice(0, n);
  return buf;
}
