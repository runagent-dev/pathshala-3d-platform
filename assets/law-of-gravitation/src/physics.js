// The maths of the law of gravitation (book pages 78–79, topic 3.7), pure functions, unit-tested in
// test/unit/law-of-gravitation.test.mjs. The book's numbers: G = 6.67 × 10⁻¹¹ N m² kg⁻², the Earth's mass
// M = 5.98 × 10²⁴ kg and radius R = 6.37 × 10⁶ m (about 6370 km), so g = GM/R² ≈ 9.83 ≈ 9.8 m s⁻².

export const G = 6.67e-11; // N m² kg⁻² (book)
export const EARTH = { M: 5.98e24, R: 6.37e6 }; // kg, m (book)
export const IRON = 7870; // kg/m³: the two spheres are solid iron, so twice the mass is twice the iron

/** F = G m₁m₂ / r² (newtons), for masses in kg and r in m. */
export const force = (m1, m2, r) => (G * m1 * m2) / (r * r);

/** g = GM/R² (m s⁻²): the acceleration the Earth's pull gives any body at distance R from its centre. */
export const gravity = (M = EARTH.M, R = EARTH.R) => (G * M) / (R * R);

/** The Earth's pull on a body of mass m kg on its surface: F = GMm/R², the body's weight (newtons). */
export const weight = (m, M = EARTH.M, R = EARTH.R) => (G * M * m) / (R * R);

/** The radius (m) of a solid sphere of mass m kg (iron unless another density is given). */
export const sphereRadius = (m, rho = IRON) => Math.cbrt((3 * m) / (4 * Math.PI * rho));

/** Rounds x to `d` decimals without binary leftovers (3.335 → 3.34). */
export function roundTo(x, d = 2) {
  const k = 10 ** d;
  return Math.round(x * k * (1 + 1e-12)) / k;
}

/**
 * x in scientific notation with `digits` decimals: { m: '1.67', e: -5 } for 1.6675e-5. With `exp` given, the mantissa
 * is written for that power of ten instead (0.42 for 4.17e-6 at exp −5), so choices can be compared at a glance.
 */
export function sci(x, digits = 2, exp = null) {
  if (x === 0) return { m: (0).toFixed(digits), e: exp ?? 0 };
  let e = exp ?? Math.floor(Math.log10(Math.abs(x)));
  let m = roundTo(x / 10 ** e, digits);
  if (exp == null && Math.abs(m) >= 10) {
    e += 1;
    m = roundTo(x / 10 ** e, digits);
  }
  return { m: m.toFixed(digits), e };
}

// ── the figure's cases ────────────────────────────────────────────────────────
export const MASSES = [1000, 2000]; // kg: each sphere is 1,000 kg or (doubled) 2,000 kg of iron
export const DISTANCES = [1, 2]; // m between the centres

/** Where each example starts (masses in kg, r in m). */
export const BASES = {
  dist: { m1: 1000, m2: 1000, r: 1 }, // two 1,000 kg spheres 1 m apart: F = G × 10⁶ = 6.67 × 10⁻⁵ N
  mass: { m1: 1000, m2: 1000, r: 2 }, // the distance example ends here, so the mass example goes on from it
};
export const EXAMPLES = ['dist', 'mass', 'earth'];

/**
 * The student's five steps in the book's order of ideas: double the distance (the pull drops to a quarter), double
 * m₁ (it doubles), double m₂ too (four times), then put a 1 kg weight on the Earth (its weight GMm/R², R to the
 * centre) and a second one (twice the weight, the same g). Each step changes one thing from the state before it.
 */
export const STEPS = [
  { example: 'dist', act: 'r2' },
  { example: 'mass', act: 'm1' },
  { example: 'mass', act: 'm2' },
  { example: 'earth', act: 'place' },
  { example: 'earth', act: 'add' },
];

/** The state after the first n of the natural steps (n = 0…5). */
export function stateAfter(n) {
  const s = { example: 'dist', ...BASES.dist, placed: false, kg: 1 };
  for (const step of STEPS.slice(0, Math.max(0, Math.min(STEPS.length, n)))) {
    if (step.example !== s.example && step.example === 'mass') Object.assign(s, BASES.mass);
    s.example = step.example;
    if (step.act === 'r2') s.r = 2;
    if (step.act === 'm1') s.m1 = 2000;
    if (step.act === 'm2') s.m2 = 2000;
    if (step.act === 'place') s.placed = true;
    if (step.act === 'add') s.kg = 2;
  }
  return s;
}

// ── the arrows ───────────────────────────────────────────────────────────────
// One scale for every force between the spheres, so their lengths compare honestly: the pull between two 1,000 kg
// spheres 1 m apart (6.67 × 10⁻⁵ N) is drawn 1 m long. The figure's states run from a quarter of that to it.
export const F_REF = force(1000, 1000, 1);
export const ARROW_REF = 1; // m
export const arrowLength = (F) => (F / F_REF) * ARROW_REF;

// ── the test: the right answer first, then the usual mistakes ────────────────
/** What F becomes when one mass doubles (or halves): right, squared by mistake, the other way, unchanged. */
export function massChoices(F, factor = 2) {
  return [F * factor, F * factor * factor, F / factor, F];
}

/** What F becomes when r is multiplied by k (2 or ½): right (1/k²), the square forgotten, the wrong way, the wrong way squared. */
export function distanceChoices(F, k = 2) {
  return [F / (k * k), F / k, F * k, F * k * k];
}

/**
 * g at a place k Earth radii from the centre (k = 2: a weight one radius above the ground), with the usual slips: g
 * = GM/(kR)² is right; the distance not squared; g unchanged (as if height did not matter); the wrong way squared.
 */
export function heightChoices(k = 2, M = EARTH.M, R = EARTH.R) {
  const g0 = gravity(M, R);
  return [gravity(M, k * R), g0 / k, g0, g0 * k * k];
}

/** R for a body 1 m above the ground: about the Earth's radius; the height above the ground; the diameter; km read as m. */
export function radiusChoices(R = EARTH.R, h = 1) {
  return [R + h, h, 2 * R, R / 1000];
}
