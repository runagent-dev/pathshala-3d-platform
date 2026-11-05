// The optics of the figure, pure functions (unit-tested in test/unit/parallel-mirrors.test.mjs). Everything is measured in
// cm along the row: x runs from M₂ to M₁, and y is up from the table. Two mirrors stand face to face, M₂ at x = −15 and M₁ at
// x = +15; the silver on the back of each glass is the reflecting plane. An image is the candle reflected in a chain of
// mirrors, one after the other, and a ray is traced by the law itself: it is aimed by the unfolded picture, then reflected
// with r = d − 2(d·n)n at each mirror, and the law and the miss at the eye are read back from the vectors.

const RAD = Math.PI / 180;
export const round = (x, digits = 2) => {
  const k = 10 ** digits;
  return Math.round((x + Number.EPSILON) * k) / k;
};

/** The two mirrors' planes and the gap between them, cm. */
export const M = { m1: 15, m2: -15, gap: 30 };
/** The glass of each mirror, cm: its height from the table and half its width. */
export const GLASS = { y0: 2, y1: 31, top: 31.8, halfW: 11 };
/** The candle: where it starts, how far it may go, and the height of its flame. */
export const CANDLE = { start: 5, min: -7, max: 7, step: 1, flame: 20, tip: 23.4 };
/** Where the eye looks from, over the nearer mirror's top: at −x for the images behind M₁, +x for those behind M₂. */
export const EYE = { x: 29, y: 36.8 };
/** A silvered glass mirror sends back about 90 % of the light at each reflection (a common round figure). */
export const REFLECTANCE = 0.9;
/** The images the figure draws on each side. */
export const COUNT = 6;
/** The ones the book names and the figure can trace a ray to. */
export const NAMED = 3;

const planeOf = (name) => (name === 'm1' ? M.m1 : M.m2);
/** The reflection of a point on the row in the plane at m. */
export const reflectIn = (x, m) => 2 * m - x;

/**
 * The mirrors the light meets, in order, for the k-th image on a side ('r' behind M₁, 'l' behind M₂). The last one is
 * always that side's own mirror: k = 1 is the candle in that mirror, k = 2 the other mirror's first image in it, and so on.
 */
export function chainOf(side, k) {
  const last = side === 'r' ? 'm1' : 'm2';
  const other = side === 'r' ? 'm2' : 'm1';
  const out = [];
  for (let i = 0; i < k; i++) out.unshift(i % 2 === 0 ? last : other);
  return out;
}
/** Where the k-th image on a side stands: the candle reflected in the chain, mirror by mirror. */
export function imageAt(x, side, k) {
  let p = x;
  for (const m of chainOf(side, k)) p = reflectIn(p, planeOf(m));
  return p;
}
/** All of them, nearest the mirror first: [{ id, side, k, x, flipped }]; odd k is left–right swapped. */
export function row(x, count = COUNT) {
  const out = [];
  for (const side of ['r', 'l'])
    for (let k = 1; k <= count; k++) out.push({ id: `${side}${k}`, side, k, x: imageAt(x, side, k), flipped: k % 2 === 1 });
  return out;
}
/** The book's four distances (চিত্র ৮.০৪): d₁, d₂ from the candle to each mirror, d₃, d₄ from M₁ to the images behind M₂. */
export function distances(x) {
  return {
    d1: M.m1 - x,
    d2: x - M.m2,
    d3: M.m1 - imageAt(x, 'l', 1),
    d4: M.m1 - imageAt(x, 'l', 2),
  };
}
/** How much of the candle's light is left in the k-th image, %. */
export const brightness = (k) => Math.round(100 * REFLECTANCE ** k);

export const snapCandle = (x) => Math.min(CANDLE.max, Math.max(CANDLE.min, Math.round(x / CANDLE.step) * CANDLE.step));

const unit = (x, y) => {
  const l = Math.hypot(x, y);
  return { x: x / l, y: y / l };
};
/** r = d − 2(d·n)n, for the mirrors' normal along x. */
export function reflect(d, n = { x: 1, y: 0 }) {
  const k = 2 * (d.x * n.x + d.y * n.y);
  return { x: d.x - k * n.x, y: d.y - k * n.y };
}
/** The angle between a line along v and the mirrors' normal, degrees. */
export const toNormal = (v) => Math.atan2(Math.abs(v.y), Math.abs(v.x)) / RAD;

/** The eye that looks into a side's mirror: over the top of the other one. */
export const eyeFor = (side) => ({ x: side === 'r' ? -EYE.x : EYE.x, y: EYE.y });

/**
 * The ray that leaves the flame, meets the chain of mirrors and enters the eye. Aimed by unfolding, then traced by the law:
 * `miss` (at the eye) and `backMiss` (of its extension at the image's flame) are read back from the vectors, so they are
 * zero only if the image really is where imageAt says. `via` lists each earlier image the ray seems to come from on the way.
 */
export function path(x, side, k) {
  const eye = eyeFor(side);
  const chain = chainOf(side, k);
  const y0 = CANDLE.flame;
  let aim = eye.x;
  for (let i = k - 1; i >= 0; i--) aim = reflectIn(aim, planeOf(chain[i]));
  let d = unit(aim - x, eye.y - y0);
  let p = { x, y: y0 };
  const points = [p];
  const hits = [];
  for (let i = 0; i < k; i++) {
    const m = planeOf(chain[i]);
    const t = (m - p.x) / d.x;
    const hit = { x: m, y: p.y + t * d.y, mirror: chain[i] };
    const out = reflect(d);
    hit.thetaI = toNormal(d);
    hit.thetaR = toNormal(out);
    // the mirror's normal stays the same: the two angles are measured on either side of it
    hits.push(hit);
    points.push(hit);
    p = hit;
    d = out;
  }
  const atEye = p.y + ((eye.x - p.x) / d.x) * d.y;
  points.push(eye);
  // a ray leaving each mirror, traced back, reaches that stage's image
  const via = hits.map((h, i) => {
    let at = x;
    for (let j = 0; j <= i; j++) at = reflectIn(at, planeOf(chain[j]));
    const next = i + 1 < hits.length ? hits[i + 1] : eye;
    const slope = (next.y - h.y) / (next.x - h.x);
    return { x: at, y: h.y + (at - h.x) * slope, from: h };
  });
  const image = imageAt(x, side, k);
  const near = planeOf(side === 'r' ? 'm2' : 'm1');
  const last = hits[hits.length - 1];
  const clearY = last.y + ((near - last.x) * (eye.y - last.y)) / (eye.x - last.x);
  return {
    points,
    hits,
    eye,
    via,
    image,
    miss: Math.abs(atEye - eye.y),
    backMiss: Math.abs(via[via.length - 1].y - y0),
    onGlass: hits.every((h) => h.y >= GLASS.y0 && h.y <= GLASS.y1),
    clearsNear: clearY > GLASS.top,
  };
}

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
