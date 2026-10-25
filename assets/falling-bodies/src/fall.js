// The physics of the figure, in metres and seconds, as pure functions (unit-tested in
// test/unit/falling-bodies.test.mjs). Two tubes of the same height: one full of air, one emptied (বাতাসহীন).
// In each, a small stone and a piece of paper are let go from rest (স্থির অবস্থান) at the same height.
//   without air (বিনা বাধায়): every body falls freely: v = gt, h = ½gt² (no mass anywhere);
//   in air: the drag ½ρC·A·v² grows with speed until it balances the weight (terminal speed vt), which gives
//           v = vt·tanh(gt/vt) and h = (vt²/g)·ln cosh(gt/vt). A stone's vt is about 47 m/s, so over half a metre
//           air barely matters; a flat paper's vt is about 1 m/s, so it falls far behind (and flutters).

export const G = 9.8; // m/s², the book's g
export const STEP = 0.1; // s between the pictures left behind (like a strobe photo)
export const STEPS = 3; // pictures at 0.1, 0.2 and 0.3 s
export const H = Math.round(0.5 * G * (STEP * STEPS) ** 2 * 1e6) / 1e6; // 0.441 m: the fall inside a tube takes exactly 0.3 s without air
export const SLOW = 8; // the fall is shown 8 times slower than real time (0.3 s → 2.4 s)

/**
 * The bodies (terminal speed in air, m/s). Stone: a 5 cm pebble, about 150 g: vt ≈ 47 m/s. Paper: a 5.8 cm square of
 * exercise-book paper (80 g/m², about 0.27 g), falling flat: vt ≈ √(2mg / ρCA) ≈ 1 m/s (it flutters). Crumpled: the
 * same paper (the same mass) squeezed into a 2.5 cm ball: vt ≈ 3.9 m/s.
 */
export const BODIES = {
  stone: { vt: 47 },
  paper: { vt: 1 },
  crumpled: { vt: 3.9 },
};

/** Rounded without binary leftovers: round(0.1 + 0.2, 3) → 0.3. */
export const round = (v, d = 3) => +(Math.round(v * 10 ** d) / 10 ** d).toFixed(d);
/** A number for a sentence: at most d decimals, no trailing zeros (0.30 → "0.3", 0.512 → "0.51"). */
export const fmt = (v, d = 2) => String(round(v, d));
/** A number for a live readout: always d decimals ("0.98", "4.9"). */
export const fixed = (v, d) => round(v, d).toFixed(d);

/** ln(cosh x), precise for small x (a series) and safe for large x. */
const lnCosh = (x) => {
  const a = Math.abs(x);
  if (a < 1e-3) return (a * a) / 2 - (a * a * a * a) / 12;
  if (a < 15) return Math.log(Math.cosh(a));
  return a + Math.log1p(Math.exp(-2 * a)) - Math.LN2;
};

/** Height fallen after t s from rest (m), freely (vt = Infinity) or in air; it stops at the floor, h below the start. */
export function fallen(t, vt = Number.POSITIVE_INFINITY, h = H) {
  if (!(t > 0)) return 0;
  const d = Number.isFinite(vt) ? ((vt * vt) / G) * lnCosh((G * t) / vt) : 0.5 * G * t * t;
  return Math.min(h, d);
}

/** Speed after t s from rest (m/s), before it reaches the floor. */
export function speed(t, vt = Number.POSITIVE_INFINITY) {
  if (!(t > 0)) return 0;
  return Number.isFinite(vt) ? vt * Math.tanh((G * t) / vt) : G * t;
}

/** Time to fall h from rest (s): √(2h/g) freely, (vt/g)·acosh(e^(gh/vt²)) in air. */
export function landTime(vt = Number.POSITIVE_INFINITY, h = H) {
  if (!Number.isFinite(vt)) return Math.sqrt((2 * h) / G);
  const y = (G * h) / (vt * vt); // acosh(e^y) = ln(e^y + √(e^2y − 1)), written to stay precise for small y
  return (vt / G) * Math.log1p(Math.expm1(y) + Math.sqrt(Math.expm1(2 * y)));
}

/** The book's equations from rest (u = 0): v = gt and h = ½gt². */
export const freeV = (t) => G * t;
export const freeH = (t) => 0.5 * G * t * t;

/** The picture times: 0.1, 0.2, 0.3 s. */
export const stepTimes = () => Array.from({ length: STEPS }, (_, i) => round((i + 1) * STEP, 6));

/** The next picture time after t (s), and the one before it (0 at the start). */
export const nextStep = (t) => round((Math.floor(t / STEP + 1e-6) + 1) * STEP, 6);
export const prevStep = (t) => Math.max(0, round((Math.ceil(t / STEP - 1e-6) - 1) * STEP, 6));

/** When everything in both tubes is down, with this paper ('paper' flat or 'crumpled'). */
export function endTime(paper = 'paper') {
  return Math.max(landTime(), landTime(BODIES.stone.vt), landTime(BODIES[paper].vt));
}

/**
 * How a flat paper flutters as it falls through air (none without air): a sideways sway x (m), a rocking tilt about
 * the line of sight (rad; it dips toward the way it swings, like a falling leaf) and a slow turn about the vertical
 * (rad). The flutter grows with speed, (v/vt)², and dies away in the last few centimetres so it lands flat.
 */
export function flutter(t, vt = Number.POSITIVE_INFINITY, h = H) {
  if (!Number.isFinite(vt) || !(t > 0)) return { x: 0, tilt: 0, yaw: 0 };
  const land = landTime(vt, h);
  const tt = Math.min(t, land);
  const k = (speed(tt, vt) / vt) ** 2;
  const left = h - fallen(tt, vt, h); // m above the floor
  const near = Math.min(1, left / 0.04);
  const a = k * near * near * (3 - 2 * near);
  const w = (2 * Math.PI) / 0.24; // one swing to and fro in 0.24 s
  return {
    x: 0.006 * a * Math.sin(w * tt),
    tilt: -0.5 * a * Math.cos(w * tt),
    yaw: 0.9 * tt * k,
  };
}

// ── for the test ──────────────────────────────────────────────────────────────

/**
 * The right answer and three wrong ones from the usual mistakes: positive, all different once written with `d`
 * decimals, the mistakes taken in the order given. Returns the four values (not shuffled).
 */
export function pickWrong(right, mistakes, d = 2) {
  const key = (v) => fmt(v, d);
  const seen = new Set([key(right)]);
  const out = [];
  for (const m of mistakes) {
    if (!(m > 0) || seen.has(key(m))) continue;
    seen.add(key(m));
    out.push(round(m, d));
    if (out.length === 3) break;
  }
  for (let k = 2; out.length < 3; k++) {
    const m = round(right * k, d); // a fallback, rarely needed
    if (!seen.has(key(m))) {
      seen.add(key(m));
      out.push(m);
    }
  }
  return [round(right, d), ...out];
}
