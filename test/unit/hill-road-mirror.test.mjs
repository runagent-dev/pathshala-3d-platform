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
  LANE,
  MIRROR,
  magnification,
  NORMAL,
  path,
  reflect,
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
  for (const nose of [11, 15, 25]) near(carEye(nose).x, MIRROR.x);
  for (const nose of [12.5, 13.5, 20]) near(busEye(nose).z, MIRROR.z);
  assert.ok(Math.abs(carEye(13).x + LANE) < BEND.half, 'the car keeps to its lane');
});

test('a ray along one road leaves along the other: turned exactly 90°', () => {
  const out = reflect({ x: -1, y: 0, z: 0 }, NORMAL);
  near(out.x, 0);
  near(out.z, 1);
});

test('the path between the two eyes obeys the law, wherever the bus is', () => {
  for (const bus of [12.5, 13.5, 16, 20]) {
    const p = path(carEye(13), busEye(bus));
    near(p.thetaI, p.thetaR, 1e-9);
    assert.equal(Math.round(p.thetaI), 45);
    near(p.turn, 90, 0.2);
    near(p.P.x, MIRROR.x, 1e-9);
    near(p.P.z, MIRROR.z, 1e-9);
    assert.ok(Math.abs(p.P.y - MIRROR.y) < MIRROR.radius, 'it strikes the mirror itself');
  }
});

test('the path is the same both ways', () => {
  const a = path(carEye(13), busEye(13.5));
  const b = path(busEye(13.5), carEye(13));
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
  const n = turned(NORMAL, 20);
  const out = reflect({ x: -1, y: 0, z: 0 }, n);
  near((Math.acos(out.z) * 180) / Math.PI, 40, 1e-9);
});

/** Is a point of the road between the field's two edge rays? */
function within(field, x, z) {
  const side = (e) => e.dir.x * (z - e.from.z) - e.dir.z * (x - e.from.x);
  return side(field.a) * side(field.b) <= 0;
}

test('the plane mirror shows a narrow strip, its edges meeting at the image of the eye', () => {
  const E = carEye(13);
  const f = fieldOfView(E, false);
  const image = imageIn({ ...E, y: MIRROR.y }, NORMAL);
  for (const e of [f.a, f.b]) {
    // back along the edge ray from the mirror's rim: the eye's image is on that line
    const k = (image.x - e.from.x) / e.dir.x;
    near(e.from.z + e.dir.z * k, image.z, 1e-9);
  }
  assert.ok(fieldAngle(E, false) < 8);
  const w = fieldWidthAt(f, 13.5);
  assert.ok(w > 2 && w < 3.5, `${w} m`);
});

test('the convex mirror shows far more of the road than the plane one', () => {
  const E = carEye(13);
  const plane = fieldOfView(E, false);
  const convex = fieldOfView(E, true);
  assert.ok(fieldAngle(E, true) > 4 * fieldAngle(E, false));
  assert.ok(fieldWidthAt(convex, 13.5) > 3 * fieldWidthAt(plane, 13.5));
  // the CNG in the next lane: outside the plane mirror's strip, inside the convex mirror's
  assert.equal(within(plane, 12.3, -LANE), false);
  assert.equal(within(convex, 12.3, -LANE), true);
  // the bus driver's eye is in both
  assert.equal(within(plane, 14.25, MIRROR.z), true);
  assert.equal(within(convex, 14.25, MIRROR.z), true);
});

test('the mirror formula: 1/u + 1/v = 1/f for the convex mirror', () => {
  near(FOCAL_CONVEX, -MIRROR.rho / 2);
  const v = imageDistance(20, FOCAL_CONVEX);
  near(1 / 20 + 1 / v, 1 / FOCAL_CONVEX);
  assert.ok(v < 0, 'behind the mirror');
  near(v, -10 / 3, 1e-9);
  near(magnification(20, FOCAL_CONVEX), 1 / 6);
});
