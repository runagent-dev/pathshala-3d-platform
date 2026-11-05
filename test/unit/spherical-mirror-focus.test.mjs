// The optics of spherical-mirror-focus: every ray traced on the exact sphere, read back against the book's statements.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BULB_H,
  beamKind,
  boxAt,
  beamSpread,
  bulbBundle,
  bulbRay,
  exactCrossing,
  focal,
  focusX,
  heights,
  normalAt,
  parallelBundle,
  parallelRay,
  RADII,
  sag,
  surface,
} from '../../assets/spherical-mirror-focus/src/reading.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} is not ${b}`);

test('every point of the surface is r from the centre, and the normal is along the radius', () => {
  for (const kind of ['concave', 'convex'])
    for (const r of RADII)
      for (const h of [0, 2, 5, 9.6]) {
        const p = surface(kind, r, h);
        const cx = kind === 'convex' ? -r : r;
        near(Math.hypot(p.x - cx, p.y), r);
        const n = normalAt(kind, r, h);
        near(Math.hypot(n.x, n.y), 1);
        // the normal faces the light, which comes from +x
        assert.ok(n.x > 0);
      }
});

test('the law of reflection holds at every hit', () => {
  for (const kind of ['concave', 'convex'])
    for (const r of RADII)
      for (const h of [-9.6, -5, 1, 7]) {
        const ray = parallelRay(kind, r, h);
        near(ray.thetaI, ray.thetaR, 1e-7);
        near(ray.thetaI, (Math.asin(Math.abs(h) / r) * 180) / Math.PI, 1e-7);
      }
});

test('near the axis parallel rays meet at r/2: in front of a concave mirror, behind a convex one', () => {
  for (const r of RADII) {
    near(parallelRay('concave', r, 0.01).cross, r / 2, 1e-5);
    near(parallelRay('convex', r, 0.01).cross, -r / 2, 1e-5);
    near(focusX('concave', r), focal(r));
    near(focusX('convex', r), -focal(r));
  }
});

test('the crossing agrees with the sphere’s exact answer, and the rim rays cross nearer the mirror', () => {
  for (const r of RADII)
    for (const h of [3, 5, 9.6]) {
      near(parallelRay('concave', r, h).cross, exactCrossing(r, h), 1e-9);
      near(parallelRay('convex', r, h).cross, -exactCrossing(r, h), 1e-9);
      assert.ok(exactCrossing(r, h) < r / 2);
    }
  // the book's "কাছাকাছি": for r = 30 the narrow bundle is about 2 mm short of F, the wide one nearly 1 cm
  assert.ok(15 - exactCrossing(30, 5) < 0.22);
  assert.ok(15 - exactCrossing(30, 9.6) > 0.8);
  assert.ok(15 - exactCrossing(30, 9.6) < 1);
});

test('a bundle: five rays, as the book draws, symmetrical, and they stay clear of the rail', () => {
  const hs = heights(5);
  assert.equal(hs.length, 5);
  near(hs[0], -5);
  near(hs[2], 0);
  near(hs[4], 5);
  for (const kind of ['concave', 'convex'])
    for (const r of RADII)
      for (const half of [5, 9.6]) {
        const rays = parallelBundle(kind, r, half);
        for (const ray of rays) assert.ok(Math.abs(ray.end.y) <= 14 + 1e-9);
        near(rays[0].end.y, -rays[4].end.y, 1e-9);
      }
});

test('the convex mirror spreads the light, the concave one gathers it', () => {
  const out = parallelRay('convex', 30, 5);
  assert.ok(out.dir.x > 0 && out.dir.y > 0);
  const inn = parallelRay('concave', 30, 5);
  assert.ok(inn.dir.x > 0 && inn.dir.y < 0);
});

test('a bulb at F: the reflected light comes out parallel (very nearly: exact only near the axis)', () => {
  for (const r of RADII) {
    near(bulbRay(r, r / 2, 0.01).slope, 0, 1e-3);
    assert.ok(Math.abs(beamSpread(r, r / 2)) < 1.1);
    assert.equal(beamKind(r, r / 2), 'parallel');
  }
  for (const ray of bulbBundle(30, 15)) near(ray.thetaI, ray.thetaR, 1e-7);
  assert.equal(bulbBundle(30, 15).length, 5);
  assert.ok(Math.abs(bulbRay(30, 15, BULB_H).slope) < 1.1);
});

test('moved off F the beam is not parallel: nearer the mirror it spreads, beyond F it closes in', () => {
  assert.ok(beamSpread(30, 10) > 5);
  assert.equal(beamKind(30, 10), 'spread');
  assert.ok(beamSpread(30, 22) < -4);
  assert.equal(beamKind(30, 22), 'closing');
});

test('the ray box stands past O, and the light starts from its plate', () => {
  for (const r of RADII) {
    assert.ok(boxAt('concave', r) > r);
    near(parallelRay('concave', r, 3).start.x, boxAt('concave', r));
    near(parallelRay('convex', r, 3).start.x, boxAt('convex', r));
  }
});

test('sag: the mirror is nearly flat when r is large (a plane mirror is one with f = ∞)', () => {
  near(sag(30, 10), 30 - Math.sqrt(800));
  assert.ok(sag(60, 10) < sag(20, 10) / 3);
  assert.ok(sag(1e7, 10) < 1e-5);
});
