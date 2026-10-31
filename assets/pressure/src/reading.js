// The maths of the pressure figure (book page 129, topic 5.1): P = F/A, with the force F in newtons and the area A
// the book's way, in square metres (the shoes' areas are given in cm² and converted: 1 m² = 10,000 cm²). Pure
// functions, unit-tested in test/unit/pressure.test.mjs.

/** The two shoes: the area of the sole that touches the clay (cm²). The same force on each. */
export const SHOES = {
  heel: { area: 50 }, // a high heel: the front of the sole and the tip of the heel
  sneaker: { area: 200 }, // a flat sneaker: the whole sole
};
export const SHOE_IDS = ['heel', 'sneaker'];

/** The force on each shoe: [lowest, highest, step] in newtons, and where it starts. */
export const F_LIMITS = [100, 800, 100];
export const F_START = 500;

/** The views (the row of words): both shoes, close to the heel, close to the sneaker. */
export const VIEWS = ['both', 'heel', 'sneaker'];

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** cm² → m² (1 m² = 100 cm × 100 cm = 10,000 cm²). */
export const toM2 = (cm2) => round(cm2 / 10000, 8);

/** P = F/A: pascal (N/m²) from newtons and cm². */
export const pressure = (F, cm2) => round(F / toM2(cm2), 6);

/** F = PA (the book writes it too): newtons from pascal and cm². */
export const force = (P, cm2) => round(P * toM2(cm2), 6);

/** A force on the stepper's grid (100 … 800 N in steps of 100). */
export function fixForce(F) {
  const [lo, hi, step] = F_LIMITS;
  const v = Math.round((Number(F) || F_START) / step) * step;
  return Math.min(hi, Math.max(lo, v));
}

/** How many times the heel's pressure is the sneaker's, for the same force (the ratio of the areas). */
export const ratio = () => SHOES.sneaker.area / SHOES.heel.area;

/**
 * Digits grouped the Bangladeshi way (the last three, then twos): 100000 → "1,00,000", 25000 → "25,000". Latin
 * digits; t.num turns them into Bangla ones. Decimals are kept as they are (0.005 → "0.005").
 */
export function groupBD(x) {
  const neg = x < 0;
  const [int, frac] = String(Math.abs(x)).split('.');
  let out = int;
  if (int.length > 3) {
    const head = int.slice(0, -3);
    out = `${head.replace(/\B(?=(\d{2})+$)/g, ',')},${int.slice(-3)}`;
  }
  return `${neg ? '−' : ''}${out}${frac ? `.${frac}` : ''}`;
}

/** Digits grouped in threes (for English): 100000 → "100,000". */
export function groupIntl(x) {
  const [int, frac] = String(Math.abs(x)).split('.');
  return `${x < 0 ? '−' : ''}${int.replace(/\B(?=(\d{3})+$)/g, ',')}${frac ? `.${frac}` : ''}`;
}

/** How far a shoe sinks into the soft clay (m) under a pressure (Pa): deeper for more pressure (a picture, not data). */
export const SINK_PER_PA = 0.055 / 160000; // 1,60,000 Pa (the heel at 800 N) → 5.5 cm
export const sinkDepth = (P) => Math.max(0, P) * SINK_PER_PA;

/** The length of the pressure arrows (m) for a pressure (Pa): the longer the arrow, the more the pressure. */
export const ARROW_PER_PA = 0.1 / 100000; // 1,00,000 Pa → 10 cm
export const arrowLength = (P) => Math.max(0, P) * ARROW_PER_PA;

// ── the test ────────────────────────────────────────────────────────────────
/** Forces for the questions (not the starting 500 N). */
export const QUIZ_FORCES = [300, 400, 600, 700];
/** Pressures under the sneaker for the F = PA question (Pa). */
export const QUIZ_PRESSURES = [15000, 20000, 30000, 35000];

/**
 * The heel's pressure from F (the area read off the picture): the right one first, then the usual mistakes: the
 * sneaker's area, cm² not turned into m², F × A instead of F ÷ A.
 */
export function heelChoices(F) {
  const A = SHOES.heel.area;
  return [
    { key: 'right', v: pressure(F, A) },
    { key: 'other', v: pressure(F, SHOES.sneaker.area) },
    { key: 'cm2', v: round(F / A, 6) },
    { key: 'times', v: round(F * toM2(A), 6) },
  ];
}

/** The force on the sneaker from its pressure: F = PA, then the mistakes: P ÷ A, cm² not converted, the heel's area. */
export function forceChoices(P) {
  const A = SHOES.sneaker.area;
  return [
    { key: 'right', v: force(P, A) },
    { key: 'divide', v: round(P / toM2(A), 6) },
    { key: 'cm2', v: round(P * A, 6) },
    { key: 'other', v: force(P, SHOES.heel.area) },
  ];
}
