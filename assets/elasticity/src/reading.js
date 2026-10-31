// The maths of the spring (pure functions, unit-tested in test/unit/elasticity.test.mjs). A steel spring of length
// L₀ = 20 cm hangs from a stand; brass weights of 1 N each hang from it one at a time. The book's quantities
// (pages 147–148): বিকৃতি (strain) = (L − L₀)/L₀, no unit; পীড়ন (stress) = F/A on the cross-section A of the spring's
// wire, in Pa; within the elastic limit পীড়ন = ধ্রুবক × বিকৃতি (Hooke's law). Past the limit (here 4 N) the spring
// stretches much more for each newton, and part of that stretch stays when the weights come off: a permanent set
// (স্থায়ী বিকৃতি). Taken on again, it stretches along a straight line from that set, up to the biggest load it has had.

export const L0 = 20; // cm: the spring's length with nothing on it
export const W1 = 1; // N: each brass weight
export const MAX_N = 6; // weights on the stand
export const AREA_MM2 = 10; // the wire's cross-section A (mm²)
export const AREA_M2 = 0.00001; // the same in m²
export const MODULUS = 1000000; // Pa: পীড়ন ÷ বিকৃতি within the limit (the constant)
export const LIMIT_N = 4; // the elastic limit (N on the spring)
/** Strain that stays (the permanent set) once the spring has carried this many newtons past the limit. */
const SET_AFTER = { 5: 0.15, 6: 0.35 };
export const LAKH = 100000;

/** Rounds without binary leftovers (0.1 + 0.2 → 0.3). */
export function round(x, d = 3) {
  return +(Math.round(x * 10 ** d) / 10 ** d).toFixed(d);
}

/** পীড়ন F/A in Pa for n weights. */
export const stress = (n) => round((n * W1) / AREA_M2, 0);

/** The set a spring keeps after carrying n weights (0 within the limit). */
export function setAfter(n) {
  if (n <= LIMIT_N) return 0;
  return SET_AFTER[Math.min(MAX_N, n)] ?? 0;
}

/**
 * A spring's history: { set, peak }: the strain it keeps with nothing on it, and the most weights it has carried.
 * load(spring, n) → the spring after n weights hang on it (its set and peak only grow).
 */
/** @typedef {{ set: number, peak: number }} Spring */
/** @type {Readonly<Spring>} */
export const FRESH = Object.freeze({ set: 0, peak: 0 });
export function load(spring, n) {
  const k = Math.max(0, Math.min(MAX_N, Math.round(n)));
  return { set: Math.max(spring.set, setAfter(k)), peak: Math.max(spring.peak, k) };
}

/** বিকৃতি with n weights on a spring with this history (after hanging them: load first). */
export function strain(spring, n) {
  const s = load(spring, n);
  return round(stress(n) / MODULUS + s.set, 3);
}

/** The spring's length L (cm) and its stretch x = L − L₀ (cm). */
export const lengthOf = (spring, n) => round(L0 * (1 + strain(spring, n)), 2);
export const stretchOf = (spring, n) => round(lengthOf(spring, n) - L0, 2);

/** Has this spring been past its elastic limit? Is n weights past it (for this spring)? */
export const overstretched = (spring) => spring.peak > LIMIT_N;
export const beyond = (n) => n > LIMIT_N;

/** Is the point (n weights on this spring) on the straight line of Hooke's law from the origin? */
export const onHookeLine = (spring, n) => spring.set === 0 && n <= LIMIT_N;

/** পীড়ন ÷ বিকৃতি (Pa), or null with no strain. Within the limit it is MODULUS every time. */
export function ratio(spring, n) {
  const e = strain(spring, n);
  return e > 0 ? round(stress(n) / e, 0) : null;
}

/** Pa in lakh (1,00,000 Pa) for the Bangla text: 300000 → 3. */
export const lakh = (pa) => round(pa / LAKH, 2);

/** Indian/Bangladeshi digit groups: 1000000 → '10,00,000'. */
export function groupBD(x) {
  const [whole, frac] = String(x).split('.');
  const neg = whole.startsWith('-');
  const w = neg ? whole.slice(1) : whole;
  const last3 = w.slice(-3);
  const rest = w.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${neg ? '-' : ''}${rest ? `${rest},` : ''}${last3}${frac ? `.${frac}` : ''}`;
}
/** International groups: 1000000 → '1,000,000'. */
export const groupIntl = (x) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ── the test ─────────────────────────────────────────────────────────────────

/** Four choices, the right one first, each with a key that names the mistake behind it. */
export function strainChoices(n) {
  const L = lengthOf(FRESH, n);
  const x = round(L - L0, 2);
  return [
    { key: 'right', v: round(x / L0, 3) },
    { key: 'cm', v: x }, // L − L₀ itself, a length
    { key: 'ratio', v: round(L / L0, 3) }, // forgot to take L₀ away
    { key: 'unit', v: round(x / L0, 3) }, // the right number with a unit it doesn't have
  ];
}

/** n weights, A in m²: the stress, and the usual slips. */
export function stressChoices(n) {
  return [
    { key: 'right', v: stress(n) },
    { key: 'force', v: n * W1 }, // F, not F/A
    { key: 'mm2', v: round((n * W1) / AREA_MM2, 2) }, // divided by mm² without changing to m²
    { key: 'zero', v: stress(n) * 10 }, // one zero too many in A
  ];
}

/** x for one weight is known; x for n weights within the limit, and the usual guesses. */
export function hookeChoices(n) {
  const x1 = stretchOf(FRESH, 1);
  return [
    { key: 'right', v: round(x1 * n, 2) },
    { key: 'same', v: x1 }, // the stretch doesn't change
    { key: 'count', v: n }, // the number of weights as cm
    { key: 'square', v: round(x1 * n * n, 2) }, // grows like n²
  ];
}

/** Up to which stress (lakh Pa) is the graph a straight line? */
export function limitChoices() {
  return [
    { key: 'right', v: lakh(stress(LIMIT_N)) },
    { key: 'top', v: lakh(stress(MAX_N)) }, // the highest point
    { key: 'after', v: lakh(stress(LIMIT_N + 1)) }, // the first point past the bend
    { key: 'early', v: lakh(stress(2)) }, // stopped too soon
  ];
}
