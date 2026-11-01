// The maths of Torricelli's experiment (book page 145–146, topic 5.4.1): the pressure of a liquid column P = hρg
// (topic 5.3) with the book's numbers (ρ of mercury 13.6 times ρ of water, g = 9.8 m s⁻²), the 76 cm mercury column
// that balances the air's pressure (about 10⁵ N/m², topic 5.4), the 10.3 m of water (or cold drink) that would do the
// same, the column of a tilted tube, the column higher up a mountain, and the jet from a hole in a water tank. Pure
// functions, unit-tested in test/unit/torricelli-barometer.test.mjs.

/** Densities (kg m⁻³): mercury is 13.6 times as dense as water; the book takes a cold drink to be about water. */
export const RHO = { mercury: 13600, water: 1000, drink: 1000 };
export const G = 9.8; // m s⁻², as the book's worked examples
/** The mercury column at the sea (m): the book's 76 cm. */
export const H_HG = 0.76;
/** How many times mercury is denser than water (the book's 13.6). */
export const RATIO = RHO.mercury / RHO.water;
/** The water column that balances the air (m): the book rounds 76 cm × 13.6 = 10.336 m to 10.3 m. */
export const H_WATER = 10.3;

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** P = hρg: the pressure (Pa, whole) under a liquid column h metres high of density ρ. */
export const columnPressure = (h, rho) => round(h * rho * G, 0);

/** The column of a liquid of density ρ that the same pressure P holds up (m): h = P/(ρg). */
export const columnFor = (P, rho) => P / (rho * G);

/** 76 cm × 13.6 (m), what a straw of water (or cold drink) would need; the book says 10.3 m. */
export const waterColumn = () => round(H_HG * RATIO, 3);

// ── the tube ────────────────────────────────────────────────────────────────
/** The glass tube (m): its inside length from the open mouth to the closed top, and how deep its mouth is. */
export const TUBE = { length: 1.05, mouthDepth: 0.025 };

/** The tilts the student steps through (degrees from upright). At 40° a thin vacuum is still left at the top. */
export const TILTS = [0, 10, 20, 30, 40];

/**
 * The mercury along a tilted tube (m, from the dish's surface to the column's top): the vertical height stays h, so
 * the length along the tube is h / cos θ.
 */
export const tiltLength = (h, deg) => h / Math.cos((deg * Math.PI) / 180);

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

// ── the straw ───────────────────────────────────────────────────────────────
/** The straw (m): how far it reaches above the drink's surface in the bottle, to the mouth. */
export const STRAW_RISE = 0.2;

// ── the tank with a hole (the owner's third picture) ────────────────────────
/**
 * A glass tank of water on the bench with one corked hole near the bottom (m): the water's height above the
 * tank's floor, the hole's height above the floor, the floor's height above the bench.
 */
export const TANK = { water: 0.26, hole: 0.04, floor: 0.008, low: 0.1 };

/** The hole's depth below the water's surface (m). */
export const holeDepth = (water = TANK.water) => round(Math.max(0, water - TANK.hole), 3);

/**
 * Where the jet lands on the bench (m from the tank's wall): water leaves the hole level, falls the hole's height
 * above the bench, and goes farther the deeper the hole is under the surface (a picture of the jet, not a formula
 * the student sees).
 */
export function jetReach(depth, fall = TANK.hole + TANK.floor) {
  return depth > 0 ? 2 * Math.sqrt(depth * fall) : 0;
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
 * The air's pressure from the column read off the scale (cm), P = hρg: the right one first, then the usual
 * mistakes: h left in cm, ρ of water instead of mercury, the sea's 76 cm instead of the reading.
 */
export function pressureChoices(cm) {
  const h = cm / 100;
  return [
    { key: 'right', v: columnPressure(h, RHO.mercury) },
    { key: 'cm', v: columnPressure(cm, RHO.mercury) },
    { key: 'water', v: columnPressure(h, RHO.water) },
    { key: 'sea', v: columnPressure(H_HG, RHO.mercury) },
  ];
}

/**
 * The vertical height of the mercury's top in a tilted tube (cm): the right one (76) first, then the length along
 * the tube, 76 × cos θ (as if the column were shortened by the tilt), and the reading upright minus the tilt.
 */
export function tiltChoices(deg) {
  const along = toCm(tiltLength(H_HG, deg));
  const cos = toCm(H_HG * Math.cos((deg * Math.PI) / 180));
  const less = 76 - deg / 2;
  const items = [
    { key: 'right', v: 76 },
    { key: 'along', v: along },
    { key: 'cos', v: cos },
  ];
  if (!items.some((x) => x.v === less)) items.push({ key: 'less', v: less });
  else items.push({ key: 'less', v: 76 - deg });
  return items;
}

/** The water column for the same air (m): 10.3 first, then 76 cm unchanged, 76 cm ÷ 13.6, 76 cm × 1.36. */
export function waterChoices() {
  return [
    { key: 'right', v: H_WATER },
    { key: 'same', v: H_HG },
    { key: 'divide', v: round(H_HG / RATIO, 3) },
    { key: 'tenth', v: round(H_WATER / 10, 2) },
  ];
}
