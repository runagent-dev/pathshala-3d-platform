// The optics of the figure, pure functions (unit-tested in test/unit/concave-lens-image.test.mjs). Everything is in cm in the plane of
// the rays: x runs along the rail from the lens's centre O (x = 0); the light comes from the left, so the pencil XY stands at x = −u.
// y is the height above the principal axis. The book's F (চিত্র ৯.১৮, ৯.২০) is at x = −f, on the pencil's side; the focus on the other
// side, which rule (iii) aims at, is F′ at x = +f (the sister figure convex-lens-image names it so).
//
// The book finds the image with rays, not with a formula (p258–259). The rules of a thin lens agree exactly with 1/u + 1/v = 1/f (real
// is positive, as in chapter 8 and the sister figure; a concave lens has f = −15 cm, and v comes out negative: the image is on the
// pencil's side). Every ray drawn here goes by the book's rule and passes exactly through X′ (tested). The rays bend once, on the lens's
// middle plane, as the book's own figures draw them.
//
// What the eye sees through the glass is the same thin lens applied to every point behind it (`lensImage`): a point at x < 0 is seen at
// x′ = x·m, y′ = y·m, z′ = z·m with m = f/(f + |x|), the map the shader of bench.js applies to the pencil, its stand, the rail and the table.

export const round = (x, digits = 2) => {
  const k = 10 ** digits;
  return Math.round((x + Number.EPSILON) * k) / k;
};
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** The size of the focal length, cm (the sister convex lens's 15 cm); the lens's f is −F0. */
export const F0 = 15;
/** The glass: half its height, its index (table ৯.০১), its thickness in the middle, cm. */
export const LENS = { half: 7.5, n: 1.52, middle: 0.4 };
/** Each face's radius for a symmetric thin lens of that f: 1/f = (n − 1)(2/R). */
export const R_FACE = 2 * (LENS.n - 1) * F0;
/** How far a sphere of radius r dips in from the plane of its rim at height h. */
export const sag = (r, h) => r - Math.sqrt(r * r - h * h);
/** The thickness of the glass at its edge, cm: a concave lens is thin in the middle and thick at the edge. */
export const EDGE = LENS.middle + 2 * sag(R_FACE, LENS.half);
/** The pencil XY is 6 cm tall (the sister figure's). Where it may stand, cm from O; where the story starts (as চিত্র ৯.২০, F nearer the
 * pencil than the lens; the image 3/7 of the pencil); it moves by whole cm. */
export const PENCIL = 6;
export const U = { min: 4, max: 60, start: 20 };
/** The rays go on this far on the far side; no higher or lower than this (the bundles; the pencil's rays stop sooner, in their frame). */
export const X_END = 34;
export const REACH = { up: 26, down: 15 };
const PENCIL_END = 22;
const PENCIL_REACH = { up: 11.5, down: 12 };

/** The image of a pencil of height h at u: v (signed: negative, on the pencil's side), x (where it stands), m (its size), height. */
export function imageOf(u, h = PENCIL, f = F0) {
  const m = f / (u + f);
  const v = -u * m;
  return { v, x: v, m, height: m * h, behind: -v };
}
/** The check: 1/u + 1/v − 1/f with f = −F0, zero when the image is right. */
export const formulaError = (u, v, f = F0) => 1 / u + 1 / v + 1 / f;

/** Where a point (x < 0, y above the axis, z across) behind the glass is seen through it: the thin lens's map. */
export function lensImage(p, f = F0) {
  const m = f / (f - p.x);
  return { x: p.x * m, y: p.y * m, z: p.z * m, m };
}

const unit = (a) => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};

/** Going from p along d: as far as x = xEnd, and never past the reach above or below the axis. */
export function endOf(p, d, xEnd = X_END, reach = REACH) {
  let t = Math.abs(d.x) > 1e-9 ? (xEnd - p.x) / d.x : Number.POSITIVE_INFINITY;
  if (t < 0) t = 0;
  if (d.y > 1e-9) t = Math.min(t, (reach.up - p.y) / d.y);
  else if (d.y < -1e-9) t = Math.min(t, (-reach.down - p.y) / d.y);
  return { x: p.x + d.x * t, y: p.y + d.y * t };
}

/** A ray really meets the glass, not the ring round it. */
export const lands = (y) => Number.isFinite(y) && Math.abs(y) <= LENS.half - 0.3;

/** After the lens, a ray that met its middle plane at height y spreads as if from F (x = −f, on the axis): rule (ii) and চিত্র ৯.১৮. */
export const fromF = (y, f = F0) => unit({ x: f, y });

/**
 * One of the book's three rays from X = (−u, h) (p258): 'parallel' (rule ii: XP, then PS as if from F), 'centre' (rule i: XO, straight
 * on to T) or 'focal' (rule iii: toward F′, then parallel). start, hit (P, O, or where it meets the middle plane), dir after the lens,
 * end, back (where the dashed line behind the lens goes: F for (ii), X′ for (iii); none for (i), whose own line XT holds X′).
 */
export function rayOf(name, u, h = PENCIL, f = F0) {
  const X = { x: -u, y: h };
  const img = imageOf(u, h, f);
  let hit;
  let dir;
  let back = null;
  if (name === 'parallel') {
    hit = { x: 0, y: h };
    dir = fromF(h, f);
    back = { x: -f, y: 0 };
  } else if (name === 'centre') {
    hit = { x: 0, y: 0 };
    dir = unit({ x: u, y: -h });
  } else {
    hit = { x: 0, y: img.height }; // aimed at F′ = (f, 0): it meets the middle plane at h·f/(u + f), the image's height
    dir = { x: 1, y: 0 };
    back = { x: img.x, y: img.height };
  }
  if (!lands(hit.y)) return null;
  return { name, start: X, hit, dir, end: endOf(hit, dir, PENCIL_END, PENCIL_REACH), back };
}
/** The book's order of teaching (ii), (i), (iii): rays[0] is (ii) XP, rays[1] is (i) XO, rays[2] is (iii) toward F′. */
export const threeRays = (u, h = PENCIL, f = F0) => [rayOf('parallel', u, h, f), rayOf('centre', u, h, f), rayOf('focal', u, h, f)];

/** How far the line of a ray after the lens (or, for the centre ray, the ray itself) passes from X′, cm: zero for every rule. */
export function missOf(ray, u, h = PENCIL, f = F0) {
  const img = imageOf(u, h, f);
  const px = img.x - ray.hit.x;
  const py = img.height - ray.hit.y;
  return Math.abs(px * ray.dir.y - py * ray.dir.x);
}
/** The largest miss of the three rays at u. */
export const miss = (u) => Math.max(...threeRays(u).map((r) => (r ? missOf(r, u) : 0)));

/** চিত্র ৯.১৮: parallel rays at these heights spread as if from F; চিত্র ৯.১৯: rays aimed at F′ leave parallel. */
export const BUNDLE = [-5.6, -2.8, 0, 2.8, 5.6];
export function spreadBundle(f = F0, from = -24) {
  return BUNDLE.map((y) => {
    const hit = { x: 0, y };
    const d = fromF(y, f);
    return { start: { x: from, y }, hit, dir: d, end: endOf(hit, d, 30), back: y === 0 ? null : { x: -f, y: 0 } };
  });
}
export function convergeBundle(f = F0, from = -20) {
  return BUNDLE.map((y) => {
    const start = { x: from, y: (y * (f - from)) / f };
    return { start, hit: { x: 0, y }, dir: { x: 1, y: 0 }, end: { x: 30, y }, aim: { x: f, y: 0 } };
  });
}

/** The test's question on rule (ii): where the parallel ray at height h might go after the lens; 'spread' is the book's. */
export function candidates(h = PENCIL, f = F0) {
  return {
    spread: fromF(h, f),
    gather: unit({ x: f, y: -h }), // to F′: what a convex lens does
    straight: { x: 1, y: 0 },
    back: unit({ x: -f, y: h }), // back to the pencil's side, as from a mirror
  };
}

/** The graph's curves: for each u on the bench, how far the image is from the lens and how tall it is, cm. */
export function curve(from = 0, to = U.max, step = 0.5) {
  const out = [];
  for (let u = from; u <= to + 1e-9; u += step) {
    const img = imageOf(u);
    out.push({ u, v: img.behind, height: img.height });
  }
  return out;
}

/** m as a fraction a student reads: 1/3, 3/5 … when it is one (small denominators only), else null. */
export function fraction(m) {
  for (let d = 2; d <= 12; d++) {
    const n = Math.round(m * d);
    if (n > 0 && n < d && Math.abs(n / d - m) < 1e-9) {
      let a = n;
      let b = d;
      while (b) [a, b] = [b, a % b];
      return { n: n / a, d: d / a };
    }
  }
  return null;
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
