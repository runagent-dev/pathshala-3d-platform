// The maths of the figure, kept apart from the 3D so it can be unit-tested (book p175, "নিজে করো" at the end of 6.3.3).
// Two balloons of the same volume (1 L) start at room temperature (30 °C): one is filled with water, the other with air.
// Both are kept in hot water. The air is a gas, so at nearly constant pressure V grows with the absolute temperature
// (V₂/V₁ = T₂/T₁, kelvin); the water is a liquid, which expands only a little (its density, from tables).

export const T0 = 30; // °C: the balloons at the start (a warm room)
export const V0 = 1000; // mL: the same volume of water and of air
export const T_CHOICES = [50, 70, 90]; // °C: the hot water
export const EXAGGERATION = 3; // the picture draws the swelling's radius this many times too big (said on screen)

// water's volume relative to 30 °C (from its density: 995.65, 992.2, 988.04, 983.2, 977.8, 971.8, 965.3 kg/m³)
const WATER = [
  [30, 1],
  [40, 1.0035],
  [50, 1.0077],
  [60, 1.0126],
  [70, 1.0183],
  [80, 1.0245],
  [90, 1.0314],
];

export const clampT = (T) => Math.min(90, Math.max(T0, T));

/** V(T)/V(30 °C) for the balloon of water, by interpolating the table. */
export function waterRatio(T) {
  const x = clampT(T);
  for (let i = 1; i < WATER.length; i++) {
    if (x <= WATER[i][0]) {
      const [a, ra] = WATER[i - 1];
      const [b, rb] = WATER[i];
      return ra + ((rb - ra) * (x - a)) / (b - a);
    }
  }
  return WATER[WATER.length - 1][1];
}

/** V(T)/V(30 °C) for the balloon of air: V ∝ T in kelvin (the book's gas at constant pressure). */
export const airRatio = (T) => (clampT(T) + 273.15) / (T0 + 273.15);

/** Whole percent more than before. */
export const percentUp = (ratio) => Math.round((ratio - 1) * 100);
/** Volume in mL to the nearest 10 mL (the panel never shows false precision). */
export const mL = (ratio) => Math.round((V0 * ratio) / 10) * 10;

/** The drawn radius for a volume ratio: the true radius change times EXAGGERATION. */
export const drawnRatio = (ratio) => 1 + EXAGGERATION * (Math.cbrt(ratio) - 1);

export function readings(T) {
  const a = airRatio(T);
  const w = waterRatio(T);
  return { T: Math.round(T), air: { ratio: a, mL: mL(a), pct: percentUp(a) }, water: { ratio: w, mL: mL(w), pct: percentUp(w) } };
}

export function shuffle(list, rnd = Math.random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
