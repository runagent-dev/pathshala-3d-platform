// The maths of efficiency (book page 121, section 4.8 কর্মদক্ষতা), kept apart from the 3D so it can be unit-tested.
//
//   কর্মদক্ষতা = কাজের পরিমাণ / প্রদত্ত শক্তি × 100% = (প্রদত্ত শক্তি − শক্তির অপচয়) / প্রদত্ত শক্তি × 100%
//
// The book's example: a 1000 W motor runs for 15 s and lifts a 100 kg load 10 m. Work = 100 × 9.8 × 10 J = 9,800 J,
// input = 1000 × 15 J = 15,000 J, wasted = 5,200 J, efficiency = 65.3%.
//
// The figure runs the same motor in three conditions (the book's, with oiled gears, with worn gears). The motor always
// takes 1000 W; the less it wastes, the faster the load goes up, so the time is what changes. How the waste divides
// between the motor's heat, the gears' friction and sound is the figure's own illustration (the book gives only the
// total), and always adds up exactly to input − work.

export const G = 9.8; // m/s², as the book
export const BOOK = { P: 1000, t: 15, m: 100, h: 10 }; // W, s, kg, m
export const PLANT = 30; // %: the book's power plant

/**
 * The machine's three conditions: the time the book's load takes, and how the wasted power (W) divides. Each one adds
 * up to P − mgh/t for the book's load: 150 + 190 + 6.67 = 346.67 W = 1000 − 9800/15.
 */
export const CONDITIONS = {
  book: { t: 15, waste: { motor: 150, friction: 190, sound: 20 / 3 } },
  oiled: { t: 14, waste: { motor: 150, friction: 145, sound: 5 } },
  worn: { t: 20, waste: { motor: 200, friction: 300, sound: 10 } },
};
export const CONDITION_IDS = /** @type {Array<keyof typeof CONDITIONS>} */ (Object.keys(CONDITIONS));
export const PARTS = ['motor', 'friction', 'sound'];

/** Work done on the load, J: m g h. */
export const work = (m, h) => m * G * h;
/** Energy given to the motor, J: P t. */
export const input = (P, t) => P * t;

/**
 * The whole sum for one run: work, input, waste (input − work), efficiency (%), and whether it is possible (a machine
 * can never give out as much work as the energy put in). With exact fractions so a test can compare.
 */
export function solve({ P, t, m, h }) {
  const W = work(m, h);
  const E = input(P, t);
  const waste = E - W;
  const eff = E > 0 ? (W / E) * 100 : 0;
  return { work: W, input: E, waste, eff, possible: W < E - 1e-9 };
}

/** How a condition's waste divides, as fractions that add up to 1 (the book's split for a run from the example). */
export function wasteShares(cond = 'book') {
  const w = (CONDITIONS[cond] || CONDITIONS.book).waste;
  const total = w.motor + w.friction + w.sound;
  return { motor: w.motor / total, friction: w.friction / total, sound: w.sound / total };
}

/** The numbers of a condition's run with the book's load: P, t, m, h. */
export function runOf(cond) {
  return { ...BOOK, t: (CONDITIONS[cond] || CONDITIONS.book).t };
}

/**
 * The energy so far, `time` seconds into a run of `run` ({ P, t, m, h }) with the waste split as `shares`: the motor
 * takes P all the time, the load rises at a steady speed, and what is wasted is exactly input − work.
 */
export function energyAt(run, time, shares = wasteShares('book')) {
  const k = run.t > 0 ? Math.min(1, Math.max(0, time / run.t)) : 0;
  const E = input(run.P, run.t) * k;
  const W = work(run.m, run.h) * k;
  const waste = E - W;
  return {
    k,
    height: run.h * k,
    input: E,
    work: W,
    waste,
    motor: waste * shares.motor,
    friction: waste * shares.friction,
    sound: waste * shares.sound,
  };
}

/** An efficiency for a sentence, as the book writes it: one decimal, no trailing zero (65.3, 70, 49). */
export const pct = (x) => String(Math.round(x * 10) / 10);

/** A whole number of joules, grouped the Bangladeshi way (৯,৮০০; ১৫,০০০; ১,২০,০০০). */
export function groupJ(j) {
  const n = String(Math.round(Math.max(0, j)));
  if (n.length <= 3) return n;
  const last = n.slice(-3);
  let rest = n.slice(0, -3);
  const parts = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${parts.join(',')},${last}`;
}

/** Joules while a run goes on: to the nearest 10 below 1,000 J, else to the nearest 100 (so the digits don't flicker). */
export const liveJ = (j) => (j < 1000 ? Math.round(j / 10) * 10 : Math.round(j / 100) * 100);

/** The steppers of the worked example: where each one stops and its step. */
export const EX_LIMITS = {
  P: { min: 500, max: 2000, step: 100 },
  t: { min: 5, max: 40, step: 1 },
  m: { min: 20, max: 200, step: 10 },
  h: { min: 2, max: 20, step: 1 },
};

/** Clamp and round a worked-example number to its stepper. */
export function fixExample(key, x) {
  const l = EX_LIMITS[key];
  const v = Math.min(l.max, Math.max(l.min, Math.round(x / l.step) * l.step));
  return +v.toFixed(6);
}

/** True when the worked example shows the book's own numbers. */
export const isBook = (r) => r.P === BOOK.P && r.t === BOOK.t && r.m === BOOK.m && r.h === BOOK.h;

/**
 * Gear train of the winch, from the motor to the drum: a single-start worm turns a 20-tooth worm wheel; a 14-tooth
 * pinion on the same shaft turns a 42-tooth gear on the drum's shaft. The rope lies on the drum 0.12 m from its axis
 * (the book's 10 m in 15 s: the drum turns at about 53 rpm and the motor at about 3,200 rpm).
 */
export const TRAIN = { wheel: 20, pinion: 14, gear: 42, drum: 0.12 };
/** Turns (radians) of the drum, the worm wheel's shaft and the motor for `height` m of rope wound on. */
export function turnsFor(height) {
  const drum = height / TRAIN.drum;
  const shaft = drum * (TRAIN.gear / TRAIN.pinion);
  const motor = shaft * TRAIN.wheel;
  return { drum, shaft, motor };
}
