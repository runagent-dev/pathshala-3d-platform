// Force: contact and non-contact (book page 67, topic 3.1.2): the facts and the motion behind the figure, as pure
// functions (unit-tested in test/unit/contact-noncontact-force.test.mjs).
//  - The page's five examples: which kind of force each is (স্পর্শ বল or অস্পর্শ বল) and what it does, in the
//    words of the book's definition (a body at rest starts moving, or a moving body's velocity changes).
//  - Each example's motion as a function of the time shown on screen, with real speeds in m/s; some are shown
//    slower than real (SLOW), and the figure says so.
//  - The test's new cases (with the usual mistakes as wrong answers).

export const EXAMPLE_IDS = ['crane', 'push', 'friction', 'fall', 'magnet'];

/** স্পর্শ বল ('contact') or অস্পর্শ বল ('noncontact'). */
export const KIND = { crane: 'contact', push: 'contact', friction: 'contact', fall: 'noncontact', magnet: 'noncontact' };

/**
 * What the force does, in the words of the book's definition: 'start' (স্থির বস্তু চলতে শুরু করে), 'change'
 * (গতিশীল বস্তুর বেগের পরিবর্তন হয়) or 'both' (the ball starts falling, and falls faster and faster).
 */
export const EFFECT = { crane: 'start', push: 'start', friction: 'change', fall: 'both', magnet: 'start' };

/** How many times slower than real each example is shown. */
export const SLOW = { crane: 1, push: 1, friction: 2, fall: 3, magnet: 10 };

export const G = 9.8; // m/s²

/** x rounded to a multiple of step, without binary leftovers (0.30000000000000004). */
export function roundTo(x, step) {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
  return +(Math.round(x / step) * step).toFixed(decimals);
}
const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const easeOutCubic = (k) => 1 - (1 - clamp01(k)) ** 3;
export const easeInOut = (k) => {
  const x = clamp01(k);
  return x * x * (3 - 2 * x);
};

/**
 * A move from rest to rest along a line: speed up at `accel` to `vmax`, keep it, slow down at `decel`, `dist` in
 * all (a shorter move never reaches vmax). at(t) → { s (m), v (m/s) }.
 */
export function trapezoid({ dist, vmax, accel, decel = accel }) {
  let v = vmax;
  if ((v * v) / (2 * accel) + (v * v) / (2 * decel) > dist) v = Math.sqrt((2 * dist * accel * decel) / (accel + decel));
  const t1 = v / accel;
  const d1 = (v * v) / (2 * accel);
  const t3 = v / decel;
  const d3 = (v * v) / (2 * decel);
  const t2 = (dist - d1 - d3) / v;
  const T = t1 + t2 + t3;
  return {
    T,
    vmax: v,
    at(t) {
      if (t <= 0) return { s: 0, v: 0 };
      if (t < t1) return { s: 0.5 * accel * t * t, v: accel * t };
      if (t < t1 + t2) return { s: d1 + v * (t - t1), v };
      if (t < T) {
        const u = T - t;
        return { s: dist - 0.5 * decel * u * u, v: decel * u };
      }
      return { s: dist, v: 0 };
    },
  };
}

/** A body sliding at v0 that friction slows at `a` (m/s²) until it stops: { s, v } after t real seconds. */
export function slide(t, v0, a) {
  const stop = v0 / a;
  const u = Math.min(Math.max(t, 0), stop);
  const v = t >= stop - 1e-9 ? 0 : Math.max(0, v0 - a * Math.max(t, 0)); // exactly 0 once stopped (no 2e-16 left)
  return { s: v0 * u - 0.5 * a * u * u, v, stop, dist: (v0 * v0) / (2 * a) };
}

/**
 * A ball let go with its bottom `h` m above the floor: it falls (g), bounces with restitution `e` and comes to
 * rest once a bounce would be slower than `vRest`. drop(t) → { y (bottom above floor), v (m/s, + up), bounces,
 * resting, falling (still on its first fall) } after t real seconds.
 */
export function drop(t, h, e = 0.45, vRest = 0.3) {
  const t0 = Math.sqrt((2 * h) / G);
  if (t <= 0) return { y: h, v: 0, bounces: 0, resting: false, falling: true };
  if (t < t0) return { y: h - 0.5 * G * t * t, v: -G * t, bounces: 0, resting: false, falling: true };
  let vUp = G * t0 * e;
  let start = t0;
  let n = 1;
  while (vUp >= vRest) {
    const flight = (2 * vUp) / G;
    if (t < start + flight) {
      const u = t - start;
      return { y: vUp * u - 0.5 * G * u * u, v: vUp - G * u, bounces: n, resting: false, falling: false };
    }
    start += flight;
    vUp *= e;
    n++;
  }
  return { y: 0, v: 0, bounces: n - 1, resting: true, falling: false };
}

/** How long drop() takes to come to rest (real s). */
export function dropDuration(h, e = 0.45, vRest = 0.3) {
  const t0 = Math.sqrt((2 * h) / G);
  let total = t0;
  let vUp = G * t0 * e;
  while (vUp >= vRest) {
    total += (2 * vUp) / G;
    vUp *= e;
  }
  return total;
}

/**
 * An iron nail pulled the last `d` m to a magnet in `T` real seconds, faster and faster as the gap closes:
 * s = d (τ/T)^p. → { s, v, gap }.
 */
export function pull(tau, d, T, p = 2.5) {
  let k = clamp01(tau / T);
  if (k > 1 - 1e-9) k = 1; // arrived (no 0.9999999 left over from a sum of times): stuck, at rest
  return { s: d * k ** p, v: k > 0 && k < 1 ? (p * d * k ** (p - 1)) / T : 0, gap: d * (1 - k ** p) };
}

// ── the five examples, as functions of the time shown (s) ───────────────────────────────────────────────────
// Each returns { pos (m the moving body has gone), speed (real m/s), acting (the force acts), touching (the source
// touches the body), gap (m of empty space between them, or null) } and a few things for the 3D.

export const CRANE = { take: 0.35, lift: trapezoid({ dist: 1.3, vmax: 0.5, accel: 1, decel: 1 }) };
export const PUSH = { lean: 0.5, accel: 1, vmax: 0.9, roll: 0.4, stop: 0.45 };
export const FRICTION = { v0: 2, mu: 0.2 };
export const FALL = { open: 0.3, h: 1.04, e: 0.45 };
export const MAGNET = { far: 0.05, near: 0.03, slide: 0.9, wait: 0.25, T: 0.12 };

const pushTime = PUSH.vmax / PUSH.accel; // seconds of pushing
const frictionReal = slide(0, FRICTION.v0, FRICTION.mu * G);

/** How long each example's action lasts on screen (s). */
export const DURATION = {
  crane: CRANE.take + CRANE.lift.T,
  push: PUSH.lean + pushTime + PUSH.vmax / PUSH.roll,
  friction: frictionReal.stop * SLOW.friction,
  fall: FALL.open + dropDuration(FALL.h, FALL.e) * SLOW.fall,
  magnet: MAGNET.slide + MAGNET.wait + MAGNET.T * SLOW.magnet,
};

/**
 * The telling moment of each example (s on screen): where a run stops and holds, the force acting and the body
 * moving, so the student sees what touches it (or the gap): later the hands let go, the crate stops, the football
 * lands and the nail clicks onto the magnet, and the picture would no longer show it.
 */
export const KEY = {
  crane: CRANE.take + 1.3, // half a metre up, rising at 0.5 m/s
  push: PUSH.lean + 0.5, // the hands push, the trolley at 0.5 m/s
  friction: 0.45 * SLOW.friction, // still sliding, at 1.1 m/s
  fall: FALL.open + 0.3 * SLOW.fall, // in the air, nothing touching it
  magnet: MAGNET.slide + MAGNET.wait + 0.55 * MAGNET.T * SLOW.magnet, // the nail on its way, a gap still open
};

export function craneAt(t) {
  const m = CRANE.lift.at(t - CRANE.take);
  // the cable takes up the slack first; the pull is drawn once it lifts the block
  return { pos: m.s, speed: m.v, acting: t >= CRANE.take, touching: true, gap: null, take: clamp01(t / CRANE.take), dir: 'up' };
}

export function pushAt(t) {
  const { lean, accel, vmax, roll, stop } = PUSH;
  if (t < lean)
    return {
      pos: 0,
      person: 0,
      speed: 0,
      acting: false,
      touching: t >= lean * 0.75,
      gap: null,
      reach: easeInOut(t / lean),
      walking: 0,
      dir: 'right',
    };
  if (t < lean + pushTime) {
    const u = t - lean;
    const s = 0.5 * accel * u * u;
    return { pos: s, person: s, speed: accel * u, acting: true, touching: true, gap: null, reach: 1, walking: s, dir: 'right' };
  }
  // let go: the trolley rolls on, slowing a little; the student stops within `stop` s
  const s0 = 0.5 * accel * pushTime * pushTime;
  const u = t - lean - pushTime;
  const ur = Math.min(u, vmax / roll);
  const pos = s0 + vmax * ur - 0.5 * roll * ur * ur;
  const up = Math.min(u, stop);
  const person = s0 + vmax * up - 0.5 * (vmax / stop) * up * up;
  return {
    pos,
    person,
    speed: Math.max(0, vmax - roll * u),
    acting: false,
    touching: false,
    gap: null,
    reach: 1 - easeInOut(u / 0.6),
    walking: person,
    dir: 'right',
  };
}

export function frictionAt(t) {
  const m = slide(t / SLOW.friction, FRICTION.v0, FRICTION.mu * G);
  // friction acts whenever it slides, also in the first, still picture
  return { pos: m.s, speed: m.v, acting: m.v > 0, touching: true, gap: null, dir: 'right' };
}

export function fallAt(t) {
  const open = clamp01(t / FALL.open);
  const m = drop((t - FALL.open) / SLOW.fall, FALL.h, FALL.e);
  const free = t >= FALL.open;
  return {
    pos: FALL.h - m.y, // how far it has come down
    y: m.y,
    speed: Math.abs(m.v),
    velocity: m.v,
    acting: true, // gravity always pulls: while the hands hold the ball, in the air, on the floor
    held: !free, // the hands still hold it up
    touching: false,
    gap: free && m.falling ? m.y : null, // the empty space under the ball on its way down
    open: easeInOut(open),
    resting: m.resting,
    bounces: m.bounces,
    dir: m.v > 0 ? 'up' : 'down',
  };
}

export function magnetAt(t) {
  const { far, near, slide: tSlide, wait, T } = MAGNET;
  const magnetGap = far - (far - near) * easeOutCubic(t / tSlide); // where the magnet has been brought
  const m = pull((t - tSlide - wait) / SLOW.magnet, near, T);
  const moving = t >= tSlide + wait;
  return {
    pos: m.s,
    speed: m.v,
    acting: moving,
    touching: m.gap <= 1e-9,
    gap: moving && m.gap > 1e-9 ? m.gap : null,
    magnet: moving ? near : magnetGap, // the magnet's distance from the nail's starting tip (m)
    strength: moving ? 1 - m.gap / near : 0, // 0 … 1: the pull grows as the gap closes
    dir: 'right',
  };
}

const AT = { crane: craneAt, push: pushAt, friction: frictionAt, fall: fallAt, magnet: magnetAt };

/** Example `id` at time t on screen (clamped to its action). */
export function actionAt(id, t) {
  return AT[id](Math.min(Math.max(t, 0), DURATION[id]));
}

/**
 * Has the body begun to move under the force yet? (Before that the panel says what is being set up, and the
 * definition is not lit: the crane's cable still tightening, the hands reaching the carton or letting go of the
 * ball, the magnet being brought near.) The crate slides from the start.
 */
export function moved(id, m) {
  return id === 'friction' || m.pos > 1e-9;
}

/** A gap (m) as the figure writes it, in cm: whole cm from 10 cm up (the football), one decimal below (the nail). */
export function gapCm(gap) {
  const cm = Math.max(0, gap) * 100;
  return cm >= 10 ? Math.round(cm) : roundTo(cm, 0.1);
}

// ── the test ─────────────────────────────────────────────────────────────────────────────────────────────────

/** New cases for the test (not on the page): which kind each is. */
export const CASES = { rope: 'contact', parachute: 'contact', comb: 'noncontact' };

/**
 * Answer keys (i18n) for "what kind of force is this?", the right one first; the others are the usual mistakes.
 *  - rope, parachute, comb (the test's new cases): the person does not touch the cart, air cannot be seen, the hand
 *    holds the comb, the paper ends up stuck to the comb, the right kind for a wrong reason, "no force".
 *  - crate (friction on the sliding crate): a contact force although nothing seems to push it ("nobody touches
 *    it", "it stops by itself", the right kind for a wrong reason: "the air pushes on its front").
 *  - ball (gravity on the falling football): a non-contact force ("the air pushes it down", "the Earth touches it
 *    through the floor", "it falls by itself").
 */
export const KIND_CHOICES = {
  rope: ['k_rope_ok', 'k_rope_person', 'k_rope_wheels', 'k_rope_none'],
  parachute: ['k_para_ok', 'k_para_unseen', 'k_para_gravity', 'k_para_none'],
  comb: ['k_comb_ok', 'k_comb_hand', 'k_comb_touch', 'k_comb_light'],
  crate: ['k_crate_ok', 'k_crate_nobody', 'k_crate_none', 'k_crate_air'],
  ball: ['k_ball_ok', 'k_ball_air', 'k_ball_floor', 'k_ball_none'],
};
/** The kind of force each set of answers is about. */
export const CHOICE_KIND = { rope: 'contact', parachute: 'contact', comb: 'noncontact', crate: 'contact', ball: 'noncontact' };

/** "What is the force doing?": the right effect for an example caught in the middle of its action. */
export const EFFECT_RIGHT = { friction: 'eff_slower', fall: 'eff_faster', magnet: 'eff_faster' };
export const EFFECT_CHOICES = ['eff_faster', 'eff_slower', 'eff_same', 'eff_nothing'];

/**
 * The five questions of a test, in a shuffled order: a new contact case (a rope or a parachute), the comb (a new
 * non-contact case), friction (contact although nothing pushes), gravity (pulls without touching), and what the
 * magnet's pull does to the nail (the book's definition of force).
 */
export const QUESTION_KINDS = ['case', 'comb', 'friction', 'gravity', 'effect'];

/** Fisher–Yates with a given random source (Math.random is seeded by the test harness). */
export function shuffle(list, random = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
