// Newton's second law (book pages 75–76, topic 3.6), the maths: a handcart (ঠেলাগাড়ি) on a smooth floor, pushed for
// 2 s by one or two people (100 N each), empty (100 kg) or with two 50 kg sacks of rice. While the push lasts the
// acceleration is a = F / m (F = ma with the book's k = 1); after it the cart rolls on at the velocity it has (no
// friction, no force), until the sacks at the end of the floor stop it. In the "back" example a second person stands
// in front and pushes back (to the left) for 2 s: the velocity falls from 2 m/s to 0. Real numbers, real time, metres.
// Pure functions only (unit-tested in test/unit/newtons-second-law.test.mjs).

export const PUSH_TIME = 2; // s: every push lasts this long
export const PERSON_FORCE = 100; // N: one person's push
export const CART_MASS = 100; // kg: the empty handcart
export const SACK_MASS = 50; // kg: one sack of rice
export const START_X = 0; // m: where the cart's front waits
export const BUFFER_X = 5.4; // m: the cart's front meets the sacks at the end of the floor here
export const CATCH_X = 2.6; // m: the hands of the person in front (the "back" example)
export const GIVE = 0.12; // m: the sacks give way this much as they stop the cart
export const MARK_STEP = 1; // s between the marks the cart's front leaves on the floor

/** The four examples of the row of words: who pushes and what is on the cart. */
export const EXAMPLES = {
  base: { pushers: 1, sacks: 0, back: false }, // খালি গাড়ি: 100 N on 100 kg
  force: { pushers: 2, sacks: 0, back: false }, // দ্বিগুণ বল: 200 N on 100 kg
  mass: { pushers: 1, sacks: 2, back: false }, // দ্বিগুণ ভর: 100 N on 200 kg
  back: { pushers: 1, sacks: 0, back: true }, // উল্টো দিকে বল: pushed to 2 m/s, then 100 N backward
};
export const EXAMPLE_IDS = /** @type {Array<keyof typeof EXAMPLES>} */ (Object.keys(EXAMPLES));

export const massOf = (sacks) => CART_MASS + SACK_MASS * sacks;
export const forceOf = (pushers) => PERSON_FORCE * pushers;

/** x rounded to d decimals, with no binary leftovers and no −0. */
export function round(x, d = 2) {
  const k = 10 ** d;
  const r = Math.round(Math.abs(x) * k + 1e-9) / k;
  return r === 0 ? 0 : Math.sign(x) * +r.toFixed(d);
}

/** A number for a sentence: no trailing zeros ("0.5", "2"). */
export const plain = (x, d = 2) => String(round(x, d));

/**
 * The run of one example (an id of EXAMPLES, or { pushers, sacks, back, F }, F the total push in N): pieces of
 * constant acceleration, one after the other.
 *   push   the people behind push forward (F, a = F / m)
 *   coast  nobody pushes: the velocity stays
 *   brake  the person in front pushes backward with 100 N ("back" only)
 *   stop   the sacks at the end of the floor stop the cart over GIVE m
 * @param {string | { pushers: number, sacks: number, back?: boolean, F?: number }} which
 */
export function planOf(which) {
  const ex = typeof which === 'string' ? (EXAMPLES[which] ?? EXAMPLES.base) : which;
  const id = typeof which === 'string' && EXAMPLES[which] ? which : null;
  const m = massOf(ex.sacks);
  const F = ex.F ?? forceOf(ex.pushers);
  const a = F / m;
  /** @type {Array<{ kind: 'push' | 'coast' | 'brake' | 'stop', t0: number, dur: number, x0: number, v0: number, a: number, F: number }>} */
  const segs = [];
  let t = 0;
  let x = START_X;
  let v = 0;
  const add = (kind, dur, acc, force) => {
    segs.push({ kind, t0: t, dur, x0: x, v0: v, a: acc, F: force });
    x += v * dur + 0.5 * acc * dur * dur;
    v += acc * dur;
    t += dur;
  };
  add('push', PUSH_TIME, a, F);
  const back = Boolean(ex.back);
  if (back) {
    add('coast', (CATCH_X - x) / v, 0, 0);
    add('brake', PUSH_TIME, -PERSON_FORCE / m, -PERSON_FORCE);
  } else {
    add('coast', Math.max(0, (BUFFER_X - x) / v), 0, 0);
    const dur = (2 * GIVE) / v;
    add('stop', dur, -v / dur, 0);
  }
  return { id, m, F, a, back, pushers: ex.pushers, sacks: ex.sacks, segs, end: t, xEnd: x };
}

/**
 * Where the cart is t s after the push began: phase, the front's x (m), velocity v (m/s), acceleration a (ms⁻²), the
 * force on it F (N, + to the right), and the piece it is in.
 * @param {ReturnType<typeof planOf>} plan
 * @param {number} t
 */
export function runAt(plan, t) {
  if (t <= 0) return { phase: 'rest', x: START_X, v: 0, a: 0, F: 0, t: 0, seg: null };
  for (const seg of plan.segs) {
    if (t < seg.t0 + seg.dur) {
      const s = t - seg.t0;
      return { phase: seg.kind, x: seg.x0 + seg.v0 * s + 0.5 * seg.a * s * s, v: seg.v0 + seg.a * s, a: seg.a, F: seg.F, t, seg };
    }
  }
  return { phase: 'stopped', x: plan.xEnd, v: 0, a: 0, F: 0, t, seg: null };
}

/** The piece whose acceleration the student measures: the push, or in "back" the push backward. */
export function measuredSeg(plan) {
  return plan.segs.find((s) => s.kind === (plan.back ? 'brake' : 'push'));
}

/**
 * What the student finds when the measured piece is over: u and v (m/s) over t (s), and a = (v − u) / t (ms⁻²).
 * `at` is when that is (s after the push began).
 */
export function measured(plan) {
  const seg = measuredSeg(plan);
  const u = round(seg.v0, 2);
  const v = round(seg.v0 + seg.a * seg.dur, 2);
  return { u, v, t: seg.dur, a: round((v - u) / seg.dur, 3), F: seg.F, m: plan.m, at: seg.t0 + seg.dur, from: seg.t0 };
}

/** Times (s after the push began) of the marks the cart's front leaves: every MARK_STEP s until it stops. */
export function markTimes(plan) {
  const out = [];
  for (let t = 0; t <= plan.end + 1e-9; t += MARK_STEP) out.push(round(t, 6));
  return out;
}

/** The momentum p = m v (kg m/s). */
export const momentum = (m, v) => round(m * v, 2);

/**
 * A pusher behind the cart: on the cart while the push lasts, then slowing to a stop (deceleration `decel` m/s²).
 * Returns how far the pusher has moved from the start (m), his speed, and whether his hands are on the cart.
 * @param {ReturnType<typeof planOf>} plan
 * @param {number} t
 */
export function pusherAt(plan, t, decel = 8) {
  const push = plan.segs[0];
  if (t <= 0) return { dx: 0, v: 0, on: false };
  if (t <= push.dur) {
    const r = runAt(plan, t);
    return { dx: r.x - START_X, v: r.v, on: true };
  }
  const v0 = push.v0 + push.a * push.dur;
  const x0 = push.x0 + push.v0 * push.dur + 0.5 * push.a * push.dur * push.dur;
  const s = Math.min(t - push.dur, v0 / decel);
  return { dx: x0 + v0 * s - 0.5 * decel * s * s - START_X, v: Math.max(0, v0 - decel * (t - push.dur)), on: false };
}

/**
 * The person in front ("back" only): waits with his hands at CATCH_X, then goes back with the cart's front while he
 * pushes against it, and stands holding it once it stops. dx: how far he has been pushed back (m).
 */
export function catcherAt(plan, t) {
  const brake = plan.segs.find((s) => s.kind === 'brake');
  if (!brake || t <= brake.t0) return { dx: 0, v: 0, on: false };
  const r = runAt(plan, t);
  return { dx: r.x - CATCH_X, v: r.v, on: true };
}

// ── the test ────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * "What is the acceleration?" with the cart's and each sack's mass read off the picture: the right a = F / M and
 * three answers from real mistakes (only the cart's mass, only the sacks, one sack forgotten, m / F instead of F / m).
 * @param {number} F newtons
 * @param {number} sacks on the cart
 */
export function calcChoices(F, sacks) {
  const M = massOf(sacks);
  const right = round(F / M, 3);
  const wrong = [
    { kind: 'cart', value: round(F / CART_MASS, 3) },
    sacks === 1 ? { kind: 'sacks', value: round(F / SACK_MASS, 3) } : { kind: 'one_less', value: round(F / massOf(sacks - 1), 3) },
    { kind: 'inverse', value: round(M / F, 3) },
  ];
  return { M, right, wrong };
}

/** The (F, sacks) pairs whose four answers are all different and short (at most two decimals). */
export const CALC_CASES = [
  { F: 300, sacks: 1 }, // a = 2; cart only 3; sacks only 6; m / F 0.5
  { F: 100, sacks: 3 }, // a = 0.4; cart only 1; one sack forgotten 0.5; m / F 2.5
  { F: 200, sacks: 3 }, // a = 0.8; cart only 2; one sack forgotten 1; m / F 1.25
];

/**
 * "The force (or the mass) is doubled: what is the acceleration now?" from a measured a: the right answer and the
 * usual mistakes (unchanged, the wrong way, squared).
 * @param {number} a the measured acceleration
 * @param {'force' | 'mass'} what is doubled
 */
export function doubleChoices(a, what) {
  const right = what === 'force' ? a * 2 : a / 2;
  const wrong = [
    { kind: 'same', value: a },
    { kind: 'flip', value: what === 'force' ? a / 2 : a * 2 },
    { kind: 'square', value: what === 'force' ? a * 4 : a / 4 },
  ];
  return { right: round(right, 3), wrong: wrong.map((w) => ({ ...w, value: round(w.value, 3) })) };
}

/**
 * Two carts side by side: pushers and sacks of each. The ratio a(খ) / a(ক) and the ratios a student gets from the
 * force alone or the mass alone (or upside down).
 */
export const PAIR_CASES = [
  { a: { pushers: 1, sacks: 0 }, b: { pushers: 2, sacks: 2 } }, // 1 and 1: the same
  { a: { pushers: 1, sacks: 0 }, b: { pushers: 1, sacks: 2 } }, // 1 and 0.5: half
  { a: { pushers: 1, sacks: 2 }, b: { pushers: 2, sacks: 2 } }, // 0.5 and 1: twice
  { a: { pushers: 1, sacks: 2 }, b: { pushers: 2, sacks: 0 } }, // 0.5 and 2: four times
];
export function pairRatio({ a, b }) {
  const accA = forceOf(a.pushers) / massOf(a.sacks);
  const accB = forceOf(b.pushers) / massOf(b.sacks);
  return {
    aA: round(accA, 3),
    aB: round(accB, 3),
    ratio: round(accB / accA, 3),
    byForce: round(forceOf(b.pushers) / forceOf(a.pushers), 3), // looked only at who pushes
    byMass: round(massOf(b.sacks) / massOf(a.sacks), 3), // a ∝ m, the wrong way round
    flip: round(accA / accB, 3),
  };
}
/** The words for a ratio of accelerations (keys of i18n: r_same, r_twice, r_half, r_four, r_quarter). */
export const RATIO_KEYS = { 1: 'r_same', 2: 'r_twice', 0.5: 'r_half', 4: 'r_four', 0.25: 'r_quarter' };
