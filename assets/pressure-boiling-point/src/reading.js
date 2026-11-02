// The maths of the pressure-boiling-point figure (book page 182, topic 6.7): three cases of one pot of water on a
// stove: in the open (the usual air pressure), high on a mountain (less air pressure) and in a pressure cooker (steam
// shut in, more pressure). Each has a boiling point; heating takes the water there and no further. The book gives no
// numbers, so the temperatures are round and marked "প্রায়" (about) except the usual 100° C; they are not from the page.

export const CASES = ['plain', 'mountain', 'cooker'];
export const DATA = {
  plain: { tb: 100, pressure: 'normal', cooking: 'normal', arrow: 0.045 },
  mountain: { tb: 90, pressure: 'low', cooking: 'slow', arrow: 0.022 },
  cooker: { tb: 120, pressure: 'high', cooking: 'fast', arrow: 0.06 },
};
export const T0 = 25; // °C: the water before heating
export const T_MIN = 20; // the thermometer's scale
export const T_MAX = 130;
export const T_REF = 100; // the usual boiling point, marked on the scale
export const HEAT_S = 6; // s: from cold to boiling, shown fast
export const BOIL_S = 6; // s: bubbles keep rising this long, then the picture rests (the figure draws nothing when idle)

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const fixCase = (c) => (CASES.includes(c) ? c : 'plain');

/** The boiling point (°C) of a case. */
export const boilingPoint = (c) => DATA[fixCase(c)].tb;

/** The water's temperature (°C) a fraction k (0 … 1) of the way through heating: smooth, ending exactly at the boiling point. */
export function tempAt(c, k) {
  const x = clamp01(k);
  const e = x * x * (3 - 2 * x);
  return T0 + (boilingPoint(c) - T0) * e;
}

/** How high the thermometer's red thread stands (0 … 1) at a temperature. */
export function mercuryLevel(T) {
  return clamp01((T - T_MIN) / (T_MAX - T_MIN));
}

/** How strongly the water bubbles (0 … 1): a few small bubbles from warm, a full boil at the boiling point. */
export function bubbleIntensity(c, k) {
  const T = tempAt(c, k);
  const tb = boilingPoint(c);
  return clamp01((T - (tb - 35)) / 35);
}

/** The story: 'idle' (cold), 'heating', 'boiling' (at the boiling point). */
export function phaseOf({ k, heating }) {
  if (k >= 1) return 'boiling';
  return heating || k > 0 ? 'heating' : 'idle';
}

/** The case after this one, in the book's order after the usual pot. */
export const nextCase = (c) => CASES[(CASES.indexOf(fixCase(c)) + 1) % CASES.length];

/** What the next tap does. */
export function nextOf(k, busy) {
  if (busy) return '';
  return k >= 1 ? 'next' : 'heat';
}

/** The test's scenes: the case and how far through heating (0 cold … 1 boiling). */
export const SCENES = {
  mtn_bp: { c: 'mountain', k: 0 },
  mtn_cook: { c: 'mountain', k: 1 },
  cooker_p: { c: 'cooker', k: 0 },
  cooker_fast: { c: 'cooker', k: 1 },
  gas: { c: 'plain', k: 0 },
};
export const QUIZ_KINDS = ['mtn_bp', 'mtn_cook', 'cooker_p', 'cooker_fast', 'gas'];
