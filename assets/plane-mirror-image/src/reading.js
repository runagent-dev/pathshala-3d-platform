// The optics of the figure, pure functions (unit-tested in test/unit/plane-mirror-image.test.mjs). Everything happens in
// the vertical plane through the boy's eye: x runs along the floor toward the mirror, which is the plane x = 0, and y is
// up, in metres. Rays are traced, never drawn from a remembered angle: a mirror point is found from the object's image,
// and the law is then read back from the vectors r = d − 2(d·n)n.

const RAD = Math.PI / 180;
export const deg = (r) => r / RAD;
export const round = (x, digits = 2) => {
  const k = 10 ** digits;
  return Math.round((x + Number.EPSILON) * k) / k;
};

/** The boy of 1.5 m (the book's p221): X the top of his head, Y the toe under his eye. */
export const BOY = {
  H: 1.5, // height, m
  eye: 1.4, // the eye above the floor, m
  g: 0.05, // how far the eye and the toe are ahead of X, m: the top of the head is not quite over the eye
};
export const NORMAL = { x: -1, y: 0 }; // the mirror's normal, toward the boy
export const DIST = { min: 0.5, max: 2, frame: 1.3, step: 0.05, far: 10, start: 1 };
/** How far the mirror's edges can go, m. */
export const EDGE = { low: 0.45, high: 1.6, gap: 0.2, step: 0.01 };
export const FULL = { top: 1.52, bottom: 0.7 }; // the mirror of the first two steps: X's perpendicular lands on it
export const SHORT = { top: 1.3, bottom: 0.92 }; // too short: the student makes it tall enough

/** The points of a boy of height H (his shape scaled from the 1.5 m one) at distance d from the mirror. */
export function points(d, H = BOY.H) {
  const k = H / BOY.H;
  const front = -d + BOY.g * k;
  return { x: { x: -d, y: H }, y: { x: front, y: 0 }, e: { x: front, y: BOY.eye * k } };
}
/** The image of a point: as far behind the plane x = 0 as the point is in front of it. */
export const imageOf = (p) => ({ x: -p.x, y: p.y });

/** Where on the mirror (the height y at x = 0) a ray from a must land to reflect to b: on the line from a's image to b. */
export function mirrorHit(a, b) {
  const i = imageOf(a);
  const s = i.x / (i.x - b.x);
  return i.y + (b.y - i.y) * s;
}
const unit = (x, y) => {
  const l = Math.hypot(x, y);
  return { x: x / l, y: y / l };
};
/** r = d − 2(d·n)n. */
export function reflect(d, n = NORMAL) {
  const k = 2 * (d.x * n.x + d.y * n.y);
  return { x: d.x - k * n.x, y: d.y - k * n.y };
}
/** The angle between a line along v and the mirror's normal, degrees. */
export const toNormal = (v) => deg(Math.atan2(Math.abs(v.y), Math.abs(v.x)));

/**
 * One ray from a, to the mirror at height m, and off it. `out` comes from the law, so `seen` says whether it really
 * reaches the eye e, and `back` where its extension behind the mirror reaches a vertical at x = behind.
 */
export function trace(a, m, e, behind) {
  const din = unit(-a.x, m - a.y);
  const out = reflect(din);
  const hitsEye = Math.abs(m + out.y * (e.x / out.x) - e.y);
  return {
    din,
    out,
    thetaI: toNormal(din),
    thetaR: toNormal(out),
    miss: hitsEye,
    back: m + (out.y / out.x) * behind,
  };
}

/** How much mirror he needs at distance d: the two heights where the rays from X and from Y land. */
export function needed(d, H = BOY.H) {
  const p = points(d, H);
  const top = mirrorHit(p.x, p.e);
  const bottom = mirrorHit(p.y, p.e);
  return { top, bottom, length: top - bottom };
}
/** The same, to the whole centimetre that shows all of him: the mirror is measured in cm. */
export function neededCm(d, H = BOY.H) {
  const n = needed(d, H);
  const top = Math.ceil(n.top * 100 - 1e-9) / 100;
  const bottom = Math.floor(n.bottom * 100 + 1e-9) / 100;
  return { top, bottom, length: round(top - bottom) };
}

/** Whether an edge stands where it must, within a centimetre: 'low' or 'high' when it is past that, doing no work. */
export function edgeAt(which, y, d) {
  const n = neededCm(d);
  const at = which === 'top' ? n.top : n.bottom;
  if (Math.abs(y - at) <= 0.0101) return 'exact';
  return y > at ? 'high' : 'low';
}
/** Whether this mirror is just the length needed. */
export const justEnough = (top, bottom, d) => Math.abs(top - bottom - neededCm(d).length) <= 0.005;

/** Who he sees: head and feet, for a mirror between these heights. */
export function sees(d, top, bottom, H = BOY.H) {
  const n = needed(d, H);
  return { head: top >= n.top - 1e-9, feet: bottom <= n.bottom + 1e-9 };
}

/**
 * The two rays that reach the eye, for this mirror: from X and Y when the mirror is tall enough; when it is too short,
 * from the highest and lowest part of him it can show, by the mirror's own edge.
 */
export function rays(d, top, bottom, H = BOY.H) {
  const p = points(d, H);
  const n = needed(d, H);
  const e = p.e;
  const ray = (src, m, full) => {
    const t = trace(src, m, e, -src.x);
    return { src, m, full, image: imageOf(src), ...t };
  };
  // on the vertical through the eye: the mirror's edge at height m shows the height 2m − eye there
  const headRay = top >= n.top - 1e-9 ? ray(p.x, n.top, true) : ray({ x: e.x, y: Math.max(0, 2 * top - e.y) }, top, false);
  const feetRay = bottom <= n.bottom + 1e-9 ? ray(p.y, n.bottom, true) : ray({ x: e.x, y: Math.min(H, 2 * bottom - e.y) }, bottom, false);
  return { head: headRay, feet: feetRay, eye: e, x: p.x, y: p.y };
}

/** The image's part he sees, as heights on the vertical through X′Y′ (shown as a clean band on the ghost). */
export const seenRange = (top, bottom, eye = BOY.eye) => ({ top: 2 * top - eye, bottom: 2 * bottom - eye });

/** A drag's new distance, on the steps of the readout. */
export function snapDistance(d) {
  const s = DIST.step;
  return round(Math.min(DIST.max, Math.max(DIST.min, Math.round(d / s) * s)));
}
/** A mirror edge on whole centimetres, kept apart from the other edge, and catching the height that shows all of him. */
export function snapEdge(which, y, other, d) {
  const n = neededCm(d);
  let v = which === 'top' ? Math.min(EDGE.high, Math.max(other + EDGE.gap, y)) : Math.max(EDGE.low, Math.min(other - EDGE.gap, y));
  v = round(v);
  const catchAt = which === 'top' ? n.top : n.bottom;
  if (Math.abs(v - catchAt) <= 0.02 && (which === 'top' ? catchAt >= other + EDGE.gap : catchAt <= other - EDGE.gap)) v = catchAt;
  return v;
}

/** Fisher–Yates, on a copy. */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
