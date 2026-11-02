// The maths of Torricelli's experiment (book page 145–146, topic 5.4.1): the pressure of a liquid column P = hρg
// (topic 5.3) with the book's numbers (ρ of mercury 13.6 times ρ of water, g = 9.8 m s⁻²), the 76 cm mercury column
// that balances the air's pressure (about 10⁵ N/m², topic 5.4), the 10.3 m of water (or cold drink) that would do the
// same, and the vacuum left at the top. Pure functions, unit-tested in test/unit/torricelli-barometer.test.mjs.

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
export const TUBE = { length: 1.0, mouthDepth: 0.025 };

/** The vacuum left at the top of a tilted tube (m along the tube; 0 if the mercury fills it). */
export function vacuumLength(h, deg) {
  const cos = Math.cos((deg * Math.PI) / 180);
  return Math.max(0, TUBE.length - TUBE.mouthDepth / cos - h / cos);
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

/** The water column for the same air (m): 10.3 first, then 76 cm unchanged, 76 cm ÷ 13.6, 76 cm × 1.36. */
export function waterChoices() {
  return [
    { key: 'right', v: H_WATER },
    { key: 'same', v: H_HG },
    { key: 'divide', v: round(H_HG / RATIO, 3) },
    { key: 'tenth', v: round(H_WATER / 10, 2) },
  ];
}
