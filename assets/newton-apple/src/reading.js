// The maths of the falling apple (book page 79, topic 3.7), pure functions, unit-tested in
// test/unit/newton-apple.test.mjs. The book's numbers: G = 6.67 × 10⁻¹¹ N m² kg⁻², the Earth's mass M = 5.98 × 10²⁴ kg and
// radius R = 6.37 × 10⁶ m. GM/R² with those values is 9.83; the book and the sister figures round it to g = 9.8, and
// every number on the screen starts from that 9.8 (F = mg, the time, the speed), so F ÷ m is exactly 9.8 at every mass.

export const G = 6.67e-11; // N m² kg⁻² (book)
export const EARTH = { M: 5.98e24, R: 6.37e6 }; // kg, m (book)
export const BOOK_G = 9.8; // m s⁻²: the value the book and the sister figures use

export const MASS = { min: 0.1, max: 0.5, step: 0.05 }; // kg: the slider (100 g … 500 g)
export const HEIGHT = { min: 1, max: 5, step: 1 }; // m: the apples hang at each whole metre
export const STROBE = 0.1; // s between two pictures of the falling apple
export const APPLE_DENSITY = 750; // kg m⁻³: a real apple floats (about 8 cm across at 200 g)

/** Rounds x to `d` decimals without binary leftovers (3.335 → 3.34). */
export function roundTo(x, d = 2) {
  const k = 10 ** d;
  return Math.round(x * k * (1 + 1e-12)) / k;
}

/** The pull between masses m and M at distance R (N): F = G m M / R². */
export const pull = (m, M = EARTH.M, R = EARTH.R) => (G * m * M) / (R * R);

/** The acceleration the Earth gives any body, g = G M / R² (m s⁻²): m is not in it. */
export const gravity = (M = EARTH.M, R = EARTH.R) => (G * M) / (R * R);

/** The apple's weight, the Earth's pull on it, with the book's g: F = mg (N). */
export const weight = (m, g = BOOK_G) => m * g;

/** The distance in the formula for an apple h metres above the ground: from the Earth's centre, not from the ground. */
export const radiusAt = (h) => EARTH.R + h;

/** How much smaller g is h metres up than on the ground (a fraction): why the book ignores small heights. */
export const gChange = (h) => 1 - gravity(EARTH.M, radiusAt(h)) / gravity();

/** Time to fall h metres from rest, t = √(2h/g) (s). */
export const fallTime = (h, g = BOOK_G) => Math.sqrt((2 * h) / g);

/** Speed after falling h metres from rest, v = √(2gh) (m/s). */
export const landingSpeed = (h, g = BOOK_G) => Math.sqrt(2 * g * h);

/** The apple t seconds after it was let go from height h: { t, y (m above the ground), v, landed }. */
export function fallAt(t, h, g = BOOK_G) {
  const end = fallTime(h, g);
  const at = Math.max(0, Math.min(end, t));
  const landed = t >= end;
  return { t: at, y: landed ? 0 : h - 0.5 * g * at * at, v: g * at, landed };
}

/** The heights (m above the ground) of the pictures taken every `dt` seconds up to time t: the strobe trail. */
export function strobeHeights(h, t = Number.POSITIVE_INFINITY, dt = STROBE, g = BOOK_G) {
  const out = [];
  const end = Math.min(t, fallTime(h, g));
  for (let i = 0; i * dt <= end + 1e-9; i++) out.push(fallAt(i * dt, h, g).y);
  return out;
}

/** The gap between each picture and the next (m): it grows by g·dt² each time, the sign of a steady acceleration. */
export const strobeGaps = (heights) => heights.slice(1).map((y, i) => heights[i] - y);

/** The Earth's own acceleration from the apple's pull, F / M (m s⁻²): the same F on a huge mass. */
export const earthAcceleration = (m, M = EARTH.M) => weight(m) / M;

/** A real apple's radius (m), from its mass and density: the size follows the cube root of the mass. */
export const appleRadius = (m, density = APPLE_DENSITY) => Math.cbrt((3 * m) / (4 * Math.PI * density));

/** x as mantissa and power of ten: sci(3.29e-25, 1) → { m: '3.3', e: -25 }. */
export function sci(x, d = 2) {
  if (x === 0) return { m: '0', e: 0 };
  let e = Math.floor(Math.log10(Math.abs(x)));
  let m = roundTo(x / 10 ** e, d);
  if (Math.abs(m) >= 10) {
    m = roundTo(m / 10, d);
    e += 1;
  }
  return { m: String(m), e };
}

/** Whole numbers with Bangladeshi commas: 1,000 · 12,740 · 63,70,000. */
export function groupBD(n) {
  const s = String(Math.round(Math.abs(n)));
  if (s.length <= 3) return s;
  const head = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${s.slice(-3)}`;
}

/**
 * The test's weight question: the weight of an m kg apple in newtons, then the usual slips: dividing by g instead of
 * multiplying, the mass taken for the weight, g taken for the weight (as if the mass did not matter).
 */
export function weightChoices(m, g = BOOK_G) {
  return [roundTo(m * g, 2), roundTo(m / g, 2), roundTo(m, 2), g];
}
