// The maths of the vectors on the graph paper, kept apart from the 3D so it can be unit-tested (book p38, 2.3).
// A vector is drawn as an arrow. Its মান (magnitude) is the arrow's length in squares of the paper; its দিক
// (direction) is the angle from পূর্ব (east, +x) turning towards উত্তর (north, +y), 0–359°. Where the arrow is
// drawn (its tail) is not part of the vector: two arrows are the same vector when মান and দিক are both equal,
// wherever they lie (চিত্র ২.০৩).

export const PAPER = { w: 12, h: 10 }; // squares of the graph paper (1 square = 1 cm)
export const MARGIN = 0.5; // squares: tails and heads stay this far inside the paper's edge
export const ANGLE_STEP = 15; // °: a dragged head turns in these steps
export const LEN_MIN = 1;
export const LEN_MAX = 7;
export const DOCK = 0.8; // squares: a tail dropped this close to another arrow's tail sits on it
export const NAMES = ['A', 'B', 'C', 'D', 'E'];

/**
 * The arrows of চিত্র ২.০৩: A and B the same vector in two places, C as long as A but turned, D along C but
 * shorter. Laid out like the book's picture, with room to line up A–B, A–C and C–D tail to tail on the paper.
 */
export const BOOK = {
  A: { tail: [3, 2], length: 5, angle: 60 },
  B: { tail: [5, 1], length: 5, angle: 60 },
  C: { tail: [11, 3], length: 5, angle: 120 },
  D: { tail: [11, 6], length: 3, angle: 120 },
};

/** The compass rose printed in the top-left corner of the paper: arrows keep clear of it. */
export const ROSE = { x: 1.35, y: 8.65, r: 1.15 };

const EPS = 1e-6;
export const tidy = (x) => +x.toFixed(9) + 0; // no binary leftovers, no -0
export const norm360 = (deg) => tidy(((deg % 360) + 360) % 360);

/** x and y of a vector from its মান and দিক. */
export function components(length, angle) {
  const a = (angle * Math.PI) / 180;
  return { x: tidy(length * Math.cos(a)), y: tidy(length * Math.sin(a)) };
}

/** মান and দিক of a vector from its x and y. */
export function polar(x, y) {
  return { length: tidy(Math.hypot(x, y)), angle: norm360((Math.atan2(y, x) * 180) / Math.PI) };
}

/** A dragged head: whole squares for the মান, steps of ANGLE_STEP for the দিক. */
export function snapPolar(x, y, { step = ANGLE_STEP, min = LEN_MIN, max = LEN_MAX } = {}) {
  const p = polar(x, y);
  return {
    length: Math.min(max, Math.max(min, Math.round(p.length))),
    angle: norm360(Math.round(p.angle / step) * step),
  };
}

/** Where the arrow's head is on the paper. */
export function headOf({ tail, length, angle }) {
  const c = components(length, angle);
  return [tidy(tail[0] + c.x), tidy(tail[1] + c.y)];
}

export const sameMagnitude = (u, v) => Math.abs(u.length - v.length) < EPS;
export function sameDirection(u, v) {
  const d = Math.abs(norm360(u.angle) - norm360(v.angle));
  return Math.min(d, 360 - d) < EPS;
}

/** What chapter 2.3 asks of two arrows: same মান? same দিক? Only both together make them the same vector. */
export function compare(u, v) {
  const m = sameMagnitude(u, v);
  const d = sameDirection(u, v);
  const turn = Math.abs(norm360(u.angle) - norm360(v.angle));
  return { sameMagnitude: m, sameDirection: d, equal: m && d, opposite: Math.abs(turn - 180) < EPS };
}

/** Which of the eight compass directions an angle is ('e', 'ne', 'n', …), or null in between. */
export function compass(angle) {
  const a = norm360(angle);
  if (Math.abs(a / 45 - Math.round(a / 45)) > EPS) return null;
  return ['e', 'ne', 'n', 'nw', 'w', 'sw', 's', 'se'][Math.round(a / 45) % 8];
}

/** The tail moved (as little as possible) so the whole arrow lies on the paper. */
export function fitOnPaper(tail, length, angle, paper = PAPER, m = MARGIN) {
  const c = components(length, angle);
  const lo = (d) => m - Math.min(0, d);
  const hi = (size, d) => size - m - Math.max(0, d);
  const clamp = (v, a, b) => (a > b ? (a + b) / 2 : Math.min(b, Math.max(a, v)));
  return [tidy(clamp(tail[0], lo(c.x), hi(paper.w, c.x))), tidy(clamp(tail[1], lo(c.y), hi(paper.h, c.y)))];
}

/** The nearest corner of the grid to `raw` where the whole arrow lies on the paper. */
export function fitOnGrid(raw, length, angle, paper = PAPER, m = MARGIN) {
  const c = components(length, angle);
  const axis = (v, d, size) => {
    const lo = Math.ceil(m - Math.min(0, d) - EPS);
    const hi = Math.floor(size - m - Math.max(0, d) + EPS);
    return lo > hi ? null : Math.min(hi, Math.max(lo, Math.round(v)));
  };
  const x = axis(raw[0], c.x, paper.w);
  const y = axis(raw[1], c.y, paper.h);
  return x == null || y == null ? fitOnPaper(raw, length, angle, paper, m) : [x, y];
}

/** The longest whole মান an arrow from `tail` in direction `angle` can have with its head still on the paper. */
export function maxLengthFrom(tail, angle, paper = PAPER, m = MARGIN) {
  for (let len = LEN_MAX; len > LEN_MIN; len--) {
    const [x, y] = headOf({ tail, length: len, angle });
    if (x >= m - EPS && x <= paper.w - m + EPS && y >= m - EPS && y <= paper.h - m + EPS) return len;
  }
  return LEN_MIN;
}

/** Does the whole arrow from `tail` lie on the paper? */
export function fits(tail, length, angle, paper = PAPER) {
  const f = fitOnPaper(tail, length, angle, paper);
  return Math.abs(f[0] - tail[0]) < EPS && Math.abs(f[1] - tail[1]) < EPS;
}

/**
 * Where a dragged arrow lands when it is let go: on another arrow's tail if it is dropped close to one (so the
 * two can be compared tail to tail), otherwise on the nearest corner of the grid, on the paper.
 *   others: [{ name, tail }]   → { tail, dockedOn: name | null }
 */
export function landing(raw, { length, angle }, others = [], { dock = DOCK, paper = PAPER } = {}) {
  let best = null;
  for (const o of others) {
    const d = Math.hypot(o.tail[0] - raw[0], o.tail[1] - raw[1]);
    if (d <= dock && (!best || d < best.d)) best = { d, o };
  }
  if (best) return { tail: [best.o.tail[0], best.o.tail[1]], dockedOn: best.o.name };
  return { tail: fitOnGrid(raw, length, angle, paper), dockedOn: null };
}

/**
 * One tail for two arrows lined up to be compared: u's own tail if v fits there too, otherwise the nearest
 * corner of the grid where both lie on the paper (u moves as little as possible).
 */
export function commonTail(u, v, paper = PAPER) {
  if (fits(u.tail, u.length, u.angle, paper) && fits(u.tail, v.length, v.angle, paper)) return [u.tail[0], u.tail[1]];
  let best = null;
  for (let x = 0; x <= paper.w; x++)
    for (let y = 0; y <= paper.h; y++) {
      if (!fits([x, y], u.length, u.angle, paper) || !fits([x, y], v.length, v.angle, paper)) continue;
      const d = Math.hypot(x - u.tail[0], y - u.tail[1]);
      if (!best || d < best.d - EPS) best = { d, tail: [x, y] };
    }
  return best ? best.tail : fitOnPaper(u.tail, u.length, u.angle, paper);
}

/** Shortest distance between the segments p1–p2 and q1–q2 (each [x, y]). */
export function segmentDistance(p1, p2, q1, q2) {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  const r = sub(p2, p1);
  const s = sub(q2, q1);
  const denom = cross(r, s);
  if (Math.abs(denom) > EPS) {
    const qp = sub(q1, p1);
    const tt = cross(qp, s) / denom;
    const uu = cross(qp, r) / denom;
    if (tt >= 0 && tt <= 1 && uu >= 0 && uu <= 1) return 0; // they cross
  }
  const toSeg = (p, a, b) => {
    const ab = sub(b, a);
    const k = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1)));
    return Math.hypot(p[0] - a[0] - k * ab[0], p[1] - a[1] - k * ab[1]);
  };
  return Math.min(toSeg(p1, q1, q2), toSeg(p2, q1, q2), toSeg(q1, p1, p2), toSeg(q2, p1, p2));
}

/**
 * Tails for a set of vectors so the arrows lie apart on the paper (at least `gap` squares between any two, and
 * clear of the compass rose), using `rand` (0…1). Returns null if no layout was found.
 *   vectors: [{ length, angle }]
 */
export function placeApart(vectors, rand, { gap = 1.3, paper = PAPER, tries = 400 } = {}) {
  const placed = [];
  for (const v of vectors) {
    const c = components(v.length, v.angle);
    let found = null;
    for (let k = 0; k < tries && !found; k++) {
      const lo = [MARGIN - Math.min(0, c.x), MARGIN - Math.min(0, c.y)];
      const hi = [paper.w - MARGIN - Math.max(0, c.x), paper.h - MARGIN - Math.max(0, c.y)];
      if (hi[0] < lo[0] || hi[1] < lo[1]) return null;
      const tail = [Math.ceil(lo[0]) + Math.floor(rand() * (Math.floor(hi[0]) - Math.ceil(lo[0]) + 1)), 0];
      tail[1] = Math.ceil(lo[1]) + Math.floor(rand() * (Math.floor(hi[1]) - Math.ceil(lo[1]) + 1));
      const head = [tail[0] + c.x, tail[1] + c.y];
      const nearRose = segmentDistance(tail, head, [ROSE.x, ROSE.y], [ROSE.x, ROSE.y]) < ROSE.r + 0.5;
      if (nearRose) continue;
      if (placed.every((p) => segmentDistance(tail, head, p.tail, p.head) >= gap)) found = { tail, head };
    }
    if (!found) return null;
    placed.push(found);
  }
  return placed.map((p) => p.tail);
}

/**
 * Wrong readings of an arrow, from the usual mistakes: the মান one too few (counting the marks, not the
 * squares between them), the arrow read backwards (দিক turned by 180°), east and west swapped (mirrored).
 * Returns three { length, angle }, all different from the right one and from each other.
 */
export function readingMistakes({ length, angle }) {
  const key = (v) => `${v.length}|${norm360(v.angle)}`;
  const seen = new Set([key({ length, angle })]);
  const out = [];
  const candidates = [
    { length: length > LEN_MIN ? length - 1 : length + 1, angle },
    { length, angle: norm360(angle + 180) },
    { length, angle: norm360(180 - angle) },
    { length, angle: norm360(-angle) },
    { length, angle: norm360(angle + 90) },
    { length: length + 1, angle },
  ];
  for (const c of candidates) {
    if (out.length === 3 || seen.has(key(c))) continue;
    seen.add(key(c));
    out.push(c);
  }
  return out;
}
