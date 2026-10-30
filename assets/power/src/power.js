// The maths of the figure, kept apart from the 3D so it can be unit-tested (book p120, 4.7: P = W / t).
// Two ideal electric pumps lift water from a tank in the courtyard to identical tanks on the roof, h metres up. Lifting
// m kg through h does the work W = mgh (the weight mg moved h along the force, W = Fs from 4.1), so a pump of power P
// lifts water at m/t = P / (gh) kg each second. Ideal: no energy is lost (efficiency is the next topic, 4.8).
// One litre of water is taken as 1 kg.

export const G = 9.8; // ms⁻², as the book's worked examples use
export const H = 3; // m: from the water in the courtyard tank to the roof tanks' floor (a one-storey house)
export const FULL = 500; // kg (500 L): one roof tank
export const PUMPS = { small: 490, big: 980 }; // W: the two pumps (ideal; about 0.66 and 1.3 horsepower)
export const BULB = 100; // W: the book's bulb
export const BULB_TIME = 10; // s: the bulb is switched on for this long
export const SPEED = 3; // the pumps' runs are shown this many times faster than life (the bulb runs in real time)
export const SAME_TIME = 15; // s: in the "same time" example both pumps run this long

/** Round to a step without float dust (0.1 + 0.2 → 0.3). */
export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** Work done lifting m kg through h metres: W = mgh (J). */
export const workToLift = (m, h = H, g = G) => roundTo(m * g * h, 1e-6);
/** Power: the rate of doing work, P = W / t (W, with W in J and t in s). */
export const power = (W, t) => (t > 0 ? roundTo(W / t, 1e-6) : 0);
/** Seconds a pump of power P needs to lift m kg through h: t = mgh / P. */
export const timeToLift = (m, P, h = H) => roundTo(workToLift(m, h) / P, 1e-6);
/** Kilograms a pump of power P lifts through h in t seconds: m = Pt / (gh). */
export const massLifted = (P, t, h = H) => roundTo((P * t) / (G * h), 1e-6);

/**
 * One example's plan: how long each pump runs and how much it lifts.
 * 'work' (একই কাজ): both fill FULL kg, so they stop at different times. 'time' (একই সময়): both run SAME_TIME s.
 * @param {'work' | 'time'} example
 * @param {number} [mass] kg each pump fills in 'work'
 * @param {number} [T] s each pump runs in 'time'
 */
export function plan(example, mass = FULL, T = SAME_TIME) {
  const out = {};
  for (const [id, P] of Object.entries(PUMPS)) {
    const t = example === 'time' ? T : timeToLift(mass, P);
    const m = example === 'time' ? massLifted(P, T) : mass;
    out[id] = { P, t, m, W: workToLift(m) };
  }
  return { ...out, total: Math.max(out.small.t, out.big.t) };
}

/**
 * A pump's reading `t` seconds (scene time) into a run: the stopwatch in whole seconds (it stops when the pump does),
 * the water lifted and the work done so far, both from that same whole second (lesson 20: numbers that agree, agree).
 * @param {{ P: number, t: number, m: number, W: number }} pump
 */
export function readingAt(pump, t) {
  const tRun = clamp(t, 0, pump.t);
  const done = t >= pump.t - 1e-9;
  const sec = done ? pump.t : Math.floor(tRun + 1e-9);
  return {
    t: sec,
    running: !done && t > 0,
    done,
    m: done ? pump.m : massLifted(pump.P, sec), // kg in the tank (the stopwatch's number)
    mSmooth: massLifted(pump.P, tRun), // kg in the tank right now (for drawing the water)
    W: done ? pump.W : roundTo(pump.P * sec, 1e-6),
  };
}

/** The bulb `t` seconds after it was switched on: whole seconds, energy used so far E = Pt. */
export function bulbAt(t, P = BULB, T = BULB_TIME) {
  const done = t >= T - 1e-9;
  const sec = done ? T : Math.floor(clamp(t, 0, T) + 1e-9);
  return { t: sec, E: roundTo(P * sec, 1e-6), on: t > 0 && !done, done };
}

/** Numbers in sentences without trailing zeros ("2", "1.5"). */
export const plain = (x) => String(roundTo(x, 0.01));

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

/** The usual mistakes when finding P from m, h and t (other: the other pump's power, read off the wrong stopwatch). */
export const powerMistakes = (m, t, other) => [
  { value: workToLift(m) / other, why: 'p_other' },
  { value: workToLift(m), why: 'p_noT' },
  { value: (m * H) / t, why: 'p_noG' },
  { value: workToLift(m) * t, why: 'p_mul' },
  { value: (m * G) / t, why: 'p_noH' },
];

/** The usual mistakes when finding the energy a bulb of P watts uses in t seconds. */
export const energyMistakes = (P, t) => [
  { value: P, why: 'e_one' },
  { value: P + t, why: 'e_add' },
  { value: P / t, why: 'e_div' },
  { value: P * t * 60, why: 'e_min' },
];
