// The maths of the figure (pure functions, unit-tested in test/unit/hanging-weight-pull.test.mjs). Book pages 81–82,
// topic 3.7: a hanging mass M pulls a block m over a smooth table through a string over a pulley.
//   block:        T = m a                       (right is positive)
//   hanging mass: T − M g = M (−a)              (up is positive)
//   so            a = M g / (M + m),   T = m M g / (M + m)  (less than M g)
// The page-82 example hangs a mass at each end of the block's string: m₂ on the left, m₁ on the right.

/** g in ms⁻² (the book's value). */
export const G = 9.8;
/** How far the block (and the hanging mass) travel in a run, in metres: one hanging mass; two hanging masses. */
export const TRAVEL = { single: 0.34, two: 0.26 };
/** Time is slowed down by this much on screen: a run lasts 0.3 to 0.7 s for real. */
export const SLOW = 4;

export const round = (x, digits = 2) => Math.round(x * 10 ** digits) / 10 ** digits;
/** A number for a sentence: at most two decimals, no trailing zeros ("2.8", "3.27", "14"). */
export const plain = (x) => String(+Number(x).toFixed(2));

/**
 * One hanging mass M (kg) pulling a block m (kg) over a smooth table.
 * @returns {{ W: number, a: number, T: number }} W = M g (N), a (ms⁻²), the string's pull T (N)
 */
export function pull(M, m, g = G) {
  const W = M * g;
  const a = W / (M + m);
  return { W, a, T: m * a };
}

/**
 * The block with a hanging mass at each end of its table (page 82): m₂ on the left string, m₁ on the right one.
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

/** The four experiments of the row of words, in order: what hangs, what is on the table. */
export const EXPERIMENTS = {
  w2: { kind: 'single', M: 2, m: 5 },
  w5: { kind: 'single', M: 5, m: 5 },
  heavy: { kind: 'single', M: 5, m: 10 },
  two: { kind: 'two', m2: 10, m1: 5, m: 5 },
};
export const IDS = Object.keys(EXPERIMENTS);

/** Everything the picture and the panel need for one setup: { kind, M, m, a, T, W, … } (two: m2, m1, T2, T1, left). */
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

// ── the test's mass sets and choices (pure, so the unit tests can check that no two choices read the same) ──────────
/** (M, m) for the question that reads the acceleration off the picture: M < m, so even the wrong Mg/m stays below g. */
export const CALC_PAIRS = [
  [2, 3],
  [3, 4],
  [3, 7],
  [2, 5],
  [4, 6],
];
/** (M, m) for "the hanging mass is made 2 times" and "the block is made 2 times as heavy". */
export const M_PAIRS = [
  [2, 4],
  [2, 6],
  [3, 6],
];
export const m_PAIRS = [
  [5, 5],
  [3, 3],
  [4, 3],
];
/** (m₂ left, m₁ right, m) for the two-weights question: the heavier side is left or right. */
export const TWO_PAIRS = [
  [10, 5, 5],
  [5, 10, 5],
  [8, 2, 5],
  [2, 8, 5],
];

/** The acceleration question: the right a first, then three real mistakes (M and m swapped; M forgotten as a moving mass; a = g). */
export function calcChoices(M, m, g = G) {
  return [
    { key: 'right', v: (M * g) / (M + m) },
    { key: 'swap', v: (m * g) / (M + m) },
    { key: 'block', v: (M * g) / m },
    { key: 'g', v: g },
  ].map((x) => ({ ...x, v: round(x.v, 2) }));
}

/** "One string, one pull": the pull on the hanging mass equals the one on the block; wrong: the weight, nothing, both added. */
export function sameChoices(M, m, g = G) {
  const { W, T } = pull(M, m, g);
  return [
    { key: 'same', v: round(T, 2) },
    { key: 'weight', v: round(W, 2) },
    { key: 'zero', v: 0 },
    { key: 'sum', v: round(2 * T, 2) },
  ];
}

/** The two-weights question: the right way and a first; then the other way, forgetting the lighter mass, forgetting the block. */
export function twoChoices(m2, m1, m, g = G) {
  const sol = twoWeights(m2, m1, m, g);
  const big = Math.max(m1, m2);
  const small = Math.min(m1, m2);
  return [
    { key: 'right', left: sol.left, v: round(sol.a, 2) },
    { key: 'side', left: !sol.left, v: round(sol.a, 2) },
    { key: 'one', left: sol.left, v: round((big * g) / (big + small + m), 2) },
    { key: 'nomass', left: sol.left, v: round(((big - small) * g) / (big + small), 2) },
  ];
}
