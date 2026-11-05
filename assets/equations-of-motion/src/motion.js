// The maths of the figure (book pages 45–46, topic 2.7, গতির সমীকরণ), in the book's own form: a car starts at 0 on a
// straight number line from −7 m to 10 m with uniform acceleration,
//   s = ut + ½at²,  v = u + at,  v² = u² + 2as
// (s: অতিক্রান্ত দূরত্ব from where the motion starts; the book lets it be ধনাত্মক or ঋণাত্মক along the line, p45).
// The car stops when it reaches an end of the axis.
// Pure functions, no three.js and no DOM, unit-tested in test/unit/equations-of-motion.test.mjs.

/** The number line, in metres: the car starts at 0 and s stays between these. */
export const AXIS = { min: -7, max: 10 };

/** The sliders: min, max, step (decimals 0.1, as the reference). */
export const LIMITS = {
  u: { min: -5, max: 5, step: 0.1 },
  a: { min: -3, max: 3, step: 0.1 },
  t: { min: 0, max: 6, step: 0.1 },
};

/** The opening values. */
export const START = { u: 1.9, a: 1.7, t: 0 };

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

/** s = ut + ½at² */
export const distance = (u, a, t) => u * t + 0.5 * a * t * t;

/** v(t) = u + at */
export const velocity = (u, a, t) => u + a * t;

/** The two parts of s, as the arrows under the axis show them: ut and ½at². */
export const parts = (u, a, t) => ({ ut: u * t, half: 0.5 * a * t * t });

/** A slider's value, kept in its range and on its 0.1 steps. */
export function fixValue(key, value) {
  const L = LIMITS[key];
  const n = Number(value);
  if (!Number.isFinite(n)) return START[key];
  return roundTo(clamp(Math.round(n / L.step) * L.step, L.min, L.max), 1);
}

/** The smallest t > 0 at which ut + ½at² = S, or Infinity if it never gets there. */
export function timeToReach(u, a, S) {
  // ½a t² + u t − S = 0
  if (Math.abs(a) < EPS) {
    if (Math.abs(u) < EPS) return Number.POSITIVE_INFINITY;
    const t = S / u;
    return t > EPS ? t : Number.POSITIVE_INFINITY;
  }
  const disc = u * u + 2 * a * S;
  if (disc < 0) return Number.POSITIVE_INFINITY;
  const r = Math.sqrt(disc);
  const roots = [(-u - r) / a, (-u + r) / a].filter((t) => t > EPS).sort((p, q) => p - q);
  return roots.length ? roots[0] : Number.POSITIVE_INFINITY;
}

/**
 * When the run ends: at the slider's last moment (LIMITS.t.max) or earlier, when the car reaches an end of the axis.
 * Returns { t, end: 'left' | 'right' | null }.
 */
export function runEnd(u, a, tMax = LIMITS.t.max) {
  const left = timeToReach(u, a, AXIS.min);
  const right = timeToReach(u, a, AXIS.max);
  const hit = Math.min(left, right);
  if (hit <= tMax) return { t: hit, end: right <= left ? 'right' : 'left' };
  return { t: tMax, end: null };
}

/** Everything the figure shows at the moment t (t is first kept inside the run). */
export function stateAt({ u, a }, t) {
  const run = runEnd(u, a);
  const tt = clamp(t, 0, run.t);
  const atEnd = run.end && tt >= run.t - 1e-9;
  const s = atEnd ? AXIS[run.end === 'right' ? 'max' : 'min'] : distance(u, a, tt);
  return { t: tt, s, v: velocity(u, a, tt), ...parts(u, a, tt), end: atEnd ? run.end : null, tEnd: run.t, endAt: run.end };
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

/** Setups: u, a, t. Every one keeps the car on the axis up to t. */
export const QUIZ = {
  // how far has the car gone after t?
  s: [
    { u: 2, a: 1, t: 2 },
    { u: 1, a: 2, t: 2 },
    { u: -1, a: 2, t: 2 },
    { u: 3, a: 1, t: 2 },
    { u: 2, a: -1, t: 2 },
  ],
  // the velocity after t
  v: [
    { u: 2, a: 1.5, t: 2 },
    { u: 4, a: -1, t: 3 },
    { u: -1, a: 2, t: 2 },
    { u: 1, a: 1.5, t: 2 },
  ],
  // a read from the equation s = (½a)t² + (u)t
  coef: [
    { u: 1, a: 3, t: 0 },
    { u: -2, a: 2, t: 0 },
    { u: 2, a: 1, t: 0 },
    { u: 0.5, a: -1, t: 0 },
  ],
  // when the velocity becomes zero, from v = (a)t + (u)
  turn: [
    { u: 4, a: -2, t: 0 },
    { u: -3, a: 1.5, t: 0 },
    { u: 3, a: -1, t: 0 },
    { u: -4, a: 2, t: 0 },
  ],
  // the part ½at² read off the picture: s from the axis, ut from its label
  part: [
    { u: 1, a: 2, t: 2 },
    { u: 1, a: 1, t: 2 },
    { u: 0.5, a: 2, t: 2 },
    { u: -1, a: 2, t: 2 },
    { u: 3, a: -1, t: 2 },
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
export function answers(kind, { u, a, t }) {
  if (kind === 's') {
    const right = distance(u, a, t);
    const c = pick(right, [
      [u * t + a * t * t, 'no_half'],
      [u * t, 'no_a'],
      [0.5 * a * t * t, 'no_ut'],
      [(u + a * t) * t, 'vt'],
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
      [-a, 'sign'],
      [2 * a, 'double'],
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
    const p = parts(u, a, t);
    const S = distance(u, a, t);
    const c = pick(p.half, [
      [S, 'whole'],
      [S + p.ut, 'add_ut'],
      [0.5 * a * t, 'no_square'],
      [a * t * t, 'no_half'],
    ]);
    return { right: c[0].v, choices: c };
  }
  throw new Error(`unknown question kind ${kind}`);
}
