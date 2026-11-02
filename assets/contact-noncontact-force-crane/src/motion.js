// Force: a crane’s pull, a contact force (book page 67, topic 3.1.2): the facts and the motion behind the figure, as pure functions
// (unit-tested in test/unit/contact-noncontact-force-crane.test.mjs).
//  - The example: which kind of force it is (স্পর্শ বল or অস্পর্শ বল) and what it does, in the words of the book's
//    definition (a body at rest starts moving, or a moving body's velocity changes).
//  - Its motion as a function of the time shown on screen, with real speeds in m/s (SLOW: shown slower than real).
//  - The test: its answer keys (the right one first, the others the usual mistakes).

/** The page's example this figure shows. */
export const EXAMPLE = 'crane';

/** স্পর্শ বল ('contact') or অস্পর্শ বল ('noncontact'). */
export const KIND = { crane: 'contact' };

/**
 * What the force does, in the words of the book's definition: 'start' (স্থির বস্তু চলতে শুরু করে), 'change'
 * (গতিশীল বস্তুর বেগের পরিবর্তন হয়) or 'both' (it starts moving, and goes faster and faster).
 */
export const EFFECT = { crane: 'start' };

/** How many times slower than real it is shown. */
export const SLOW = { crane: 1 };

/** x rounded to a multiple of step, without binary leftovers (0.30000000000000004). */
export function roundTo(x, step) {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
  return +(Math.round(x / step) * step).toFixed(decimals);
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));

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

// ── the example, as a function of the time shown (s) ─────────────────────────────────────────────────────────
// It returns { pos (m the moving body has gone), speed (real m/s), acting (the force acts), touching (the source
// touches the body), gap (m of empty space between them, or null) } and a few things for the 3D.

export const CRANE = { take: 0.35, lift: trapezoid({ dist: 1.3, vmax: 0.5, accel: 1, decel: 1 }) };

/** How long the action lasts on screen (s). */
export const DURATION = {
  crane: CRANE.take + CRANE.lift.T,
};

/**
 * The telling moment (s on screen): where a run stops and holds, the force acting and the body moving, so the
 * student sees what touches it (or the gap).
 */
export const KEY = {
  crane: CRANE.take + 1.3, // half a metre up, rising at 0.5 m/s
};

export function craneAt(t) {
  const m = CRANE.lift.at(t - CRANE.take);
  // the cable takes up the slack first; the pull is drawn once it lifts the block
  return { pos: m.s, speed: m.v, acting: t >= CRANE.take, touching: true, gap: null, take: clamp01(t / CRANE.take) };
}

const AT = { crane: craneAt };

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
export const CASES = { rope: 'contact', parachute: 'contact' };

/**
 * Answer keys (i18n) for "what kind of force is this?", the right one first; every wrong one is a real mistake with
 * its own worked answer, and each question has two answers of each kind (the first word gives nothing away).
 */
export const KIND_CHOICES = {
  rope: ['k_rope_ok', 'k_rope_person', 'k_rope_wheels', 'k_rope_far'],
  parachute: ['k_para_ok', 'k_para_unseen', 'k_para_gravity', 'k_para_ground'],
  crane: ['k_crane_ok', 'k_crane_up', 'k_crane_far', 'k_crane_wheels'],
};

/** The kind of force each set of answers is about. */
export const CHOICE_KIND = { rope: 'contact', parachute: 'contact', crane: 'contact' };

/** The questions of a test, in a shuffled order: the example itself and new cases. */
export const QUESTIONS = [
  { kind: 'kind', set: 'crane' },
  { kind: 'case', set: 'rope' },
  { kind: 'case', set: 'parachute' },
];

/** Fisher–Yates with a given random source (Math.random is seeded by the test harness). */
export function shuffle(list, random = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
