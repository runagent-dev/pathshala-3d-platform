// The optics of the coin in the cup (book page 246, topic 9.1.1, চিত্র ৯.০৩), kept apart from the 3D so it can be
// unit-tested. Everything is in centimetres, in the upright plane through the eye and the coin (the plane of the rays:
// the eye, the coin's centre, the point where the light leaves the water and the normal there all lie in it, as the
// book's first law says). x runs from the eye's side (−) to the far wall (+), y is up from the table.
//
// The light that reaches the eye leaves the coin, meets the water's surface at S and bends there by the book's second
// law, n₁ sin θ₁ = n₂ sin θ₂ with n₁ = 1.33 (water, table ৯.০১) and n₂ = 1 (air). S is found exactly (the one point on
// the surface from which the bent ray goes straight to the eye). The eye sees the coin if that ray clears the cup's rim.

export const N_WATER = 1.33; // table ৯.০১, water at 20 °C
export const N_AIR = 1; // the book takes air as 1 (1.00029)

/** The cup (a wide tea cup): inner radius, wall, base, the rim's top, the round of the inner bottom corner. */
export const CUP = { ri: 5.2, wall: 0.5, base: 0.6, top: 6.6, fillet: 1.1, rim: 0.16 };
/** The coin: radius and thickness (a 2.4 cm coin). */
export const COIN = { r: 1.2, h: 0.18 };
/** The plane of the rays: the coin lies a little behind the cup's axis, so the cut through the axis shows it whole. */
export const ZP = -1.4;
/** Where the plane of the rays meets the cup's inner wall (x = ±W). */
export const W = Math.sqrt(CUP.ri * CUP.ri - ZP * ZP);
/** The rim's inner edge on the eye's side: the point the eye's line of sight just grazes. */
export const RIM = { x: -W, y: CUP.top };
/** The light starts from the middle of the coin's face. */
export const COIN_TOP = { x: 0, y: CUP.base + COIN.h };
/** The eye: placed, as the book asks, so that the empty cup's rim just hides the whole coin. Moving it along its line
 * of sight changes nothing the student sees happen: the light that just clears the rim is the same. */
export const EYE = { x: -8.7, y: 9.8 };
/** Water levels (y of the surface): an empty cup, and full (0.6 cm below the rim). */
export const LEVEL = { empty: CUP.base, full: CUP.top - 0.6 };

const DEG = 180 / Math.PI;
export const deg = (rad) => rad * DEG;
export const rad = (d) => d / DEG;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** n₁ sin θ₁ = n₂ sin θ₂: θ₂ (degrees) for θ₁ (degrees), or null where no light gets out (total internal reflection). */
export function refractAngle(theta1, n1 = N_WATER, n2 = N_AIR) {
  const s = (n1 / n2) * Math.sin(rad(theta1));
  return Math.abs(s) > 1 ? null : deg(Math.asin(s));
}

/** The eye's line of sight past the rim of the empty cup: from the eye through the rim's edge to where it meets the
 * inside (the bottom, or the far wall). Returns { from, rim, to, hits: 'bottom' | 'wall' }. */
export function sightLine(eye = EYE) {
  const dx = RIM.x - eye.x;
  const dy = RIM.y - eye.y; // < 0: looking down
  // where the line reaches the inner bottom (y = base), and the far wall (x = W)
  const kBottom = (CUP.base - eye.y) / dy;
  const xBottom = eye.x + dx * kBottom;
  if (xBottom <= W) return { from: eye, rim: RIM, to: { x: xBottom, y: CUP.base }, hits: 'bottom' };
  const kWall = (W - eye.x) / dx;
  return { from: eye, rim: RIM, to: { x: W, y: eye.y + dy * kWall }, hits: 'wall' };
}

/** The height (y) at which the straight line from a to b crosses x. */
const yAt = (a, b, x) => a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);

/**
 * The light from a point of the coin (x0 on the coin's face) toward the eye, for a water surface at `level` (y).
 * Returns:
 * - points: the path [coin, S, end] (or [coin, end] with no water): end is the eye, or where the wall stops it;
 * - visible: the light clears the rim and reaches the eye;
 * - water: true if there is water over the coin;
 * - theta1, theta2: the angles with the normal at S (degrees): θ₁ in the water (incidence), θ₂ in air (refraction);
 * - surface: S; depth: the real depth of the coin under the surface; apparent: how deep it looks (see below);
 * - image: the point where the coin appears (on the eye's line, straight back through S);
 * - clearance: how far (cm) the ray passes above the rim (negative: below it, stopped by the wall).
 *
 * How deep it looks: the eye sees the coin straight back along the ray it receives. Seen with two eyes side by side
 * (across the plane of the rays), the rays from one point of the coin meet, traced back, on the upright line through
 * that point, at depth d·tan θ₁ / tan θ₂ (d/n when looking straight down). That is where the coin appears: right above
 * the real one, raised, as the book says ("মনে হবে মুদ্রাটি বুঝি উপরে উঠে এসেছে").
 */
export function trace(level, { eye = EYE, x0 = 0, n = N_WATER } = {}) {
  const C = { x: x0, y: COIN_TOP.y };
  const water = level > C.y + 1e-6;
  if (!water) {
    // straight to the eye: is the rim in the way?
    const yRim = yAt(C, eye, RIM.x);
    const clearance = yRim - RIM.y;
    const visible = clearance > 0;
    const end = visible ? { ...eye } : { x: RIM.x, y: yRim };
    return { points: [C, end], visible, water: false, theta1: null, theta2: null, surface: null, depth: 0, apparent: 0, image: null, clearance };
  }
  const D = level - C.y;
  const H = eye.y - level;
  // S = (xs, level), between the eye and the point straight above the coin: n sin θ₁ = sin θ₂ there
  const f = (xs) => (n * (C.x - xs)) / Math.hypot(C.x - xs, D) - (xs - eye.x) / Math.hypot(xs - eye.x, H);
  let a = eye.x;
  let b = C.x;
  for (let i = 0; i < 64; i++) {
    const m = (a + b) / 2;
    if (f(m) > 0) a = m;
    else b = m;
  }
  const xs = (a + b) / 2;
  const S = { x: xs, y: level };
  const theta1 = deg(Math.atan2(C.x - xs, D));
  const theta2 = deg(Math.atan2(xs - eye.x, H));
  // the water part may meet the wall before the surface (only with the surface beyond the wall: never in this cup)
  let end;
  let clearance;
  if (xs < RIM.x) {
    end = { x: RIM.x, y: yAt(C, S, RIM.x) };
    clearance = Number.NEGATIVE_INFINITY;
    return { points: [C, end], visible: false, water, theta1, theta2, surface: null, depth: D, apparent: 0, image: null, clearance };
  }
  const yRim = yAt(S, eye, RIM.x);
  clearance = yRim - RIM.y;
  const visible = clearance > 0;
  end = visible ? { ...eye } : { x: RIM.x, y: yRim };
  const apparent = theta1 < 1e-6 ? D / n : (D * Math.tan(rad(theta1))) / Math.tan(rad(theta2));
  const image = { x: C.x, y: level - apparent };
  return { points: [C, S, end], visible, water, theta1, theta2, surface: S, depth: D, apparent, image, clearance };
}

/** The lowest water level (y) at which the eye sees the point x0 of the coin (bisection), or null if never below full. */
export function threshold({ eye = EYE, x0 = 0, n = N_WATER, top = LEVEL.full } = {}) {
  if (trace(COIN_TOP.y, { eye, x0, n }).visible) return COIN_TOP.y;
  if (!trace(top, { eye, x0, n }).visible) return null;
  let a = COIN_TOP.y;
  let b = top;
  for (let i = 0; i < 50; i++) {
    const m = (a + b) / 2;
    if (trace(m, { eye, x0, n }).visible) b = m;
    else a = m;
  }
  return b;
}

/** The water's depth (cm, from the inner bottom) for a level y, and back. */
export const depthOf = (level) => clamp(level - CUP.base, 0, LEVEL.full - CUP.base);
export const levelOf = (depth) => clamp(CUP.base + depth, LEVEL.empty, LEVEL.full);

/** One decimal, as a number (5.22 → 5.2): for the panel's readouts. */
export const tenth = (x) => Math.round(x * 10) / 10;
/** Whole degrees. */
export const whole = (x) => Math.round(x);

/** The inner radius of the cup at height y (the round of the bottom corner), for the water's surface. */
export function innerRadius(y) {
  const y0 = CUP.base + CUP.fillet;
  if (y >= y0) return CUP.ri;
  const dy = clamp(y0 - y, 0, CUP.fillet);
  return CUP.ri - CUP.fillet + Math.sqrt(Math.max(0, CUP.fillet * CUP.fillet - dy * dy));
}

/**
 * The test's angle question: light leaving water at θ₁; the answer θ₂ first, then three real mistakes, as whole
 * degrees: n on the wrong side (sin θ₂ = sin θ₁ / n: bent toward the normal), no bending at all, and the angle taken
 * from the surface instead of the normal (90° − θ₂).
 */
export function angleChoices(theta1, n = N_WATER) {
  const right = whole(refractAngle(theta1, n));
  const divided = whole(deg(Math.asin(Math.sin(rad(theta1)) / n)));
  const same = whole(theta1);
  const fromSurface = 90 - right;
  return [
    { key: 'right', v: right },
    { key: 'divided', v: divided },
    { key: 'same', v: same },
    { key: 'surface', v: fromSurface },
  ];
}

/** The water level (y) at which the light that reaches the eye leaves the water at θ₁ (degrees), within the levels at
 * which the eye sees the coin's middle; null if none. θ₁ grows with the level here. */
export function levelForTheta1(theta1, { eye = EYE, n = N_WATER } = {}) {
  let a = threshold({ eye, n });
  let b = LEVEL.full;
  if (a == null) return null;
  const at = (y) => trace(y, { eye, n }).theta1;
  if (theta1 < at(a) || theta1 > at(b)) return null;
  for (let i = 0; i < 50; i++) {
    const m = (a + b) / 2;
    if (at(m) < theta1) a = m;
    else b = m;
  }
  return (a + b) / 2;
}
