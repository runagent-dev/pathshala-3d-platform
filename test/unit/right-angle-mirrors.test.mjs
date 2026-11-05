// The optics of right-angle-mirrors: images as chains of reflections, left and right, the book's quarters, rays traced by the law.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ANGLE,
  ANGLE_CHOICES,
  BOY_AT,
  doubleRay,
  FIST_AT,
  halfTurn,
  HANDLE,
  handedness,
  handIn,
  handleAt,
  IMAGES,
  imageOf,
  mirrors,
  PLACE_AT,
  PLAN,
  PLAN_EYE,
  PLAN_Y,
  placeChoices,
  planPoint,
  quarterOf,
  reflectPoint,
  reflectRay,
  round,
  shuffle,
  snapAngle,
  toNormal,
  trace,
  WING,
} from '../../assets/right-angle-mirrors/src/reading.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

test('at 180° the two mirrors are one flat mirror, and each gives the same image', () => {
  const p = { x: -0.3, y: 1, z: 1.16 };
  const a = imageOf(p, ['a'], 180);
  const b = imageOf(p, ['b'], 180);
  near(a.x, -0.3);
  near(a.z, -1.16);
  near(b.x, a.x);
  near(b.z, a.z);
});

test('at 90° the mirrors are square to each other and the normals lie along the other mirror', () => {
  const m = mirrors(90);
  near(m.a.dir.x * m.b.dir.x + m.a.dir.z * m.b.dir.z, 0);
  near(m.a.n.x, m.b.dir.x);
  near(m.a.n.z, m.b.dir.z);
});

test('a reflection keeps the distance from the hinge and the height, and undoes itself', () => {
  for (const alpha of [90, 100, 135, 180]) {
    const m = mirrors(alpha);
    const p = { x: 0.4, y: 1.2, z: 0.9 };
    const q = reflectPoint(p, m.a.n);
    near(Math.hypot(q.x, q.z), Math.hypot(p.x, p.z));
    near(q.y, p.y);
    const back = reflectPoint(q, m.a.n);
    near(back.x, p.x);
    near(back.z, p.z);
  }
});

test('the image lies as far behind the mirror as the object is in front', () => {
  const m = mirrors(90);
  const p = { x: BOY_AT.x, y: 0, z: BOY_AT.z };
  const q = imageOf(p, ['a'], 90);
  const d0 = p.x * m.a.n.x + p.z * m.a.n.z;
  const d1 = q.x * m.a.n.x + q.z * m.a.n.z;
  assert.ok(d0 > 0);
  near(d1, -d0);
});

test('at 90° the double image is the same either way, a half turn about the hinge', () => {
  const p = { x: BOY_AT.x, y: 1, z: BOY_AT.z };
  const ab = imageOf(p, ['a', 'b'], 90);
  const ba = imageOf(p, ['b', 'a'], 90);
  const h = halfTurn(p);
  for (const q of [ab, ba]) {
    near(q.x, h.x);
    near(q.z, h.z);
    near(q.y, p.y);
  }
});

test('between 90° and 180° the two double images part: there are two, and at 90° they meet', () => {
  const p = { x: BOY_AT.x, y: 1, z: BOY_AT.z };
  assert.ok(dist(imageOf(p, ['a', 'b'], 120), imageOf(p, ['b', 'a'], 120)) > 0.1);
  near(dist(imageOf(p, ['a', 'b'], 90), imageOf(p, ['b', 'a'], 90)), 0);
});

test('one reflection swaps left and right, two keep them: read off the transform itself', () => {
  near(handedness(['a'], 90), -1);
  near(handedness(['b'], 90), -1);
  near(handedness(['a', 'b'], 90), 1);
  near(handedness(['a'], 137), -1);
  near(handedness(['a', 'b'], 137), 1);
  assert.equal(handIn(['a']), 'right');
  assert.equal(handIn(['b']), 'right');
  assert.equal(handIn(['a', 'b']), 'left');
});

test('the book’s quarters: AO gives AOB′, BO gives A′OB, the two together A′OB′', () => {
  const real = planPoint(FIST_AT.p, FIST_AT.q);
  assert.equal(quarterOf(real), 'AOB');
  for (const im of IMAGES) assert.equal(quarterOf(imageOf(real, im.chain, 90)), im.quarter);
  // A′OB′ is the image of either single image in the other mirror, as the book says
  const viaB = imageOf(imageOf(real, ['b'], 90), ['a'], 90);
  const viaA = imageOf(imageOf(real, ['a'], 90), ['b'], 90);
  assert.equal(quarterOf(viaB), 'A′OB′');
  assert.equal(quarterOf(viaA), 'A′OB′');
  near(dist(viaA, viaB), 0);
});

test('r = d − 2(d·n)n keeps a ray’s length and its climb, and the two angles are equal', () => {
  const m = mirrors(90);
  const d = { x: 0.6, y: 0.1, z: -0.79 };
  const r = reflectRay(d, m.a.n);
  near(Math.hypot(r.x, r.y, r.z), Math.hypot(d.x, d.y, d.z));
  near(r.y, d.y);
  near(toNormal(r, m.a.n), toNormal(d, m.a.n));
});

test('every ray of the plan lands on the mirrors, obeys the law, reaches the eye, and comes from its image', () => {
  const src = { ...planPoint(FIST_AT.p, FIST_AT.q), y: PLAN_Y };
  const eye = { ...planPoint(PLAN_EYE.p, PLAN_EYE.q), y: PLAN_Y };
  const rays = [trace(src, eye, ['a'], 90, PLAN.w, PLAN.y1), trace(src, eye, ['b'], 90, PLAN.w, PLAN.y1), doubleRay(src, eye, PLAN.w, PLAN.y1)];
  for (const r of rays) {
    assert.ok(r, 'a ray exists');
    assert.ok(r.onGlass);
    near(r.miss, 0, 1e-9);
    near(r.backMiss, 0, 1e-9);
    for (const h of r.hits) near(h.thetaI, h.thetaR, 1e-9);
  }
  assert.equal(quarterOf(rays[0].image), 'AOB′');
  assert.equal(quarterOf(rays[1].image), 'A′OB');
  assert.equal(quarterOf(rays[2].image), 'A′OB′');
  // at right angles a ray that has met both mirrors goes back the way it came, in plan
  const r = rays[2];
  const first = { x: r.hits[0].x - src.x, z: r.hits[0].z - src.z };
  const last = { x: eye.x - r.hits[1].x, z: eye.z - r.hits[1].z };
  near((first.x * last.z - first.z * last.x) / (Math.hypot(first.x, first.z) * Math.hypot(last.x, last.z)), 0, 1e-9);
  assert.ok(first.x * last.x + first.z * last.z < 0);
});

test('the fold handle stands on mirror A at every angle, on an arc round the hinge', () => {
  for (const alpha of [90, 120, 180]) {
    const h = handleAt(alpha);
    const a = mirrors(alpha).a;
    near(Math.hypot(h.x, h.z), HANDLE.along);
    near(h.x * a.n.x + h.z * a.n.z, 0);
    assert.ok(HANDLE.along < WING.w && HANDLE.y < WING.y1);
  }
});

test('the fold snaps to its ends and goes in whole degrees', () => {
  assert.equal(snapAngle(92.4), 90);
  assert.equal(snapAngle(60), 90);
  assert.equal(snapAngle(178), 180);
  assert.equal(snapAngle(200), 180);
  assert.equal(snapAngle(133.6), 134);
});

test('the test: four different choices, with only one mark at the true place', () => {
  assert.equal(new Set(ANGLE_CHOICES).size, 4);
  assert.ok(ANGLE_CHOICES.includes(ANGLE.right));
  for (const at of PLACE_AT) {
    const c = placeChoices(at);
    assert.equal(new Set(c.map((q) => `${round(q.p)},${round(q.q)}`)).size, 4);
    const real = planPoint(at.p, at.q);
    const t = c.find((q) => q.v === 'true');
    const p = planPoint(t.p, t.q);
    const im = imageOf(real, ['b', 'a'], 90);
    near(p.x, im.x);
    near(p.z, im.z);
  }
});

test('the boy and the fist stand clear of the mirrors at every fold', () => {
  for (let alpha = 90; alpha <= 180; alpha += 5) {
    const m = mirrors(alpha);
    for (const w of [m.a, m.b]) assert.ok(BOY_AT.x * w.n.x + BOY_AT.z * w.n.z > 0.3, `boy at ${alpha}°`);
  }
  assert.ok(WING.y1 > 1.5 + 0.3); // the card, held above his head, stays in the glass
});

test('shuffle keeps every item', () => {
  assert.deepEqual(shuffle([1, 2, 3, 4]).sort(), [1, 2, 3, 4]);
});
