// The maths of the air-pressure figure (book page 142, topic 5.4). The air outside presses on every face of a thin tin
// box with the book's 10⁵ N/m² (= 1,00,000 Pa). The air inside presses back just as hard, so nothing happens. Each
// stroke of the pump takes some of the inside air out: the inside pressure drops, the difference ΔP = P(outside) −
// P(inside) is left over, and on one 10 cm × 10 cm face (A = 0.01 m²) it makes a force F = ΔP × A that crushes the
// box. The air column: on 1 m² the column of air above weighs 10⁵ N (the book: about an elephant's weight), so
// P = F/A = 10⁵ N/m². Pure functions, unit-tested in test/unit/air-pressure.test.mjs.

/** The air pressure at the Earth's surface, as the book gives it: 10⁵ N/m² (Pa). */
export const P_AIR = 100000;
/** The book's power of ten for it (10⁵). */
export const P_EXP = 5;

/** The tin box: a cube 10 cm on a side, so one face is 10 cm × 10 cm = 100 cm² = 0.01 m². */
export const SIDE = 0.1; // m
export const SIDE_CM = 10;
export const FACE_CM2 = SIDE_CM * SIDE_CM;

/** The pump: each stroke takes out this much of the inside pressure (made simple: equal steps), down to nothing. */
export const STROKE_PA = 20000;
export const STROKES = P_AIR / STROKE_PA; // 5 strokes: 1,00,000 → 80,000 → … → 0 (বায়ুশূন্য)

/** The parts of the figure (the row of words): the tin box, the air column, our body. */
export const PARTS = ['can', 'column', 'body'];

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** cm² → m² (1 m² = 100 cm × 100 cm = 10,000 cm²). */
export const toM2 = (cm2) => round(cm2 / 10000, 8);

/** A stroke count on the pump's range (0 … 5, whole strokes). */
export function fixStrokes(n) {
  const v = Math.round(Number(n) || 0);
  return Math.min(STROKES, Math.max(0, v));
}

/** The pressure left inside the box after n strokes (Pa). */
export const insidePressure = (n) => P_AIR - fixStrokes(n) * STROKE_PA;

/** ΔP: how much more the outside air presses than the inside air (Pa). */
export const pressureDifference = (n) => P_AIR - insidePressure(n);

/** F = ΔP × A: the force left over on one face (N), with A in cm² (converted to m² first). */
export const faceForce = (dP, cm2 = FACE_CM2) => round(dP * toM2(cm2), 6);

/** P = F/A (the book's 5.1): pascal from newtons and m². */
export const pressureOf = (F, m2) => round(F / m2, 6);

/** The weight of the air column over 1 m² at the Earth's surface (N): P × A = 10⁵ N/m² × 1 m². */
export const COLUMN_AREA = 1; // m²
export const columnWeight = (P = P_AIR, m2 = COLUMN_AREA) => round(P * m2, 6);

/**
 * How crumpled the box is (0 = new, 1 = crushed) for a pressure difference: it gives a little at first and more
 * and more as the difference grows (a picture, not a model of buckling).
 */
export const crumpleFor = (dP) => {
  const k = Math.min(1, Math.max(0, dP / P_AIR));
  return round(k ** 1.25, 4);
};

/** The length of a pressure arrow (m) for a pressure (Pa): the outside air's 1,00,000 Pa → 4 cm. */
export const ARROW_PER_PA = 0.04 / P_AIR;
export const arrowLength = (P) => Math.max(0, P) * ARROW_PER_PA;

/**
 * Digits grouped the Bangladeshi way (the last three, then twos): 100000 → "1,00,000", 25000 → "25,000". Latin
 * digits; t.num turns them into Bangla ones. Decimals are kept as they are (0.01 → "0.01").
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

// ── the test ────────────────────────────────────────────────────────────────
/** Stroke counts for the force question (never 0 or 5: then one of the mistakes would give the same number). */
export const QUIZ_STROKES = [1, 2, 3, 4];

/**
 * The force on one face after n strokes: the right one first (ΔP × A), then the usual mistakes: the outside pressure
 * alone (forgetting the inside air still pushes back), the inside pressure instead of the difference, and the area
 * left in cm².
 */
export function forceChoices(n) {
  const pIn = insidePressure(n);
  const dP = pressureDifference(n);
  return [
    { key: 'right', v: faceForce(dP) },
    { key: 'outside', v: faceForce(P_AIR) },
    { key: 'inside', v: faceForce(pIn) },
    { key: 'cm2', v: round(dP * FACE_CM2, 6) },
  ];
}
