// The maths of the tank with a hole (the owner's third picture, topic 5.4.1): the depth h of the hole under the
// surface, the pressure hρg there (topic 5.3), and where the jet lands. Pure functions, unit-tested in
// test/unit/torricelli-barometer-tank.test.mjs.

/** Densities (kg m⁻³): mercury is 13.6 times as dense as water; the book takes a cold drink to be about water. */
export const RHO = { mercury: 13600, water: 1000, drink: 1000 };
export const G = 9.8; // m s⁻², as the book's worked examples

/** A number without binary leftovers: round(0.1 + 0.2, 2) = 0.3. */
export const round = (x, d = 0) => +(Math.round(Number(`${x}e${d}`)) / 10 ** d).toFixed(d);

/** P = hρg: the pressure (Pa, whole) under a liquid column h metres high of density ρ. */
export const columnPressure = (h, rho) => round(h * rho * G, 0);

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
