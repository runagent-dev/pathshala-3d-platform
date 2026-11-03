// The maths of the paper vocal cord (book pages 198–199, topic 7.3, চিত্র ৭.১০). Pure functions, no three.js, unit-tested
// in test/unit/paper-vocal-cord.test.mjs.
//
// The honest model: each cut paper flap is a thin strip held at one end (a cantilever), clamped at its hinge in the
// folded sheet and free at the fold. Its lowest natural frequency is
//   f = (1.875² / 2π) · (t / L²) · √(E / 12ρ)
// with t the paper's thickness, L the flap's length (hinge to free edge), E its stiffness (Young's modulus) and ρ its
// density. Ordinary writing paper: t = 0.1 mm, E ≈ 3 GPa, ρ ≈ 800 kg/m³. A real paper reed's note also depends on
// how hard you blow, so the figure always says "প্রায়" and rounds to 10 Hz.

/** Speed of sound in air, as the chapter's examples use it (m/s). */
export const V_SOUND = 330;
/** Paper: thickness (m), Young's modulus (Pa), density (kg/m³). */
export const PAPER = { t: 0.1e-3, E: 3e9, rho: 800 };
/** The three cuts, the row of words in the panel: the flap's length in mm. */
export const CUTS = { long: { L: 14 }, mid: { L: 10 }, short: { L: 7 } };
export const CUT_IDS = /** @type {const} */ (['long', 'mid', 'short']);
/** The picture slows time this many times (the flaps' flutter and the wave's travel). */
export const SLOW = 100;
/** The drawn wavelength is this fraction of the real one (a 1 m wave drawn 30 mm long in a scene in mm). */
export const LAMBDA_SCALE = 0.03;

/** The flap's lowest natural frequency (Hz), for a length L in mm. */
export function flapFrequency(Lmm, paper = PAPER) {
  const L = Lmm / 1000;
  const beta = 1.875104;
  return ((beta * beta) / (2 * Math.PI)) * (paper.t / (L * L)) * Math.sqrt(paper.E / (12 * paper.rho));
}

/** Rounds without binary leftovers. */
export function roundTo(x, step) {
  const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return +(Math.round(x / step) * step).toFixed(d);
}

/** The frequency the figure shows for a cut: rounded to 10 Hz ("প্রায়"). */
export function shownFrequency(id) {
  return roundTo(flapFrequency(CUTS[id].L), 10);
}

/** λ = v / f in m, from the frequency shown (so the numbers on screen agree), to 2 decimals. */
export function wavelength(f) {
  return roundTo(V_SOUND / f, 0.01);
}

/** How the note sounds: মোটা (deep), মাঝারি, তীক্ষ্ণ (shrill). */
export function voiceOf(f) {
  if (f < 250) return 'deep';
  if (f < 450) return 'middle';
  return 'shrill';
}

/** The drawn wave, in the scene's millimetres and the picture's seconds (slowed). */
export function drawnWave(f) {
  const fShow = f / SLOW; // flutters a second on screen
  const lambda = (V_SOUND / f) * 1000 * LAMBDA_SCALE; // mm
  return { fShow, lambda, speed: fShow * lambda, omega: 2 * Math.PI * fShow, k: (2 * Math.PI) / lambda };
}

/**
 * How far the flap's free edge is open (0 shut … 1 wide open) at phase φ = ωt: it opens once a period and shuts
 * again, as the vocal cords do.
 */
export function opening(phase) {
  return 0.5 - 0.5 * Math.cos(phase);
}

/** The bent shape of a cantilever under a spread push: 0 at the hinge, 1 at the free edge (σ = 0 … 1). */
export function bendShape(sigma) {
  const x = Math.max(0, Math.min(1, sigma));
  return (x * x * (6 - 4 * x + x * x)) / 3;
}

/**
 * The air's particles in the drawn wave: displacement (mm, along the way the sound goes) and how squeezed the air is
 * (+1 সংকোচন … −1 প্রসারণ) at a distance r (mm) and time t (s, slowed), for a source that was vibrating at the
 * earlier time τ = t − r/v with strength `on(τ)` (0 … 1). The source pushes hardest (a compression leaves) when the
 * flaps are most open, so squeeze = −cos ωτ. Writes into `out` (no allocation: it runs for every particle, every frame).
 */
export function airAt(r, t, wave, on, out = { shift: 0, squeeze: 0 }) {
  const tau = t - r / wave.speed;
  const env = on(tau);
  if (env <= 0) {
    out.shift = 0;
    out.squeeze = 0;
    return out;
  }
  const psi = wave.omega * tau;
  const a = 0.1 * wave.lambda; // a·k ≈ 0.63: the bunching shows clearly
  out.shift = -a * Math.sin(psi) * env;
  out.squeeze = -Math.cos(psi) * env;
  return out;
}
