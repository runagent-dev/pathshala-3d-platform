// The optics of the figure, pure functions (unit-tested in test/unit/convex-lens-image.test.mjs). Everything is in cm in the plane of
// the rays: x runs along the rail from the lens's centre O (x = 0); the light comes from the left, so the pencil XY stands at x = −u
// and a real image forms at x = +v on the other side. y is the height above the principal axis. F is at x = −f, F′ at x = +f.
//
// The image comes from the thin-lens formula 1/u + 1/v = 1/f with the chapter's signs (real is positive, as in chapter 8): a virtual
// image has v < 0 and so stands at x = v, on the pencil's own side. The book gives no lens formula in 9.4.2: it finds the image with
// three rays (p260). Those rules of a thin lens agree exactly with the formula, so every ray drawn here goes by the book's rule and
// passes exactly through X′ (tested). The rays bend once, on the lens's middle plane, as the book's own figures draw them.

export const round = (x, digits = 2) => {
  const k = 10 ** digits;
  return Math.round((x + Number.EPSILON) * k) / k;
};
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** The lens: f = 15 cm (the chapter's focal length, as the concave mirror of chapter 8), half its height, the glass's index (table ৯.০১). */
export const F0 = 15;
export const LENS = { half: 7.5, n: 1.52, edge: 0.3 };
/** Each face's radius for a symmetric thin lens of that f: 1/f = (n − 1)(2/R). */
export const R_FACE = 2 * (LENS.n - 1) * F0;
/** How far a sphere of radius r stands out from the plane of its rim at height h. */
export const sag = (r, h) => r - Math.sqrt(r * r - h * h);
/** The thickness of the glass at the middle, cm. */
export const THICK = LENS.edge + 2 * sag(R_FACE, LENS.half);
/** The pencil XY is 6 cm tall (the sister figure's). Where it may stand, cm from O; where the figure starts; it moves by half centimetres. */
export const PENCIL = 6;
export const U = { min: 4, max: 60, start: 30, step: 0.5 };
/** The screen, on the other side: where it may stand, where it comes in, where it waits with nothing to catch; how near counts as sharp. */
export const SCREEN = { min: 6, max: 78, enter: 42, rest: 26, sharp: 0.75 };
/** The paper of the screen: heights above the table, and half its width, cm. */
export const CARD = { bottom: 6.6, top: 23.4, half: 5 };
/** The book's cases, cm, in the book's order (inside F, F–2F, at 2F, beyond 2F): the words of the panel. Inside F at 9 cm, so the
 * virtual image (22.5 cm) does not sit on 2F. */
export const CASES = [9, 22.5, 30, 45];
/** The উদাহরণ's pair when the student's own place makes no real swap: the pencil at 45 cm, its image at 22.5 cm. */
export const SWAP = { a: 45, b: 22.5 };
/** The rays go on this far past X′; the light is followed no farther than this on either side, and no higher or lower. */
export const PAST = 9;
export const X_END = 80;
export const REACH = { up: 32, down: 17 };

/** The image of a pencil of height l at u. kind: 'real', 'virtual', or 'none' at F. m = |v/u| is a size; tip is the height of X′. */
export function imageOf(u, f = F0, l = PENCIL) {
  if (u === f) return { kind: 'none', v: Number.POSITIVE_INFINITY, m: Number.POSITIVE_INFINITY, length: Number.POSITIVE_INFINITY, tip: 0 };
  const v = (u * f) / (u - f);
  const m = Math.abs(v / u);
  const real = v > 0;
  return { kind: real ? 'real' : 'virtual', v, m, length: m * l, tip: real ? -m * l : m * l };
}
/** The check: 1/u + 1/v − 1/f, zero when the image is right. */
export const formulaError = (u, v, f = F0) => 1 / u + 1 / v - 1 / f;

/** Where the pencil stands, in the book's words: inside F, at F, between F and 2F, at 2F, beyond 2F. */
export function zoneOf(u, f = F0) {
  if (u < f) return 'inside';
  if (u === f) return 'focus';
  if (u < 2 * f) return 'between';
  if (u === 2 * f) return 'two';
  return 'far';
}
/** i18n keys: what the book calls the image in each zone (panel), and the short words beside the image (3D). */
export const NATURE = { inside: 'n_inside', focus: 'n_focus', between: 'n_between', two: 'n_two', far: 'n_far' };
export const PROPS = { inside: 'p_inside', focus: 'p_focus', between: 'p_between', two: 'p_two', far: 'p_far' };

const unit = (a) => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};

/** Going from p along d: as far as x = xEnd, and never past the reach above or below the axis. */
export function endOf(p, d, xEnd, reach = REACH) {
  let t = Math.abs(d.x) > 1e-9 ? (xEnd - p.x) / d.x : Number.POSITIVE_INFINITY;
  if (t < 0) t = 0;
  if (d.y > 1e-9) t = Math.min(t, (reach.up - p.y) / d.y);
  else if (d.y < -1e-9) t = Math.min(t, (-reach.down - p.y) / d.y);
  return { x: p.x + d.x * t, y: p.y + d.y * t };
}

/** The height at which the ray through F (or from F's direction) meets the lens's middle plane. */
export const focalHeight = (u, h = PENCIL, f = F0) => (-h * f) / (u - f);
/** A ray really meets the glass, not the ring round it. */
export const lands = (y) => Number.isFinite(y) && Math.abs(y) <= LENS.half - 0.3;

/**
 * One of the book's three rays from X = (−u, h) (p260): 'parallel' (rule ii: parallel to the axis, then through F′), 'centre' (rule i:
 * toward O, straight on) or 'focal' (rule iii: through F, then parallel). start, hit (on the middle plane), dir after the lens, end,
 * back (X′, if the image is virtual: the dashed line goes back to it). null if the ray cannot be drawn (it misses the glass, or X is at F).
 */
export function rayOf(name, u, h = PENCIL, f = F0) {
  const X = { x: -u, y: h };
  const img = imageOf(u, f, h);
  let hit;
  let dir;
  if (name === 'parallel') {
    hit = { x: 0, y: h };
    dir = unit({ x: f, y: -h });
  } else if (name === 'centre') {
    hit = { x: 0, y: 0 };
    dir = unit({ x: u, y: -h });
  } else {
    if (u === f) return null;
    const y = focalHeight(u, h, f);
    if (!lands(y)) return null;
    hit = { x: 0, y };
    dir = { x: 1, y: 0 };
  }
  if (!lands(hit.y)) return null;
  const xEnd = img.kind === 'real' ? Math.min(img.v + PAST, X_END) : Math.min(Math.max(32, f * 2), X_END);
  const end = endOf(hit, dir, xEnd);
  const back = img.kind === 'virtual' ? { x: img.v, y: img.tip } : null;
  return { name, start: X, hit, dir, end, back };
}
/** The two rays the book draws in each case (চিত্র 9.23–৯.২৬): the parallel one and the one through O. */
export const twoRays = (u, h = PENCIL, f = F0) => [rayOf('parallel', u, h, f), rayOf('centre', u, h, f)];
/** All three rules, as the step that teaches them draws them (the third only where it meets the glass). */
export const threeRays = (u, h = PENCIL, f = F0) => [...twoRays(u, h, f), rayOf('focal', u, h, f)];

/** Where a ray leaves the lens's middle plane at height y, from a point source at X = (−u, h): toward X′, away from it, or parallel. */
export function leaving(y, u, h = PENCIL, f = F0) {
  const img = imageOf(u, f, h);
  if (img.kind === 'real') return unit({ x: img.v, y: img.tip - y });
  if (img.kind === 'virtual') return unit({ x: -img.v, y: y - img.tip });
  return unit({ x: u, y: -h }); // at F every ray leaves parallel to the one through O
}
/** The light from X through the whole lens: its two rims, for the wash of light between them. */
export function beamOf(u, h = PENCIL, f = F0) {
  return [LENS.half, -LENS.half].map((y) => ({ hit: { x: 0, y }, dir: leaving(y, u, h, f) }));
}

/** চিত্র ৯.২১: rays parallel to the axis at these heights meet at F′; চিত্র ৯.২২: rays from a point at F leave parallel. */
export const BUNDLE = [-5.6, -2.8, 0, 2.8, 5.6];
export function parallelBundle(f = F0, from = -26, to = 30) {
  return BUNDLE.map((y) => {
    const d = unit({ x: f, y: -y });
    return { start: { x: from, y }, hit: { x: 0, y }, dir: d, end: endOf({ x: 0, y }, d, to) };
  });
}
export function pointBundle(f = F0, to = 30) {
  return BUNDLE.map((y) => ({ start: { x: -f, y: 0 }, hit: { x: 0, y }, dir: { x: 1, y: 0 }, end: { x: to, y } }));
}

/** How far the line of a drawn ray, after the lens, passes from X′ (cm): zero for every ray of the book's rules. */
export function missOf(ray, u, h = PENCIL, f = F0) {
  const img = imageOf(u, f, h);
  if (img.kind === 'none') return 0;
  const px = img.v - ray.hit.x;
  const py = img.tip - ray.hit.y;
  return Math.abs(px * ray.dir.y - py * ray.dir.x);
}

/** What falls on a screen at s (x > 0): how wide (cm) each point spreads, the size of the picture, whether it is sharp, how bright. */
export function onScreen(s, u, f = F0, l = PENCIL) {
  const D = 2 * LENS.half;
  const img = imageOf(u, f, l);
  if (img.kind === 'none') return { blur: D, length: 0, tip: 0, sharp: false, gain: 0.08 };
  const blur = D * Math.abs(1 - s / img.v);
  const length = img.length * Math.abs(s / img.v);
  const real = img.kind === 'real';
  return {
    blur,
    length,
    tip: real ? -length : length,
    sharp: real && Math.abs(s - img.v) < 0.05,
    gain: real ? (length * length) / (length * length + blur * blur) : 0.06,
  };
}

/** The graph's curve: v for each u on the bench (null at F), the points of the two branches. */
export function curve(f = F0, from = U.min, to = U.max, step = 0.25) {
  const out = [];
  for (let u = from; u <= to + 1e-9; u += step) out.push({ u, v: u === f ? null : (u * f) / (u - f) });
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
