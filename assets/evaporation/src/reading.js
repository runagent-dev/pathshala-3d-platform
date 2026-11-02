// The maths of the evaporation figure (book topic 6.4, pages 177–178): two vessels of liquid side by side, one thing
// different about the second, and how much liquid each has left as time goes on. A model of "more evaporation, less
// liquid left": the liquid lost per unit of time is the rate of evaporation per square centimetre of surface (k, in
// arbitrary units, 1 for still air at room temperature) times the area of the surface. Not a measurement of real
// water: the figure says "relative" and shows percentages of the liquid left. Pure functions, no DOM.

export const V0 = 90; // cc of liquid in each vessel at the start
export const T_END = 10; // the run lasts this many time units
const LOSS = 0.1; // cc lost per time unit, per cm² of surface, at k = 1

/** The factors of the book's list (page 177–178) that fit one setup, two open vessels on the bench (the book's air pressure, with a bell jar and a pump, is left out). */
export const FACTORS = ['wind', 'area', 'liquid', 'warm', 'dry'];

/**
 * What differs in each case: the plain vessel (left) and the changed one (right), each with the area of its surface
 * (cm²) and the relative rate k (per cm²).
 *  - wind: a fan blows across the right vessel; - area: the same liquid in a glass and in a wide plate;
 *  - liquid: water and a volatile liquid (a low boiling point); - warm: the right vessel on a warm plate; - dry: humid air round the left vessel, dry round the right.
 */
export const CASES = {
  wind: { plain: { A: 50, k: 1 }, changed: { A: 50, k: 3 } },
  area: { plain: { A: 30, k: 1 }, changed: { A: 120, k: 1 } },
  liquid: { plain: { A: 50, k: 1 }, changed: { A: 50, k: 4 } },
  warm: { plain: { A: 50, k: 1 }, changed: { A: 50, k: 3 } },
  dry: { plain: { A: 50, k: 0.5 }, changed: { A: 50, k: 1.5 } },
};

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** cc of liquid lost per time unit by a vessel. */
export const lossRate = ({ A, k }) => k * A * LOSS;

/** cc of liquid left in a vessel at time t. */
export const remaining = (vessel, t) => Math.max(0, V0 - lossRate(vessel) * clamp(t, 0, T_END));

/** Percent of the liquid left (whole numbers). */
export const percentLeft = (vessel, t) => Math.round((remaining(vessel, t) / V0) * 100);

/** Depth of the liquid in cm (a straight-sided vessel of surface area A: 1 cc = 1 cm³). */
export const depth = (vessel, t) => remaining(vessel, t) / vessel.A;

/** Evaporation rate relative to the fastest case (0–1), 0 once the vessel is dry: how much vapour to draw. */
const FASTEST = Math.max(...Object.values(CASES).flatMap((c) => [lossRate(c.plain), lossRate(c.changed)]));
export const vapour = (vessel, t) => (remaining(vessel, t) > 0 ? clamp(lossRate(vessel) / FASTEST, 0, 1) : 0);

/** The time (units) at which a vessel runs dry, or null if it does not within the run. */
export function dryAt(vessel) {
  const t = V0 / lossRate(vessel);
  return t <= T_END ? t : null;
}

/** Which vessel has less liquid left at time t: 'plain', 'changed' or 'same'. */
export function emptierAt(factor, t) {
  const a = remaining(CASES[factor].plain, t);
  const b = remaining(CASES[factor].changed, t);
  if (Math.abs(a - b) < 0.5) return 'same';
  return b < a ? 'changed' : 'plain';
}

/** The radius (cm) of a round vessel with a surface of area A. */
export const radiusOf = (A) => Math.sqrt(A / Math.PI);
