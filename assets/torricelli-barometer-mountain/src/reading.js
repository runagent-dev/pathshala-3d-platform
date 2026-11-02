// The maths of the barometer up a mountain (book page 146, topic 5.4.1): the mercury column falls with the height
// above the sea (about 76, 67, 60 and 53 cm at 0, 1000, 2000 and 3000 m), the air's pressure from it by P = hρg,
// the test's choices. Pure functions, unit-tested in test/unit/torricelli-barometer-mountain.test.mjs.

/** Densities (kg m⁻³): mercury is 13.6 times as dense as water; the book takes a cold drink to be about water. */
export const RHO = { mercury: 13600, water: 1000, drink: 1000 };
export const G = 9.8; // m s⁻², as the book's worked examples
/** The mercury column at the sea (m): the book's 76 cm. */
export const H_HG = 0.76;

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** P = hρg: the pressure (Pa, whole) under a liquid column h metres high of density ρ. */
export const columnPressure = (h, rho) => round(h * rho * G, 0);

// ── the tube ────────────────────────────────────────────────────────────────
/** The glass tube (m): its inside length from the open mouth to the closed top, and how deep its mouth is. */
export const TUBE = { length: 1.05, mouthDepth: 0.025 };

/** The vacuum left at the top of a tilted tube (m along the tube; 0 if the mercury fills it). */
export function vacuumLength(h, deg) {
  const cos = Math.cos((deg * Math.PI) / 180);
  return Math.max(0, TUBE.length - TUBE.mouthDepth / cos - h / cos);
}

// ── up a mountain ───────────────────────────────────────────────────────────
/** The heights the student goes up to (m above the sea). */
export const ALTITUDES = [0, 1000, 2000, 3000];

/**
 * The mercury column at a height above the sea (m, to the whole cm): less air above, less pressure, a lower column.
 * The standard atmosphere's fall of pressure with height (P ∝ (1 − 2.25577 × 10⁻⁵ z)^5.25588), scaled to the book's
 * 76 cm at the sea: 76, 67, 60 and 53 cm at 0, 1000, 2000 and 3000 m. Shown as "প্রায়".
 */
export function columnAt(z) {
  const k = (1 - 2.25577e-5 * Math.max(0, z)) ** 5.25588;
  return round(H_HG * k, 2);
}

// ── numbers ─────────────────────────────────────────────────────────────────
/**
 * Digits grouped the Bangladeshi way (the last three, then twos): 101293 → "1,01,293", 13600 → "13,600". Latin
 * digits; t.num turns them into Bangla ones. Decimals are kept as they are (0.76 → "0.76").
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

/** Digits grouped in threes (for English): 101293 → "101,293". */
export function groupIntl(x) {
  const [int, frac] = String(Math.abs(x)).split('.');
  return `${x < 0 ? '−' : ''}${int.replace(/\B(?=(\d{3})+$)/g, ',')}${frac ? `.${frac}` : ''}`;
}

/** Metres as whole centimetres: 0.6 → 60. */
export const toCm = (m) => round(m * 100, 0);

// ── the test ────────────────────────────────────────────────────────────────
/**
 * The column read off the scale up the mountain (cm): the right one first, then the sea's 76 cm (not read at all),
 * as far above 76 as it really is below (the wrong way), and one a few cm off (misread by a mark).
 */
export function readChoices(cm) {
  return [
    { key: 'right', v: cm },
    { key: 'sea', v: 76 },
    { key: 'up', v: 76 + (76 - cm) },
    { key: 'off', v: cm - 5 },
  ];
}
