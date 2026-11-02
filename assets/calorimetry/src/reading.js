// The maths of the page (book pp179-181, topic 6.6): two bodies at different temperatures are mixed, nothing is lost
// to the surroundings, so the heat the hot one gives up is exactly the heat the cold one takes in. Pure functions,
// unit-tested in test/unit/calorimetry.test.mjs. SI units: kg, J, K (a difference in °C is a difference in K).
//
// The book's three worked examples (m₁ is the one the book's equation puts first):
//   ice     p179-180: 1 L of water at 30 °C, a 100 gm piece of ice at 0 °C let go in it; L = 334 kJ/kg; T = 20 °C.
//                     m₁ = the ice, m₂ = the water:   m₁L + m₁sT = m₂s(30 °C − T)
//   water   p180-181: 2 L of water at 75 °C and 1 L at 20 °C added; T = 56.6 °C (the book); m₁ = 2 kg (75 °C),
//                     m₂ = 1 kg (20 °C), as its equation m₁s(75 °C − T) = m₂s(T − 20 °C) and its sum 75×2 + 20 use them.
//   iron    p181:     a 10 gm piece of iron at 120 °C let go in 1 kg of water at 30 °C; s₁ = 0.45×10³, s₂ = 4.2×10³;
//                     T = 30.1 °C:   m₁s₁(120 °C − T) = m₂s₂(T − 30 °C)

/** Water's specific heat, J kg⁻¹K⁻¹ (the book's 4.2 × 10³). */
export const WATER_S = 4200;
/** Latent heat of melting of ice, J/kg (the book's 334 kJ/kg). */
export const ICE_L = 334000;

/**
 * hot / cold: { m kg, T0 °C, s J kg⁻¹K⁻¹ }; cold.L: latent heat the cold body (ice) needs first; `holds`: which one
 * sits in the beaker at the start ('hot' or 'cold'; the other is added), `litres`: the beaker's water at the start.
 */
export const EXAMPLES = {
  ice: {
    id: 'ice',
    hot: { m: 1, T0: 30, s: WATER_S, what: 'water' },
    cold: { m: 0.1, T0: 0, s: WATER_S, L: ICE_L, what: 'ice' },
    holds: 'hot',
    litres: 1,
    bookT: '20',
  },
  water: {
    id: 'water',
    hot: { m: 2, T0: 75, s: WATER_S, what: 'water' },
    cold: { m: 1, T0: 20, s: WATER_S, what: 'water' },
    holds: 'hot',
    litres: 2,
    bookT: '56.6',
  },
  iron: {
    id: 'iron',
    hot: { m: 0.01, T0: 120, s: 450, what: 'iron' },
    cold: { m: 1, T0: 30, s: WATER_S, what: 'water' },
    holds: 'cold',
    litres: 1,
    bookT: '30.1',
  },
};
export const EXAMPLE_IDS = /** @type {const} */ (['ice', 'water', 'iron']);

/** Final temperature T (°C) and the heat the hot body gives and the cold body takes (J). */
export function solve(ex) {
  const { hot, cold } = ex;
  const L = cold.L || 0;
  const T = (hot.m * hot.s * hot.T0 + cold.m * cold.s * cold.T0 - cold.m * L) / (hot.m * hot.s + cold.m * cold.s);
  const given = hot.m * hot.s * (hot.T0 - T);
  const taken = cold.m * L + cold.m * cold.s * (T - cold.T0);
  return { T, given, taken, melts: T >= cold.T0 };
}

const settle = (k) => (1 - Math.exp(-4 * k)) / (1 - Math.exp(-4));

/** The beaker's temperature when a fraction u (0…1) of the mixing has happened (all mixed instantly, as the book assumes). */
export function tempAt(ex, u) {
  const k = Math.min(1, Math.max(0, u));
  const { hot, cold } = ex;
  if (ex.id === 'ice') {
    // a fraction k of the ice has melted: the hot water has paid for that part only
    return (hot.m * hot.s * hot.T0 - k * cold.m * cold.L + k * cold.m * cold.s * cold.T0) / (hot.m * hot.s + k * cold.m * cold.s);
  }
  if (ex.id === 'water') {
    // a fraction k of the cold water has been poured in
    return (hot.m * hot.T0 + k * cold.m * cold.T0) / (hot.m + k * cold.m);
  }
  // a small hot piece: the water warms a little, fast at first, as the piece cools
  return cold.T0 + (solve(ex).T - cold.T0) * settle(k);
}

/** The piece's own temperature while it cools (iron: from 120 °C to T); for the others, null. */
export function pieceTempAt(ex, u) {
  if (ex.id !== 'iron') return null;
  const k = Math.min(1, Math.max(0, u));
  return ex.hot.T0 + (solve(ex).T - ex.hot.T0) * settle(k);
}

/** Litres of water in the beaker at fraction u of the mixing (a kilogram of water is a litre). */
export function litresAt(ex, u) {
  const k = Math.min(1, Math.max(0, u));
  if (ex.id === 'iron') return ex.litres;
  return ex.litres + k * ex.cold.m; // the melted ice, the poured water
}

/** Three significant figures (the heats are "about"): 41818 → 41800, 404.6 → 405. */
export function round3(x) {
  if (!x) return 0;
  const p = 10 ** (Math.floor(Math.log10(Math.abs(x))) - 2);
  return Math.round(x / p) * p;
}

/** The temperature as the figure shows it: one decimal, no trailing ".0" ("20", "56.7", "30.1"). */
export function tempText(T) {
  const r = Math.round(T * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** The usual wrong answers for the final temperature of two waters (for the test). */
export function mixMistakes(ex) {
  const { hot, cold } = ex;
  return {
    right: solve(ex).T,
    average: (hot.T0 + cold.T0) / 2, // forgetting that the masses differ
    swapped: (cold.m * hot.T0 + hot.m * cold.T0) / (hot.m + cold.m), // masses on the wrong temperatures
    difference: hot.T0 - cold.T0,
  };
}
