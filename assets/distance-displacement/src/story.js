// The guided story of the শেখো panel and what its lines say: pure functions, unit-tested in
// test/unit/distance-displacement.test.mjs. The story is the book's example and two more legs: ride from A to B
// (4 km of road, a displacement of 2 km), on to C, and back to A (the displacement becomes zero, the distance
// keeps growing). The big action button rides to the story's next stop; arriving there by any means (the button,
// a tap on the map, a drag, the arrow keys) counts.

/** The story's stops, in order. */
export const STORY = ['B', 'C', 'A'];

/** The stop the story goes to next after `step` stops reached, or null when it is done. */
export const nextStop = (step) => STORY[step] ?? null;

/**
 * The story's step after the cyclist comes to rest at `at` ('A' | 'B' | 'C' | null) with `trip` km ridden: one more
 * when it is the next stop (A counts only after a ride, since the trip starts there).
 */
export function advance(step, at, trip) {
  if (!at || at !== STORY[step]) return step;
  if (at === 'A' && trip < 0.05) return step;
  return step + 1;
}

/**
 * How far the rule line has grown (it never shrinks during a trip):
 * 0 before the first stop (what the posts' numbers and সরণ mean), 1 after a stop anywhere (দূরত্ব is a scalar, সরণ
 * a vector), 2 after the story's second stop (the distance only grows, the displacement can shrink), 3 back at A
 * after a ride (the displacement is never more than the distance).
 */
export function ruleLevel(prev, { step, at, trip, moving }) {
  let level = 0;
  if (!moving && trip >= 0.005) level = 1;
  if (step >= 2) level = 2;
  if (step >= 3 || (!moving && at === 'A' && trip >= 0.05)) level = 3;
  return Math.max(prev, level);
}

/**
 * Which result line to show: 'move' while it rides or is dragged, 'start' before any ride, 'back' at A after a
 * ride, 'stop' at B or C, 'here' anywhere else.
 */
export function outcomeKind({ trip, at, moving }) {
  if (moving) return 'move';
  if (trip < 0.005) return 'start';
  if (at === 'A') return 'back';
  if (at === 'B' || at === 'C') return 'stop';
  return 'here';
}

/**
 * The legs of a trip as the panel names them: the signed legs (+ out, − back) merged where a turn-round of less
 * than 50 m is a wobble (it counts in the leg before it, so the sum stays the same); sizes, km.
 */
export function mergeLegs(legs) {
  const out = [];
  for (const leg of legs) {
    const last = out.length - 1;
    if (last >= 0 && (Math.abs(leg) < 0.05 || Math.sign(leg) === Math.sign(out[last]))) out[last] += Math.sign(out[last]) * Math.abs(leg);
    else out.push(leg);
  }
  return out.map(Math.abs);
}

/** The legs to write in a sum: at most four ([a, b, null, z] for more: "a + b + … + z"). */
export const legsToShow = (list) => (list.length > 4 ? [list[0], list[1], null, list.at(-1)] : list);
