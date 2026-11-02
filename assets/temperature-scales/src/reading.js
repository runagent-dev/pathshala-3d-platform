// The maths of the temperature scales (book pages 163–164, topic 6.2, চিত্র ৬.০২): Celsius, Kelvin and Fahrenheit side
// by side. Pure functions, no browser, unit-tested in test/unit/temperature-scales.test.mjs.
//
//   T_K = T_C + 273.15            (the book: সেলসিয়াস স্কেলের সাথে 273.15 যোগ করলেই কেলভিন স্কেল)
//   T_F = 9/5 · T_C + 32          (so that ice melts at 32 °F and water boils at 212 °F, as the book's picture shows)

export const K_OFFSET = 273.15;
export const ABS_ZERO = -273.15; // °C: পরম শূন্য
export const TRIPLE_C = 0.01; // °C: পানির ত্রৈধ বিন্দু
export const TRIPLE_K = 273.16;
export const TRIPLE_ATM = '0.0060373';
export const ICE_C = 0;
export const BOIL_C = 100;
export const ROOM_C = 30; // the book's example: ঘরের তাপমাত্রা 30 °C = 303.15 K

export const toK = (c) => c + K_OFFSET;
export const toF = (c) => (c * 9) / 5 + 32;
export const kToC = (k) => k - K_OFFSET;

/** Round to two decimals and never return -0. */
export const round2 = (x) => {
  const r = Math.round(x * 100) / 100;
  return r === 0 ? 0 : r;
};

/** "303.15", "30", "0.01", "−273.15": at most two decimals, no trailing zeros, a real minus sign (U+2212). */
export function fmt(x) {
  return String(round2(x)).replace('-', '−');
}

// ── the picture: one temperature on three scales ─────────────────────────────
// The tubes' vertical scale maps a temperature (°C) to a height; the view shows lo … hi (°C).
export const HI = 108; // the top of the tubes
export const LO_NORMAL = -12; // the bottom of the tubes in the book's picture (just below 0 °C)
export const LO_ZOOM = -300; // the bottom when the whole range down to absolute zero is shown
export const DRAG_MIN = -10; // lowest temperature the student can drag to in the normal view
export const DRAG_MAX = 106;

export const SCALE_IDS = ['C', 'K', 'F'];
/** The three scales: how a Celsius value reads on them, and the graduations drawn (a value every `minor`, longer every `major`). */
export const SCALES = {
  C: { unit: '°C', from: (c) => c, to: (v) => v, normal: { origin: 0, minor: 2, major: 10 }, zoom: { origin: 0, minor: 10, major: 50 } },
  K: { unit: 'K', from: toK, to: kToC, normal: { origin: K_OFFSET, minor: 2, major: 10 }, zoom: { origin: 0, minor: 10, major: 50 } },
  F: {
    unit: '°F',
    from: toF,
    to: (f) => ((f - 32) * 5) / 9,
    normal: { origin: 32, minor: 4, major: 20 },
    zoom: { origin: 32, minor: 20, major: 100 },
  },
};

/**
 * The graduations of one scale between lo and hi (°C): [{ c, major }], at most `max`. In the normal view they count
 * from the scale's fixed point (0 °C, 273.15 K, 32 °F), so 0 and 100 °C, 273.15 and 373.15 K, 32 and 212 °F are long marks.
 */
export function ticksFor(id, lo, hi, max = 64) {
  const sc = SCALES[id];
  const g = hi - lo > 200 ? sc.zoom : sc.normal;
  const a = sc.from(lo) - g.origin;
  const b = sc.from(hi) - g.origin;
  const per = Math.round(g.major / g.minor);
  const out = [];
  for (let i = Math.ceil(a / g.minor - 1e-9); i <= Math.floor(b / g.minor + 1e-9) && out.length < max; i++) {
    out.push({ c: sc.to(g.origin + i * g.minor), major: i % per === 0 });
  }
  return out;
}

/** The three readings for a temperature in °C. */
export function readings(c) {
  return { C: round2(c), K: round2(toK(c)), F: round2(toF(c)) };
}

// ── the steps: the book's own temperatures, in the book's order ──────────────
export const STEPS = ['ice', 'boil', 'room', 'abs', 'triple'];
export const STEP_C = { ice: ICE_C, boil: BOIL_C, room: ROOM_C, abs: ABS_ZERO, triple: TRIPLE_C };
export const nextStep = (id) => STEPS[(STEPS.indexOf(id) + 1) % STEPS.length];

/** A change of temperature from `base` to `c`, in whole degrees (the same number in °C and in K), or 0. */
export function change(c, base) {
  if (Math.abs(c - base) < 0.5) return 0;
  return Math.round(c - base);
}

/** The temperature (°C) the student dragged to: whole degrees, held between the tube's ends. */
export function dragTo(c, zoomed) {
  const lo = zoomed ? ABS_ZERO : DRAG_MIN;
  if (c <= lo + 0.5) return lo;
  return Math.min(DRAG_MAX, Math.round(c));
}

// ── the test ─────────────────────────────────────────────────────────────────
const pick = (list, rng) => list[Math.floor(rng() * list.length)];
export const shuffle = (list, rng = Math.random) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Five questions, each a plain object: kind; scene { c (the temperature shown), from (start of a rise), show (the scale(s)
 * whose reading the picture shows) }; unit of the answers; expected; choices (every value different, the right one among
 * them); notes (the wrong choice's mistake: value → string key); vars for the question text and the worked answer.
 * Numbers are drawn from rng, the order of the five is shuffled.
 */
export function makeQuiz(rng = Math.random) {
  const c2k = (() => {
    const c = pick([15, 20, 25, 35, 40, 45, 50], rng);
    const right = round2(toK(c));
    return {
      kind: 'c2k',
      scene: { c, show: ['C'] },
      unit: 'K',
      expected: right,
      choices: [right, c, round2(K_OFFSET - c), round2(c - K_OFFSET)],
      notes: { [c]: 'same', [round2(K_OFFSET - c)]: 'rev', [round2(c - K_OFFSET)]: 'neg' },
      vars: { c: fmt(c), k: fmt(right) },
    };
  })();
  const k2c = (() => {
    const c = pick([20, 25, 40, 50, 60, 75], rng);
    const k = round2(toK(c));
    return {
      kind: 'k2c',
      scene: { c, show: ['K'] },
      unit: '°C',
      expected: c,
      choices: [c, k, round2(k + K_OFFSET), round2(K_OFFSET - k)],
      notes: { [k]: 'same', [round2(k + K_OFFSET)]: 'add', [round2(K_OFFSET - k)]: 'rev' },
      vars: { c: fmt(c), k: fmt(k) },
    };
  })();
  const delta = (() => {
    const a = pick([10, 20, 25], rng);
    const d = pick([10, 15, 20, 25], rng);
    const b = a + d;
    return {
      kind: 'delta',
      scene: { c: b, from: a, show: ['C'] },
      unit: 'K',
      expected: d,
      choices: [d, round2(d + K_OFFSET), round2(toK(b)), b],
      notes: { [round2(d + K_OFFSET)]: 'add', [round2(toK(b))]: 'level', [b]: 'celsius' },
      vars: { a: fmt(a), b: fmt(b), d: fmt(d), k: fmt(toK(b)) },
    };
  })();
  const abs = {
    kind: 'abs',
    scene: { c: 20, show: ['C'] },
    unit: '°C',
    expected: ABS_ZERO,
    choices: [ABS_ZERO, K_OFFSET, 0, 373.15],
    notes: { [K_OFFSET]: 'k0', 0: 'ice', 373.15: 'boil' },
    vars: { a: fmt(ABS_ZERO), z: fmt(0), off: fmt(K_OFFSET) },
  };
  const f = (() => {
    const boil = rng() < 0.5;
    const c = boil ? BOIL_C : ICE_C;
    const right = boil ? 212 : 32;
    const other = boil ? 32 : 212;
    return {
      kind: boil ? 'fboil' : 'fice',
      scene: { c, show: ['C'] },
      unit: '°F',
      expected: right,
      choices: [right, c, round2(toK(c)), other],
      notes: { [c]: 'same', [round2(toK(c))]: 'kelvin', [other]: 'other' },
      vars: { c: fmt(c), k: fmt(toK(c)), f: fmt(right), other: fmt(other) },
    };
  })();
  return shuffle([c2k, k2c, delta, abs, f], rng).map((q) => ({ ...q, choices: shuffle(q.choices, rng) }));
}
