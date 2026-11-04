// The maths of the figure (book pages 45–46, topic 2.7, গতির সমীকরণ), as the owner's reference "Uniform Acceleration
// in One Dimension": a car on a straight number line from −7 m to 10 m with uniform acceleration,
//   x(t) = x₀ + ut + ½at²,  v(t) = u + at
// (the book writes the initial velocity u; the reference's v₀). The car stops when it reaches an end of the axis.
// Pure functions, no three.js and no DOM, unit-tested in test/unit/equations-of-motion.test.mjs.

/** The number line, in metres: the car's position x stays between these. */
export const AXIS = { min: -7, max: 10 };

/** The sliders: min, max, step (decimals 0.1, as the reference). */
export const LIMITS = {
  x0: { min: -5, max: 5, step: 0.1 },
  u: { min: -5, max: 5, step: 0.1 },
  a: { min: -3, max: 3, step: 0.1 },
  t: { min: 0, max: 6, step: 0.1 },
};

/** The reference's opening values. */
export const START = { x0: -0.8, u: 1.9, a: 1.7, t: 0 };

const EPS = 1e-9;

/** x rounded to d decimals (no -0). */
export const roundTo = (x, d = 2) => {
  const k = 10 ** d;
  const r = Math.round((x + Math.sign(x) * 1e-12) * k) / k;
  return Object.is(r, -0) ? 0 : r;
};

/** A number for a sentence: no trailing zeros, a real minus sign. */
export const fmt = (x, d = 2) => String(roundTo(x, d)).replace('-', '−');

/** A live readout with fixed decimals (a real minus sign). */
export const fixed = (x, d = 1) => {
  const r = roundTo(x, d);
  return (Object.is(r, -0) ? 0 : r).toFixed(d).replace('-', '−');
};

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** x(t) = x₀ + ut + ½at² */
export const position = (x0, u, a, t) => x0 + u * t + 0.5 * a * t * t;

/** v(t) = u + at */
export const velocity = (u, a, t) => u + a * t;

/** The three parts of x, as the arrows under the axis show them: x₀, ut and ½at². */
export const parts = (x0, u, a, t) => ({ x0, ut: u * t, half: 0.5 * a * t * t });

/** A slider's value, kept in its range and on its 0.1 steps. */
export function fixValue(key, value) {
  const L = LIMITS[key];
  const n = Number(value);
  if (!Number.isFinite(n)) return START[key];
  return roundTo(clamp(Math.round(n / L.step) * L.step, L.min, L.max), 1);
}

/** The smallest t > 0 at which x₀ + ut + ½at² = X, or Infinity if it never gets there. */
export function timeToReach(x0, u, a, X) {
  const d = X - x0; // ½a t² + u t − d = 0
  if (Math.abs(a) < EPS) {
    if (Math.abs(u) < EPS) return Number.POSITIVE_INFINITY;
    const t = d / u;
    return t > EPS ? t : Number.POSITIVE_INFINITY;
  }
  const disc = u * u + 2 * a * d;
  if (disc < 0) return Number.POSITIVE_INFINITY;
  const r = Math.sqrt(disc);
  const roots = [(-u - r) / a, (-u + r) / a].filter((t) => t > EPS).sort((p, q) => p - q);
  return roots.length ? roots[0] : Number.POSITIVE_INFINITY;
}

/**
 * When the run ends: at the slider's last moment (LIMITS.t.max) or earlier, when the car reaches an end of the axis.
 * Returns { t, end: 'left' | 'right' | null }.
 */
export function runEnd(x0, u, a, tMax = LIMITS.t.max) {
  const left = timeToReach(x0, u, a, AXIS.min);
  const right = timeToReach(x0, u, a, AXIS.max);
  const hit = Math.min(left, right);
  if (hit <= tMax) return { t: hit, end: right <= left ? 'right' : 'left' };
  return { t: tMax, end: null };
}

/** Everything the figure shows at the moment t (t is first kept inside the run). */
export function stateAt({ x0, u, a }, t) {
  const run = runEnd(x0, u, a);
  const tt = clamp(t, 0, run.t);
  const atEnd = run.end && tt >= run.t - 1e-9;
  const x = atEnd ? AXIS[run.end === 'right' ? 'max' : 'min'] : position(x0, u, a, tt);
  return { t: tt, x, v: velocity(u, a, tt), ...parts(x0, u, a, tt), end: atEnd ? run.end : null, tEnd: run.t, endAt: run.end };
}

/** The moment one step (0.1 s) before or after t, on the 0.1 s grid, inside the run. */
export function stepTime(t, dir, tEnd) {
  const k = LIMITS.t.step;
  const grid = dir > 0 ? Math.floor(roundTo(t / k, 6) + 1e-6) + 1 : Math.ceil(roundTo(t / k, 6) - 1e-6) - 1;
  return clamp(roundTo(grid * k, 1), 0, tEnd);
}

/** The time when the velocity is zero (the car turns back), if that happens after the start. */
export const turnTime = (u, a) => (Math.abs(a) > EPS && -u / a > EPS ? -u / a : null);

// ── the test ────────────────────────────────────────────────────────────────────────────────────────────────────────
// Each kind of question has a few real setups (whole or half numbers, the car always on the axis). The wrong
// choices are the usual mistakes, each with a name the worked answer explains.

/** Setups: x0, u, a, t. Every one keeps the car on the axis up to t. */
export const QUIZ = {
  // where is the car after t? (x₀ read off the axis: the car stands there)
  x: [
    { x0: -4, u: 2, a: 1, t: 2 },
    { x0: -3, u: 1, a: 2, t: 2 },
    { x0: 2, u: -1, a: 2, t: 2 },
    { x0: -5, u: 3, a: 1, t: 2 },
    { x0: 1, u: 2, a: -1, t: 2 },
  ],
  // the velocity after t
  v: [
    { x0: -5, u: 2, a: 1.5, t: 2 },
    { x0: 0, u: 4, a: -1, t: 3 },
    { x0: -3, u: -1, a: 2, t: 2 },
    { x0: -6, u: 1, a: 2, t: 3 },
  ],
  // a read from the x equation: x = (½a)t² + (u)t + (x₀)
  coef: [
    { x0: -2, u: 1, a: 3, t: 0 },
    { x0: 3, u: -2, a: 2, t: 0 },
    { x0: -4, u: 2, a: 1, t: 0 },
    { x0: 3, u: 0.5, a: -1, t: 0 },
  ],
  // when the velocity becomes zero, from v = (a)t + (u)
  turn: [
    { x0: -2, u: 4, a: -2, t: 0 },
    { x0: 4, u: -3, a: 1.5, t: 0 },
    { x0: -3, u: 3, a: -1, t: 0 },
    { x0: 2, u: -4, a: 2, t: 0 },
  ],
  // the part ½at² read off the picture: x from the axis, x₀ and ut from their labels
  part: [
    { x0: -3, u: 1, a: 2, t: 2 },
    { x0: -5, u: 2, a: 1, t: 2 },
    { x0: -4, u: 0.5, a: 2, t: 2 },
    { x0: 3, u: -1, a: 2, t: 2 },
  ],
};

/** Distinct values, the right one first, then wrong ones (never equal to the right one), at most `n`. */
function pick(right, wrong, n = 4) {
  const out = [{ v: roundTo(right, 2), why: null }];
  for (const [v, why] of wrong) {
    const r = roundTo(v, 2);
    if (out.some((c) => Math.abs(c.v - r) < 1e-6)) continue;
    out.push({ v: r, why });
    if (out.length === n) break;
  }
  return out;
}

/**
 * The right answer and three wrong ones for a question of `kind` with setup q.
 * Returns { right, choices: [{ v, why }] } (unshuffled: the right one first).
 */
export function answers(kind, { x0, u, a, t }) {
  if (kind === 'x') {
    const right = position(x0, u, a, t);
    const c = pick(right, [
      [x0 + u * t + a * t * t, 'no_half'],
      [u * t + 0.5 * a * t * t, 'no_x0'],
      [x0 + u * t, 'no_a'],
      [x0 + (u + a * t) * t, 'vt'],
    ]);
    return { right: c[0].v, choices: c };
  }
  if (kind === 'v') {
    const right = velocity(u, a, t);
    const c = pick(right, [
      [u + a, 'one_second'],
      [a * t, 'no_u'],
      [u - a * t, 'sign'],
      [u * a * t, 'times'],
    ]);
    return { right: c[0].v, choices: c };
  }
  if (kind === 'coef') {
    const c = pick(a, [
      [a / 2, 'half'],
      [u, 'wrong_term'],
      [x0, 'wrong_term'],
      [-a, 'sign'],
    ]);
    return { right: c[0].v, choices: c };
  }
  if (kind === 'turn') {
    const right = -u / a;
    const c = pick(right, [
      [Math.abs(u * a), 'times'],
      [Math.abs(a / u), 'flip'],
      [Math.abs(u) + Math.abs(a), 'add'],
      [Math.abs(u / a) / 2, 'half'],
    ]);
    return { right: c[0].v, choices: c };
  }
  if (kind === 'part') {
    const p = parts(x0, u, a, t);
    const x = position(x0, u, a, t);
    const c = pick(p.half, [
      [x, 'whole'],
      [x - x0, 'no_ut'],
      [x - p.ut, 'no_x0'],
      [0.5 * a * t, 'no_square'],
    ]);
    return { right: c[0].v, choices: c };
  }
  throw new Error(`unknown question kind ${kind}`);
}
