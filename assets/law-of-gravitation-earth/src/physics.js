// The maths of the weight on the Earth (book pages 78–79, topic 3.7), pure functions, unit-tested in
// test/unit/law-of-gravitation-earth.test.mjs. The book's numbers: G = 6.67 × 10⁻¹¹ N m² kg⁻², the Earth's mass
// M = 5.98 × 10²⁴ kg and radius R = 6.37 × 10⁶ m (about 6370 km), so g = GM/R² ≈ 9.83 ≈ 9.8 m s⁻².

export const G = 6.67e-11; // N m² kg⁻² (book)
export const EARTH = { M: 5.98e24, R: 6.37e6 }; // kg, m (book)

/** g = GM/R² (m s⁻²): the acceleration the Earth's pull gives any body at distance R from its centre. */
export const gravity = (M = EARTH.M, R = EARTH.R) => (G * M) / (R * R);

/** The Earth's pull on a body of mass m kg on its surface: F = GMm/R², the body's weight (newtons). */
export const weight = (m, M = EARTH.M, R = EARTH.R) => (G * M * m) / (R * R);

/** Rounds x to `d` decimals without binary leftovers (3.335 → 3.34). */
export function roundTo(x, d = 2) {
  const k = 10 ** d;
  return Math.round(x * k * (1 + 1e-12)) / k;
}

/** The student's two steps: put a 1 kg weight on the Earth, then a second one on top. */
export const STEPS = ['place', 'add'];

/**
 * g at a place k Earth radii from the centre (k = 2: a weight one radius above the ground), with the usual slips: g
 * = GM/(kR)² is right; the distance not squared; g unchanged (as if height did not matter); the wrong way squared.
 * Every choice starts from the g the question states (9.8, rounded to one decimal), so 4 × 9.8 = 39.2 is the last one,
 * not 4 × 9.83.
 */
export function heightChoices(k = 2, M = EARTH.M, R = EARTH.R) {
  const g0 = roundTo(gravity(M, R), 1);
  return [g0 / (k * k), g0 / k, g0, g0 * k * k];
}

/** R for a body 1 m above the ground: about the Earth's radius; the height above the ground; the diameter; km read as m. */
export function radiusChoices(R = EARTH.R, h = 1) {
  return [R + h, h, 2 * R, R / 1000];
}
