// The optics of the figure, pure functions (unit-tested in test/unit/spherical-mirror-focus.test.mjs). Everything is in cm in the
// plane of the rays: x runs along the rail from the pole P of the mirror (x = 0) toward the light (+x), y is the height above
// the principal axis. Light comes from +x. A concave mirror's centre O is at x = +r, a convex mirror's at x = −r. Every ray is
// traced with the law itself, r = d − 2(d·n)n, on the exact sphere: nothing here uses the formula f = r/2 to place a ray.

const RAD = Math.PI / 180;
export const round = (x, digits = 2) => {
  const k = 10 ** digits;
  return Math.round((x + Number.EPSILON) * k) / k;
};
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** The radii the student can choose, cm, and where the figure starts (common.md: f = 15 cm, r = 30 cm). */
export const RADII = [20, 30, 40, 60];
export const R0 = 30;
/** The mirror: half its width and the thickness of the glass, cm. */
export const MIRROR = { half: 10, thick: 0.7 };
/** The ray box's hole plate on the rail, cm: it stands just past O in front of a concave mirror, so that the source stays in view. */
export const boxAt = (kind, r) => (kind === 'convex' ? 30 : r + 12);
/** The bundles of parallel rays: half their height, cm. The narrow one is what the book's picture draws. */
export const BUNDLE = { narrow: 5, wide: 9.6, count: 5 };
/** Rays stop before they would run into the rail: at this height above or below the axis, cm. */
export const REACH = 14;
/** Where a ray from the bulb lands on the mirror, at most, cm. */
export const BULB_H = 8;

export const focal = (r) => r / 2;
/** How far the surface at height h stands from the plane through P. */
export const sag = (r, h) => r - Math.sqrt(r * r - h * h);
/** Signed x of the centre O and of the focus F: + in front of the mirror (concave), − behind it (convex). */
export const centreX = (kind, r) => (kind === 'convex' ? -r : r);
export const focusX = (kind, r) => (kind === 'convex' ? -r / 2 : r / 2);
/** The point of the mirror at height h. */
export const surface = (kind, r, h) => ({ x: kind === 'convex' ? -sag(r, h) : sag(r, h), y: h });
/** The unit normal at that point, on the side the light comes from. */
export function normalAt(kind, r, h) {
  const p = surface(kind, r, h);
  const cx = centreX(kind, r);
  const k = kind === 'convex' ? 1 : -1; // from the centre for a convex mirror, toward it for a concave one
  return { x: (k * (p.x - cx)) / r, y: (k * p.y) / r };
}
export function reflect(d, n) {
  const k = 2 * (d.x * n.x + d.y * n.y);
  return { x: d.x - k * n.x, y: d.y - k * n.y };
}
/** Angles to the normal, degrees: the incoming ray (reversed) and the reflected one. */
function angles(d, n, u) {
  const i = Math.acos(clamp(-(d.x * n.x + d.y * n.y), -1, 1)) / RAD;
  const o = Math.acos(clamp(u.x * n.x + u.y * n.y, -1, 1)) / RAD;
  return { thetaI: i, thetaR: o };
}
/** Where the line through p along u meets the axis (x), or null if it runs along or beside it. */
function axisCrossing(p, u) {
  if (Math.abs(u.y) < 1e-9) return null;
  return p.x - (p.y / u.y) * u.x;
}
/** The point of p + t·u, t ≥ 0, that is `xEnd` along the rail, or as far as the reach above or below the axis if that is nearer. */
function endOf(p, u, xEnd, reach = REACH) {
  let t = Math.abs(u.x) > 1e-9 ? (xEnd - p.x) / u.x : Number.POSITIVE_INFINITY;
  if (t < 0) t = 0;
  if (u.y > 1e-9) t = Math.min(t, (reach - p.y) / u.y);
  else if (u.y < -1e-9) t = Math.min(t, (-reach - p.y) / u.y);
  return { x: p.x + u.x * t, y: p.y + u.y * t };
}

/** One ray parallel to the axis at height h, from the ray box to the mirror and away. */
export function parallelRay(kind, r, h, { from = boxAt(kind, r), xEnd = null } = {}) {
  const hit = surface(kind, r, h);
  const d = { x: -1, y: 0 };
  const n = normalAt(kind, r, h);
  const u = reflect(d, n);
  const cross = h === 0 ? focusX(kind, r) : axisCrossing(hit, u);
  const end = endOf(hit, u, xEnd ?? (kind === 'convex' ? from - 3 : r * 0.96));
  return { h, start: { x: from, y: h }, hit, end, dir: u, cross, ...angles(d, n, u) };
}
/** Heights of the rays in a bundle of half-height `half`. */
export function heights(half, count = BUNDLE.count) {
  const m = (count - 1) / 2;
  return Array.from({ length: count }, (_, i) => (half * (i - m)) / m);
}
export const parallelBundle = (kind, r, half, opts) => heights(half).map((h) => parallelRay(kind, r, h, opts));

/** The sphere's exact answer: where the reflected ray from height h crosses the axis: r − r/(2 cos θ), sin θ = h/r. */
export function exactCrossing(r, h) {
  const c = Math.sqrt(1 - (h * h) / (r * r));
  return r - r / (2 * c);
}

/** A ray from a bulb on the axis at x = bx to the concave mirror at height h, and away toward the room. */
export function bulbRay(r, bx, h, xEnd = 90) {
  const hit = surface('concave', r, h);
  const l = Math.hypot(hit.x - bx, hit.y);
  const d = { x: (hit.x - bx) / l, y: hit.y / l };
  const n = normalAt('concave', r, h);
  const u = reflect(d, n);
  // the slope away from the axis, degrees: + spreading, − closing in
  const slope = (Math.atan2(u.y, u.x) / RAD) * Math.sign(h || 1);
  return { h, start: { x: bx, y: 0 }, hit, end: endOf(hit, u, xEnd, 200), dir: u, slope, ...angles(d, n, u) };
}
export const bulbBundle = (r, bx, xEnd) => heights(BULB_H).map((h) => bulbRay(r, bx, h, xEnd));
/** How the beam leaves, from its outermost ray but one: the angle of that ray to the axis, degrees. */
export function beamSpread(r, bx) {
  return bulbRay(r, bx, BULB_H / 2).slope;
}
/** Where a bulb may stand, cm from P, and how near F it counts as at F. */
export const bulbRange = (r) => ({ min: r * 0.2, max: r * 0.85, snap: 0.5 });
/** 'parallel' at F, 'spread' nearer the mirror, 'closing' farther from it. */
export function beamKind(r, bx) {
  const off = bx - focal(r);
  if (Math.abs(off) < 0.26) return 'parallel';
  return off < 0 ? 'spread' : 'closing';
}

/** A fair shuffle (the test harness seeds Math.random). */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
