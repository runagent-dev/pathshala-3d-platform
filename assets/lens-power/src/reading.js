// The optics of the figure, pure functions (unit-tested in test/unit/lens-power.test.mjs). Everything is in cm in the plane of the rays:
// x runs along the rail from the lens's centre O (x = 0); the light comes from the left, so the ray box and the pencil XY stand at
// x < 0. y is the height above the principal axis (প্রধান অক্ষ).
//
// The book (9.4.3) defines the power of a lens in words and by its example: P is inversely proportional to the focal length; with f in
// metres, P is in ডায়াপটার: f = 1/P = 1/2.5 m = 0.4 m. A convex lens has a positive power, a concave one a negative power. So here
// the focal length f is always a distance (the book's ফোকাস দূরত্ব, from O to the focus point, as চিত্র ৯.১৮ draws it for a concave
// lens), and the sign of P comes from the kind of lens: P = +1/f for a convex lens, P = −1/f for a concave one.
//
// The lenses and the tracer are the sister figure lens-types' (copied: a shared optics-bench module will come later): two spherical
// faces, rays traced exactly through each face with Snell's law and the book's index of glass, 1.52 (table ৯.০১). Each lens's faces
// are chosen so that its traced focus (of the rays near the axis) lies exactly f from its centre; the ray box's five beams are traced
// through it, so the outer ones cross a few millimetres from F, as real ones do. The pencil's two rays follow the book's thin-lens
// rules (9.4.1, 9.4.2), bending once on the middle plane as the book draws them, as in the sister figure convex-lens-image: they pass
// exactly through X′ (tested).

export const round = (x, digits = 2) => {
  const k = 10 ** digits;
  return Math.round((x + Number.EPSILON) * k) / k;
};
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** The book's refractive index of glass (table ৯.০১), and of air. */
export const N_GLASS = 1.52;
export const N_AIR = 1;
/** Every lens is the sisters' size: 15 cm across; the thin edge of a convex lens and the thin middle of a concave one, cm. */
export const LENS = { half: 7.5, edge: 0.3, middle: 0.6 };
/** The ray box's five holes, cm above the axis (the sisters' ray box). */
export const HOLES = [-2.4, -1.2, 0, 1.2, 2.4];

/**
 * The lenses of the figure: five the student tries (the book's glasses of power 2.5 first), and two more for the test. f in cm.
 * convex: উত্তল, concave: অবতল. half: half the lens's height, if not the sisters' 7.5 cm.
 */
export const LENSES = {
  plus40: { kind: 'convex', f: 40 },
  plus20: { kind: 'convex', f: 20 },
  plus10: { kind: 'convex', f: 10, half: 5 }, // a lens this strong is made smaller: 15 cm across it could not be ground
  minus40: { kind: 'concave', f: 40 },
  minus20: { kind: 'concave', f: 20 },
  plus25: { kind: 'convex', f: 25 },
  minus25: { kind: 'concave', f: 25 },
};

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

/** A symmetric lens of the sisters' kind with faces of curvature c (1/R): convex thick in the middle, concave thin there. */
function shapeOf(kind, c, h = LENS.half) {
  if (kind === 'convex') return makeLens(LENS.edge + 2 * sag(c, h), c, c, h);
  return makeLens(LENS.middle, -c, -c, h);
}
/** The traced focus of a lens from its centre: where rays very near the axis cross it after the lens (behind it for a concave lens: < 0). */
export function focusFrom(L) {
  const xs = [0.2, -0.2].map((y) => {
    const tr = traceLens(L, 0, { x: -40, y }, { x: 1, y: 0 });
    return tr ? axisCrossing(tr.b, tr.out) : Number.NaN;
  });
  return (xs[0] + xs[1]) / 2;
}
const shapes = new Map();
/** The lens id as glass: its faces chosen (by bisection) so that its traced focus is exactly f from its centre. Cached. */
export function lensOf(id) {
  if (shapes.has(id)) return shapes.get(id);
  const { kind, f, half = LENS.half } = LENSES[id];
  const want = kind === 'convex' ? f : -f;
  // a stronger curvature brings the focus nearer; start from the thin-lens radius R = 2(n − 1)f
  let lo = 1 / (2 * (N_GLASS - 1) * f * 3);
  let hi = Math.min(1 / half - 1e-6, 3 / (2 * (N_GLASS - 1) * f));
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const x = focusFrom(shapeOf(kind, mid, half));
    if (Math.abs(x) > Math.abs(want)) lo = mid;
    else hi = mid;
  }
  const L = shapeOf(kind, (lo + hi) / 2, half);
  shapes.set(id, L);
  return L;
}
/** The glass's thickness at the middle and at the edge, cm. */
export const thickness = (id) => ({ middle: thicknessAt(lensOf(id), 0), edge: thicknessAt(lensOf(id), lensOf(id).h) });

/** The power in ডায়াপটার: f in metres; + for a convex lens, − for a concave one. */
export function powerOf(id) {
  const L = LENSES[id];
  return (L.kind === 'convex' ? 1 : -1) / (L.f / 100);
}
/** The focal length in metres (a distance). */
export const metres = (cm) => round(cm / 100, 3);

/** A signed number as the figure writes it: "+2.5", "−5" (U+2212), "0"; digits through num(). */
export function signed(x, num = String, digits = 2) {
  const r = round(x, digits);
  if (r === 0) return num(0);
  return `${r > 0 ? '+' : '−'}${num(Math.abs(r))}`;
}

/** The book's pencil XY, 6 cm (the sister figures' pencil); where it stands in the comparison of চিত্র ৯.২৭ (inside both foci). */
export const PENCIL = 6;
export const PENCIL_U = 12;

/**
 * The image of a pencil of height l at u (cm in front of the lens) through lens id, by the thin-lens rules. kind 'real' (on the far
 * side, inverted), 'virtual' (on the pencil's side, upright) or 'none' (u = f of a convex lens). x is where it stands on the bench,
 * m = |v|/u its size as a multiple, tip the height of X′.
 */
export function imageOf(id, u, l = PENCIL) {
  const { kind, f } = LENSES[id];
  if (kind === 'convex') {
    if (Math.abs(u - f) < 1e-9) return { kind: 'none', x: Number.POSITIVE_INFINITY, m: Number.POSITIVE_INFINITY, tip: 0 };
    const v = (u * f) / (u - f); // real is positive
    const m = Math.abs(v / u);
    const real = v > 0;
    return { kind: real ? 'real' : 'virtual', x: v, m, tip: real ? -m * l : m * l };
  }
  const d = (u * f) / (u + f); // a concave lens: always virtual, between O and F
  const m = d / u;
  return { kind: 'virtual', x: -d, m, tip: m * l };
}
/** The check of the thin-lens rule for a convex lens: 1/u + 1/v − 1/f, zero for a right image (v real-positive). */
export const formulaError = (u, v, f) => 1 / u + 1 / v - 1 / f;

const unit = (a) => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};
/** The rays are followed no farther than these, cm. */
export const REACH = { up: 17, down: 14, right: 60 };
/** Going from p along d as far as x = xEnd, and never past the reach above or below the axis. */
export function endOf(p, d, xEnd, reach = REACH) {
  let t = Math.abs(d.x) > 1e-9 ? (xEnd - p.x) / d.x : Number.POSITIVE_INFINITY;
  if (t < 0) t = 0;
  if (d.y > 1e-9) t = Math.min(t, (reach.up - p.y) / d.y);
  else if (d.y < -1e-9) t = Math.min(t, (-reach.down - p.y) / d.y);
  return { x: p.x + d.x * t, y: p.y + d.y * t };
}

/**
 * The ray box's beams through lens id, traced exactly: for each hole, from the box's plate at x = from: start, where it enters (a) and
 * leaves (b) the glass, its direction out, its end (as far as x = to), and where its line out crosses the axis (`cross`; behind the
 * lens for a concave lens, where the dashed line goes back to). The middle beam goes straight through.
 */
export function beamsOf(id, from, to) {
  const L = lensOf(id);
  return HOLES.map((h) => {
    const start = { x: from, y: h };
    const tr = traceLens(L, 0, start, { x: 1, y: 0 });
    if (!tr) return null;
    const end = endOf(tr.b, tr.out, to);
    const cross = h === 0 ? null : axisCrossing(tr.b, tr.out);
    const back = LENSES[id].kind === 'concave' && cross != null ? { x: cross, y: 0 } : null;
    return { h, start, a: tr.a, b: tr.b, dir: tr.out, end, cross, back };
  }).filter(Boolean);
}
/** Where the rays meet (convex: F′, on the far side) or seem to come from (concave: F, on the light's side): x on the bench. */
export const focusX = (id) => (LENSES[id].kind === 'convex' ? LENSES[id].f : -LENSES[id].f);

/**
 * The book's two rays from X = (−u, h) (চিত্র ৯.২৭, ৯.২০, ৯.২৩): 'parallel' (parallel to the axis; then through F′, or as if from F
 * for a concave lens) and 'centre' (toward O, straight on). Each: start, hit (on the middle plane), dir after the lens, end, and
 * back (X′, when the image is virtual: the dashed line goes back to it).
 */
export function pencilRays(id, u, h = PENCIL, to = null) {
  const { kind, f } = LENSES[id];
  const X = { x: -u, y: h };
  const img = imageOf(id, u, h);
  const xEnd = to ?? (img.kind === 'real' ? img.x + 8 : kind === 'convex' ? f + 6 : 26);
  const back = img.kind === 'virtual' ? { x: img.x, y: img.tip } : null;
  const par = { x: 0, y: h };
  const parDir = kind === 'convex' ? unit({ x: f, y: -h }) : unit({ x: f, y: h });
  const cenDir = unit({ x: u, y: -h });
  const ray = (name, hit, dir) => ({ name, start: X, hit, dir, end: endOf(hit, dir, xEnd), back });
  return [ray('parallel', par, parDir), ray('centre', { x: 0, y: 0 }, cenDir)];
}
/** How far the line of a ray after the lens passes from X′ (cm): zero for the book's rules. */
export function missOf(ray, img) {
  const px = img.x - ray.hit.x;
  const py = img.tip - ray.hit.y;
  return Math.abs(px * ray.dir.y - py * ray.dir.x);
}

/** The graph: P against f. f from 0 to fMax m on the x axis, P from −pMax to +pMax; the curve P = ±1/f is cut where it leaves. */
export const GRAPH = { fMax: 0.5, pMax: 12 };
export function curve(sign, from = 1 / GRAPH.pMax, to = GRAPH.fMax, n = 48) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const f = from + ((to - from) * i) / n;
    out.push({ f, p: sign / f });
  }
  return out;
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

/**
 * The four answers to "what is this lens's power?" for lens id, the right one first, each wrong one a real mistake: f left in cm
 * (1/25 = 0.04), P taken to be f, the sign of the other kind of lens. { key, p } with p in ডায়াপটার.
 */
export function powerChoices(id) {
  const { f } = LENSES[id];
  const p = powerOf(id);
  const s = Math.sign(p);
  return [
    { key: 'right', p },
    { key: 'cm', p: round(s / f, 3) },
    { key: 'f', p: s * f },
    { key: 'sign', p: -p },
  ];
}
