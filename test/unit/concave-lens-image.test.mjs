// The optics of concave-lens-image: the image wherever the pencil stands (virtual, upright, smaller, between O and F), the book's three
// rays meeting exactly at X′, the bundles of চিত্র ৯.১৮ and ৯.১৯, the thin lens's map that the glass shows, and the lens's shape.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  candidates,
  convergeBundle,
  curve,
  EDGE,
  F0,
  formulaError,
  fraction,
  imageOf,
  LENS,
  lensImage,
  miss,
  missOf,
  PENCIL,
  R_FACE,
  rayOf,
  spreadBundle,
  threeRays,
  U,
} from '../../assets/concave-lens-image/src/reading.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} is not ${b}`);

test('the image is always virtual, upright, smaller and between the lens and F', () => {
  for (let u = U.min; u <= U.max; u += 0.5) {
    const img = imageOf(u);
    assert.ok(img.v < 0, `virtual (on the pencil's side) at u = ${u}`);
    assert.ok(img.behind > 0 && img.behind < F0, `between O and F at u = ${u}`);
    assert.ok(img.m > 0 && img.m < 1, `upright and smaller at u = ${u}`);
    near(formulaError(u, img.v), 0, 1e-12);
  }
});

test('the row of distances gives tidy numbers', () => {
  const want = { 10: [6, 3 / 5], 15: [7.5, 1 / 2], 20: [60 / 7, 3 / 7], 30: [10, 1 / 3], 60: [12, 1 / 5] };
  for (const [u, [v, m]] of Object.entries(want)) {
    const img = imageOf(Number(u));
    near(img.behind, v, 1e-12);
    near(img.m, m, 1e-12);
    near(img.height, m * PENCIL, 1e-12);
  }
  assert.deepEqual(fraction(1 / 3), { n: 1, d: 3 });
  assert.deepEqual(fraction(3 / 5), { n: 3, d: 5 });
  assert.deepEqual(fraction(3 / 7), { n: 3, d: 7 });
  assert.equal(fraction(0.4291), null);
});

test('the image moves toward F and shrinks as the pencil goes away', () => {
  const pts = curve(0, U.max, 1);
  for (let i = 1; i < pts.length; i++) {
    assert.ok(pts[i].v > pts[i - 1].v);
    assert.ok(pts[i].height < pts[i - 1].height);
  }
  near(pts[0].height, PENCIL);
});

test("each of the book's rays passes exactly through X′", () => {
  for (let u = U.min; u <= U.max; u += 0.5) {
    const rays = threeRays(u);
    assert.equal(rays.length, 3);
    for (const r of rays) {
      assert.ok(r, `every ray meets the glass at u = ${u}`);
      near(missOf(r, u), 0, 1e-9);
    }
    near(miss(u), 0, 1e-9);
  }
});

test('rule (ii) spreads as if from F, rule (i) goes straight, rule (iii) leaves parallel', () => {
  const u = 20;
  const [par, cen, foc] = threeRays(u);
  // (ii): the line back from P goes through F = (−f, 0)
  near(par.hit.y + (par.dir.y / par.dir.x) * (-F0 - par.hit.x), 0);
  assert.deepEqual(par.back, { x: -F0, y: 0 });
  // (i): the direction from X to O is kept
  near(cen.dir.y / cen.dir.x, -PENCIL / u);
  assert.equal(cen.back, null);
  // (iii): aimed at F′ = (f, 0) before the lens, parallel after it, extended back to X′
  near((foc.hit.y - PENCIL) / u, -foc.hit.y / F0);
  assert.deepEqual(foc.dir, { x: 1, y: 0 });
  near(foc.back.x, imageOf(u).x);
  assert.equal(rayOf('parallel', u, 7.4), null); // a ray above the glass is not drawn
});

test('চিত্র ৯.১৮ and ৯.১৯: the bundles', () => {
  for (const r of spreadBundle()) {
    // extended back, every leaving ray meets the axis at F
    near(r.hit.y + (r.dir.y / r.dir.x) * (-F0 - r.hit.x), 0);
  }
  for (const r of convergeBundle()) {
    // the coming ray aims at F′, the leaving one is parallel
    near(r.start.y + ((r.hit.y - r.start.y) / (r.hit.x - r.start.x)) * (F0 - r.start.x), 0);
    assert.equal(r.dir.y, 0);
  }
});

test('the glass shows each point behind it where the thin lens puts its image', () => {
  for (const u of [5, 15, 20, 45]) {
    const tip = lensImage({ x: -u, y: PENCIL, z: 0 });
    const img = imageOf(u);
    near(tip.x, img.x, 1e-12);
    near(tip.y, img.height, 1e-12);
    // a point off the axis sideways is shrunk by the same m
    near(lensImage({ x: -u, y: 0, z: 2 }).z, 2 * img.m, 1e-12);
  }
  // very far behind, it comes to F
  near(lensImage({ x: -1e9, y: 0, z: 0 }).x, -F0, 1e-6);
});

test('the lens: f = −15 cm from n = 1.52, thin in the middle and thick at the edge', () => {
  near(1 / ((LENS.n - 1) * (2 / R_FACE)), F0, 1e-12);
  assert.ok(EDGE > 4 * LENS.middle);
});

test("the test's candidate paths: only one spreads as if from F", () => {
  const c = candidates(PENCIL);
  near(c.spread.y / c.spread.x, PENCIL / F0);
  assert.ok(c.gather.y < 0 && c.gather.x > 0);
  assert.equal(c.straight.y, 0);
  assert.ok(c.back.x < 0);
});
