// The maths of the figure (pure functions, unit-tested in test/unit/translational-motion.test.mjs): a car of
// real size moving as one rigid body, straight along a road or round a bend, where each painted point (বিন্দু)
// of it is, and how far each point has travelled. Everything is in metres.
//
// Car coordinates: x forward from the rear bumper, y up from the road, z to the car's right (towards the viewer).
// World: the car starts with its rear bumper at x = 0, heading +x; the bend turns left (towards −z).
// The car's position is given by d, the distance its rear axle has travelled along its path.

export const CAR = {
  length: 4.0,
  width: 1.72,
  height: 1.475,
  wheelR: 1 / Math.PI, // 0.318 m: one turn of a wheel moves the car exactly 2 m
  rearAxle: 0.78, // from the rear bumper
  wheelbase: 2.5,
  track: 1.48, // between the wheel centres, left to right
};
export const TURN_R = 5; // m: radius of the rear axle's path round the bend (a real car's tight turn)
export const PATHS = ['straight', 'turn'];
/** How far the rear axle goes: 4 m straight (two turns of a wheel), a quarter circle round the bend. */
export const D_MAX = { straight: 4, turn: (TURN_R * Math.PI) / 2 };

/** The painted points on the body, in car coordinates (on the right side, the roof). */
export const DOT_KEYS = ['front', 'door', 'roof', 'back'];
export const DOTS = {
  front: [3.82, 0.47, 0.865], // front bumper, right side
  door: [2.62, 0.74, 0.865], // right front door, under the handle
  roof: [1.75, 1.475, 0], // middle of the roof
  back: [0.17, 0.62, 0.865], // rear bumper, right side
};
/** Which way each point's surface faces (car coordinates), to draw its sticker and lift its trail off the paint. */
export const DOT_NORMALS = { front: [0, 0, 1], door: [0, 0, 1], roof: [0, 1, 0], back: [0, 0, 1] };

/** The point on the front right tyre: its hub, how far out from the wheel's middle plane, its radius, and its
 *  starting angle from the top, turning the way the wheel rolls (π: at the bottom, touching the road). */
export const WHEEL_DOT = { hub: [CAR.rearAxle + CAR.wheelbase, CAR.wheelR, CAR.track / 2], out: 0.105, rho: 0.27, start: Math.PI };

export const clampD = (path, d) => Math.min(D_MAX[path] ?? D_MAX.straight, Math.max(0, Number(d) || 0));

/** Where the rear axle's middle is (x, z on the road) and which way the car points (radians, + = turned left). */
export function pose(path, d) {
  const s = clampD(path, d);
  if (path !== 'turn') return { x: CAR.rearAxle + s, z: 0, heading: 0 };
  const phi = s / TURN_R;
  return { x: CAR.rearAxle + TURN_R * Math.sin(phi), z: -TURN_R + TURN_R * Math.cos(phi), heading: phi };
}

/** A point given in car coordinates, in world coordinates when the car is at pose p. */
export function toWorld(p, [x, y, z]) {
  const dx = x - CAR.rearAxle;
  const c = Math.cos(p.heading);
  const s = Math.sin(p.heading);
  return [p.x + c * dx + s * z, y, p.z - s * dx + c * z];
}

/** Rotates a car-coordinates vector by an angle about the vertical (same sense as the heading). */
function turnY([x, y, z], a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c * x + s * z, y, -s * x + c * z];
}

/** World position of a painted point (or any point given in car coordinates) after the car has gone d. */
export const pointAt = (path, local, d) => toWorld(pose(path, d), local);
export const dotAt = (path, key, d) => pointAt(path, DOTS[key], d);

/** Radius of the circle a point of the car follows round the bend (about the turn centre). */
export function turnRadius([x, , z]) {
  return Math.hypot(x - CAR.rearAxle, z + TURN_R);
}

/** How far a point of the body has travelled along its own path when the car has gone d. Straight: every point
 *  the same; round the bend: each point on its own circle, so farther from the centre means farther. */
export function travelled(path, local, d) {
  const s = clampD(path, d);
  return path === 'turn' ? turnRadius(local) * (s / TURN_R) : s;
}
export const dotDistance = (path, key, d) => travelled(path, DOTS[key], d);

/** True when every painted point of the body has gone the same distance (to a millimetre): translational motion. */
export function allSame(distances) {
  return distances.every((v) => Math.abs(v - distances[0]) < 0.001);
}

/** Steering angles of the front wheels round the bend (Ackermann: both wheels point round the same centre). */
export function steer(path) {
  if (path !== 'turn') return { left: 0, right: 0 };
  return { left: Math.atan(CAR.wheelbase / (TURN_R - CAR.track / 2)), right: Math.atan(CAR.wheelbase / (TURN_R + CAR.track / 2)) };
}

/** How far a wheel has turned (radians) when the car has gone d: the distance its hub rolled ÷ its radius. */
export function wheelTurn(path, hub, d) {
  return travelled(path, hub, d) / CAR.wheelR;
}

/** World position of the point on the front right tyre. Options change the point (radius, start angle). */
export function wheelDotAt(path, d, { rho = WHEEL_DOT.rho, start = WHEEL_DOT.start, out = WHEEL_DOT.out } = {}) {
  const { hub } = WHEEL_DOT;
  const a = start + wheelTurn(path, hub, d);
  // in the wheel: forward and up from the hub; then steered with the wheel, then carried by the car
  const [ox, oy, oz] = turnY([rho * Math.sin(a), rho * Math.cos(a), out], steer(path).right);
  return pointAt(path, [hub[0] + ox, hub[1] + oy, hub[2] + oz], d);
}

/**
 * A point's path sampled every `step` of d, with the length travelled up to each sample (for the trails and the
 * distance of the tyre point, which has no simple formula). fn(d) → [x, y, z].
 */
export function sampleTrail(fn, dMax, step = 0.01) {
  const n = Math.max(1, Math.ceil(dMax / step - 1e-9));
  const points = new Float64Array((n + 1) * 3);
  const lengths = new Float64Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const p = fn(Math.min(dMax, i * step));
    points.set(p, i * 3);
    if (i) lengths[i] = lengths[i - 1] + Math.hypot(p[0] - points[i * 3 - 3], p[1] - points[i * 3 - 2], p[2] - points[i * 3 - 1]);
  }
  return { step, n, dMax, points, lengths };
}

/** The length travelled up to d, read from a sampled trail (linear between samples). */
export function lengthAt(trail, d) {
  const { step, n, dMax, lengths } = trail;
  const x = Math.min(dMax, Math.max(0, d));
  const i = Math.min(n - 1, Math.floor(x / step));
  const d0 = i * step;
  const d1 = Math.min(dMax, (i + 1) * step); // the last step may be shorter
  const k = d1 > d0 ? Math.min(1, (x - d0) / (d1 - d0)) : 1;
  return lengths[i] + (lengths[i + 1] - lengths[i]) * k;
}

/** Rounds without binary leftovers (0.1 + 0.2 → 0.3). */
export const roundTo = (x, step) => {
  const d = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
  return +(Math.round(x / step) * step).toFixed(d);
};
/** A distance as the figure shows it: metres with one decimal. */
export const fmtM = (x) => roundTo(x, 0.1).toFixed(1);
