// The paper reed's buzz, at its real frequency (the picture is slowed; the sound is not): a bright sawtooth through a
// soft low-pass, with a little breath noise, faded in and out. Synthesized with Web Audio, no files; silent with
// sound=0 and until the student's first tap (browsers require a gesture). The kit's createAudio has only short UI
// sounds, so the figure keeps this one itself.
export function createBuzz(enabled = true) {
  let ctx = null;
  let osc = null;
  let gain = null;
  let lp = null;
  let noise = null;
  let on = enabled;

  function ensure() {
    if (!on) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || /** @type {any} */ (window).webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  function start(freq) {
    const c = ensure();
    if (!c) return;
    stop(0.02);
    const t = c.currentTime;
    osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    // a slight wobble, as a real breath gives
    const lfo = c.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoGain = c.createGain();
    lfoGain.gain.value = freq * 0.006;
    lfo.connect(lfoGain).connect(osc.frequency);
    lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(4000, freq * 6);
    lp.Q.value = 0.7;
    gain = c.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.12);
    const len = c.sampleRate;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noise = c.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.8;
    const ng = c.createGain();
    ng.gain.value = 0.18;
    noise.connect(bp).connect(ng).connect(gain);
    osc.connect(lp).connect(gain).connect(c.destination);
    osc.start(t);
    lfo.start(t);
    noise.start(t);
    osc.onended = () => {
      lfo.stop();
    };
  }

  function stop(release = 0.18) {
    if (!ctx || !osc) return;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + release);
    osc.stop(t + release + 0.02);
    noise.stop(t + release + 0.02);
    osc = null;
    noise = null;
  }

  return {
    unlock: ensure,
    start,
    stop,
    get playing() {
      return Boolean(osc);
    },
    setEnabled(v) {
      on = v;
      if (!v) stop();
    },
  };
}
