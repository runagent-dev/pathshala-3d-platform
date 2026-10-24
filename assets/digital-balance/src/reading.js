// The balance's maths, apart from the 3D so it can be unit-tested. Book page 23 (1.6.2): a balance cannot
// measure mass directly; it measures the weight W pressing on its sensor and shows the mass m = W ÷ g.

export const G = 9.8; // m/s², as in the book
export const LC = 0.1; // g: the smallest step the display shows (ন্যূনাঙ্ক)
export const CAPACITY = 1000; // g

/** Rounds to a multiple of `step` without binary leftovers (56.3, not 56.300000000000004). */
export const roundTo = (x, step) => {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
  return +(Math.round(x / step) * step).toFixed(decimals);
};

/** Weight in newtons of a mass in grams. */
export const weightOf = (grams) => (grams / 1000) * G;

/** Mass in grams from a weight in newtons (what the sensor does). */
export const massFromWeight = (newtons) => (newtons / G) * 1000;

/**
 * What the display shows: the load minus what was tared, rounded to the least count, in grams or kilograms.
 * Returns { grams, value, text, unit, net }.
 */
export function display(loadGrams, { tare = 0, unit = 'g' } = {}) {
  const grams = roundTo(loadGrams - tare, LC);
  const value = unit === 'kg' ? +(grams / 1000).toFixed(4) : grams;
  const text = unit === 'kg' ? value.toFixed(4) : value.toFixed(1);
  return { grams, value, text, unit, net: tare !== 0 };
}

/** The things to weigh: their mass range in grams (the test picks a mass inside it). */
export const THINGS = {
  egg: { mass: 56.3, min: 48, max: 64 },
  mango: { mass: 212.4, min: 170, max: 260 },
  coin: { mass: 6.2, min: 5, max: 8 },
  weight: { mass: 100, min: 100, max: 100 }, // a standard brass weight (বাটখারা): always 100 g
  bowl: { mass: 124.6, min: 105, max: 145 },
};
export const THING_KINDS = Object.keys(THINGS);

export function randomMass(kind, random = Math.random) {
  const t = THINGS[kind];
  return roundTo(t.min + random() * (t.max - t.min), LC);
}
