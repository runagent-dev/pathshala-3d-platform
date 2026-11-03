// The physics of a mass on a vertical spring (book pages 188–190, topic 7.1), in SI units. Pure functions, no three.js.
//
// x is the displacement from the সাম্যাবস্থা (equilibrium), upward positive, so the book's "pulled down by a and
// released" starts at x = −a with v = 0. Gravity only moves the equilibrium down by mg/k; about it the motion is
// x = −a cos ωt, with ω = √(k/m), T = 2π√(m/k), f = 1/T. The restoring force F = −kx; the energy that trades is
// K = ½mv² and U = ½kx² (the spring's and gravity's potential energy together, measured from the equilibrium), and
// K + U = ½ka² stays the same.

export const G = 9.8; // m/s² (the book's value)
/** The masses (kg) and springs (N/m) the student can choose. Four times the mass, or a quarter of k: twice the T. */
export const MASSES = [0.25, 0.5, 1];
export const SPRINGS = [100, 200, 400];
export const DEFAULT_M = 0.5;
export const DEFAULT_K = 100;
/** The largest pull (m). */
export const A_MAX = 0.08;
export const DEFAULT_A = 0.05;
/**
 * How much shorter than unloaded the open-coil spring may get (m) before its coils would touch: its body is 100 mm
 * unloaded and 66 mm with the coils closed, less a 4 mm margin. Above the equilibrium the spring first loses its
 * stretch mg/k, then is squeezed; Hooke's law holds both ways.
 */
export const SQUEEZE = 0.03;
/** The animation runs this many times slower than real time (said on the picture). */
export const SLOW = 5;

export const omega = (m, k) => Math.sqrt(k / m);
export const period = (m, k) => 2 * Math.PI * Math.sqrt(m / k);
export const frequency = (m, k) => 1 / period(m, k);
/** How far the mass stretches the spring when it hangs at rest: mg = kx₀. */
export const staticStretch = (m, k) => (m * G) / k;
/** The largest amplitude for this pair: the scale's room, and the coils never touching at the top. */
export const maxAmplitude = (m, k) => Math.min(A_MAX, staticStretch(m, k) + SQUEEZE);

/**
 * The motion at time t (s) after a release from x = −a at rest: { x, v, acc } in m, m/s, m/s² (upward positive).
 * `w` is ω in rad/s.
 */
export function motion(a, w, t) {
  const c = Math.cos(w * t);
  const s = Math.sin(w * t);
  return { x: -a * c, v: a * w * s, acc: a * w * w * c };
}

/** Kinetic and potential energy (J) at displacement x and velocity v; E is their sum. */
export function energies(m, k, x, v) {
  const K = 0.5 * m * v * v;
  const U = 0.5 * k * x * x;
  return { K, U, E: K + U };
}

/** The restoring force F = −kx (N), upward positive. */
export const force = (k, x) => -k * x;

/** Whole oscillations completed by time t (s). */
export const fullOscillations = (m, k, t) => Math.floor(t / period(m, k) + 1e-9);

/** Rounds to n decimals (a number, not a string). */
export function round(x, n = 2) {
  const p = 10 ** n;
  return Math.round(x * p + (x >= 0 ? 1e-9 : -1e-9)) / p;
}

/** A number for a sentence: at most n decimals, no trailing zeros ("0.5", "1.26", "2"). */
export function fmt(x, n = 2) {
  const r = round(x, n);
  return String(Object.is(r, -0) ? 0 : r);
}

/** A number with exactly n decimals, for live readouts ("0.63"). */
export const fixed = (x, n = 2) => (Object.is(round(x, n), -0) ? 0 : round(x, n)).toFixed(n);

/** Where in its cycle the mass is, from the phase θ = ωt (radians): 'bottom', 'up', 'top', 'down' (nearest quarter). */
export function phaseName(theta) {
  const q = (((theta / (Math.PI / 2)) % 4) + 4) % 4;
  return ['bottom', 'up', 'top', 'down'][Math.round(q) % 4];
}

/** A tidy step for a time axis `span` seconds long with room for at most `most` labels: 0.1, 0.2, 0.5 or 1 s. */
export function timeStep(span, most = 8) {
  for (const st of [0.1, 0.2, 0.5, 1]) if (span / st <= most) return st;
  return 2;
}

/** The ratio T₂/T₁ when the mass is multiplied by mm and the spring constant by kk. */
export const periodRatio = (mm, kk) => Math.sqrt(mm / kk);
