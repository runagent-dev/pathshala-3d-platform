// Force: friction, a contact force (book page 67, topic 3.1.2): the facts and the motion behind the figure, as pure functions
// (unit-tested in test/unit/contact-noncontact-force-friction.test.mjs).
//  - The example: which kind of force it is (স্পর্শ বল or অস্পর্শ বল) and what it does, in the words of the book's
//    definition (a body at rest starts moving, or a moving body's velocity changes).
//  - Its motion as a function of the time shown on screen, with real speeds in m/s (SLOW: shown slower than real).
//  - The test: its answer keys (the right one first, the others the usual mistakes).

/** The page's example this figure shows. */
export const EXAMPLE = 'friction';

/** স্পর্শ বল ('contact') or অস্পর্শ বল ('noncontact'). */
export const KIND = { friction: 'contact' };

/**
 * What the force does, in the words of the book's definition: 'start' (স্থির বস্তু চলতে শুরু করে), 'change'
 * (গতিশীল বস্তুর বেগের পরিবর্তন হয়) or 'both' (it starts moving, and goes faster and faster).
 */
export const EFFECT = { friction: 'change' };

/** How many times slower than real it is shown. */
export const SLOW = { friction: 2 };

export const G = 9.8; // m/s²

/** x rounded to a multiple of step, without binary leftovers (0.30000000000000004). */
export function roundTo(x, step) {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
  return +(Math.round(x / step) * step).toFixed(decimals);
}

/** A body sliding at v0 that friction slows at `a` (m/s²) until it stops: { s, v } after t real seconds. */
export function slide(t, v0, a) {
  const stop = v0 / a;
  const u = Math.min(Math.max(t, 0), stop);
  const v = t >= stop - 1e-9 ? 0 : Math.max(0, v0 - a * Math.max(t, 0)); // exactly 0 once stopped (no 2e-16 left)
  return { s: v0 * u - 0.5 * a * u * u, v, stop, dist: (v0 * v0) / (2 * a) };
}

// ── the example, as a function of the time shown (s) ─────────────────────────────────────────────────────────
// It returns { pos (m the moving body has gone), speed (real m/s), acting (the force acts), touching (the source
// touches the body), gap (m of empty space between them, or null) } and a few things for the 3D.

export const FRICTION = { v0: 2, mu: 0.2 };

const frictionReal = slide(0, FRICTION.v0, FRICTION.mu * G);

/** How long the action lasts on screen (s). */
export const DURATION = {
  friction: frictionReal.stop * SLOW.friction,
};

/**
 * The telling moment (s on screen): where a run stops and holds, the force acting and the body moving, so the
 * student sees what touches it (or the gap).
 */
export const KEY = {
  friction: 0.45 * SLOW.friction, // still sliding, at 1.1 m/s
};

export function frictionAt(t) {
  const m = slide(t / SLOW.friction, FRICTION.v0, FRICTION.mu * G);
  // friction acts whenever it slides, also in the first, still picture
  return { pos: m.s, speed: m.v, acting: m.v > 0, touching: true, gap: null };
}

const AT = { friction: frictionAt };

/** The example at time t on screen (clamped to its action). */
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
export const CASES = { parachute: 'contact' };

/**
 * Answer keys (i18n) for "what kind of force is this?", the right one first; every wrong one is a real mistake with
 * its own worked answer, and each question has two answers of each kind (the first word gives nothing away).
 */
export const KIND_CHOICES = {
  parachute: ['k_para_ok', 'k_para_unseen', 'k_para_gravity', 'k_para_ground'],
  crate: ['k_crate_ok', 'k_crate_nobody', 'k_crate_earth', 'k_crate_push'],
};

/** The kind of force each set of answers is about. */
export const CHOICE_KIND = { parachute: 'contact', crate: 'contact' };

/** "What is the force doing to the body?": the book's definition of force. */
export const EFFECT_RIGHT = 'eff_slower';

export const EFFECT_CHOICES = ['eff_faster', 'eff_slower', 'eff_same', 'eff_nothing'];

/** Where the effect question's answer plays on to (s on screen), so the student sees it happen. */
export const EFFECT_SHOW = DURATION.friction;

/** The questions of a test, in a shuffled order: the example itself and new cases. */
export const QUESTIONS = [{ kind: 'case', set: 'parachute' }, { kind: 'kind', set: 'crate' }, { kind: 'effect' }];

/** Fisher–Yates with a given random source (Math.random is seeded by the test harness). */
export function shuffle(list, random = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
