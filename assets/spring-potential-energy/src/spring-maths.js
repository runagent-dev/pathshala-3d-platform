// The maths of the spring figure (book p106–107, 4.3.2): a spring of constant k pulled out or pushed in x from its
// rest length. The hand's force and the spring's force are equal and opposite, F = kx; the energy stored in the
// spring is the book's V = ½kx². x is kept in whole centimetres (the student's steps and the ruler) and turned into
// metres for the sums, so every number on screen comes from the same x. Pure functions, unit-tested.

export const K_RANGE = { min: 100, max: 400, step: 100 }; // N/m: a spring a hand can squeeze 10 cm (10–40 N)
export const X_RANGE = { min: -10, max: 10, step: 1 }; // cm: + pulled out (stretched), − pushed in (compressed)
export const DEFAULTS = { k: 200, x: 0 };
export const REST_LENGTH = 0.3; // m: the spring at rest (stretched 40 cm, squeezed 20 cm long; its coils never touch)

export const roundTo = (x, step) => Math.round(x / step) * step;
const clean = (x) => Math.round(x * 1e6) / 1e6;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** k on its steps (100, 200, 300, 400 N/m). */
export const clampK = (k) => clamp(roundTo(Number(k) || DEFAULTS.k, K_RANGE.step), K_RANGE.min, K_RANGE.max);
/** x in whole centimetres, −10 … +10 (− pushed in). */
export const clampX = (x) => clamp(Math.round(Number(x) || 0), X_RANGE.min, X_RANGE.max);

/** The stretch or squeeze in metres (always ≥ 0: the book's x is a distance). */
export const metres = (xcm) => clean(Math.abs(xcm) / 100);
/** F = kx in newtons: the hand's pull or push, and the spring's force back (the same size). */
export const force = (k, xcm) => clean(k * metres(xcm));
/** V = ½kx² in joules: the energy stored in the spring. */
export const energy = (k, xcm) => clean(0.5 * k * metres(xcm) ** 2);
/** 'rest' | 'stretched' | 'compressed'. */
export const stateOf = (xcm) => (xcm > 0 ? 'stretched' : xcm < 0 ? 'compressed' : 'rest');

/** Numbers in sentences without trailing zeros ("0.1", "0.25", "1"). */
export const plain = (x) => String(clean(x));

/**
 * What happened since an earlier state the student saw with the same spring, pulled (or pushed) the same way:
 * { times, F, V, from } when x grew by a whole factor (2 or 3: "twice the stretch, twice the force, four times the
 * energy"), else null.
 */
export function compare(prev, now) {
  if (!prev || prev.k !== now.k || prev.x === 0 || now.x === 0 || Math.sign(prev.x) !== Math.sign(now.x)) return null;
  const a = Math.abs(prev.x);
  const b = Math.abs(now.x);
  if (b <= a || b % a !== 0) return null;
  const times = b / a;
  if (times > 3) return null;
  return { times, F: times, V: times * times, from: { F: force(prev.k, prev.x), V: energy(prev.k, prev.x) } };
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
 * The test's numeric choices: the right value and real mistakes (each { value, why }, `why` a key for its one-line
 * note). Duplicates, the right value and non-positive values are dropped; at most three mistakes.
 * @param {number} right
 * @param {{ value: number, why: string }[]} mistakes
 */
export function choicesFrom(right, mistakes) {
  const seen = new Set([clean(right)]);
  const wrong = [];
  for (const m of mistakes) {
    const v = clean(m.value);
    if (!Number.isFinite(v) || v <= 0 || seen.has(v)) continue;
    seen.add(v);
    wrong.push({ value: v, why: m.why });
    if (wrong.length === 3) break;
  }
  return [{ value: clean(right), why: null }, ...wrong];
}

/** The usual mistakes when working out F = kx (k in N/m, x in cm). */
export const forceMistakes = (k, xcm) => [
  { value: k * Math.abs(xcm), why: 'm_cm' }, // x left in centimetres
  { value: 0.5 * k * metres(xcm), why: 'm_halfF' }, // the ½ belongs to the energy, not the force
  { value: k * metres(xcm) ** 2, why: 'm_sqF' }, // squared x
  { value: k / metres(xcm), why: 'm_div' },
];

/** The usual mistakes when working out V = ½kx². */
export const energyMistakes = (k, xcm) => [
  { value: k * metres(xcm) ** 2, why: 'm_noHalf' }, // forgot the ½
  { value: 0.5 * k * metres(xcm), why: 'm_noSq' }, // forgot the square
  { value: k * metres(xcm), why: 'm_isF' }, // gave the force F = kx
  { value: 0.5 * k * Math.abs(xcm) ** 2, why: 'm_cmV' }, // x left in centimetres
];
