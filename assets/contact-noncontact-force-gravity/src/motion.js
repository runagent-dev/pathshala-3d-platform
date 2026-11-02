// Force: gravity, a non-contact force (book page 67, topic 3.1.2): the facts and the motion behind the figure, as pure functions
// (unit-tested in test/unit/contact-noncontact-force-gravity.test.mjs).
//  - The example: which kind of force it is (স্পর্শ বল or অস্পর্শ বল) and what it does, in the words of the book's
//    definition (a body at rest starts moving, or a moving body's velocity changes).
//  - Its motion as a function of the time shown on screen, with real speeds in m/s (SLOW: shown slower than real).
//  - The test: its answer keys (the right one first, the others the usual mistakes).

/** The page's example this figure shows. */
export const EXAMPLE = 'fall';

/** স্পর্শ বল ('contact') or অস্পর্শ বল ('noncontact'). */
export const KIND = { fall: 'noncontact' };

/**
 * What the force does, in the words of the book's definition: 'start' (স্থির বস্তু চলতে শুরু করে), 'change'
 * (গতিশীল বস্তুর বেগের পরিবর্তন হয়) or 'both' (it starts moving, and goes faster and faster).
 */
export const EFFECT = { fall: 'both' };

/** How many times slower than real it is shown. */
export const SLOW = { fall: 3 };

export const G = 9.8; // m/s²

/** x rounded to a multiple of step, without binary leftovers (0.30000000000000004). */
export function roundTo(x, step) {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
  return +(Math.round(x / step) * step).toFixed(decimals);
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));

export const easeInOut = (k) => {
  const x = clamp01(k);
  return x * x * (3 - 2 * x);
};

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

// ── the example, as a function of the time shown (s) ─────────────────────────────────────────────────────────
// It returns { pos (m the moving body has gone), speed (real m/s), acting (the force acts), touching (the source
// touches the body), gap (m of empty space between them, or null) } and a few things for the 3D.

export const FALL = { open: 0.3, h: 1.04, e: 0.45 };

/** How long the action lasts on screen (s). */
export const DURATION = {
  fall: FALL.open + dropDuration(FALL.h, FALL.e) * SLOW.fall,
};

/**
 * The telling moment (s on screen): where a run stops and holds, the force acting and the body moving, so the
 * student sees what touches it (or the gap).
 */
export const KEY = {
  fall: FALL.open + 0.3 * SLOW.fall, // in the air, nothing touching it
};

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
  };
}

const AT = { fall: fallAt };

/** The example at time t on screen (clamped to its action). */
export function actionAt(id, t) {
  return AT[id](Math.min(Math.max(t, 0), DURATION[id]));
}

/**
 * Has the body begun to move under the force yet? (Before that the panel says what is being set up, and the
 * definition is not lit: the crane's cable still tightening, the hands reaching the carton or letting go of the
 * ball, the magnet being brought near.)
 */
export function moved(_id, m) {
  return m.pos > 1e-9;
}

/** A gap (m) as the figure writes it, in cm: whole cm from 10 cm up (the football), one decimal below (the nail). */
export function gapCm(gap) {
  const cm = Math.max(0, gap) * 100;
  return cm >= 10 ? Math.round(cm) : roundTo(cm, 0.1);
}

// ── the test ─────────────────────────────────────────────────────────────────────────────────────────────────

/** New cases for the test (not on the page): which kind each is. */
export const CASES = { comb: 'noncontact' };

/**
 * Answer keys (i18n) for "what kind of force is this?", the right one first; every wrong one is a real mistake with
 * its own worked answer, and each question has two answers of each kind (the first word gives nothing away).
 */
export const KIND_CHOICES = {
  comb: ['k_comb_ok', 'k_comb_hand', 'k_comb_touch', 'k_comb_light'],
  ball: ['k_ball_ok', 'k_ball_air', 'k_ball_floor', 'k_ball_hands'],
};

/** The kind of force each set of answers is about. */
export const CHOICE_KIND = { comb: 'noncontact', ball: 'noncontact' };

/** "What is the force doing to the body?": the book's definition of force. */
export const EFFECT_RIGHT = 'eff_faster';

export const EFFECT_CHOICES = ['eff_faster', 'eff_slower', 'eff_same', 'eff_nothing'];

/** Where the effect question's answer plays on to (s on screen), so the student sees it happen. */
export const EFFECT_SHOW = FALL.open + Math.sqrt((2 * FALL.h) / G) * SLOW.fall - 0.05;

/** The questions of a test, in a shuffled order: the example itself and new cases. */
export const QUESTIONS = [{ kind: 'case', set: 'comb' }, { kind: 'kind', set: 'ball' }, { kind: 'effect' }];

/** Fisher–Yates with a given random source (Math.random is seeded by the test harness). */
export function shuffle(list, random = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
