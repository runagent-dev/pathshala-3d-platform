// Small synthesized UI sounds (no audio files). Created lazily on the first user gesture.
export function createAudio(enabled = true) {
  let ctx = null;
  let master = null;
  let on = enabled;
  let lastTick = 0;

  function ensure() {
    if (!on) return null;
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.5;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  function noiseBurst({ freq = 3000, q = 4, dur = 0.025, gain = 0.25, delay = 0 }) {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime + delay;
    const len = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(bp).connect(g).connect(master);
    src.start(t);
  }

  function tone({ freq = 880, dur = 0.12, gain = 0.12, type = 'sine', delay = 0 }) {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  return {
    get enabled() {
      return on;
    },
    setEnabled(v) {
      on = v;
    },
    /** Wake the audio context from a user gesture (browsers require this). */
    unlock: ensure,
    tick() {
      const now = performance.now();
      if (now - lastTick < 28) return;
      lastTick = now;
      noiseBurst({ freq: 5200, q: 6, dur: 0.012, gain: 0.06 });
    },
    contact() {
      noiseBurst({ freq: 2400, q: 3, dur: 0.03, gain: 0.35 });
      noiseBurst({ freq: 900, q: 2, dur: 0.05, gain: 0.12, delay: 0.004 });
    },
    lock(locked) {
      noiseBurst({ freq: locked ? 1800 : 2600, q: 5, dur: 0.02, gain: 0.25 });
      noiseBurst({ freq: locked ? 1400 : 3200, q: 5, dur: 0.02, gain: 0.2, delay: 0.06 });
    },
    success() {
      tone({ freq: 784, dur: 0.16, gain: 0.1 });
      tone({ freq: 1175, dur: 0.28, gain: 0.1, delay: 0.09 });
    },
    error() {
      tone({ freq: 220, dur: 0.18, gain: 0.08, type: 'triangle' });
    },
    pop() {
      tone({ freq: 660, dur: 0.08, gain: 0.06 });
    },
  };
}
