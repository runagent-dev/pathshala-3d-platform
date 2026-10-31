// The maths of the figure (pure functions, unit-tested in test/unit/hanging-weight-pull.test.mjs). Book pages 81–83,
// topic 3.7: Newton's second law for bodies joined by one string over a pulley.
//
// The well (the main scene): a person pulls a rope over the well's pulley; a bucket of water M hangs from its other
// end. A light rope over a smooth pulley carries one tension T all along it (the pulley only turns its direction), so
// the person's pull is T and the rope pulls the bucket up with the same T. Up is positive (the book's rule):
//   bucket:   T − M g = M a          so  a = (T − M g) / M
// a > 0: the bucket speeds up going up; a < 0: it speeds up going down (the book writes M(−a) with a the size);
// T = M g: no acceleration (held still, or moving steadily).
//
// The book's examples (the উদাহরণ window), on a smooth table:
//   চিত্র ৩.০৯  block:        T = m a                       (right is positive)
//              hanging mass: T − M g = M (−a)              (up is positive)
//              so            a = M g / (M + m),   T = m M g / (M + m)  (less than M g)
//   চিত্র ৩.১০  a mass at each end of the block's strings: m₂ = 10 kg on the left, m₁ = 5 kg on the right:
//              T₁ − m₁g = m₁a,  T₁ − T₂ = m(−a),  T₂ − m₂g = m₂(−a)  so  a = (m₂ − m₁)g / (m₁ + m₂ + m) = 5g/(m + 15)

/** g in ms⁻² (the book's value). */
export const G = 9.8;

export const round = (x, digits = 2) => Math.round(x * 10 ** digits) / 10 ** digits;
/** A number for a sentence: at most two decimals, no trailing zeros ("2.8", "3.27", "14"). */
export const plain = (x) => String(+Number(x).toFixed(2));
/** A signed number for the acceleration: "+3.2", "−2.8" (U+2212), "0". */
export const signed = (x, digits = 2) => {
  const v = round(x, digits);
  if (v === 0) return '0';
  return `${v > 0 ? '+' : '−'}${plain(Math.abs(v))}`;
};

// ── the well ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** The empty bucket, kg (a 15 litre plastic bucket with a steel handle); a litre of water is a kilogram. */
export const BUCKET = 1;
/** What the steppers allow: the pull T in newtons, the bucket with its water M in kilograms ([min, max, step]). */
/** @type {{ T: [number, number, number], M: [number, number, number] }} */
export const LIMITS = { T: [0, 200, 2], M: [3, 15, 1] };
/** Time is slowed down by this much on screen: a real run lasts about a second. */
export const SLOW = 3;
/** Where the bucket's bottom can be (metres, the courtyard is y = 0): its start half way down the shaft, the top
 * (lifted out above the parapet) and the bottom (touching the water). */
export const SHAFT = { start: -0.45, top: 0.9, bottom: -0.97 };
/** How long a run with no acceleration lasts on screen (s): the bucket simply stays where it is held. */
export const HOLD_SECONDS = 2.4;

/**
 * The bucket on the rope: pull T (N), bucket with water M (kg).
 * @returns {{ T: number, M: number, W: number, net: number, a: number }} W = M g, net = T − M g (N), a (ms⁻², up +)
 */
export function lift(T, M, g = G) {
  const W = M * g;
  const net = T - W;
  return { T, M, W, net, a: net / M };
}

/** The pull that holds a bucket still (T = M g). */
export const holdPull = (M, g = G) => M * g;

/**
 * Snaps a pull and a mass to the steppers' steps and limits.
 * @param {{ T?: any, M?: any }} [p]
 */
export function fixLift({ T, M } = {}) {
  const snap = (x, [lo, hi, step], fallback) => {
    const v = Number.isFinite(Number(x)) ? Number(x) : fallback;
    return Math.min(hi, Math.max(lo, Math.round((v - lo) / step) * step + lo));
  };
  return { T: snap(T, LIMITS.T, 130), M: snap(M, LIMITS.M, 10) };
}

/**
 * Where the bucket is `t` real seconds after it starts from rest at SHAFT.start with acceleration a (up +): it stops
 * at the top (caught at the parapet) or at the bottom (in the water).
 * @returns {{ y: number, v: number, s: number, done: boolean, end: 'top' | 'water' | null }}
 */
export function bucketAt(a, t, shaft = SHAFT) {
  const room = a >= 0 ? shaft.top - shaft.start : shaft.start - shaft.bottom;
  const tEnd = Math.abs(a) < 1e-9 ? Number.POSITIVE_INFINITY : Math.sqrt((2 * room) / Math.abs(a));
  const tt = Math.max(0, Math.min(t, tEnd));
  const s = 0.5 * a * tt * tt;
  const done = t >= tEnd;
  return { y: shaft.start + s, v: a * tt, s, done, end: done ? (a > 0 ? 'top' : 'water') : null };
}

/** Real seconds a run lasts: until the bucket reaches the top or the water (or HOLD_SECONDS / SLOW if a = 0). */
export function runSeconds(a, shaft = SHAFT) {
  if (Math.abs(a) < 1e-9) return HOLD_SECONDS / SLOW;
  const room = a > 0 ? shaft.top - shaft.start : shaft.start - shaft.bottom;
  return Math.sqrt((2 * room) / Math.abs(a));
}

/** The four experiments of the row of words, in order: the pull T (N) and the bucket with its water M (kg). */
export const EXPERIMENTS = {
  hold: { T: 98, M: 10 }, // T = Mg: it stays where it is held
  pull: { T: 130, M: 10 }, // a = +3.2: up, faster and faster
  ease: { T: 70, M: 10 }, // a = −2.8: down, faster and faster
  full: { T: 130, M: 12 }, // the same pull, 2 litres more water: a = +1.03
};
export const IDS = Object.keys(EXPERIMENTS);

// ── the test's choices (pure, so the unit tests can check that no two choices read the same) ─────────────────────
/** (T, M) for "how big is a?": the bucket goes up, and the wrong answers stay apart. */
export const CALC_SETS = [
  [130, 10],
  [150, 12],
  [100, 8],
  [120, 9],
  [70, 5],
];
/** a from T and M: the right one first, then three real mistakes (gravity forgotten; Mg added; divided by the weight). */
export function calcChoices(T, M, g = G) {
  return [
    { key: 'right', v: (T - M * g) / M },
    { key: 'nog', v: T / M },
    { key: 'plus', v: (T + M * g) / M },
    { key: 'byW', v: (T - M * g) / (M * g) },
  ].map((x) => ({ ...x, v: round(x.v, 2) }));
}
/** The masses for "held still: how big is T?" */
export const HOLD_MASSES = [6, 8, 10, 12, 14];
/** Held still: T = Mg first, then: the kilograms as newtons, nothing, twice the weight. */
export function holdChoices(M, g = G) {
  return [
    { key: 'right', v: round(M * g, 2) },
    { key: 'kg', v: M },
    { key: 'zero', v: 0 },
    { key: 'double', v: round(2 * M * g, 2) },
  ];
}
/** (T, M) with T < Mg for "which way does it speed up?" */
export const EASE_SETS = [
  [70, 10],
  [60, 8],
  [90, 12],
  [40, 6],
];
/** (T, M, extra kg) for "the same pull, more water". */
export const FULL_SETS = [
  [130, 10, 2],
  [150, 12, 2],
  [120, 9, 2],
];
/** The same pull with more water: the new a first; then: unchanged; scaled by the masses only; the pull's share. */
export function fullChoices(T, M, extra, g = G) {
  const a1 = lift(T, M, g).a;
  const M2 = M + extra;
  return [
    { key: 'right', v: round(lift(T, M2, g).a, 2) },
    { key: 'same', v: round(a1, 2) },
    { key: 'ratio', v: round((a1 * M) / M2, 2) },
    { key: 'nog', v: round(T / M2, 2) },
  ];
}

// ── the book's examples (the উদাহরণ window) ───────────────────────────────────────────────────────────────────────
/** How far the block (and the hanging mass) travel in a run, in metres: one hanging mass; two hanging masses. */
export const TRAVEL = { single: 0.34, two: 0.26 };
/** The book's numbers and what the window's steppers allow. */
export const BOOK = { single: { M: 2, m: 5 }, two: { m2: 10, m1: 5, m: 5 } };
/** @type {{ M: [number, number, number], m: [number, number, number] }} [min, max, step] */
export const EX_LIMITS = { M: [1, 10, 1], m: [1, 20, 1] };

/**
 * One hanging mass M (kg) pulling a block m (kg) over a smooth table (চিত্র ৩.০৯).
 * @returns {{ W: number, a: number, T: number }} W = M g (N), a (ms⁻²), the string's pull T (N)
 */
export function pull(M, m, g = G) {
  const W = M * g;
  const a = W / (M + m);
  return { W, a, T: m * a };
}

/**
 * The block with a hanging mass at each end of its table (চিত্র ৩.১০): m₂ on the left string, m₁ on the right one.
 * a is positive towards the left (the heavier side); the two strings pull with different tensions.
 * @returns {{ a: number, T2: number, T1: number, W2: number, W1: number, left: boolean }}
 */
export function twoWeights(m2, m1, m, g = G) {
  const a = ((m2 - m1) * g) / (m1 + m2 + m);
  return { a: Math.abs(a), T2: m2 * (g - a), T1: m1 * (g + a), W2: m2 * g, W1: m1 * g, left: a >= 0 };
}

/** Seconds (real) to cover `d` metres from rest at acceleration `a`. */
export const runTime = (a, d) => Math.sqrt((2 * d) / a);

/** Distance covered and speed after `t` real seconds from rest, stopping at `d` metres. */
export function runAt(a, d, t) {
  const s = Math.min(d, 0.5 * a * t * t);
  return { s, v: a * Math.min(t, runTime(a, d)), done: s >= d - 1e-9 };
}

/** Everything the picture and the window need for one setup: { kind, M, m, a, T, W, … } (two: m2, m1, T2, T1, left). */
export function solve(setup, g = G) {
  if (setup.kind === 'two') return { ...setup, ...twoWeights(setup.m2, setup.m1, setup.m, g) };
  return { ...setup, ...pull(setup.M, setup.m, g) };
}

/** The distance one run covers. */
export const travel = (setup) => TRAVEL[setup.kind === 'two' ? 'two' : 'single'];

/** Sizes of the bodies from their mass (cube root, so a heavier one is bigger but not silly): metres. */
export const blockSize = (m) => {
  const k = (m / 5) ** (1 / 3);
  return { w: 0.26 * k, h: 0.17 * k, d: 0.2 * k };
};
export const weightSize = (M) => {
  const k = (M / 5) ** (1 / 3);
  return { rBottom: 0.105 * k, rTop: 0.066 * k, body: 0.115 * k, knob: 0.045 };
};
