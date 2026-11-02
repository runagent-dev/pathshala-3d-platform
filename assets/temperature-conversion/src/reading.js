// The maths of the figure, kept apart from the 3D so it can be unit-tested (book p165–166, topic 6.2.1):
// one temperature on three scales, Celsius T_C, Kelvin T_K and Fahrenheit T_F, joined by
//   (T_C − 0) / (100 − 0) = (T_K − 273.15) / (373.15 − 273.15) = (T_F − 32) / (212 − 32)
// that is T_C = T_K − 273.15° and T_C = 5/9 (T_F − 32°). Every temperature here is held in °C (the level of the liquid).

export const K0 = 273.15; // 0° C in kelvin
export const MIN_C = -50; // the lowest and highest levels the drawn thermometers reach, in °C
export const MAX_C = 310;

export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);
export const clampC = (c) => Math.min(MAX_C, Math.max(MIN_C, c));

export const toK = (c) => c + K0;
export const toF = (c) => (c * 9) / 5 + 32;
export const fromK = (k) => k - K0;
export const fromF = (f) => ((f - 32) * 5) / 9;

/** The three readings of one temperature (°C). */
export const convert = (c) => ({ c, k: toK(c), f: toF(c) });

/** The same fraction on all three scales: how far the liquid is from the first mark to the second (0 to 1 = 0° to 100° C). */
export const fraction = (c) => c / 100;

/** A number the way the book writes it: at most two decimals, no trailing zeros, a true minus sign, never "−0". */
export function fmt(x, digits = 2) {
  const v = +Number(x).toFixed(digits);
  if (v === 0) return '0';
  return String(v).replace('-', '−');
}

/** Which two scales read the same number at this temperature ('cf', 'kf', or null). C and K never do. */
export function sameNumber(c) {
  const { k, f } = convert(c);
  if (Math.abs(c - f) < 0.005) return 'cf';
  if (Math.abs(k - f) < 0.005) return 'kf';
  if (Math.abs(c - k) < 0.005) return 'ck';
  return null;
}

/** The book's four examples, in the book's order (p165–166), each as the level in °C. */
export const EXAMPLES = [
  { id: 'cf', c: -40 }, // C and F scales equal: −40
  { id: 'kf', c: (9 * K0 - 5 * 32) / 4 - K0 }, // K and F scales equal: 574.59 K
  { id: 'body', c: fromF(98.4) }, // a healthy body, 98.4° F: 36.89° C
  { id: 'ck', c: 25 }, // C and K scales are never equal: here 25° C = 298.15 K
];
export const exampleOf = (id) => EXAMPLES.find((e) => e.id === id) || null;
export const nextExample = (id) => EXAMPLES[(EXAMPLES.findIndex((e) => e.id === id) + 1) % EXAMPLES.length].id;

// ── the test: five questions, the usual mistakes as the wrong choices ──────────────────────────────────────────────
const pick = (list, rng) => list[Math.floor(rng() * list.length)];
export function shuffle(list, rng = Math.random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export const QUESTION_KINDS = ['c2f', 'f2c', 'c2k', 'body', 'eqCF'];

/**
 * One question: the level to show (°C), which scale is given, the unit of the answer, the right value and the
 * choices { v, note } (note: the mistake that choice stands for, null for the right one).
 */
export function makeQuestion(kind, rng = Math.random) {
  let q;
  if (kind === 'c2f') {
    const c = pick([20, 25, 30, 40, 60, 80], rng);
    q = {
      c,
      given: { C: c },
      unit: 'F',
      expected: toF(c),
      wrong: [
        { v: (c * 9) / 5, note: 'no32' },
        { v: c + 32, note: 'only32' },
        { v: (c * 5) / 9 + 32, note: 'flip' },
      ],
    };
  } else if (kind === 'f2c') {
    const f = pick([50, 68, 77, 86, 104, 140], rng);
    q = {
      c: fromF(f),
      given: { F: f },
      unit: 'C',
      expected: fromF(f),
      wrong: [
        { v: f - 32, note: 'minusOnly' },
        { v: (f * 5) / 9 - 32, note: 'order' },
        { v: ((f - 32) * 9) / 5, note: 'flip' },
      ],
    };
  } else if (kind === 'c2k') {
    const c = pick([15, 27, 37, 50, 77], rng);
    q = {
      c,
      given: { C: c },
      unit: 'K',
      expected: toK(c),
      wrong: [
        { v: c - K0, note: 'minusK' },
        { v: c + 32, note: 'plus32' },
        { v: c + 373.15, note: 'plus373' },
      ],
    };
  } else if (kind === 'body') {
    const c = fromF(98.4);
    q = {
      c,
      given: { F: 98.4 },
      unit: 'C',
      expected: +c.toFixed(2),
      wrong: [
        { v: 98.4 - 32, note: 'minusOnly' },
        { v: (98.4 * 5) / 9, note: 'no32' },
        { v: ((98.4 - 32) * 9) / 5, note: 'flip' },
      ],
    };
  } else {
    q = {
      c: 20,
      given: {},
      unit: 'deg',
      expected: -40,
      wrong: [
        { v: 0, note: 'zeroC' },
        { v: 32, note: 'f32' },
        { v: 40, note: 'positive' },
      ],
    };
  }
  const choices = shuffle([{ v: q.expected, note: null }, ...q.wrong], rng);
  return { kind, ...q, choices };
}
