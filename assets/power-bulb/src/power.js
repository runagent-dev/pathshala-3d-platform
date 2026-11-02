// The maths of the figure, kept apart from the 3D so it can be unit-tested (book p120, 4.7: P = W / t).
// The book's 100 W bulb uses 100 J each second: E = Pt. (G, H and FULL size the house and its roof tanks.)

export const BULB = 100; // W: the book's bulb
export const BULB_TIME = 10; // s: the bulb is switched on for this long

/** Round to a step without float dust (0.1 + 0.2 → 0.3). */
export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** The bulb `t` seconds after it was switched on: whole seconds, energy used so far E = Pt. */
export function bulbAt(t, P = BULB, T = BULB_TIME) {
  const done = t >= T - 1e-9;
  const sec = done ? T : Math.floor(clamp(t, 0, T) + 1e-9);
  return { t: sec, E: roundTo(P * sec, 1e-6), on: t > 0 && !done, done };
}

/** Shuffle in place with the page's Math.random (seeded by the test harness). */
export function shuffle(list, rnd = Math.random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * The test's numeric choices: the right value and real mistakes (each a { value, why } with `why` a key for its
 * one-line note). Duplicates, the right value, non-positive and (with `whole`) fractional values among the mistakes
 * are dropped; at most three mistakes.
 * @param {number} right
 * @param {{ value: number, why: string }[]} mistakes
 */
export function choicesFrom(right, mistakes, { whole = true } = {}) {
  const seen = new Set([roundTo(right, 1e-6)]);
  const wrong = [];
  for (const m of mistakes) {
    const v = roundTo(m.value, 1e-6);
    if (!Number.isFinite(v) || v <= 0 || seen.has(v) || (whole && !Number.isInteger(v))) continue;
    seen.add(v);
    wrong.push({ value: v, why: m.why });
    if (wrong.length === 3) break;
  }
  return [{ value: roundTo(right, 1e-6), why: null }, ...wrong];
}

/** The usual mistakes when finding the energy a bulb of P watts uses in t seconds. */
export const energyMistakes = (P, t) => [
  { value: P, why: 'e_one' },
  { value: P + t, why: 'e_add' },
  { value: P / t, why: 'e_div' },
  { value: P * t * 60, why: 'e_min' },
];
