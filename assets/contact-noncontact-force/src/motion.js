// Force: a push, a contact force (book page 67, topic 3.1.2): the facts and the motion behind the figure, as pure functions
// (unit-tested in test/unit/contact-noncontact-force.test.mjs).
//  - The example: which kind of force it is (স্পর্শ বল or অস্পর্শ বল) and what it does, in the words of the book's
//    definition (a body at rest starts moving, or a moving body's velocity changes).
//  - Its motion as a function of the time shown on screen, with real speeds in m/s (SLOW: shown slower than real).
//  - The test: its answer keys (the right one first, the others the usual mistakes).

/** The page's example this figure shows. */
export const EXAMPLE = 'push';

/** স্পর্শ বল ('contact') or অস্পর্শ বল ('noncontact'). */
export const KIND = { push: 'contact' };

/**
 * What the force does, in the words of the book's definition: 'start' (স্থির বস্তু চলতে শুরু করে), 'change'
 * (গতিশীল বস্তুর বেগের পরিবর্তন হয়) or 'both' (it starts moving, and goes faster and faster).
 */
export const EFFECT = { push: 'start' };

/** How many times slower than real it is shown. */
export const SLOW = { push: 1 };

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

// ── the example, as a function of the time shown (s) ─────────────────────────────────────────────────────────
// It returns { pos (m the moving body has gone), speed (real m/s), acting (the force acts), touching (the source
// touches the body), gap (m of empty space between them, or null) } and a few things for the 3D.

export const PUSH = { lean: 0.5, accel: 1, vmax: 0.9, roll: 0.4, stop: 0.45 };

const pushTime = PUSH.vmax / PUSH.accel; // seconds of pushing

/** How long the action lasts on screen (s). */
export const DURATION = {
  push: PUSH.lean + pushTime + PUSH.vmax / PUSH.roll,
};

/**
 * The telling moment (s on screen): where a run stops and holds, the force acting and the body moving, so the
 * student sees what touches it (or the gap).
 */
export const KEY = {
  push: PUSH.lean + 0.5, // the hands push, the trolley at 0.5 m/s
};

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
    };
  if (t < lean + pushTime) {
    const u = t - lean;
    const s = 0.5 * accel * u * u;
    return { pos: s, person: s, speed: accel * u, acting: true, touching: true, gap: null, reach: 1, walking: s };
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
  };
}

const AT = { push: pushAt };

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
export const CASES = { rope: 'contact' };

/**
 * Answer keys (i18n) for "what kind of force is this?", the right one first; every wrong one is a real mistake with
 * its own worked answer, and each question has two answers of each kind (the first word gives nothing away).
 */
export const KIND_CHOICES = {
  rope: ['k_rope_ok', 'k_rope_person', 'k_rope_wheels', 'k_rope_far'],
  push: ['k_push_ok', 'k_push_unseen', 'k_push_wheels', 'k_push_self'],
};

/** The kind of force each set of answers is about. */
export const CHOICE_KIND = { rope: 'contact', push: 'contact' };

/** "What is the force doing to the body?": the book's definition of force. */
export const EFFECT_RIGHT = 'eff_faster';

export const EFFECT_CHOICES = ['eff_faster', 'eff_slower', 'eff_same', 'eff_nothing'];

/** Where the effect question's answer plays on to (s on screen), so the student sees it happen. */
export const EFFECT_SHOW = PUSH.lean + pushTime - 0.02;

/** The questions of a test, in a shuffled order: the example itself and new cases. */
export const QUESTIONS = [{ kind: 'case', set: 'rope' }, { kind: 'kind', set: 'push' }, { kind: 'effect' }];

/** Fisher–Yates with a given random source (Math.random is seeded by the test harness). */
export function shuffle(list, random = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
