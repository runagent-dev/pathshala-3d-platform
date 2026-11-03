// The physics of the ripple tank, pure functions (unit-tested in test/unit/wave-interference.test.mjs), in metres and
// seconds of real (not slowed) time. Two point dippers on one vibrating bar touch the water in step (the same phase):
// each sends out circular waves y_i = a(r_i)·sin(ω(t − r_i/v)), whose height falls off as 1/√r away from the source
// (the energy of a ring spreads over a longer and longer circle). Where they meet the displacements add
// (superposition): equal paths, or paths that differ by whole wavelengths, give crest on crest (a bigger wave); paths
// that differ by half a wavelength (½λ, 1½λ …) give crest on trough (they cancel: the still lines).

/** Frequency of the vibrator (Hz), the speed of ripples in shallow water (m/s), so λ = v/f = 5 cm. */
export const F = 5;
export const V = 0.25;
export const LAMBDA = V / F;
export const OMEGA = 2 * Math.PI * F;
export const K = (2 * Math.PI) / LAMBDA;
/** The figure runs this many times slower than real ripples (5 Hz is a blur to the eye). */
export const SLOW = 5;
/** The tank's water inside the beaches (m): x from −W/2 to W/2, z from −D/2 to D/2. */
export const TANK = { w: 0.6, d: 0.44 };
/** The dippers' row (z) and the default distance between them: 3λ. */
export const SOURCE_Z = -0.15;
export const GAPS = [0.1, 0.15, 0.2];
export const GAP = 0.15;
/** A ripple's height 1 cm from a dipper (m, real) and the distance over which it falls off as 1/√r. */
export const A0 = 0.0012;
export const R0 = 0.04;
/** Where the two floating balls sit by default: the same row, one on the centre line, one on a still line. */
export const BALL_Z = 0.11;

/** The two sources for a gap d. */
export const sources = (gap = GAP) => [
  { x: -gap / 2, z: SOURCE_Z },
  { x: gap / 2, z: SOURCE_Z },
];

/** The height of one source's ripple at distance r (m), before the sine. */
export function amplitudeAt(r) {
  return A0 * Math.sqrt(R0 / (R0 + Math.max(0, r)));
}

/** dA/dr, for the water's normals. */
export function amplitudeSlope(r) {
  const rr = R0 + Math.max(0, r);
  return -0.5 * A0 * Math.sqrt(R0) * rr ** -1.5;
}

/** 0 → 1 smoothly over [0, 1]. */
export function smoothstep(x) {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
}

/**
 * How much of a source's wave is present at distance r at time t, if the dipper touched the water at `on` and
 * left it at `off` (null: still dipping): the front spreads at v, the tail too, each softened over half a
 * wavelength so it reads as a real ripple's front.
 */
export function envelope(r, t, on, off) {
  if (on == null || t < on) return 0;
  const edge = 0.6 * LAMBDA;
  let e = smoothstep((V * (t - on) - r) / edge);
  if (off != null && t > off) e *= smoothstep((r - V * (t - off)) / edge + 1);
  return e;
}

/** One source's displacement at distance r, time t (m, real): a(r)·sin(ω(t − r/v))·envelope. */
export function waveAt(r, t, on, off) {
  const e = envelope(r, t, on, off);
  if (!e) return 0;
  return e * amplitudeAt(r) * Math.sin(OMEGA * t - K * r);
}

/** The distances from a point to the two sources. */
export function distances(x, z, gap = GAP) {
  const [s1, s2] = sources(gap);
  return [Math.hypot(x - s1.x, z - s1.z), Math.hypot(x - s2.x, z - s2.z)];
}

/** The path difference at a point, in wavelengths (signed: r₂ − r₁). */
export function pathDifference(x, z, gap = GAP) {
  const [r1, r2] = distances(x, z, gap);
  return (r2 - r1) / LAMBDA;
}

/**
 * The steady swing (amplitude) at a point once the waves have filled the tank, from the sources that are on:
 * |a₁e^{−ikr₁} + a₂e^{−ikr₂}|. on = [bool, bool].
 */
export function steadyAmplitude(x, z, on = [true, true], gap = GAP) {
  const rs = distances(x, z, gap);
  let re = 0;
  let im = 0;
  rs.forEach((r, i) => {
    if (!on[i]) return;
    const a = amplitudeAt(r);
    re += a * Math.cos(K * r);
    im -= a * Math.sin(K * r);
  });
  return Math.hypot(re, im);
}

/** The point on row z where the path difference is `n` wavelengths (x ≥ 0), by bisection; null if none in the tank. */
export function pointOnLine(n, z = BALL_Z, gap = GAP) {
  const f = (x) => pathDifference(x, z, gap) * -1 - n; // r₁ − r₂ grows with x
  let lo = 0;
  let hi = TANK.w / 2;
  if (f(lo) > 0 || f(hi) < 0) return null;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The two balls by default: ক on the centre line (paths equal), খ on the still line where they differ by 1½λ. */
export function defaultBalls(gap = GAP) {
  return [
    { x: 0, z: BALL_Z },
    { x: pointOnLine(1.5, BALL_Z, gap) ?? 0.14, z: BALL_Z },
  ];
}

/** How many still lines (nodal lines) cross the tank between the sources' sides: 2·floor(d/λ + ½). */
export function stillLines(gap = GAP) {
  return 2 * Math.floor(gap / LAMBDA + 0.5);
}

/** Energy carried goes as the square of the amplitude (book 7.2.1 (ii)). */
export const energyRatio = (ampRatio) => ampRatio * ampRatio;

/** A ratio rounded for the panel: '2', '1', '0' or '1.4', with "about" when the rounding hides more than 3 %. */
export function ratioText(x) {
  const r = Math.round(x * 10) / 10;
  return { value: Number.isInteger(r) ? String(r) : r.toFixed(1), about: Math.abs(r - x) > 0.03 || (r === 0 && x > 0.005) };
}

/** The examples (which dippers touch the water). */
export const EXAMPLES = ['one', 'two', 'both'];
export const SOURCES_ON = { calm: [false, false], one: [true, false], two: [false, true], both: [true, true] };
