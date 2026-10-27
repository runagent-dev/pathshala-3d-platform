// The maths of the figure, pure functions (unit-tested in test/unit/walking-third-law.test.mjs).
//
// A 50 kg student starts to walk from rest. The leg means to push the ground backward with INTENT newtons for the
// 0.6 s of the first push-off (so the leg stretches back by the same amount on every ground). What the ground can
// give back is limited by how well the foot grips it (the book: soft sand gives way, a soapy or oily floor has very
// little friction): the push is the smaller of the intended one and the grip. By the third law the ground pushes the
// student forward with exactly the force the foot pushes the ground, and that force is the student's only
// horizontal force, so a = F / m. Where the grip is less than the intended push, the rest of the leg's stretch is the
// foot sliding back over the ground instead of the body moving forward.
//
// Numbers are for one example (a 50 kg student); the book gives none.

export const MASS = 50; // kg
export const INTENT = 100; // N: the push the leg means to give the ground (the same on every ground)
export const PUSH_TIME = 0.6; // s: the first push-off, in real time
export const SLOW = 4; // the picture shows it 4 times slower than real time

/** The grounds of the page, in its order. grip: the most the foot can push this ground back (N). */
export const GROUNDS = {
  hard: { grip: 400 }, // firm ground: more than the leg gives (a friction of about 0.8 × 490 N)
  sand: { grip: 50 }, // loose sand: it gives way under the foot
  slip: { grip: 20 }, // soapy water or oil on a smooth floor (a friction of about 0.04 × 490 N)
};
export const GROUND_IDS = Object.keys(GROUNDS);

/** The push of the foot on the ground, which is also the push of the ground on the student (N). */
export const pushOn = (id) => Math.min(INTENT, GROUNDS[id].grip);

/** The student's acceleration (ms⁻²). */
export const accelOn = (id) => pushOn(id) / MASS;

/** Progress of the push-off, 0 … 1, for a time t in real seconds. */
export const progress = (t) => Math.min(1, Math.max(0, t / PUSH_TIME));

/** How far the student's body has moved after t s of the push (m). */
export const bodyAt = (t, id) => 0.5 * accelOn(id) * Math.min(Math.max(t, 0), PUSH_TIME) ** 2;

/** The student's speed after t s of the push (m/s). */
export const speedAt = (t, id) => accelOn(id) * Math.min(Math.max(t, 0), PUSH_TIME);

/** How far the leg has stretched back by t s: what the foot would move back on a ground that does not give (m). */
export const stretchAt = (t) => 0.5 * (INTENT / MASS) * Math.min(Math.max(t, 0), PUSH_TIME) ** 2;

/** How far the foot has slid back over the ground by t s (m): the leg's stretch that did not move the body. */
export const slipAt = (t, id) => stretchAt(t) - bodyAt(t, id);

/** Real time (s) of the push-off for a time `shown` s into the slowed-down picture. */
export const realTime = (shown) => Math.min(PUSH_TIME, Math.max(0, shown / SLOW));

/** How long the picture of the push-off lasts (s). */
export const SHOWN_TIME = PUSH_TIME * SLOW;

const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
export { round };
