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

/**
 * The build, one tap at a time. A beat is what stands after that many taps; a step (one of the words in the panel) is a run
 * of beats, from the state it starts in to the state it ends in.
 *   0 the candle and M₁   1 x′ in M₁, d₁   2 M₂ comes in, its x′, d₂   3 the right x′ is an object: x″ on the left
 *   4 one ray for that x″   5 the left x′ is an object: x″ on the right, d₃   6 the left x″ is an object: x‴, d₄
 *   7 the row runs on   8 the view into M₁   9 the book's whole picture
 */
export const LAST_BEAT = 9;
export const STEPS = ['one', 'two', 'image', 'again', 'many', 'book'];
const SPAN = { one: [0, 1], two: [1, 2], image: [2, 4], again: [4, 6], many: [6, 8], book: [8, 9] };
/** The beat a step starts in, or that `stage` taps into it. */
export function beatOf(step, stage = 0) {
  const [a, b] = SPAN[step] ?? SPAN.one;
  return Math.min(b, a + Math.max(0, Math.round(Number(stage) || 0)));
}
/** The step a beat belongs to (the one that ended in it, or is under way). */
export const stepOfBeat = (beat) => STEPS.find((id) => beat <= SPAN[id][1]) ?? 'book';
/** The images that stand at a beat, in the order they came. */
export function imagesAt(beat) {
  const out = [];
  if (beat >= 1) out.push('r1');
  if (beat >= 2) out.push('l1');
  if (beat >= 3) out.push('l2');
  if (beat >= 5) out.push('r2');
  if (beat >= 6) out.push('r3');
  if (beat === 7 || beat === 8) for (const q of row(0)) if (!out.includes(q.id)) out.push(q.id);
  return out;
}
/** The images the row adds at beat 7, one after the other along both sides. */
export const ROW_ADDS = ['l3', 'r4', 'l4', 'r5', 'l5', 'r6', 'l6'];
/** Seconds between two of them, and how long each takes to come in. */
export const ROW_GAP = 0.6;
export const ROW_FADE = 1;
/** Each pair of distances at a beat, with the beat that drew it; `e` is the pair round M₂ that the book has no name for. */
const BAR_FROM = { d1: 1, d2: 2, e: 3, d3: 5, d4: 6 };
export function barsAt(beat) {
  if (beat === 7 || beat === 8) return [];
  return Object.keys(BAR_FROM).filter((n) => beat >= BAR_FROM[n] && !(n === 'e' && beat > 4));
}
/** Only the newest pair is at full strength, older ones are faint; the book's whole picture shows them all. */
export const isCurrentBar = (name, beat) => beat === LAST_BEAT || BAR_FROM[name] === beat;
/** How many stacked rows of distances stand at a beat. */
export const barRows = (beat) => (beat >= 6 ? 3 : beat >= 3 ? 2 : beat >= 1 ? 1 : 0);
/** The image that acts as an object at a beat. */
export const OBJECT_AT = { 3: 'r1', 5: 'l1', 6: 'l2' };

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

/** The candle's places in the first test question: at these the four numbers always differ. */
export const PAIR_X = [-6, -3, 3, 5, 7];
/** x to x′ in M₁ (2d₁), and the mistakes: only to the mirror (d₁), the mirrors' gap, twice the distance to the wrong mirror. */
export function pairChoices(x) {
  const { d1, d2 } = distances(x);
  return { answer: 2 * d1, same: d1, gap: M.gap, other: 2 * d2 };
}
/** The count of reflections: the answer and three neighbours, never below one. */
export function timesChoices(k) {
  const low = Math.max(1, k - 2);
  return [low, low + 1, low + 2, low + 3];
}
/** Where x″ can be put behind M₁, cm from it: d₃, and the mistakes. */
export function spotChoices(x) {
  const { d2, d3 } = distances(x);
  return [
    { v: 'd3', at: d3 },
    { v: 'd2', at: d2 },
    { v: 'gap', at: M.gap },
    { v: 'more', at: d3 + M.gap },
  ];
}
/** d₄ and the mistakes; the answer is not always the largest. `alt` picks the last mistake. */
export function sumChoices(x, alt) {
  const { d1, d3, d4 } = distances(x);
  return { answer: d4, d3, two: 2 * M.gap, last: alt ? 3 * M.gap : d4 + d1, lastNote: alt ? 'three' : 'twice' };
}

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
