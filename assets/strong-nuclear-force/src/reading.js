// The maths of the strong nuclear force figure (book p69, topic 3.2.4), kept apart from the 3D so it can be
// unit-tested. Distances are in femtometres (fm): 1 fm = 10⁻¹⁵ m, the book's range of the strong force.
// Forces are in newtons.
//
// The model, for one proton pulled straight out of a small nucleus (carbon-12: 6 protons, 6 neutrons):
//   - the other 5 protons push it away (Coulomb's law, their charge taken at an effective distance);
//   - the strong nuclear force of its neighbours pulls it back, about 100 times harder than that push (the
//     book: "তড়িৎ চৌম্বক বল থেকেও একশ গুণ বেশি শক্তিশালী"), but only while it is within about 1 fm of them
//     (the book: "খুবই অল্প দূরত্বে (10⁻¹⁵ m) কাজ করে"); a little farther it is gone.
// The numbers are honest orders of magnitude, not a nuclear-physics calculation: the figure says so.

export const R_NUCLEON = 0.85; // fm, about the radius of a proton (0.84 fm) or a neutron
export const RANGE = 1; // fm: past this the strong force is gone (10⁻¹⁵ m, as the book says)
export const STEP = 0.1; // fm: the distance is read and moved in steps of 0.1 × 10⁻¹⁵ m
export const MAX_PULL = 2.5; // fm: how far a finger can hold the proton out
export const KE2 = 230.7; // N·fm²: k·e² = 8.988e9 N·m²/C² × (1.602e-19 C)² = 2.307e-28 N·m²
export const PROTONS = 6; // the nucleus of the pull scene: carbon-12
export const NEUTRONS = 6;
export const R_EFFECTIVE = 2.4; // fm: where the other protons' charge acts from, seen by the pulled proton
export const BOOK_RATIO = 100; // the strong force near touching / the electric push (the book's "একশ গুণ")
const FADE_START = 0.55; // fm: the strong pull starts to weaken here …
const FADE_END = RANGE + STEP / 2; // … and is zero from here (so every distance shown past 1.0 has none)

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);
const smooth = (a, b, x) => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};

/** The push of the other protons on the pulled one, d fm out of its place (N, outward). */
export function electricForce(d) {
  const r = R_EFFECTIVE + Math.max(0, d);
  return (KE2 * (PROTONS - 1)) / (r * r);
}

/**
 * The pull of the strong nuclear force, d fm out of its place (N, inward): it grows as the proton is pulled out
 * (like a short, very stiff spring) to about 100 × the electric push, then fades to nothing just past 1 fm.
 */
export function strongForce(d) {
  if (d >= FADE_END) return 0;
  const e0 = electricForce(0);
  const rise = smooth(0, 0.45, d);
  const fall = 1 - smooth(FADE_START, FADE_END, d);
  return (e0 + (BOOK_RATIO - 1) * e0 * rise) * fall;
}

/** Does the strong force reach the proton at this distance? */
export const inRange = (d) => strongForce(d) > 0;

/** What a proton let go at d does: 'back' (the strong pull wins, it snaps back) or 'away' (pushed off). */
export function verdict(d) {
  if (d <= 0) return 'back'; // in its place among its neighbours
  return strongForce(d) > electricForce(d) ? 'back' : 'away';
}

/**
 * The length of a force arrow (fm) for a force in N. The forces differ a hundredfold, so the arrows are drawn
 * on a compressed (logarithmic) scale: bigger force, longer arrow, but not in proportion (the figure says so).
 */
export function arrowLength(force) {
  if (!(force > 0)) return 0;
  return clamp(0.55 + 0.75 * Math.log10(force / 40), 0.4, 2.6);
}

/** How a distance is written: one decimal, "0.6" (trailing zero kept: it is a live readout). */
export const fmt = (d) => roundTo(d, STEP).toFixed(1);

/** The state the panel and the test talk about, for a proton held d fm out. */
export function forcesAt(d) {
  const dd = roundTo(clamp(d, 0, 50), STEP);
  const strong = strongForce(dd);
  const electric = electricForce(dd);
  return { d: dd, strong, electric, inRange: strong > 0, verdict: verdict(dd), ratio: strong / electric };
}

// ── letting go beyond the range: the proton is pushed away ───────────────────────────────────────────────────
// Shown in slow motion (the real flight takes about 10⁻²¹ s): the acceleration has the shape of the Coulomb push.
export const FLIGHT_A = 30; // fm/s² of the slow-motion picture at d = 0
export function flightStep(d, v, dt) {
  const r0 = R_EFFECTIVE;
  const a = (FLIGHT_A * r0 * r0) / ((r0 + d) * (r0 + d));
  const v2 = v + a * dt;
  return { d: d + (v + v2) * 0.5 * dt, v: v2 };
}

// ── nuclei as clusters of touching balls ─────────────────────────────────────────────────────────────────────
/** A small seeded random number generator (mulberry32), so the clusters are the same on every load. */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * n balls of radius r packed into a round cluster round the origin: random start, then the overlaps are pushed
 * apart while everything is drawn to the centre. `init` (optional) gives starting points; `squeeze` lets
 * neighbours overlap a little, as the balls of a nucleus model do. Returns [[x, y, z], …].
 */
export function packCluster(n, { r = R_NUCLEON, seed = 1, init = null, squeeze = 0.06, rounds = 160 } = {}) {
  const rand = rng(seed);
  const ballR = r * Math.cbrt(n / 0.62);
  const p = init
    ? init.map((q) => [...q])
    : Array.from({ length: n }, () => {
        for (;;) {
          const v = [rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1];
          if (v[0] ** 2 + v[1] ** 2 + v[2] ** 2 <= 1) return v.map((x) => x * ballR);
        }
      });
  const gap = 2 * r * (1 - squeeze);
  for (let k = 0; k < rounds; k++) {
    const pull = 0.04 * (1 - k / rounds);
    for (const q of p) for (let j = 0; j < 3; j++) q[j] -= q[j] * pull;
    for (let pass = 0; pass < 2; pass++)
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          const a = p[i];
          const b = p[j];
          const dx = b[0] - a[0];
          const dy = b[1] - a[1];
          const dz = b[2] - a[2];
          const d = Math.hypot(dx, dy, dz) || 1e-6;
          if (d >= gap) continue;
          const push = (gap - d) / d / 2;
          a[0] -= dx * push;
          a[1] -= dy * push;
          a[2] -= dz * push;
          b[0] += dx * push;
          b[1] += dy * push;
          b[2] += dz * push;
        }
  }
  // centre it
  const c = [0, 1, 2].map((j) => p.reduce((sum, q) => sum + q[j], 0) / n);
  return p.map((q) => [q[0] - c[0], q[1] - c[1], q[2] - c[2]]);
}

/** The radius of a cluster: the farthest ball's outer edge from the centre. */
export function clusterRadius(points, r = R_NUCLEON) {
  return Math.max(...points.map((q) => Math.hypot(q[0], q[1], q[2]))) + r;
}

/** Which balls are protons: `z` of them, spread through the cluster (seeded). Returns a boolean per ball. */
export function chooseProtons(n, z, seed = 3) {
  const rand = rng(seed);
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const out = new Array(n).fill(false);
  for (const i of order.slice(0, z)) out[i] = true;
  return out;
}
