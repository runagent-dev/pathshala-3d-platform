// The call as a human voice, made in code (no audio files): a boy's voice, a glottal source at about 225 → 195 Hz (a
// slight fall), breath noise for the opening /h/, through three formant resonators that move from the vowel of the
// first syllable, /æ/, through /l/ to /o/, with an amplitude envelope that dips at the /l/. synthCall() is a pure function
// (tested in test/unit/echo.test.mjs). createVoice() plays the one buffer twice through Web Audio: the call now, and the
// same samples, quieter and a little low-passed (a cliff returns less of the high sounds), exactly delay seconds later.
import { CALL } from './reading.js';

/**
 * The word, one row per moment: [t (s), F1, F2, F3 (Hz), voice, breath]; linear between rows. Bandwidths are fixed.
 * /h/ is breath through the vowel that follows, /l/ a low F1 and F2 with the voice dipping.
 */
const WORD = [
  [0, 800, 1900, 2700, 0, 0],
  [0.03, 800, 1900, 2700, 0, 0.55],
  [0.055, 800, 1900, 2700, 0.8, 0.22],
  [0.08, 820, 1880, 2650, 1, 0.05],
  [0.14, 760, 1700, 2600, 0.95, 0.02],
  [0.18, 420, 1150, 2700, 0.5, 0],
  [0.2, 420, 1050, 2750, 0.55, 0],
  [0.24, 520, 900, 2600, 1, 0.02],
  [0.31, 480, 840, 2550, 0.8, 0.02],
  [CALL, 460, 820, 2500, 0, 0],
];
const BANDWIDTH = [110, 130, 190]; // Hz
export const F0_START = 225;
export const F0_END = 195;

/** The row at time t, by straight lines between the rows of WORD. */
export function wordAt(t) {
  let i = 0;
  while (i < WORD.length - 2 && t >= WORD[i + 1][0]) i++;
  const a = WORD[i];
  const b = WORD[i + 1];
  const k = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
  return a.map((v, j) => v + (b[j] - v) * k);
}

/** One period of the glottal flow (rises for 60 %, falls fast, closed for the rest), φ in 0…1. */
function glottal(phase) {
  if (phase < 0.6) return 0.5 * (1 - Math.cos((Math.PI * phase) / 0.6));
  if (phase < 0.8) return Math.cos((Math.PI / 2) * ((phase - 0.6) / 0.2));
  return 0;
}

/** The word's samples at this sample rate: a Float32Array of CALL seconds, peak 0.9. */
export function synthCall(rate = 44100) {
  const n = Math.round(CALL * rate);
  const out = new Float32Array(n);
  const y1 = [0, 0, 0];
  const y2 = [0, 0, 0];
  let phase = 0;
  let lastFlow = 0;
  let seed = 12345; // the same word every time
  const noise = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 2147483648 - 1;
  };
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const [, f1, f2, f3, voice, breath] = wordAt(t);
    const f0 = F0_START + (F0_END - F0_START) * (t / CALL) ** 1.2;
    phase += f0 / rate;
    if (phase >= 1) phase -= 1;
    const flow = glottal(phase);
    // the mouth radiates the flow's change, not the flow
    let x = (flow - lastFlow) * 6 * voice + noise() * 0.28 * breath;
    lastFlow = flow;
    const F = [f1, f2, f3];
    for (let j = 0; j < 3; j++) {
      // a two-pole resonator (band-pass round the formant), unity gain at 0 Hz; in series, as the vocal tract is
      const r = Math.exp((-Math.PI * BANDWIDTH[j]) / rate);
      const b = 2 * r * Math.cos((2 * Math.PI * F[j]) / rate);
      const c = -r * r;
      const y = (1 - b - c) * x + b * y1[j] + c * y2[j];
      y2[j] = y1[j];
      y1[j] = y;
      x = y;
    }
    out[i] = x;
    peak = Math.max(peak, Math.abs(x));
  }
  const edge = Math.round(0.003 * rate);
  for (let i = 0; i < n; i++) out[i] *= (0.9 / (peak || 1)) * Math.min(1, i / edge, (n - 1 - i) / edge);
  return out;
}

/** audio: the kit's createAudio() (its unlock() gives the context, or null with sound off). */
export function createVoice(audio) {
  /** @type {AudioBuffer | null} */
  let buffer = null;
  /** @type {AudioBufferSourceNode[]} */
  let live = [];
  function stop() {
    for (const node of live) {
      try {
        node.stop();
      } catch {}
    }
    live = [];
  }
  /** The call now and its echo exactly delay seconds after it. */
  function play(delay) {
    const c = audio.unlock();
    if (!c) return;
    stop();
    if (!buffer) {
      const samples = synthCall(c.sampleRate);
      buffer = c.createBuffer(1, samples.length, c.sampleRate);
      buffer.copyToChannel(samples, 0);
    }
    const at = c.currentTime + 0.02;
    const send = (start, gain, cutoff) => {
      const src = c.createBufferSource();
      src.buffer = buffer;
      const g = c.createGain();
      g.gain.value = gain;
      if (cutoff) {
        const low = c.createBiquadFilter();
        low.type = 'lowpass';
        low.frequency.value = cutoff;
        src.connect(low).connect(g);
      } else src.connect(g);
      g.connect(c.destination);
      src.start(start);
      live.push(src);
    };
    send(at, 0.5, 0);
    send(at + delay, 0.24, 2600);
  }
  return { play, stop };
}
