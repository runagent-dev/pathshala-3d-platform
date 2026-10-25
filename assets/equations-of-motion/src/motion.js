// The maths of the equations of motion (book pages 45–46, topic 2.7) for a train on a straight line with uniform
// acceleration: from u (আদি বেগ), a (ত্বরণ) and t (সময়) come v = u + at (শেষ বেগ), V = (u + v)/2 (গড় বেগ),
// s = Vt = ut + ½at² (অতিক্রান্ত দূরত্ব) and v² = u² + 2as. Pure functions, unit-tested in
// test/unit/equations-of-motion.test.mjs; the test's numbers and its usual mistakes are here too.

/** What the steppers allow: what a real train can do pulling out of a station, running, or braking. */
export const LIMITS = {
  u: { min: 0, max: 15, step: 1 }, // m/s (15 m/s = 54 km/h)
  a: { min: -1.5, max: 1.5, step: 0.5 }, // m/s²
  t: { min: 1, max: 10, step: 1 }, // s
};
/** The example the figure opens with: v = 10 m/s, V = 7 m/s, s = 42 m. */
export const START = { u: 4, a: 1, t: 6 };
/** The train car, metres: the nose is at the train's position. */
export const TRAIN_LENGTH = 16;

const EPS = 1e-9;

/** x rounded to d decimals, with no binary leftovers (0.1 + 0.2 → 0.3). */
export const roundTo = (x, d = 2) => {
  const r = +(Math.round(x * 10 ** d) / 10 ** d).toFixed(d);
  return r === 0 ? 0 : r; // no −0
};
/** A number for sentences and sums: at most d decimals, no trailing zeros (42, 6.5, 2.25), a real minus sign. */
export const fmt = (x, d = 2) => String(roundTo(x, d)).replace('-', '−');
/** A live readout with fixed decimals (12.3). */
export const fixed = (x, d = 1) => roundTo(x, d).toFixed(d).replace('-', '−');

export const velocityAt = (u, a, tau) => u + a * tau;
export const distanceAt = (u, a, tau) => u * tau + 0.5 * a * tau * tau;
/** v = u + at */
export const finalVelocity = (u, a, t) => roundTo(u + a * t, 6);
/** V = (u + v)/2: the average velocity, which is also the velocity at the middle of the time, t/2. */
export const averageVelocity = (u, a, t) => roundTo((u + (u + a * t)) / 2, 6);
/** s = ut + ½at² (= Vt) */
export const distance = (u, a, t) => roundTo(u * t + 0.5 * a * t * t, 6);

/** When a braking train stops (v = 0): u / |a|; Infinity if it never does. */
export const stopTime = (u, a) => (a < 0 ? u / -a : Infinity);
/** The train only goes forwards: its velocity never drops below zero (at most it stops just at the end). */
export const valid = (u, a, t) => u + a * t >= -EPS;

/** The time at which it has gone x metres (0 ≤ x ≤ s): the inverse of distanceAt on [0, t]. */
export function timeAt(u, a, x, t) {
  if (x <= 0) return 0;
  if (x >= distanceAt(u, a, t) - EPS) return t;
  // ½aτ² + uτ − x = 0, written so that it also works for a = 0: τ = 2x / (u + √(u² + 2ax))
  const root = Math.sqrt(Math.max(0, u * u + 2 * a * x));
  const den = u + root;
  return den > EPS ? Math.min(t, (2 * x) / den) : t;
}

const snap = (key, x) => {
  const { min, max, step } = LIMITS[key];
  return roundTo(Math.min(max, Math.max(min, Math.round(x / step) * step)), 2);
};

/**
 * One tap on a stepper: key 'u' | 'a' | 't', dir +1 | −1. Returns the new { u, a, t } and a note:
 * null; 'min' | 'max' (at the end of its range, nothing changed); 'cut' (a braking train would stop before the
 * end, so t was cut to when it stops); 'stops' (t refused: the train has stopped by then); 'backwards' (refused:
 * the train would have to go backwards).
 */
export function stepPlan(plan, key, dir) {
  const next = snap(key, plan[key] + dir * LIMITS[key].step);
  const keep = { u: plan.u, a: plan.a, t: plan.t };
  if (next === plan[key]) return { ...keep, note: dir < 0 ? 'min' : 'max' };
  const p = { ...keep, [key]: next };
  if (valid(p.u, p.a, p.t)) return { ...p, note: null };
  if (key === 't') return { ...keep, note: 'stops' };
  const ts = Math.floor(stopTime(p.u, p.a) + EPS);
  if (ts >= LIMITS.t.min) return { ...p, t: ts, note: 'cut' };
  return { ...keep, note: 'backwards' };
}

/** Any u, a, t (from the book page or a test) made allowed: on the steps, in range, never going backwards. */
export function fixPlan(p = {}) {
  const u = snap('u', Number.isFinite(+p.u) ? +p.u : START.u);
  let a = snap('a', Number.isFinite(+p.a) ? +p.a : START.a);
  let t = snap('t', Number.isFinite(+p.t) ? +p.t : START.t);
  if (!valid(u, a, t)) {
    const ts = Math.floor(stopTime(u, a) + EPS);
    if (ts >= LIMITS.t.min) t = ts;
    else while (!valid(u, a, t)) a = roundTo(a + LIMITS.a.step, 2);
  }
  return { u, a, t };
}

/** Everything the panel shows for a plan. */
export function solve({ u, a, t }) {
  const v = finalVelocity(u, a, t);
  const s = distance(u, a, t);
  return { u, a, t, v, V: averageVelocity(u, a, t), s, ut: roundTo(u * t, 6), half: roundTo(0.5 * a * t * t, 6) };
}

/** Where the train is after each whole second (1, 2, … up to t): the marks between which the 1-second strips lie. */
export function secondMarks(u, a, t) {
  const out = [];
  for (let k = 1; k <= Math.floor(t + EPS); k++) out.push(roundTo(distanceAt(u, a, k), 6));
  return out;
}

/** A round top for a graph axis and its step (top 10 → 0…10 by 2; 15 → 0…16 by 4; 0 → 0…2 by 1). */
export function niceAxis(top, ticks = 6) {
  const need = Math.max(top, 2);
  for (const step of [1, 2, 4, 5, 10, 20, 25, 50, 100]) {
    const n = Math.ceil(need / step - EPS);
    if (n <= ticks) return { max: n * step, step };
  }
  return { max: Math.ceil(need / 100) * 100, step: 100 };
}

// ── the test ───────────────────────────────────────────────────────────────────
// Book-style numbers a real train can have (whole metres where possible), and the usual mistakes.

export const QUIZ = {
  // শেষ বেগ from u, a, t
  v: [
    { u: 2, a: 1, t: 6 },
    { u: 4, a: 1, t: 5 },
    { u: 5, a: 0.5, t: 6 },
    { u: 3, a: 1.5, t: 4 },
    { u: 6, a: 0.5, t: 8 },
    { u: 1, a: 1, t: 7 },
  ],
  // দূরত্ব from u, a, t (by the formula), or from the graph
  s: [
    { u: 2, a: 1, t: 6 },
    { u: 4, a: 1, t: 4 },
    { u: 1, a: 1, t: 8 },
    { u: 6, a: 0.5, t: 4 },
    { u: 3, a: 1, t: 6 },
    { u: 5, a: 1.5, t: 4 },
  ],
  // গড় বেগ (= the velocity at half time) from u and v
  avg: [
    { u: 4, a: 1, t: 6 },
    { u: 2, a: 1.5, t: 4 },
    { u: 6, a: 1, t: 6 },
    { u: 2, a: 1.5, t: 8 },
    { u: 12, a: -1, t: 6 },
    { u: 3, a: 0.5, t: 10 },
  ],
  // no acceleration: v = u and s = ut
  zero: [
    { u: 6, a: 0, t: 5 },
    { u: 8, a: 0, t: 4 },
    { u: 5, a: 0, t: 7 },
    { u: 10, a: 0, t: 3 },
    { u: 4, a: 0, t: 9 },
  ],
  // braking to a stop: t = u/|a|, s = u²/2|a| (from v² = u² + 2as with v = 0)
  brake: [
    { u: 12, a: -1.5 },
    { u: 10, a: -1 },
    { u: 8, a: -1 },
    { u: 9, a: -1.5 },
    { u: 5, a: -0.5 },
    { u: 15, a: -1.5 },
  ],
};

/**
 * The right answer and the usual mistakes for one question. kind: 'v' | 's' | 'area' | 'avg' | 'mid' | 'zero-v' |
 * 'zero-s' | 'brake-s' | 'brake-t'. Every mistake is named, so the worked answer can say what went wrong.
 */
export function answers(kind, { u, a, t }) {
  const v = u + a * t;
  const r = (x) => roundTo(x, 6);
  switch (kind) {
    case 'v':
      return { right: r(v), wrong: { no_u: r(a * t), half: r(u + 0.5 * a * t), times: r((u + a) * t), add: r(u + a + t) } };
    case 's':
      return {
        right: r(u * t + 0.5 * a * t * t),
        wrong: { no_half: r(u * t + a * t * t), no_ut: r(0.5 * a * t * t), no_sq: r(u * t + 0.5 * a * t), no_a: r(u * t) },
      };
    case 'area':
      return { right: r(((u + v) / 2) * t), wrong: { final: r(v * t), no_a: r(u * t), triangle: r(((v - u) / 2) * t), sum: r((u + v) * t) } };
    case 'avg':
    case 'mid':
      return { right: r((u + v) / 2), wrong: { sum: r(u + v), diff_half: r(Math.abs(v - u) / 2), diff: r(Math.abs(v - u)), end_half: r(v / 2) } };
    case 'zero-v':
      return { right: r(u), wrong: { rest: 0, times: r(u * t), add: r(u + t) } };
    case 'zero-s':
      return { right: r(u * t), wrong: { rest: 0, half: r(0.5 * u * t), add: r(u + t), just_u: r(u) } };
    case 'brake-s': {
      const b = -a;
      // sign: a taken as +|a| in s = ut + ½at² with t = u/|a| (speeding up instead of braking)
      return {
        right: r((u * u) / (2 * b)),
        wrong: { no_2: r((u * u) / b), sign: r((1.5 * u * u) / b), no_a: r((u * u) / 2), time: r(u / b), times: r(u * b) },
      };
    }
    case 'brake-t': {
      const b = -a;
      return { right: r(u / b), wrong: { times: r(u * b), minus: r(u - b), twice: r((2 * u) / b), half: r(u / (2 * b)) } };
    }
  }
  throw new Error(`unknown question kind ${kind}`);
}
