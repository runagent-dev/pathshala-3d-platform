// The optics of the figure, kept apart from the 3D so it can be unit-tested. Everything is in centimetres, in the plane of the
// section through the principal axis: x along the axis (the light goes toward +x), y up from it. A lens is two spherical faces
// (or one face plane) round the axis; rays are traced exactly through each face with Snell's law, n₁ sinθ₁ = n₂ sinθ₂ (book
// 9.1.1), with the book's refractive index of glass, 1.52 (table ৯.০১). Nothing here assumes a thin lens: the figure finds F,
// the shift of a ray and the optical centre from the traced rays themselves.

/** The book's refractive index of glass (table ৯.০১), and of air. */
export const N_GLASS = 1.52;
export const N_AIR = 1;
/** The lenses: half their height (cm), the radius of their faces in the early steps (cm: f = 15 cm with n = 1.52, the lens of the
 * sister figure convex-lens-image), the convex lens's edge (cm). */
export const LENS = { half: 7.5, R: 2 * (1.52 - 1) * 15, edge: 0.3 };
/** The teaching lenses (চিত্র ৯.১৫, ৯.১৭): the radius of their faces (cm), half-height of the small thin one, the concave one's middle (thin, thick). */
export const TEACH = { R: 10, small: 2.5, waist: 0.3, thickWaist: 2.5 };
/** The two lenses' places on the rail while they stand side by side (cm). */
export const SIDE = 11;
/** The ray box's plate (cm), the heights of its five holes above the axis (cm). */
export const BOX_X = -26;
export const HOLES = [-2.4, -1.2, 0, 1.2, 2.4];
/** How far the drawn rays go (cm). */
export const RAY_END = 27;
/** The glass slab (চিত্র ৯.১৬): its thickness range and start (cm), half its height and depth, the laser's angle of incidence. */
export const SLAB = { min: 1, max: 10, start: 8, end: 4, half: 7.5, depth: 0.75, angle: 40 };
/** The ray through the centre of a lens (চিত্র ৯.১৭): its angle to the axis (degrees). */
export const CENTRE_ANGLE = 35;
/** The laser's distance from the point it aims at (cm). */
export const LASER_DIST = 12;

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const round = (x, digits = 1) => {
  const k = 10 ** digits;
  return Math.round(x * k + 1e-9) / k;
};
const rad = (deg) => (deg * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** The sag of a sphere of curvature c (1/radius, signed) at height y: how far the face has left its vertex there. 0 for a plane. */
export function sag(c, y) {
  const q = 1 - c * c * y * y;
  if (q < 0) return Number.NaN;
  return (c * y * y) / (1 + Math.sqrt(q));
}
/** The radius of a sphere through a face of half-height h that sags by s at the rim. */
export const radiusFor = (h, s) => (h * h + s * s) / (2 * s);

/**
 * A lens: centre thickness t, curvatures c1 (left face) and c2 (right face), half-height h. A positive curvature bulges outward
 * (convex), a negative one curves in (concave), 0 is a plane. The left face is x = −t/2 + sag(c1, y), the right x = t/2 − sag(c2, y).
 */
export function makeLens(t, c1, c2, h = LENS.half) {
  return { t, c1, c2, h };
}
export const leftFace = (L, y) => -L.t / 2 + sag(L.c1, y);
export const rightFace = (L, y) => L.t / 2 - sag(L.c2, y);
/** The thickness of the glass at height y (at y = h: the edge). */
export const thicknessAt = (L, y) => rightFace(L, y) - leftFace(L, y);
/** The centres of curvature: of the left face and of the right face (x on the axis; Infinity for a plane). */
export function centres(L) {
  return {
    left: L.c1 === 0 ? Number.POSITIVE_INFINITY : -L.t / 2 + 1 / L.c1,
    right: L.c2 === 0 ? Number.NEGATIVE_INFINITY : L.t / 2 - 1 / L.c2,
  };
}
/** The book's C₁ and C₂: the centres of the left and right circles of চিত্র ৯.১৫ (the left circle makes the RIGHT face of a convex lens). */
export function bookCentres(L) {
  const c = centres(L);
  return { c1: Math.min(c.left, c.right), c2: Math.max(c.left, c.right) };
}

/**
 * The bench lenses of the figure (the lens of convex-lens-image and its concave sister): faces of radius LENS.R, half-height LENS.half.
 * kind: 'convex' | 'concave'. plano (0 … 1) flattens the right face.
 */
export function lensOf(kind, plano = 0) {
  const h = LENS.half;
  const c = (kind === 'convex' ? 1 : -1) / LENS.R;
  const c2 = c * (1 - plano);
  if (kind === 'convex') return makeLens(LENS.edge + sag(c, h) + sag(c2, h), c, c2, h);
  return makeLens(0.6, c, c2, h);
}

/**
 * The teaching lenses of চিত্র ৯.১৫ and ৯.১৭: more strongly curved (faces of radius TEACH.R), as the book draws them. w = 1 is the full,
 * thick lens; as w → 0 the lens gets smaller at the same radius of its faces, so it gets thin but stays plainly convex or concave.
 */
export function teachLens(kind, w = 1) {
  const h = TEACH.small + (LENS.half - TEACH.small) * w;
  const c = (kind === 'convex' ? 1 : -1) / TEACH.R;
  if (kind === 'convex') return makeLens(LENS.edge + 2 * sag(c, h), c, c, h);
  return makeLens(TEACH.waist + (TEACH.thickWaist - TEACH.waist) * w, c, c, h);
}

// ── the tracer: a ray is a point and a unit direction ─────────────────────────────────────────────────────────────

/** Where a ray meets a face: vertex v on the axis, curvature c (sign as for the left face: + bulges toward −x). null if it misses. */
function meetFace(p, d, v, c, side) {
  // side: +1 for a left face (x = v + sag), −1 for a right face (x = v − sag)
  const k = c * side;
  if (Math.abs(k) < 1e-12) {
    if (Math.abs(d.x) < 1e-12) return null;
    const s = (v - p.x) / d.x;
    return s > 1e-9 ? { x: p.x + s * d.x, y: p.y + s * d.y, nx: -1, ny: 0 } : null;
  }
  const R = 1 / k;
  const cx = v + R; // the sphere's centre
  const ox = p.x - cx;
  const oy = p.y;
  const b = ox * d.x + oy * d.y;
  const q = ox * ox + oy * oy - R * R;
  const disc = b * b - q;
  if (disc < 0) return null;
  const r = Math.sqrt(disc);
  // the near half of the sphere: the one round the vertex
  for (const s of [-b - r, -b + r].sort((a, b2) => a - b2)) {
    if (s <= 1e-9) continue;
    const x = p.x + s * d.x;
    const y = p.y + s * d.y;
    if ((x - cx) * (v - cx) <= 0) continue;
    const nx = (x - cx) / Math.abs(R);
    const ny = y / Math.abs(R);
    return { x, y, nx, ny };
  }
  return null;
}

/** Snell's law in vector form. n is any normal of the face; returns the new direction, or null for total internal reflection. */
export function refract(d, n, n1, n2) {
  let nx = n.x;
  let ny = n.y;
  let cosi = -(nx * d.x + ny * d.y);
  if (cosi < 0) {
    nx = -nx;
    ny = -ny;
    cosi = -cosi;
  }
  const eta = n1 / n2;
  const k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  const a = eta * cosi - Math.sqrt(k);
  const x = eta * d.x + a * nx;
  const y = eta * d.y + a * ny;
  const l = Math.hypot(x, y);
  return { x: x / l, y: y / l };
}

/**
 * A ray through a lens placed with its centre at x = at: from p along d. Returns the points it passes (start, the two faces) and
 * its direction out, or null if it misses the glass. The faces' curvature signs follow makeLens.
 */
export function traceLens(L, at, p, d) {
  const a = meetFace({ x: p.x - at, y: p.y }, d, -L.t / 2, L.c1, 1);
  if (!a || Math.abs(a.y) > L.h) return null;
  const d1 = refract(d, { x: a.nx, y: a.ny }, N_AIR, N_GLASS);
  if (!d1) return null;
  const b = meetFace(a, d1, L.t / 2, L.c2, -1);
  if (!b || Math.abs(b.y) > L.h) return null;
  const d2 = refract(d1, { x: b.nx, y: b.ny }, N_GLASS, N_AIR);
  if (!d2) return null;
  return { a: { x: a.x + at, y: a.y }, b: { x: b.x + at, y: b.y }, inside: d1, out: d2 };
}

/** Where a line (point, direction) crosses the axis (x), or null if it runs along it. */
export function axisCrossing(p, d) {
  if (Math.abs(d.y) < 1e-12) return null;
  return p.x - (p.y * d.x) / d.y;
}

/**
 * The parallel light of the ray box through a lens at x = at: for each hole, the ray's start, where it enters and leaves the glass,
 * its end (at x = end), and where its line out crosses the axis (for a concave lens, behind it: the rays extended back).
 */
export function parallelRays(L, at = 0, { from = BOX_X, end = RAY_END, heights = HOLES } = {}) {
  const dir = { x: 1, y: 0 };
  return heights.map((h) => {
    const start = { x: from, y: h };
    const tr = traceLens(L, at, start, dir);
    if (!tr) return { h, start, a: null, b: null, end: { x: end, y: h }, cross: null };
    const s = (end - tr.b.x) / tr.out.x;
    return {
      h,
      start,
      a: tr.a,
      b: tr.b,
      end: { x: end, y: tr.b.y + s * tr.out.y },
      out: tr.out,
      cross: h === 0 ? null : axisCrossing(tr.b, tr.out),
    };
  });
}

/** The focus found from the rays: the mean of where the rays nearest the axis cross it (the near rays: the book's F). */
export function focusFrom(L, at = 0) {
  const rays = parallelRays(L, at, { heights: [0.3, -0.3] });
  const xs = rays.map((r) => r.cross).filter((x) => x != null);
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/**
 * The ray of চিত্র ৯.১৭: through the lens's centre at an angle `angle` (degrees) to the axis, coming down from the upper left. It is
 * the ray whose path INSIDE the glass passes through the middle of the lens (its optical centre): found by trying directions in.
 * Returns the laser's point, the faces, the line out, and the lateral shift (cm) between the line in and the line out.
 */
export function centreRay(L, at = 0, angle = CENTRE_ANGLE, dist = LASER_DIST) {
  // the inside ray through (0, 0) at angle r below the axis; refracted out at both faces. Find r so that the ray in has `angle`.
  const want = rad(angle);
  const solve = (r) => {
    const din = { x: Math.cos(r), y: -Math.sin(r) };
    const back = { x: -din.x, y: -din.y };
    // the inside line meets the left face going back, the right face going on
    const a = meetFace({ x: 0, y: 0 }, back, -L.t / 2, L.c1, 1);
    const b = meetFace({ x: 0, y: 0 }, din, L.t / 2, L.c2, -1);
    if (!a || !b) return null;
    const dIn = refract(back, { x: a.nx, y: a.ny }, N_GLASS, N_AIR); // the light run backward: out of the glass, toward the laser
    const dOut = refract(din, { x: b.nx, y: b.ny }, N_GLASS, N_AIR);
    if (!dIn || !dOut) return null;
    return { a, b, dIn, dOut };
  };
  // dIn here is the direction of the reversed ray leaving to the left: the incoming ray is its opposite
  let lo = 0;
  let hi = Math.asin(1 / N_GLASS) * 0.999;
  let got = null;
  for (let i = 0; i < 36; i++) {
    const mid = (lo + hi) / 2;
    const s = solve(mid);
    if (!s) {
      hi = mid;
      continue;
    }
    const inAngle = Math.atan2(s.dIn.y, -s.dIn.x); // the incoming ray goes −dIn: down to the right; its angle below the axis
    got = s;
    if (inAngle < want) lo = mid;
    else hi = mid;
  }
  if (!got) return null;
  const dIn = { x: -got.dIn.x, y: -got.dIn.y };
  const a = { x: got.a.x + at, y: got.a.y };
  const b = { x: got.b.x + at, y: got.b.y };
  const start = { x: a.x - dIn.x * dist, y: a.y - dIn.y * dist };
  // the shift: the distance from the line out to the line in (the "মূল রশ্মির দিক")
  const ex = b.x - a.x;
  const ey = b.y - a.y;
  const shift = Math.abs(ex * dIn.y - ey * dIn.x);
  return { start, a, b, dIn, dOut: got.dOut, shift, inAngle: deg(Math.atan2(-dIn.y, dIn.x)) };
}

/**
 * The slab of চিত্র ৯.১৬, thickness T, faces upright at x = ±T/2 round x = at, the ray coming down at `angle` (degrees, to the normal)
 * and aimed at the slab's middle: where it enters and leaves, the angle in the glass, and the shift d = T sin(i − r) / cos r.
 */
export function slabRay(T, at = 0, angle = SLAB.angle, dist = LASER_DIST) {
  const i = rad(angle);
  const r = Math.asin(Math.sin(i) / N_GLASS);
  const dIn = { x: Math.cos(i), y: -Math.sin(i) };
  // the ray in, aimed at (at, 0): it meets the left face at x = at − T/2
  const a = { x: at - T / 2, y: (T / 2) * Math.tan(i) };
  const b = { x: at + T / 2, y: a.y - T * Math.tan(r) };
  const start = { x: a.x - dIn.x * dist, y: a.y - dIn.y * dist };
  const shift = (T * Math.sin(i - r)) / Math.cos(r);
  return { start, a, b, dIn, dOut: dIn, r: deg(r), shift };
}
export const slabShift = (T, angle = SLAB.angle) => {
  const i = rad(angle);
  const r = Math.asin(Math.sin(i) / N_GLASS);
  return (T * Math.sin(i - r)) / Math.cos(r);
};

/** A line from p along d, cut where it meets y = floor or x = xMax (whichever comes first). */
export function runTo(p, d, { floor = -Infinity, xMax = Infinity } = {}) {
  let s = Number.POSITIVE_INFINITY;
  if (d.y < 0 && Number.isFinite(floor)) s = Math.min(s, (floor - p.y) / d.y);
  if (d.x > 0 && Number.isFinite(xMax)) s = Math.min(s, (xMax - p.x) / d.x);
  if (!Number.isFinite(s)) s = 30;
  return { x: p.x + s * d.x, y: p.y + s * d.y };
}

export function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
