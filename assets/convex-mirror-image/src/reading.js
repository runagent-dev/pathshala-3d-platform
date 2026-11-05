// The optics of the figure, pure functions (unit-tested in test/unit/convex-mirror-image.test.mjs). Everything is in cm in the plane
// of the rays: x runs along the rail from the pole P of the mirror (x = 0) toward the pencil (+x), y is the height above the
// principal axis. The convex mirror's centre O is at x = −r, its focus F near x = −r/2. The book's signs (real is positive): f < 0
// for a convex mirror, a virtual image has v < 0. Each ray is traced with the law itself, r = d − 2(d·n)n, on the exact sphere;
// the image comes from the book's formula 1/u + 1/v = 1/f, and the unit test shows the traced rays really do meet there.

const RAD = Math.PI / 180;
export const round = (x, digits = 2) => {
  const k = 10 ** digits;
  return Math.round((x + Number.EPSILON) * k) / k;
};
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** The chapter's mirror (common.md): r = 30 cm, f = 15 cm; half its width and the thickness of the glass. */
export const R0 = 30;
export const F0 = R0 / 2;
export const MIRROR = { half: 10, thick: 0.7 };
/** The pencil XY stands on the axis, 6 cm tall. Where it may stand, cm from P, and where the figure starts. */
export const PENCIL = 6;
export const U = { min: 4, max: 75, start: 10 };
/** Rays stop before they run into the rail or off the view: this high above the axis, cm. */
export const REACH = 13;
/** The eye and the row of seven tall coloured posts across the bench (topic 8.8.2): x from P, the posts' places in z, their size. */
export const EYE_X = 66;
export const ROW_X = 70;
export const ROW_Z = [-54, -36, -18, 0, 18, 36, 54];
export const POST = { radius: 1.5, top: 36, shoulder: 31 };
/** Where the pencil waits behind the row, out of the way. */
export const AWAY_X = 79;
/** A plane mirror, as the same dish: a sphere so big that its face has no bend. */
export const FLAT_R = 40000;

/** How far the surface at height h stands from the plane through P. */
export const sag = (r, h) => r - Math.sqrt(r * r - h * h);

/** The book's formula with its signs: u > 0, a convex mirror of focal length `f` (given > 0). */
export function imageOf(u, f = F0, l = PENCIL) {
  const v = -(u * f) / (u + f); // 1/v = 1/(−f) − 1/u
  const m = -v / u; // m = l′/l, for sizes
  return { v, m, height: m * l, behind: -v };
}
/** The book's check: 1/u + 1/v − 1/f (with f < 0). Zero if the image is right. */
export const formulaError = (u, v, f = F0) => 1 / u + 1 / v + 1 / f;

/** A simple fraction for m if there is a short one (1/3), otherwise null. */
export function fraction(x, tolerance = 0.002) {
  for (let d = 2; d <= 8; d++) {
    const n = Math.round(x * d);
    if (n > 0 && n < d && Math.abs(n / d - x) < tolerance) return { n, d };
  }
  return null;
}

const unit = (a) => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};
export function reflect(d, n) {
  const k = 2 * (d.x * n.x + d.y * n.y);
  return { x: d.x - k * n.x, y: d.y - k * n.y };
}
/** The outward normal of the convex surface at a point of it. */
export const normalAtPoint = (p, r = R0) => ({ x: (p.x + r) / r, y: p.y / r });

/** The first point where a ray from p along the unit d meets the convex face (sphere of centre (−r, 0)), or null. */
export function hitMirror(p, d, r = R0) {
  const ox = p.x + r;
  const oy = p.y;
  const b = ox * d.x + oy * d.y;
  const c = ox * ox + oy * oy - r * r;
  const q = b * b - c;
  if (q < 0) return null;
  const t = -b - Math.sqrt(q);
  return t < 0 ? null : { x: p.x + d.x * t, y: p.y + d.y * t };
}

/** Where a ray leaving p along u gets to: `far` along it at most, and never beyond the reach above or below the axis. */
function endOf(p, u, far, reach = REACH) {
  let t = far;
  if (u.y > 1e-9) t = Math.min(t, (reach - p.y) / u.y);
  else if (u.y < -1e-9) t = Math.min(t, (-reach - p.y) / u.y);
  return { x: p.x + u.x * Math.max(0, t), y: p.y + u.y * Math.max(0, t) };
}
/** The angles to the normal, degrees. */
function angles(d, n, o) {
  const nl = Math.hypot(n.x, n.y);
  return {
    thetaI: Math.acos(clamp(-(d.x * n.x + d.y * n.y) / nl, -1, 1)) / RAD,
    thetaR: Math.acos(clamp((o.x * n.x + o.y * n.y) / nl, -1, 1)) / RAD,
  };
}
/** The point of the line p + t·u with the given x. */
const atX = (p, u, x) => ({ x, y: p.y + (u.y / u.x) * (x - p.x) });

/**
 * The book's three rays from the point (u, y): each traced on the exact sphere.
 * (i) toward the centre O; (ii) parallel to the axis; (iii) toward the focus F. Each has:
 * start, hit, out (the unit direction after the mirror), end (of the reflected ray), back (where its dashed line behind the mirror
 * ends) and the angles.
 */
export function threeRays(u, y = PENCIL, r = R0) {
  const X = { x: u, y };
  const f = r / 2;
  const { v } = imageOf(u, f, y);
  const make = (name, d0, backOf, far) => {
    const d = unit(d0);
    const hit = hitMirror(X, d, r);
    const n = normalAtPoint(hit, r);
    const o = reflect(d, n);
    return { name, start: X, hit, out: o, end: endOf(hit, o, far), back: backOf(hit, o), ...angles(d, n, o) };
  };
  const toO = make('center', { x: -r - u, y: -y }, () => ({ x: -r, y: 0 }), u + 2);
  // the reflected ray of (i) runs back to X: it ends there
  toO.end = { ...X };
  const para = make(
    'parallel',
    { x: -1, y: 0 },
    (hit, o) => ({ x: hit.x - (hit.y / o.y) * o.x, y: 0 }), // the true crossing of the axis, a shade inside r/2
    Math.max(26, u),
  );
  const toF = make('focus', { x: -f - u, y: -y }, (hit, o) => atX(hit, o, v - 1.6), Math.max(24, u + 5));
  return [toO, para, toF];
}

/** Where two lines meet: a + s·ua, b + t·ub. */
export function meet(a, ua, b, ub) {
  const det = ua.x * ub.y - ua.y * ub.x;
  const s = ((b.x - a.x) * ub.y - (b.y - a.y) * ub.x) / det;
  return { x: a.x + ua.x * s, y: a.y + ua.y * s };
}
/** How far apart the three dashed lines pass from the book's X′: the largest distance, cm. */
export function miss(u, y = PENCIL, r = R0) {
  const { v, height } = imageOf(u, r / 2, y);
  const rays = threeRays(u, y, r);
  const near = { x: v, y: height };
  return Math.max(
    ...rays.map(({ hit, out }) => {
      const dx = near.x - hit.x;
      const dy = near.y - hit.y;
      return Math.abs(dx * out.y - dy * out.x) / Math.hypot(out.x, out.y);
    }),
  );
}

/** Where on the face a 3D eye `c` sees a 3D point `q`: { x, y, z } with y and z from the axis. r: the mirror. */
export function seenAt(c, q, r = R0) {
  let n = { x: 1, y: 0, z: 0 };
  for (let i = 0; i < 60; i++) {
    const p = { x: -r + r * n.x, y: r * n.y, z: r * n.z };
    const a = unit3({ x: c.x - p.x, y: c.y - p.y, z: c.z - p.z });
    const b = unit3({ x: q.x - p.x, y: q.y - p.y, z: q.z - p.z });
    const h = unit3({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
    // half a step at a time: the plain iteration can swing to and fro for a near object
    n = unit3({ x: n.x + h.x, y: n.y + h.y, z: n.z + h.z });
  }
  return { x: -r + r * n.x, y: r * n.y, z: r * n.z };
}
function unit3(a) {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
}

/**
 * What an eye on the axis at (ex, 0) sees in a mirror of radius r, in the plane across the bench (x, z): the two rim rays of the
 * field of view. Returns the rim point, the direction the light comes from, and the half-width of the view at x = rowX.
 */
export function fieldOf(r, ex = EYE_X, rowX = ROW_X, half = MIRROR.half) {
  const rim = { x: -sag(r, half), y: half };
  const d = unit({ x: rim.x - ex, y: rim.y }); // from the eye to the rim
  const n = normalAtPoint(rim, r);
  const o = reflect(d, n);
  return { rim, out: o, halfWidth: rim.y + (o.y / o.x) * (rowX - rim.x), angle: Math.atan2(o.y, o.x) / RAD };
}
/** Which posts of the row the eye sees, whole. */
export const postsSeen = (r, row = ROW_Z) => {
  const w = fieldOf(r).halfWidth;
  return row.filter((z) => Math.abs(z) + POST.radius < w);
};

/** A fair shuffle (the test harness seeds Math.random). */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
