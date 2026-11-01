// The physics of the figure, as pure functions (unit-tested in test/unit/speed-velocity.test.mjs).
//
// Two boys run for the same time, 20 s (the book's numbers, page 40):
//  - boy 1 runs a zig-zag path 100 m long: দ্রুতি = দূরত্ব ÷ সময় = 100 m ÷ 20 s = 5 m/s, a number with no direction;
//  - boy 2 runs 50 m in a straight line, in a direction the student picks: বেগ = সরণ ÷ সময় = 50 m ÷ 20 s = 2.5 m/s,
//    in that direction (a vector).
// Map coordinates: e = east, n = north, in drawing units (1 unit = 5 m: the boys are drawn bigger than they are, so
// they show on a phone). Angles in degrees, counted from east towards north (anticlockwise seen from above).

export const SCALE = 5; // m of the book per drawing unit
export const RUN = { time: 20, distance: 100, displacement: 50 }; // s, m, m
export const SPEED = RUN.distance / RUN.time; // 5 m/s
export const VELOCITY = RUN.displacement / RUN.time; // 2.5 m/s
export const START = { one: { e: 0, n: -1.6 }, two: { e: 0, n: 1.6 } }; // the two places on the start line

const rad = (deg) => (deg * Math.PI) / 180;
/** 0 ≤ deg < 360. */
export const wrap = (deg) => ((deg % 360) + 360) % 360;

// boy 1's zig-zag (the corners, before scaling to exactly 100 m)
const RAW = [
  [0, 0],
  [2.6, -2.4],
  [5.2, 0.2],
  [7.8, -2.6],
  [10.4, -0.4],
  [12.6, -2],
];
const rawLength = RAW.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - RAW[i][0], p[1] - RAW[i][1]), 0);
const k = RUN.distance / SCALE / rawLength;
/** The corners of boy 1's path, in units, from his start; the path is exactly 100 m long. */
export const PATH = RAW.map(([e, n]) => ({ e: START.one.e + e * k, n: START.one.n + n * k }));
const SEGS = PATH.slice(1).map((p, i) => {
  const a = PATH[i];
  return { a, b: p, len: Math.hypot(p.e - a.e, p.n - a.n), heading: wrap((Math.atan2(p.n - a.n, p.e - a.e) * 180) / Math.PI) };
});

/** Boy 1 after running `d` m along his path: where he is and which way he faces. */
export function pathAt(d) {
  let left = Math.min(Math.max(d, 0), RUN.distance) / SCALE;
  for (const s of SEGS) {
    if (left <= s.len || s === SEGS[SEGS.length - 1]) {
      const f = Math.min(1, left / s.len);
      return { e: s.a.e + (s.b.e - s.a.e) * f, n: s.a.n + (s.b.n - s.a.n) * f, heading: s.heading };
    }
    left -= s.len;
  }
  return { ...PATH[0], heading: SEGS[0].heading };
}

/** Boy 2 after running `d` m straight at `angle`. */
export function lineAt(d, angle) {
  const u = Math.max(0, Math.min(d, RUN.displacement)) / SCALE;
  return { e: START.two.e + u * Math.cos(rad(angle)), n: START.two.n + u * Math.sin(rad(angle)), heading: wrap(angle) };
}

/** Everything `time` seconds after the start (0–20 s): the panel's numbers. */
export function runAt(time) {
  const tt = Math.min(Math.max(time, 0), RUN.time);
  const distance = SPEED * tt;
  const displacement = VELOCITY * tt;
  // boy 1's own displacement (straight from his start), to show it is not his distance
  const p = pathAt(distance);
  const straight1 = Math.hypot(p.e - START.one.e, p.n - START.one.n) * SCALE;
  return {
    time: tt,
    distance,
    displacement,
    speed: tt > 0 ? distance / tt : null,
    velocity: tt > 0 ? displacement / tt : null,
    straight1,
  };
}

// ── directions ────────────────────────────────────────────────────────────────
/** The eight directions of a compass, from east anticlockwise (keys of the strings dir_E, dir_NE, …). */
export const DIRS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
/** The compass word for a heading in degrees (nearest of the eight). */
export const dirOf = (heading) => DIRS[Math.round(wrap(heading) / 45) % 8];

// ── numbers ───────────────────────────────────────────────────────────────────
/** At most `d` decimals, no trailing zeros ("5", "2.5", "1.25"). */
export function fmt(x, d = 2) {
  if (x == null || !Number.isFinite(x)) return '';
  const s = (+x.toFixed(d)).toFixed(d);
  return d ? s.replace(/\.?0+$/, '') : s;
}
/** Exactly `d` decimals: for numbers that change while you watch, so they do not jump about. */
export const fixed = (x, d) => (x == null || !Number.isFinite(x) ? '' : (+x.toFixed(d)).toFixed(d));
