// The maths of the water barometer (book page 145, topic 5.4.1): P = hρg (topic 5.3) with the book's numbers
// (ρ of mercury 13.6 times ρ of water, g = 9.8 m s⁻²): the air that holds up 76 cm of mercury holds up 10.3 m of
// water (or of a cold drink, about as dense as water); a 10.5 m straw leaves 0.2 m empty at its top; the guided
// sequence's steps and the test's choices. Pure functions, unit-tested in test/unit/torricelli-water-barometer.test.mjs.

/** Densities (kg m⁻³): mercury is 13.6 times as dense as water; the book takes a cold drink to be about water. */
export const RHO = { mercury: 13600, water: 1000, drink: 1000 };
export const G = 9.8; // m s⁻², as the book's worked examples
/** The mercury column at the sea (m): the book's 76 cm. */
export const H_HG = 0.76;
/** How many times mercury is denser than water (the book's 13.6). */
export const RATIO = RHO.mercury / RHO.water;
/** The water column that balances the air (m): the book rounds 76 cm × 13.6 = 10.336 m to 10.3 m. */
export const H_WATER = 10.3;
/** The book's straw (m): 10.5 m long, the drink stops at 10.3 m. */
export const STRAW = 10.5;
/** The person beside the water tube, for the scale (m). */
export const PERSON_H = 1.6;

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** P = hρg: the pressure (Pa, whole) under a liquid column h metres high of density ρ. */
export const columnPressure = (h, rho) => round(h * rho * G, 0);

/** The column of a liquid of density ρ that the same pressure P holds up (m): h = P/(ρg). */
export const columnFor = (P, rho) => P / (rho * G);

/** 76 cm × 13.6 (m), what a straw of water (or cold drink) would need; the book says 10.3 m. */
export const waterColumn = () => round(H_HG * RATIO, 3);

/** How many 76 cm pieces stack up to the water's column: 13.6 (10.336 m ÷ 0.76 m). */
export const segments = () => round(waterColumn() / H_HG, 1);

/** The empty part at the top of the book's 10.5 m straw (m): 0.2. */
export const strawGap = () => round(STRAW - H_WATER, 2);

/** How many people of 1.6 m stand as tall as the water's column: about 6. */
export const peopleTall = () => Math.round(H_WATER / PERSON_H);

/** Metres as whole centimetres: 0.6 → 60. */
export const toCm = (m) => round(m * 100, 0);

// ── the guided sequence ─────────────────────────────────────────────────────
/** The four steps: the mercury barometer, water instead, the two compared, the book's straw. */
export const STEPS = ['mercury', 'water', 'compare', 'straw'];

/** A step from a URL parameter or a command: 1–4, or its name; anything else is the first. */
export function stepIndex(v) {
  if (typeof v === 'string' && STEPS.includes(v)) return STEPS.indexOf(v);
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 1 && n <= STEPS.length ? n - 1 : 0;
}

// ── the test ────────────────────────────────────────────────────────────────
/** The water column for the same air (m): 10.3 first, then 76 cm unchanged, 76 cm ÷ 13.6, 76 cm × 1.36. */
export function waterChoices() {
  return [
    { key: 'right', v: H_WATER },
    { key: 'same', v: H_HG },
    { key: 'divide', v: round(H_HG / RATIO, 3) },
    { key: 'tenth', v: round(H_WATER / 10, 2) },
  ];
}

/** How high a 12 m straw lifts a cold drink (m): 10.3 first, then the whole straw, the mercury's 76 cm, 1.03 m. */
export const LONG_STRAW = 12;
export function strawChoices() {
  return [
    { key: 'right', v: H_WATER },
    { key: 'whole', v: LONG_STRAW },
    { key: 'mercury', v: H_HG },
    { key: 'tenth', v: round(H_WATER / 10, 2) },
  ];
}
