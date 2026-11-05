// The optics of parallel-mirrors: images as chains of reflections, the book's distances, rays traced by the law.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  brightness,
  CANDLE,
  chainOf,
  COUNT,
  distances,
  GLASS,
  imageAt,
  M,
  NAMED,
  path,
  reflect,
  reflectIn,
  row,
  shuffle,
  snapCandle,
  toNormal,
} from '../../assets/parallel-mirrors/src/reading.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} is not ${b}`);
const places = [];
for (let x = CANDLE.min; x <= CANDLE.max; x += CANDLE.step) places.push(x);

test('the mirrors are parallel and 30 cm apart, the candle stays between them', () => {
  assert.equal(M.m1 - M.m2, M.gap);
  assert.ok(CANDLE.min > M.m2 && CANDLE.max < M.m1);
  assert.equal(snapCandle(99), CANDLE.max);
  assert.equal(snapCandle(-99), CANDLE.min);
  assert.equal(snapCandle(2.4), 2);
});

test('a chain alternates and ends in the mirror of its side', () => {
  assert.deepEqual(chainOf('r', 1), ['m1']);
  assert.deepEqual(chainOf('r', 2), ['m2', 'm1']);
  assert.deepEqual(chainOf('r', 3), ['m1', 'm2', 'm1']);
  assert.deepEqual(chainOf('l', 1), ['m2']);
  assert.deepEqual(chainOf('l', 2), ['m1', 'm2']);
});

test('each image is as far behind a mirror as the one before it is in front', () => {
  for (const x of places) {
    assert.equal(imageAt(x, 'r', 1), reflectIn(x, M.m1));
    assert.equal(imageAt(x, 'l', 1), reflectIn(x, M.m2));
    for (let k = 2; k <= COUNT; k++) {
      assert.equal(imageAt(x, 'r', k), reflectIn(imageAt(x, 'l', k - 1), M.m1));
      assert.equal(imageAt(x, 'l', k), reflectIn(imageAt(x, 'r', k - 1), M.m2));
    }
  }
});

test('the row agrees with the closed form, 2L apart for images of the same handedness', () => {
  const L = M.gap;
  for (const x of places)
    for (let k = 1; k <= COUNT; k++) {
      assert.equal(imageAt(x, 'r', k), k % 2 ? k * L - x : k * L + x);
      assert.equal(imageAt(x, 'l', k), k % 2 ? -k * L - x : -k * L + x);
    }
});

test('every image stands behind its mirror, further than the one before it, and the row is listed whole', () => {
  for (const x of places)
    for (let k = 1; k <= COUNT; k++) {
      assert.ok(imageAt(x, 'r', k) > M.m1);
      assert.ok(imageAt(x, 'l', k) < M.m2);
      if (k > 1) {
        assert.ok(imageAt(x, 'r', k) > imageAt(x, 'r', k - 1));
        assert.ok(imageAt(x, 'l', k) < imageAt(x, 'l', k - 1));
      }
    }
  const all = row(5);
  assert.equal(all.length, 2 * COUNT);
  assert.deepEqual(
    all
      .filter((q) => q.flipped)
      .map((q) => q.k)
      .sort(),
    [1, 1, 3, 3, 5, 5],
  );
});

test('the book’s distances (চিত্র ৮.০৪)', () => {
  const d = distances(5);
  assert.deepEqual(d, { d1: 10, d2: 20, d3: 50, d4: 70 });
  for (const x of places) {
    const q = distances(x);
    near(q.d1 + q.d2, M.gap);
    // d₁ before and behind M₁, d₂ before and behind M₂
    near(imageAt(x, 'r', 1) - M.m1, q.d1);
    near(M.m2 - imageAt(x, 'l', 1), q.d2);
    // d₃ and d₄ measured to M₁ from the images behind M₂, and the same behind M₁
    near(imageAt(x, 'r', 2) - M.m1, q.d3);
    near(imageAt(x, 'r', 3) - M.m1, q.d4);
    near(q.d3, q.d2 + M.gap);
    near(q.d4, 2 * M.gap + q.d1);
  }
});

test('reflection keeps the angle and turns the ray', () => {
  const r = reflect({ x: 0.8, y: 0.6 });
  near(r.x, -0.8);
  near(r.y, 0.6);
  near(toNormal({ x: 1, y: 1 }), 45);
});

test('every named image’s ray obeys the law, reaches the eye and comes back to the image', () => {
  for (const x of places)
    for (const side of ['r', 'l'])
      for (let k = 1; k <= NAMED; k++) {
        const r = path(x, side, k);
        near(r.miss, 0, 1e-8);
        near(r.backMiss, 0, 1e-8);
        near(r.image, imageAt(x, side, k));
        assert.equal(r.hits.length, k);
        for (const h of r.hits) near(h.thetaI, h.thetaR, 1e-9);
        assert.ok(r.onGlass, `x=${x} ${side}${k} lands off the glass`);
        assert.ok(r.clearsNear, `x=${x} ${side}${k} is stopped by the nearer mirror`);
      }
});

test('a ray meets the mirrors in the chain’s order, and each stretch seems to come from the image before', () => {
  const r = path(5, 'r', 2);
  assert.deepEqual(
    r.hits.map((h) => h.x),
    [M.m2, M.m1],
  );
  near(r.via[0].x, imageAt(5, 'l', 1));
  near(r.via[0].y, CANDLE.flame, 1e-8);
  near(r.via[1].x, imageAt(5, 'r', 2));
  near(r.via[1].y, CANDLE.flame, 1e-8);
});

test('the eye looks over the nearer mirror, not through it', () => {
  const r = path(7, 'r', 1);
  assert.ok(r.clearsNear);
  assert.ok(r.points[r.points.length - 1].y > GLASS.top);
});

test('each reflection leaves about 90 % of the light', () => {
  assert.equal(brightness(1), 90);
  assert.equal(brightness(2), 81);
  assert.equal(brightness(3), 73);
});

test('shuffle keeps every item', () => {
  assert.deepEqual(shuffle([1, 2, 3, 4]).sort(), [1, 2, 3, 4]);
});
