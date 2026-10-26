// The maths of "find your friend" (book p38, 2.3), kept apart from the 3D so it can be unit-tested.
// The school field is a map in metres: x to পূর্ব (east), y to উত্তর (north); you start at (0, 0). A vector is an
// arrow on the field: its মান (magnitude) is its length in metres, its দিক (direction) one of the eight compass
// directions, kept as the angle from পূর্ব turning towards উত্তর (0 পূর্ব, 45 উত্তর-পূর্ব, 90 উত্তর, …). Where an
// arrow is drawn (its tail) is not part of the vector: two arrows are the same vector when মান and দিক are both
// equal, wherever they lie (চিত্র ২.০৩).

/** m: how far the friend is (the clue’s মান). A school field is about 100 m across. */
export const RING = 25;
/** The eight compass directions, from পূর্ব turning towards উত্তর (index × 45°). */
export const DIRS = ['e', 'ne', 'n', 'nw', 'w', 'sw', 's', 'se'];
/** Where you start: the middle of the chalk compass on the field. */
export const START = [0, 0];
/** The friend, as the clue gives it: 30 m উত্তর-পূর্ব from you (the arrow A). */
export const FRIEND = { tail: START, length: RING, angle: 45 };
/**
 * Three more children walk their own clues from other places, like চিত্র ২.০৩: B as far and the same way as you (the
 * same vector as A, somewhere else), C as far but উত্তর-পশ্চিম (দিক ভিন্ন), D the same way as C but half as far (মান
 * সমান নয়). Laid out so that no two arrows or comparison copies come within 9 m of each other, no child standing at a
 * tail or a head covers another arrow (a standing child hides about 8 m of grass behind it on the screen), and the
 * compass round the start stays clear, inside a 52 m square round it.
 */
export const WALKERS = {
  B: { tail: [4, -26], length: RING, angle: 45 },
  C: { tail: [-4, -20], length: RING, angle: 135 },
  D: { tail: [-16, -26], length: RING / 2, angle: 135 },
};
/** The vectors of the learn sheet by name. */
export const VECTORS = { A: FRIEND, ...WALKERS };
/** Each child's arrow is compared, tail to tail, with this one: the book's caption (A ও B, C ও A, D ও C). */
export const PAIRS = { B: 'A', C: 'A', D: 'C' };
/** The question marks round the ring of every place 30 m away: every 30°, so none sits where the friend is. */
export const RING_MARKS = Array.from({ length: 12 }, (_, i) => i * 30);

/** The book's examples (page 38): a স্কেলার needs only a মান, a ভেক্টর needs a দিক too. */
export const QUANTITIES = {
  temp: 'scalar',
  time: 'scalar',
  length: 'scalar',
  mass: 'scalar',
  position: 'vector',
  velocity: 'vector',
  force: 'vector',
};

const EPS = 1e-6;
export const tidy = (x) => +x.toFixed(9) + 0; // no binary leftovers, no -0
export const norm360 = (deg) => tidy(((deg % 360) + 360) % 360);

/** The compass name of a direction ('ne', …), or null if it is not one of the eight. */
export function compass(angle) {
  const a = norm360(angle);
  const i = Math.round(a / 45);
  return Math.abs(a - i * 45) < EPS ? DIRS[i % 8] : null;
}
/** The angle of a compass name. */
export const angleOf = (name) => DIRS.indexOf(name) * 45;

/** x (east) and y (north) of a vector from its মান and দিক. */
export function components(length, angle) {
  const a = (angle * Math.PI) / 180;
  return [tidy(length * Math.cos(a)), tidy(length * Math.sin(a))];
}
/** মান and দিক of a vector from its x and y. */
export function polar(x, y) {
  return { length: tidy(Math.hypot(x, y)), angle: norm360((Math.atan2(y, x) * 180) / Math.PI) };
}
/** Where an arrow ends on the field. */
export function headOf({ tail, length, angle }) {
  const [x, y] = components(length, angle);
  return [tidy(tail[0] + x), tidy(tail[1] + y)];
}
/** The point at fraction f along an arrow (0 tail … 1 head). */
export function along({ tail, length, angle }, f) {
  const [x, y] = components(length * f, angle);
  return [tidy(tail[0] + x), tidy(tail[1] + y)];
}
/** The tail that puts an arrow's middle at `centre`. */
export function centredTail(centre, length, angle) {
  const [x, y] = components(length / 2, angle);
  return [tidy(centre[0] - x), tidy(centre[1] - y)];
}
export const distance = (p, q) => tidy(Math.hypot(q[0] - p[0], q[1] - p[1]));

export const sameMagnitude = (u, v) => Math.abs(u.length - v.length) < EPS;
export const sameDirection = (u, v) => norm360(u.angle - v.angle) < EPS || norm360(v.angle - u.angle) < EPS;
/** How two vectors compare: only when মান and দিক are both equal are they the same vector, wherever they are drawn. */
export function compare(u, v) {
  const m = sameMagnitude(u, v);
  const d = sameDirection(u, v);
  return { sameMagnitude: m, sameDirection: d, equal: m && d, opposite: m && Math.abs(norm360(u.angle - v.angle) - 180) < EPS };
}
/** The verdict in one word: 'equal', 'direction' (only the দিক differs), 'magnitude' (only the মান) or 'both'. */
export function verdict(u, v) {
  const c = compare(u, v);
  return c.equal ? 'equal' : c.sameMagnitude ? 'direction' : c.sameDirection ? 'magnitude' : 'both';
}

// ── the test ────────────────────────────────────────────────────────────────────

/** The direction mirrored পূর্ব ↔ পশ্চিম (the usual mix-up of east and west). */
export const mirrorEW = (angle) => norm360(180 - angle);
/** The direction mirrored উত্তর ↔ দক্ষিণ. */
export const mirrorNS = (angle) => norm360(-angle);
/** The opposite direction (read backwards). */
export const opposite = (angle) => norm360(angle + 180);

/**
 * "Where is the friend?" with a clue of মান and দিক along a diagonal: the right direction and the three usual
 * mistakes (the opposite way, east and west swapped, north and south swapped). Only diagonals give four different
 * places.
 */
export function findOptions(angle) {
  if (compass(angle) == null || norm360(angle) % 90 === 0) throw new Error(`not a diagonal: ${angle}`);
  return [
    { kind: 'right', angle: norm360(angle) },
    { kind: 'opposite', angle: opposite(angle) },
    { kind: 'eastwest', angle: mirrorEW(angle) },
    { kind: 'northsouth', angle: mirrorNS(angle) },
  ];
}

/**
 * "Which arrow is the same vector as A?": the equal one and the three usual mistakes, each a real near miss: turned
 * (the same মান, another দিক), shorter (the same দিক, half the মান) and reversed (the same মান, the opposite দিক).
 * turn: how far the turned one is turned (90 or -90, or ±45).
 */
export function equalOptions({ length, angle }, turn = 90) {
  return [
    { kind: 'equal', length, angle: norm360(angle) },
    { kind: 'turned', length, angle: norm360(angle + turn) },
    { kind: 'shorter', length: length / 2, angle: norm360(angle) },
    { kind: 'reversed', length, angle: opposite(angle) },
  ];
}

/** The second arrow of "why are these two different?": only its দিক, only its মান, or both differ from `u`. */
export function whyPartner(u, kind, turn = 90) {
  if (kind === 'direction') return { length: u.length, angle: norm360(u.angle + turn) };
  if (kind === 'magnitude') return { length: u.length / 2, angle: u.angle };
  return { length: u.length / 2, angle: norm360(u.angle + turn) };
}

/** m: how far the flags are from you in the test, and how long its arrows are (half that for the "half as long" one). */
export const TEST_D = 20;
export const TEST_L = 16;
/**
 * Six places for the test's arrows (3 across, 2 down), 19 m by 25 m each: an arrow of up to 16 m centred on one never
 * comes within 3 m of the next, whatever its দিক.
 */
export const CELLS = [
  [-19, 12.5],
  [0, 12.5],
  [19, 12.5],
  [-19, -13],
  [0, -13],
  [19, -13],
];

/** Gap between two segments on the field (0 when they cross). */
export function segmentDistance(p1, p2, q1, q2) {
  const toSeg = (p, a, b) => {
    const abx = b[0] - a[0];
    const aby = b[1] - a[1];
    const L = abx * abx + aby * aby || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / L));
    return Math.hypot(a[0] + t * abx - p[0], a[1] + t * aby - p[1]);
  };
  const side = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  if (side(p1, p2, q1) * side(p1, p2, q2) < 0 && side(q1, q2, p1) * side(q1, q2, p2) < 0) return 0;
  return tidy(Math.min(toSeg(p1, q1, q2), toSeg(p2, q1, q2), toSeg(q1, p1, p2), toSeg(q2, p1, p2)));
}
