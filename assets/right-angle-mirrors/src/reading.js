// The optics of the figure, pure functions (unit-tested in test/unit/right-angle-mirrors.test.mjs). Two plane mirrors are
// hinged on a vertical line through O, the origin of the floor. Seen from above, x runs to the right and z toward the viewer,
// and the mirrors open toward the viewer: wing A to the right, wing B to the left, the angle α between them. At α = 180° they
// make one flat mirror; at 90° they are the book's AO and BO, at right angles. The silver of each mirror is a plane through
// the hinge. An image is the object reflected in a chain of mirrors, one after the other, by the transform of each mirror;
// rays are aimed by unfolding, traced with r = d − 2(d·n)n, and the law is read back from the vectors.

const RAD = Math.PI / 180;
export const deg = (r) => r / RAD;
export const round = (x, digits = 2) => {
  const k = 10 ** digits;
  return Math.round((x + Number.EPSILON) * k) / k;
};

/** Each mirror, m: its length from the hinge, and the glass's height above the floor. */
export const WING = { w: 1.7, y0: 0.07, y1: 1.92 };
/** The mirrors as the book's plan shows them (চিত্র ৮.১৫), low and short, so that they read as lines. */
export const PLAN = { w: 1.5, y1: 0.46 };
/** The angle between the mirrors, degrees. */
export const ANGLE = { flat: 180, right: 90, step: 1 };
/** Where the boy stands: in front of the mirrors and a little to one side, so that he hides none of his images. */
export const BOY_AT = { x: -0.3, z: 1.16 };
/** The fist of চিত্র ৮.১৫ on the plan, m along OA and along OB; and the eye that looks into the mirrors. */
export const FIST_AT = { p: 0.82, q: 0.82 };
export const PLAN_EYE = { p: 1.34, q: 0.32 };
export const PLAN_Y = 0.24; // the height of the plan's rays
/** The ray drawn at a readable pace, s: fist → BO, BO → AO, AO → eye, then each dashed line back, one thing at a time. */
export const RAY_PLAY = {
  ray: [
    [0, 1],
    [1.4, 2.4],
    [2.8, 3.8],
  ],
  back: [
    [4.2, 5.2],
    [5.5, 6.5],
  ],
  total: 6.5,
};

/** The two mirrors for an angle α (degrees): each one's direction from the hinge and its normal toward the viewer. */
export function mirrors(alpha) {
  const f = (alpha / 2) * RAD;
  const s = Math.sin(f);
  const c = Math.cos(f);
  return {
    a: { dir: { x: s, z: c }, n: { x: -c, z: s } },
    b: { dir: { x: -s, z: c }, n: { x: c, z: s } },
  };
}
/** The reflection of a point (y stays) in a mirror through O with the normal n. */
export function reflectPoint(p, n) {
  const k = 2 * (p.x * n.x + p.z * n.z);
  return { ...p, x: p.x - k * n.x, z: p.z - k * n.z };
}
/** A point as the chain of mirrors shows it: the light meets chain[0] first. */
export function imageOf(p, chain, alpha) {
  const m = mirrors(alpha);
  let q = p;
  for (const name of chain) q = reflectPoint(q, m[name].n);
  return q;
}
/** The 2 × 2 matrix of a chain on the floor; its determinant is −1 for an odd chain: left and right change places. */
export function chainMatrix(chain, alpha) {
  const e1 = imageOf({ x: 1, z: 0 }, chain, alpha);
  const e2 = imageOf({ x: 0, z: 1 }, chain, alpha);
  return { xx: e1.x, zx: e1.z, xz: e2.x, zz: e2.z };
}
export function handedness(chain, alpha) {
  const m = chainMatrix(chain, alpha);
  return m.xx * m.zz - m.xz * m.zx;
}
/** Which hand the left hand becomes in this chain's image. */
export const handIn = (chain, alpha = ANGLE.right) => (handedness(chain, alpha) > 0 ? 'left' : 'right');

/** A plan point, m along OA and OB, on the floor (at 90°). */
export function planPoint(p, q, alpha = ANGLE.right) {
  const m = mirrors(alpha);
  return { x: p * m.a.dir.x + q * m.b.dir.x, z: p * m.a.dir.z + q * m.b.dir.z };
}
/** The book's name of the quarter a floor point stands in, at 90°: AOB, A′OB, AOB′ or A′OB′. */
export function quarterOf(pt) {
  const m = mirrors(ANGLE.right);
  const p = pt.x * m.a.dir.x + pt.z * m.a.dir.z;
  const q = pt.x * m.b.dir.x + pt.z * m.b.dir.z;
  return `${p >= 0 ? 'A' : 'A′'}O${q >= 0 ? 'B' : 'B′'}`;
}
/** The chains the 90° mirrors make, with the book's names: BO gives A′OB, AO gives AOB′, the two together A′OB′. */
export const IMAGES = [
  { id: 'b', chain: ['b'], quarter: 'A′OB' },
  { id: 'a', chain: ['a'], quarter: 'AOB′' },
  { id: 'ab', chain: ['a', 'b'], quarter: 'A′OB′' },
];
/** At 90° the two orders are the same point: the double image is a half turn about the hinge. */
export const halfTurn = (p) => ({ ...p, x: -p.x, z: -p.z });

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const unit = (v) => {
  const l = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};
/** r = d − 2(d·n)n, for a mirror's normal on the floor. */
export function reflectRay(d, n) {
  const k = 2 * (d.x * n.x + d.z * n.z);
  return { x: d.x - k * n.x, y: d.y, z: d.z - k * n.z };
}
/** The angle between a line along v and the normal n, degrees. */
export const toNormal = (v, n) => deg(Math.acos(Math.min(1, Math.abs(v.x * n.x + v.z * n.z))));

/**
 * The ray that leaves src, meets the chain of mirrors and enters the eye. Aimed by unfolding, then traced by the law: `miss`
 * (at the eye) and `backMiss` (of its last stretch traced back, at the image) are read off the vectors, so they are zero only
 * if the image really is where imageOf says. `via` lists where each stretch seems to come from.
 */
export function trace(src, eye, chain, alpha, w = WING.w, y1 = WING.y1) {
  const m = mirrors(alpha);
  let aim = eye;
  for (let i = chain.length - 1; i >= 0; i--) aim = reflectPoint(aim, m[chain[i]].n);
  let d = unit(sub(aim, src));
  let p = src;
  const points = [src];
  const hits = [];
  chain.forEach((name) => {
    const w0 = m[name];
    const n = { x: w0.n.x, z: w0.n.z };
    const t = -(p.x * n.x + p.z * n.z) / (d.x * n.x + d.z * n.z);
    const hit = { x: p.x + t * d.x, y: p.y + t * d.y, z: p.z + t * d.z, mirror: name };
    hit.along = hit.x * w0.dir.x + hit.z * w0.dir.z;
    const out = reflectRay(d, n);
    hit.thetaI = toNormal(d, n);
    hit.thetaR = toNormal(out, n);
    hit.normal = n;
    hits.push(hit);
    points.push(hit);
    p = hit;
    d = out;
  });
  const toEye = sub(eye, p);
  const across = Math.hypot(toEye.y * d.z - toEye.z * d.y, toEye.z * d.x - toEye.x * d.z, toEye.x * d.y - toEye.y * d.x);
  points.push(eye);
  // each stretch traced back reaches the image made so far
  const via = hits.map((h, i) => {
    const image = imageOf(src, chain.slice(0, i + 1), alpha);
    return { ...image, from: h };
  });
  const image = imageOf(src, chain, alpha);
  const last = hits[hits.length - 1];
  const back = unit(sub(last, image));
  const lineMiss = Math.hypot(back.x - d.x, back.y - d.y, back.z - d.z);
  return {
    points,
    hits,
    via,
    image,
    eye,
    miss: across,
    backMiss: lineMiss,
    onGlass: hits.every((h) => h.along >= 0 && h.along <= w && h.y >= 0 && h.y <= y1),
  };
}
/** The right chain to an eye for the double image, of the two orders: the one that really lands on both mirrors. */
export function doubleRay(src, eye, w = WING.w, y1 = WING.y1) {
  for (const chain of [
    ['b', 'a'],
    ['a', 'b'],
  ]) {
    const r = trace(src, eye, chain, ANGLE.right, w, y1);
    if (r.onGlass) return r;
  }
  return null;
}

/** The handle that folds the mirrors: on mirror A, this far from the hinge and this high. */
export const HANDLE = { along: 1.02, y: 0.42 };
/** Where the handle stands at an angle α; as α runs from 180° to 90° it sweeps an arc round the hinge. */
export function handleAt(alpha) {
  const d = mirrors(alpha).a.dir;
  return { x: d.x * HANDLE.along, y: HANDLE.y, z: d.z * HANDLE.along };
}

/** The fold's angle, whole degrees, caught at both ends. */
export function snapAngle(a) {
  const v = Math.round(a / ANGLE.step) * ANGLE.step;
  const c = Math.min(ANGLE.flat, Math.max(ANGLE.right, v));
  if (Math.abs(c - ANGLE.right) <= 3) return ANGLE.right;
  if (Math.abs(c - ANGLE.flat) <= 3) return ANGLE.flat;
  return c;
}

/** The test's angles: of these only 90° puts an image straight opposite the viewer after an even number of reflections. */
export const ANGLE_CHOICES = [180, 120, 90, 60];
/** The fist's places in the test: at these the four marks stand clear of each other and of the fist. */
export const PLACE_AT = [
  { p: 0.5, q: 1.05 },
  { p: 1.05, q: 0.5 },
  { p: 0.6, q: 1.1 },
  { p: 1.1, q: 0.6 },
];
/** Where A′OB′ may be put, on the plan: the true place, and the mistakes. */
export function placeChoices({ p, q }) {
  return [
    { v: 'true', p: -p, q: -q },
    { v: 'one', p: -p, q },
    { v: 'other', p, q: -q },
    { v: 'swap', p: -q, q: -p },
  ];
}

/** The card in step 2: turned about the vertical so that the real card and the corner one show about 0.87 of their width and the
 * two at the sides about half, with their reversed writing in view (a card square to the corner would be edge-on in them). */
export const CARD_TURN = 30;

/** Fisher–Yates, on a copy. */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
