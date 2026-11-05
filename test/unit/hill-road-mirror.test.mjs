// The optics of the mirror at the bend (assets/hill-road-mirror/src/reading.js): the ray is traced, not drawn by eye.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BEND,
  busEye,
  carEye,
  FOCAL_CONVEX,
  fieldAngle,
  fieldOfView,
  fieldWidthAt,
  imageDistance,
  imageIn,
  inField,
  LANE,
  MIRROR,
  magnification,
  NORMAL,
  path,
  reflect,
  shareOfMirror,
  TANGENT,
  turned,
} from '../../assets/hill-road-mirror/src/reading.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

test('the mirror faces the bend at exactly 45° to both roads', () => {
  near(Math.hypot(NORMAL.x, NORMAL.y, NORMAL.z), 1);
  near(NORMAL.x, NORMAL.z);
  near(NORMAL.x * TANGENT.x + NORMAL.z * TANGENT.z, 0);
});

test('the mirror stands where the two drivers look, just outside the rounded road', () => {
  const centre = Math.hypot(MIRROR.x - BEND.r, MIRROR.z - BEND.r);
  assert.ok(centre > BEND.r + BEND.half + 1, `${centre} m from the arc's centre is beyond the road's edge`);
  for (const nose of [12, 15, 30]) near(carEye(nose).x, MIRROR.x);
  for (const nose of [13, 17, 34]) near(busEye(nose).z, MIRROR.z);
  assert.ok(Math.abs(carEye(15).x + LANE) < BEND.half, 'the car keeps to its lane');
});

test('a ray along one road leaves along the other: turned exactly 90°', () => {
  const out = reflect({ x: -1, y: 0, z: 0 }, NORMAL);
  near(out.x, 0);
  near(out.z, 1);
});

test('the path between the two eyes obeys the law, wherever the bus is', () => {
  for (const bus of [13.5, 17, 25, 34]) {
    const p = path(carEye(15), busEye(bus));
    near(p.thetaI, p.thetaR, 1e-9);
    assert.equal(Math.round(p.thetaI), 45);
    near(p.turn, 90, 0.2);
    near(p.P.x, MIRROR.x, 1e-9);
    near(p.P.z, MIRROR.z, 1e-9);
    assert.ok(Math.abs(p.P.y - MIRROR.y) < MIRROR.radius, 'it strikes the mirror itself');
  }
});

test('the path is the same both ways', () => {
  const a = path(carEye(15), busEye(17));
  const b = path(busEye(17), carEye(15));
  near(a.P.x, b.P.x);
  near(a.P.y, b.P.y);
  near(a.P.z, b.P.z);
  near(a.thetaI, b.thetaR, 1e-9);
});

test('an image is as far behind the mirror as the object in front', () => {
  const p = { x: 4, y: 1, z: 9 };
  const q = imageIn(p, NORMAL);
  const side = (o) => (o.x - MIRROR.x) * NORMAL.x + (o.z - MIRROR.z) * NORMAL.z;
  near(side(q), -side(p));
  near(q.y, p.y);
});

test('turning the mirror by δ turns the ray by 2δ', () => {
  const n = turned(NORMAL, 15);
  const out = reflect({ x: -1, y: 0, z: 0 }, n);
  near((Math.acos(out.z) * 180) / Math.PI, 30, 1e-9);
});

test('the plane mirror shows a narrow strip, its edges meeting at the image of the eye', () => {
  const E = carEye(15);
  const f = fieldOfView(E, false);
  const image = imageIn({ ...E, y: MIRROR.y }, NORMAL);
  for (const e of [f.a, f.b]) {
    // back along the edge ray from the mirror's rim: the eye's image is on that line
    const k = (image.x - e.from.x) / e.dir.x;
    near(e.from.z + e.dir.z * k, image.z, 1e-9);
  }
  assert.ok(fieldAngle(E, false) < 6);
  const w = fieldWidthAt(f, 17);
  assert.ok(w > 2 && w < 3.2, `${w} m`);
});

test('the convex mirror shows far more of the road than the plane one', () => {
  const E = carEye(15);
  const plane = fieldOfView(E, false);
  const convex = fieldOfView(E, true);
  assert.ok(fieldAngle(E, true) > 5 * fieldAngle(E, false));
  assert.ok(fieldWidthAt(convex, 17) > 3 * fieldWidthAt(plane, 17));
  // the CNG in the next lane: outside the plane mirror's strip, inside the convex mirror's
  assert.equal(inField(plane, 13.5, -LANE), false);
  assert.equal(inField(convex, 13.5, -LANE), true);
  // the bus's own eye is in both
  assert.equal(inField(plane, 17.75, MIRROR.z), true);
  assert.equal(inField(convex, 17.75, MIRROR.z), true);
});

test('the mirror formula: 1/u + 1/v = 1/f for the convex mirror', () => {
  near(FOCAL_CONVEX, -MIRROR.rho / 2);
  const v = imageDistance(20, FOCAL_CONVEX);
  near(1 / 20 + 1 / v, 1 / FOCAL_CONVEX);
  assert.ok(v < 0, 'behind the mirror');
  near(v, -2.2222222222, 1e-9);
  near(magnification(20, FOCAL_CONVEX), 1 / 9);
});

test('the bus fills the plane mirror but is small in the convex one', () => {
  const u = 19;
  const e = 15.7;
  assert.ok(shareOfMirror(2.5, u, e, false) > 0.8);
  assert.ok(shareOfMirror(2.5, u, e, true) < 0.25);
});
