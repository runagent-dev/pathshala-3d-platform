// The maths of the water barometer (book page 145, topic 5.4.1): P = hρg (topic 5.3) with the book's numbers
// (ρ of mercury 13.6 times ρ of water, g = 9.8 m s⁻²): the air that holds up 76 cm of mercury holds up 10.3 m of
// water; the test's choices. Pure functions, unit-tested in test/unit/torricelli-water-barometer.test.mjs.

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

// ── numbers ─────────────────────────────────────────────────────────────────

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
