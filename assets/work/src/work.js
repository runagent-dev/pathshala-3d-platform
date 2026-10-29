// The maths of the figure, kept apart from the 3D so it can be unit-tested (book p100, 4.1: W = Fs).
// A push of F newtons moves the crate s metres along the force; then the hands let go and the crate slides d = s / 2
// more before it stops (the book's d: no force, so no work by F). The motion: speeding up evenly while pushed, slowing
// evenly after (d = s / 2 means the slide takes half the push's time and the top speed is reached at the release).

export const F_RANGE = { min: 10, max: 100, step: 10 }; // N
export const S_RANGE = { min: 1, max: 4, step: 1 }; // m
export const DEFAULTS = { F: 50, s: 2 }; // the default reproduces nothing printed (the page has no numbers): 100 J
export const SLIDE = 0.5; // d = SLIDE × s

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
/** Round to a step without float dust (0.1 + 0.2 → 0.3). */
export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);

/** Work done by the force: W = F s (J, with F in N and s in m). */
export const work = (F, s) => roundTo(F * s, 1e-6);

export const clampF = (F) => clamp(roundTo(Number(F) || 0, F_RANGE.step), F_RANGE.min, F_RANGE.max);
export const clampS = (s) => clamp(roundTo(Number(s) || 0, S_RANGE.step), S_RANGE.min, S_RANGE.max);

/** The slide after the hands let go: d = s / 2 (m). */
export const slideOf = (s) => roundTo(s * SLIDE, 1e-6);

/** Seconds of pushing for a push of s metres (a longer push takes longer, but not in proportion, so it stays brisk). */
export const pushTime = (s) => roundTo(1.4 + 0.8 * s, 1e-6);

/**
 * The run for a push of s metres: { s, d, T1 (push s), T2 (slide s), v (m/s at the release) }.
 * Speeding up evenly from rest over s in T1: v = 2s / T1; slowing evenly from v to rest over d: T2 = 2d / v.
 */
export function plan(s) {
  const d = slideOf(s);
  const T1 = pushTime(s);
  const v = (2 * s) / T1;
  return { s, d, T1, T2: (2 * d) / v, v };
}

/**
 * Where the crate is t seconds after the push starts: { x (m from the start), v (m/s), phase: 'push' | 'slide' | 'done' }.
 * @param {{ s: number, d: number, T1: number, T2: number, v: number }} p
 */
export function motionAt(p, t) {
  if (t <= 0) return { x: 0, v: 0, phase: 'push' };
  if (t < p.T1) {
    const a = p.v / p.T1;
    return { x: 0.5 * a * t * t, v: a * t, phase: 'push' };
  }
  const u = t - p.T1;
  if (u < p.T2) {
    const a = p.v / p.T2;
    return { x: p.s + p.v * u - 0.5 * a * u * u, v: p.v - a * u, phase: 'slide' };
  }
  return { x: p.s + p.d, v: 0, phase: 'done' };
}

/**
 * What the panel shows for the crate x metres from the start: the displacement while the force acted (sNow, snapped to
 * 0.1 m, the number shown) and the work from that same number (lesson 20: numbers that should agree, agree).
 */
export function workSoFar(F, s, x) {
  const sNow = roundTo(clamp(x, 0, s), 0.1);
  return { sNow, W: work(F, sNow), dNow: roundTo(clamp(x - s, 0, s), 0.1) };
}

/** Numbers in sentences without trailing zeros ("2", "1.5"); live readouts keep one decimal ("1.0"). */
export const plain = (x) => String(roundTo(x, 0.01));
export const fixed1 = (x) => roundTo(x, 0.1).toFixed(1);

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
 * one-line note). Duplicates, the right value, negative and (with `whole`) fractional values among the mistakes are
 * dropped; at most three mistakes.
 * @param {number} right
 * @param {{ value: number, why: string }[]} mistakes
 */
export function choicesFrom(right, mistakes, { whole = true } = {}) {
  const seen = new Set([roundTo(right, 1e-6)]);
  const wrong = [];
  for (const m of mistakes) {
    const v = roundTo(m.value, 1e-6);
    if (!Number.isFinite(v) || v < 0 || seen.has(v) || (whole && !Number.isInteger(v))) continue;
    seen.add(v);
    wrong.push({ value: v, why: m.why });
    if (wrong.length === 3) break;
  }
  return [{ value: roundTo(right, 1e-6), why: null }, ...wrong];
}

/** The usual mistakes when working out W from F, s and the slide d. */
export const workMistakes = (F, s, d) => [
  { value: F * (s + d), why: 'w_sd' }, // counted the slide too
  { value: F + s, why: 'w_add' }, // added instead of multiplying
  { value: F * d, why: 'w_d' }, // used the slide instead of the push
  { value: F / s, why: 'w_div' },
];

/** The usual mistakes when finding F from W and s (d the slide). */
export const forceMistakes = (W, s, d) => [
  { value: W / (s + d), why: 'f_sd' },
  { value: W * s, why: 'f_mul' },
  { value: W / d, why: 'f_d' },
  { value: W - s, why: 'f_sub' },
];
