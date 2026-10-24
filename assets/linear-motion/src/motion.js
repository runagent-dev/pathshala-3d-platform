// The physics of the figure's three motions, in metres and seconds, as pure functions (unit-tested in
// test/unit/linear-motion.test.mjs). Axes: x to the right, y up, z toward the student; the carrom board's playing
// surface is the square |x|, |z| ≤ BOARD.half at height BOARD.surface.
//   push:  a striker pushed on the flat board slides in a straight line and slows down evenly (friction μ·g);
//   drop:  a ball let go from rest falls freely, straight down (½·g·t²);
//   throw: the same ball pushed sideways falls on a curve (x = v·t, y = ½·g·t²): not a straight line.

export const G = 9.8; // m/s²

/** A carrom board: playing area 74 cm × 74 cm, the frame 7.5 cm wide; the surface 1.6 cm above the floor. */
export const BOARD = { half: 0.37, frame: 0.075, surface: 0.016 };

/** The striker (4.1 cm across), on the near base line; strobe pictures every 0.1 s; the board is powdered (μ ≈ 0.12). */
export const STRIKER = { r: 0.0206, h: 0.0045, mu: 0.12, start: { x: 0, z: 0.255 }, step: 0.1, margin: 0.025, minDist: 0.12 };

/**
 * A cricket ball (7.2 cm across) held over the board on a stand: its centre `height` above the surface. Strobe
 * pictures every 0.05 s; shown 4 times slower than real time (a real fall takes 0.4 s). A throw leaves at 1 m/s.
 */
export const BALL = { r: 0.036, x: -0.2, z: 0, height: 0.8, step: 0.05, slow: 4, vx: 1 };

/** The fall height of the ball's centre (from the holder until it touches the board). */
export const FALL = BALL.height - BALL.r;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
/** Rounded without binary leftovers: round(0.1 + 0.2, 3) → 0.3. */
export const round = (v, d = 3) => +(Math.round(v * 10 ** d) / 10 ** d).toFixed(d);

// ── push: slide with friction ─────────────────────────────────────────────────

/** A slide that stops after `dist` m: deceleration a = μ·g, start speed v0 = √(2·a·dist), time T = v0 / a. */
export function slideFor(dist, mu = STRIKER.mu) {
  const a = mu * G;
  const d = Math.max(0, dist);
  const v0 = Math.sqrt(2 * a * d);
  return { a, v0, T: a > 0 ? v0 / a : 0, dist: d };
}

/** Distance slid after t s (v0·t − ½·a·t², then it stays stopped). */
export function slideAt(t, { a, v0, T, dist }) {
  if (t <= 0) return 0;
  if (t >= T) return dist;
  return v0 * t - 0.5 * a * t * t;
}

/** Push direction on the board for an angle in degrees from straight ahead (−z), positive to the right. */
export function dirFromAngle(deg) {
  const a = (deg * Math.PI) / 180;
  return { x: Math.sin(a), z: -Math.cos(a) };
}

/** Angle in degrees (as dirFromAngle) of a direction on the board. */
export function angleOf({ x, z }) {
  return (Math.atan2(x, -z) * 180) / Math.PI;
}

/** How far the striker can slide from p along the unit direction before its edge comes within `margin` of the frame. */
export function roomAlong(p, dir, { half = BOARD.half, r = STRIKER.r, margin = STRIKER.margin } = {}) {
  const lim = half - r - margin;
  let room = Number.POSITIVE_INFINITY;
  for (const k of ['x', 'z']) {
    if (Math.abs(dir[k]) < 1e-9) continue;
    const edge = dir[k] > 0 ? lim : -lim;
    room = Math.min(room, (edge - p[k]) / dir[k]);
  }
  return Math.max(0, room);
}

/**
 * A push from p: the angle (degrees, see dirFromAngle) and strength (0…1) of the push. A full-strength push slides
 * it almost to the frame, a light one a short way (never less than minDist, if there is room). Returns the slide
 * plus the start, the direction and the end point.
 */
export function pushFrom(p, angle, strength) {
  const dir = dirFromAngle(angle);
  const room = roomAlong(p, dir);
  const dist = Math.min(room, Math.max(STRIKER.minDist, clamp(strength, 0, 1) * room));
  const slide = slideFor(dist);
  return { ...slide, angle, strength: clamp(strength, 0, 1), start: { ...p }, dir, end: { x: p.x + dir.x * dist, z: p.z + dir.z * dist } };
}

// ── drop and throw: free fall ─────────────────────────────────────────────────

/** Time to fall h m from rest: T = √(2h / g). */
export const fallTime = (h = FALL) => Math.sqrt((2 * h) / G);

/** Drop after t s of fall (½·g·t², no further than h). */
export const fallAt = (t, h = FALL) => Math.min(h, 0.5 * G * Math.max(0, t) ** 2);

/** The ball's offset from where it was let go, t s later, for a sideways speed vx (0: a plain drop). */
export function flightAt(t, vx = 0, h = FALL) {
  const tt = clamp(t, 0, fallTime(h));
  return { x: vx * tt, y: -fallAt(tt, h) };
}

// ── strobe pictures and straightness ──────────────────────────────────────────

/** The times of the strobe pictures: 0, step, 2·step … up to T (exact multiples, no binary drift). */
export function strobeTimes(T, step) {
  const n = Math.floor(T / step + 1e-9);
  return Array.from({ length: n + 1 }, (_, k) => round(k * step, 6));
}

/** The largest distance of the points from the straight line through a and b (3D points { x, y, z }). */
export function maxDeviation(points, a, b) {
  const d = { x: b.x - a.x, y: (b.y ?? 0) - (a.y ?? 0), z: (b.z ?? 0) - (a.z ?? 0) };
  const len = Math.hypot(d.x, d.y, d.z);
  let max = 0;
  for (const p of points) {
    const v = { x: p.x - a.x, y: (p.y ?? 0) - (a.y ?? 0), z: (p.z ?? 0) - (a.z ?? 0) };
    let dist;
    if (len < 1e-12) dist = Math.hypot(v.x, v.y, v.z);
    else {
      // |v × d| / |d|
      const cx = v.y * d.z - v.z * d.y;
      const cy = v.z * d.x - v.x * d.z;
      const cz = v.x * d.y - v.y * d.x;
      dist = Math.hypot(cx, cy, cz) / len;
    }
    max = Math.max(max, dist);
  }
  return max;
}

/** Index of the point farthest from the line ab (−1 for no points). */
export function farthestIndex(points, a, b) {
  let best = -1;
  let max = -1;
  points.forEach((p, i) => {
    const m = maxDeviation([p], a, b);
    if (m > max) {
      max = m;
      best = i;
    }
  });
  return best;
}

/** A path is a straight line when no point is more than `tol` m (2 mm) off the line from its first to its last point. */
export function isStraight(points, tol = 0.002) {
  if (points.length < 3) return true;
  return maxDeviation(points, points[0], points[points.length - 1]) <= tol;
}

// ── the test: four paths a pushed striker might take ──────────────────────────

/**
 * Four candidate paths from p for a push at `angle` (degrees), each `len` m long and starting along the push:
 * straight (the right one), curving left, curving right, and straight then turning. Points every ~1 cm as { x, z }.
 * Curves bend by `bend` degrees over their length.
 */
export function candidatePaths(p, angle, len, { bend = 50, n = 40 } = {}) {
  const arc = (turn, from = 0) =>
    Array.from({ length: n + 1 }, (_, i) => i / n).reduce(
      (pts, f, i) => {
        if (i === 0) return pts;
        const prev = pts[pts.length - 1];
        const k = Math.max(0, (f - from) / (1 - from)); // no turning before `from`
        const a = angle + turn * k;
        const d = dirFromAngle(a);
        pts.push({ x: prev.x + (d.x * len) / n, z: prev.z + (d.z * len) / n });
        return pts;
      },
      [{ x: p.x, z: p.z }],
    );
  const side = angle >= 0 ? -1 : 1; // the dog-leg turns toward the middle of the board
  return {
    straight: arc(0),
    left: arc(-bend),
    right: arc(bend),
    turn: arc(side * 2 * bend, 0.55),
  };
}
