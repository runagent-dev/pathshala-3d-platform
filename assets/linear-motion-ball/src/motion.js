// The physics of the drop and the throw, in metres and seconds, as pure functions (unit-tested in
// test/unit/linear-motion.test.mjs). Axes: x to the right, y up, z toward the student; the carrom board's playing
// surface is the square |x|, |z| ≤ BOARD.half at height BOARD.surface.
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
