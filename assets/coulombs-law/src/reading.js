// The maths of Coulomb's law (book pages 279–281, topic 10.4): F = k q₁q₂ / r² with the book's k = 9 × 10⁹ Nm²/C²,
// the book's sign rule (F > 0: the two push apart; F < 0: they pull together), its two worked examples (+1 C and −1 C
// 10 cm apart: −9 × 10¹¹ N; +9 C and +16 C 1 m apart: the third charge feels no force at x = 0.43 m from +9 C), numbers
// in the book's "a × 10ⁿ" form, and the test's choices. Pure functions, unit-tested in test/unit/coulombs-law.test.mjs.

/** The book's constant (N m² C⁻²). */
export const K = 9e9;

/** The steps of the story, in order (the first screen, 'intro', comes before them). */
export const STEPS = ['attract', 'repel', 'distance', 'law', 'balance'];

/** The book's example (a): +1 C and −1 C, 10 cm apart. */
export const EX_A = { q1: 1, q2: -1, r: 0.1 };
/** The book's example (b): +9 C and +16 C, 1 m apart, a third charge +q between them. */
export const EX_B = { qa: 9, qb: 16, d: 1 };
/** The charges the student may set (C), and the distances (m) the second sphere may be dragged to. */
export const Q_RANGE = [-2, 2];
export const R_RANGE = [0.1, 0.3];
/** Where the third charge may be dragged (m from +9 C), and the third charge itself (C): the book's +q, taken as +1 C. */
export const X_RANGE = [0.15, 0.85];
export const Q_TEST = 1;

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** F = k q₁q₂ / r² (N): positive when the charges push apart, negative when they pull together (the book's rule). */
export function coulomb(q1, q2, r) {
  return (K * q1 * q2) / (r * r);
}

/** "attract" | "repel" | "none": what the sign of F says. */
export function kindOf(q1, q2) {
  const p = q1 * q2;
  return p > 0 ? 'repel' : p < 0 ? 'attract' : 'none';
}

/**
 * A number in the book's form a × 10ⁿ: { m, e, neg } with 1 ≤ |m| < 10, m rounded to `digits` significant figures
 * (trailing zeros dropped). 0 gives { m: 0, e: 0 }.
 */
export function sci(x, digits = 3) {
  if (!x) return { m: 0, e: 0, neg: false };
  const neg = x < 0;
  const a = Math.abs(x);
  let e = Math.floor(Math.log10(a));
  let m = round(a / 10 ** e, digits - 1);
  if (m >= 10) {
    m = round(m / 10, digits - 1);
    e += 1;
  }
  return { m: neg ? -m : m, e, neg };
}

/** The book's example (b): the place between two like charges qa and qb, d apart, where a third charge feels no force
 *  (m from qa): k qa q / x² = k qb q / (d − x)² gives x = d √qa / (√qa + √qb). */
export function balanceX(qa = EX_B.qa, qb = EX_B.qb, d = EX_B.d) {
  const a = Math.sqrt(Math.abs(qa));
  const b = Math.sqrt(Math.abs(qb));
  return (d * a) / (a + b);
}

/** The two roots of the book's 7x² + 18x − 9 = 0 (from 9(1 − x)² = 16x²), smaller first. */
export function bookRoots() {
  const [A, B, C] = [7, 18, -9];
  const s = Math.sqrt(B * B - 4 * A * C);
  return [(-B - s) / (2 * A), (-B + s) / (2 * A)];
}

/**
 * The forces on a third charge q at x between qa (at 0) and qb (at d): f1 from qa (positive: to the right, away from
 * qa), f2 from qb (positive: to the left, away from qb), and the net force (to the right positive).
 */
export function forcesOnQ(x, { qa = EX_B.qa, qb = EX_B.qb, d = EX_B.d, q = Q_TEST } = {}) {
  const f1 = coulomb(qa, q, x);
  const f2 = coulomb(qb, q, d - x);
  return { f1, f2, net: f1 - f2 };
}

/** A round top for a graph's axis: 1, 2, 2.5, 5 or 10 times a power of ten, at least x. */
export function niceCeil(x) {
  if (!(x > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= x - 1e-12) return k * p;
  return 10 * p;
}

/** Shuffles a list in place (Math.random is seeded in the tests) and returns it. */
export function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * The test's number questions: the right value first, then the usual mistakes, each with its key.
 * 'far': the distance doubled (F/4); mistakes: half (F ∝ 1/r), the same, double.
 * 'charge': one charge tripled (3F); mistakes: 9F (squared), F/3 (upside down), the same.
 * 'point': the no-force point between +4 C and +1 C 0.9 m apart (0.6 m from +4 C); mistakes: the middle, nearer the
 * bigger charge (0.3 m), in the ratio of the charges (0.72 m).
 */
export function choicesFor(kind, F = 0) {
  if (kind === 'far')
    return [
      { key: 'right', v: F / 4 },
      { key: 'half', v: F / 2 },
      { key: 'same', v: F },
      { key: 'double', v: F * 2 },
    ];
  if (kind === 'charge')
    return [
      { key: 'right', v: F * 3 },
      { key: 'nine', v: F * 9 },
      { key: 'third', v: F / 3 },
      { key: 'same', v: F },
    ];
  // 'point'
  return [
    { key: 'right', v: round(balanceX(4, 1, 0.9), 2) },
    { key: 'middle', v: 0.45 },
    { key: 'near', v: 0.3 },
    { key: 'ratio', v: round((0.9 * 4) / 5, 2) },
  ];
}
