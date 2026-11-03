// The calling bell's own sound, synthesized (no audio files): at every strike of the hammer, a short metallic ring
// of a few inharmonic partials, as a small gong rings. Its loudness follows the air left in the jar (the app sets it),
// so the sound fades as the pump takes the air out, and comes back with the air. Off with ?sound=0; it starts only
// after the student's first tap (browsers allow sound only then), and it is silent while the figure is hidden.

/** A gong's partials: frequency ratios, their share and how long each rings (s). */
const PARTIALS = [
  { k: 1, g: 0.55, d: 0.5 },
  { k: 2.32, g: 0.3, d: 0.32 },
  { k: 4.25, g: 0.16, d: 0.2 },
  { k: 6.63, g: 0.08, d: 0.12 },
];
const F0 = 1180;

export function createBellSound(enabled = true) {
  let ctx = null;
  let master = null;
  let on = enabled;
  let level = 1;

  function ensure() {
    if (!on) return null;
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || /** @type {any} */ (window).webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.22 * level;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  return {
    /** Wake the audio from a user gesture. */
    unlock: ensure,
    get ready() {
      return Boolean(ctx && ctx.state === 'running');
    },
    setEnabled(v) {
      on = v;
      if (!v && master) master.gain.value = 0;
    },
    /** How loud (0–1): follows the air left. */
    setLevel(v) {
      level = Math.max(0, Math.min(1, v));
      if (master && ctx) master.gain.setTargetAtTime(0.22 * level, ctx.currentTime, 0.05);
    },
    /** One strike of the hammer. */
    strike() {
      if (!on || !ctx || ctx.state !== 'running' || level < 0.01 || document.hidden) return;
      const t = ctx.currentTime;
      for (const p of PARTIALS) {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = F0 * p.k;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(p.g, t + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, t + p.d);
        o.connect(g).connect(master);
        o.start(t);
        o.stop(t + p.d + 0.02);
      }
    },
    dispose() {
      ctx?.close?.();
      ctx = null;
    },
  };
}
