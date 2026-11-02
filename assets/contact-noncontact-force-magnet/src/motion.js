// Force: a magnet’s pull, a non-contact force (book page 67, topic 3.1.2): the facts and the motion behind the figure, as pure functions
// (unit-tested in test/unit/contact-noncontact-force-magnet.test.mjs).
//  - The example: which kind of force it is (স্পর্শ বল or অস্পর্শ বল) and what it does, in the words of the book's
//    definition (a body at rest starts moving, or a moving body's velocity changes).
//  - Its motion as a function of the time shown on screen, with real speeds in m/s (SLOW: shown slower than real).
//  - The test: its answer keys (the right one first, the others the usual mistakes).

/** The page's example this figure shows. */
export const EXAMPLE = 'magnet';

/** স্পর্শ বল ('contact') or অস্পর্শ বল ('noncontact'). */
export const KIND = { magnet: 'noncontact' };

/**
 * What the force does, in the words of the book's definition: 'start' (স্থির বস্তু চলতে শুরু করে), 'change'
 * (গতিশীল বস্তুর বেগের পরিবর্তন হয়) or 'both' (it starts moving, and goes faster and faster).
 */
export const EFFECT = { magnet: 'start' };

/** How many times slower than real it is shown. */
export const SLOW = { magnet: 10 };

/** x rounded to a multiple of step, without binary leftovers (0.30000000000000004). */
export function roundTo(x, step) {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
  return +(Math.round(x / step) * step).toFixed(decimals);
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));

export const easeOutCubic = (k) => 1 - (1 - clamp01(k)) ** 3;

/**
 * An iron nail pulled the last `d` m to a magnet in `T` real seconds, faster and faster as the gap closes:
 * s = d (τ/T)^p. → { s, v, gap }.
 */
export function pull(tau, d, T, p = 2.5) {
  let k = clamp01(tau / T);
  if (k > 1 - 1e-9) k = 1; // arrived (no 0.9999999 left over from a sum of times): stuck, at rest
  return { s: d * k ** p, v: k > 0 && k < 1 ? (p * d * k ** (p - 1)) / T : 0, gap: d * (1 - k ** p) };
}

// ── the example, as a function of the time shown (s) ─────────────────────────────────────────────────────────
// It returns { pos (m the moving body has gone), speed (real m/s), acting (the force acts), touching (the source
// touches the body), gap (m of empty space between them, or null) } and a few things for the 3D.

export const MAGNET = { far: 0.05, near: 0.03, slide: 0.9, wait: 0.25, T: 0.12 };

/** How long the action lasts on screen (s). */
export const DURATION = {
  magnet: MAGNET.slide + MAGNET.wait + MAGNET.T * SLOW.magnet,
};

/**
 * The telling moment (s on screen): where a run stops and holds, the force acting and the body moving, so the
 * student sees what touches it (or the gap).
 */
export const KEY = {
  magnet: MAGNET.slide + MAGNET.wait + 0.55 * MAGNET.T * SLOW.magnet, // the nail on its way, a gap still open
};

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
  };
}

const AT = { magnet: magnetAt };

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
  magnet: ['k_magnet_ok', 'k_magnet_hand', 'k_magnet_table', 'k_magnet_small'],
};

/** The kind of force each set of answers is about. */
export const CHOICE_KIND = { comb: 'noncontact', magnet: 'noncontact' };

/** "What is the force doing to the body?": the book's definition of force. */
export const EFFECT_RIGHT = 'eff_faster';

export const EFFECT_CHOICES = ['eff_faster', 'eff_slower', 'eff_same', 'eff_nothing'];

/** Where the effect question's answer plays on to (s on screen), so the student sees it happen. */
export const EFFECT_SHOW = DURATION.magnet;

/** The questions of a test, in a shuffled order: the example itself and new cases. */
export const QUESTIONS = [{ kind: 'case', set: 'comb' }, { kind: 'kind', set: 'magnet' }, { kind: 'effect' }];

/** Fisher–Yates with a given random source (Math.random is seeded by the test harness). */
export function shuffle(list, random = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
