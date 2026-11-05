// The optics of the figure, pure functions (unit-tested in test/unit/concave-mirror-image.test.mjs). Everything is in cm in the plane
// of the rays: x runs along the rail from the pole P of the mirror (x = 0) toward the pencil (+x), y is the height above the
// principal axis. The concave mirror's centre O is at x = r, its focus F at x = r/2. The book's signs (real is positive): f > 0,
// a virtual image has v < 0. The image comes from the book's formula 1/u + 1/v = 1/f.
//
// The rays are the book's: each lands on the real mirror (a ray that would miss it is not drawn) and goes by the book's rule. A mirror
// 20 cm wide on a 30 cm radius is far too strong for the formula to hold exactly, so a ray traced with the law alone would pass up to
// about 1 cm from X′ (`lawError` measures it, NOTES.md says what is done): each ray here passes exactly through X, F or O and X′.

export const round = (x, digits = 2) => {
  const k = 10 ** digits;
  return Math.round((x + Number.EPSILON) * k) / k;
};
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** The chapter's mirror (common.md): r = 30 cm, f = 15 cm; half its width and the thickness of the glass. */
export const R0 = 30;
export const F0 = R0 / 2;
export const MIRROR = { half: 10, thick: 0.7 };
/** The pencil XY stands on the axis, 6 cm tall. Where it may stand, cm from P, and where the figure starts. It moves by half centimetres. */
export const PENCIL = 6;
export const U = { min: 4, max: 75, start: 40, step: 0.5 };
/** The screen: where it may stand, where it comes in, where it waits when there is nothing to catch; how near counts as sharp, cm. */
export const SCREEN = { min: 6, max: 78, enter: 36, rest: 24, sharp: 0.75 };
/** The paper of the screen, heights above the table and half its width, cm. */
export const CARD = { bottom: 6.4, top: 19.2, half: 4.4 };
/** The book's cases, cm: the words of the panel, in the order the action goes. */
export const CASES = [40, 30, 22.5, 15, 10];
/** The rays stop this far past X′, and this high or low on the bench, cm. */
export const PAST = 9;
export const REACH = { up: 34, down: 18 };

/** How far the surface at height h stands from the plane through P. */
export const sag = (r, h) => r - Math.sqrt(r * r - h * h);

/**
 * The book's formula: where the image of a point at u is. kind: 'real', 'virtual', or 'none' with the pencil exactly at F.
 * m is the book's m = l′/l, a size; `tip` is the height of X′ above the axis: below it when the image is inverted.
 */
export function imageOf(u, f = F0, l = PENCIL) {
  if (u === f) return { kind: 'none', v: Number.POSITIVE_INFINITY, m: Number.POSITIVE_INFINITY, length: Number.POSITIVE_INFINITY, tip: 0, behind: 0 };
  const v = (u * f) / (u - f);
  const m = Math.abs(v / u);
  const real = v > 0;
  return { kind: real ? 'real' : 'virtual', v, m, length: m * l, tip: real ? -m * l : m * l, behind: real ? 0 : -v };
}
/** The book's check: 1/u + 1/v − 1/f. Zero if the image is right. */
export const formulaError = (u, v, f = F0) => 1 / u + 1 / v - 1 / f;

/** The book's table: which row the pencil stands in. */
export function zoneOf(u, f = F0) {
  if (u > 2 * f) return 'far';
  if (u === 2 * f) return 'o';
  if (u > f) return 'between';
  if (u === f) return 'focus';
  return 'inside';
}
/** What the book calls the image in a zone, and the short words beside the image in the 3D: keys for i18n. */
export const NATURE = { far: 'n_far', o: 'n_o', between: 'n_between', focus: 'n_focus', inside: 'n_inside' };
export const PROPS = { far: 'p_far', o: 'p_o', between: 'p_between', focus: 'p_focus', inside: 'p_inside' };

const unit = (a) => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};
export function reflect(d, n) {
  const k = 2 * (d.x * n.x + d.y * n.y);
  return { x: d.x - k * n.x, y: d.y - k * n.y };
}
/** The unit normal of the concave face at a point of it, toward the centre. */
export const normalAtPoint = (p, r = R0) => unit({ x: r - p.x, y: -p.y });

/** Where a ray from p along the unit d, going toward the mirror, meets the concave face (the sphere of centre (r, 0)), or null. */
export function hitMirror(p, d, r = R0) {
  const ox = p.x - r;
  const oy = p.y;
  const b = ox * d.x + oy * d.y;
  const q = b * b - (ox * ox + oy * oy - r * r);
  if (q < 0) return null;
  const t = -b + Math.sqrt(q);
  return t < 0 ? null : { x: p.x + d.x * t, y: p.y + d.y * t };
}
/** The ray really lands on the silver. */
export const lands = (hit) => !!hit && Math.abs(hit.y) <= MIRROR.half - 0.2;

/** Going from p along u: as far as x = xEnd, and never past the reach above or below the axis. */
export function endOf(p, u, xEnd, reach = REACH) {
  let t = Math.abs(u.x) > 1e-9 ? (xEnd - p.x) / u.x : Number.POSITIVE_INFINITY;
  if (t < 0) t = 0;
  if (u.y > 1e-9) t = Math.min(t, (reach.up - p.y) / u.y);
  else if (u.y < -1e-9) t = Math.min(t, (-reach.down - p.y) / u.y);
  return { x: p.x + u.x * t, y: p.y + u.y * t };
}

/** Where the light leaving the mirror at `hit` goes: toward X′ if the image is real, away from X′ if it is virtual, along the beam if none. */
function leaving(hit, img, u, y, r) {
  if (img.kind === 'real') return unit({ x: img.v - hit.x, y: img.tip - hit.y });
  if (img.kind === 'virtual') return unit({ x: hit.x + img.behind, y: hit.y - img.tip });
  return unit({ x: r - u, y: -y }); // at F every ray leaves parallel to the line from X through O
}

/**
 * One of the book's rays from X = (u, y). name: 'parallel' (rule ii), 'focus' (rule iii), 'radial' (rule i) or 'pole' (to P).
 * start, aim (the point F or O it goes through, if any), hit on the mirror, dir after it, end, back (X′ if the image is behind the mirror).
 * null if it cannot be drawn: it misses the mirror, or it does not reach it at all.
 */
export function rayOf(name, u, y = PENCIL, r = R0) {
  const X = { x: u, y };
  const f = r / 2;
  const img = imageOf(u, f, y);
  let hit = null;
  if (name === 'parallel') {
    // the line from the mirror through F and X′
    const d =
      img.kind === 'none'
        ? unit({ x: u - r, y })
        : img.kind === 'real'
          ? unit({ x: f - img.v, y: -img.tip })
          : unit({ x: -img.behind - f, y: img.tip });
    hit = hitMirror({ x: f, y: 0 }, d.y < 0 ? { x: d.x, y: -d.y } : d, r);
  } else if (name === 'pole') {
    hit = { x: 0, y: 0 };
  } else {
    const point = name === 'focus' ? f : r;
    if (u === point) return null; // straight above it: this ray goes nowhere near the mirror
    const d = unit(u > point ? { x: point - u, y: -y } : { x: u - point, y });
    hit = hitMirror(X, d, r);
  }
  if (!lands(hit)) return null;
  const dir = name === 'radial' ? unit({ x: r - hit.x, y: -hit.y }) : leaving(hit, img, u, y, r);
  const xEnd = img.kind === 'real' ? Math.min(img.v + PAST, 80) : Math.max(u + 12, 40);
  const end = img.kind === 'real' && !(img.v < 80) ? endOf(hit, dir, 80) : endOf(hit, dir, xEnd);
  return { name, start: X, hit, dir, end, back: img.kind === 'virtual' ? { x: -img.behind, y: img.tip } : null };
}

/**
 * The second ray at u: the book's choice in each case (চিত্র ৮.২২–৮.২৫) if it lands on the mirror: through F outside F, along the radius
 * inside it; between about 11 and 24 cm neither lands on a mirror this small, and the ray to the pole P takes over.
 */
export function secondRay(u, r = R0) {
  const f = r / 2;
  if (u > f && rayOf('focus', u, PENCIL, r)) return 'focus';
  if (u < f && rayOf('radial', u, PENCIL, r)) return 'radial';
  return 'pole';
}
/** The two rays drawn from X. */
export const twoRays = (u, r = R0) => [rayOf('parallel', u, PENCIL, r), rayOf(secondRay(u, r), u, PENCIL, r)];

/** The light from X after the mirror, between the rims of the mirror: two rays, for the wash between them. */
export function beamOf(u, y = PENCIL, r = R0) {
  const img = imageOf(u, r / 2, y);
  const s = sag(r, MIRROR.half);
  return [MIRROR.half, -MIRROR.half].map((h) => {
    const hit = { x: s, y: h };
    return { hit, dir: leaving(hit, img, u, y, r) };
  });
}

/** How far a drawn ray leaves the law of reflection: the angle between its direction and the true one, degrees. */
export function lawError(ray, r = R0) {
  if (ray.hit.x === 0 && ray.hit.y === 0) return 0;
  const d = unit({ x: ray.hit.x - ray.start.x, y: ray.hit.y - ray.start.y });
  const o = reflect(d, normalAtPoint(ray.hit, r));
  return (Math.abs(Math.atan2(o.x * ray.dir.y - o.y * ray.dir.x, o.x * ray.dir.x + o.y * ray.dir.y)) * 180) / Math.PI;
}

/** What falls on a screen at s: `blur` is how wide (cm) each point spreads, `length` the size of the picture, `sharp` as the eye finds it. */
export function onScreen(s, u, f = F0, l = PENCIL) {
  const D = 2 * MIRROR.half;
  const img = imageOf(u, f, l);
  if (img.kind === 'none') return { blur: D, length: 0, tip: 0, sharp: false, gain: 0.08 };
  const blur = D * Math.abs(1 - s / img.v);
  const k = Math.abs(s / img.v);
  const length = img.length * k;
  const real = img.kind === 'real';
  return {
    blur,
    length,
    tip: real ? -length : length,
    sharp: real && Math.abs(s - img.v) < 0.05,
    gain: real ? (length * length) / (length * length + blur * blur) : 0.06,
  };
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
