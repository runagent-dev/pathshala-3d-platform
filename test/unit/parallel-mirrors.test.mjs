// The optics of parallel-mirrors: images as chains of reflections, the book's distances, rays traced by the law.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  barRows,
  barsAt,
  beatOf,
  brightness,
  CANDLE,
  chainOf,
  COUNT,
  distances,
  GLASS,
  imageAt,
  imagesAt,
  isCurrentBar,
  LAST_BEAT,
  M,
  NAMED,
  OBJECT_AT,
  openSteps,
  PAIR_X,
  pairChoices,
  path,
  reflect,
  reflectIn,
  ROW_ADDS,
  ROW_GAP,
  row,
  shuffle,
  snapCandle,
  spotChoices,
  STEPS,
  stepOfBeat,
  sumChoices,
  timesChoices,
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

test('the test’s four choices always differ, and the right one is among them', () => {
  const distinct = (list) => assert.equal(new Set(list).size, 4, `${list}`);
  for (const x of PAIR_X) {
    const c = pairChoices(x);
    distinct([c.answer, c.same, c.gap, c.other]);
    assert.equal(c.answer, 2 * distances(x).d1);
  }
  for (const x of places) {
    distinct(spotChoices(x).map((p) => p.at));
    assert.equal(spotChoices(x)[0].at, distances(x).d3);
    for (const alt of [true, false]) {
      const c = sumChoices(x, alt);
      distinct([c.answer, c.d3, c.two, c.last]);
    }
  }
  for (const k of [1, 2, 3, 4]) {
    const list = timesChoices(k);
    distinct(list);
    assert.ok(list.includes(k) && list.every((n) => n >= 1));
  }
});

test('d₄ is not always the largest choice', () => {
  const c = sumChoices(5, false);
  assert.ok(c.last > c.answer);
  assert.ok(sumChoices(5, true).last > sumChoices(5, true).answer);
});

test('the choices are numbers, because the kit’s quiz compares numbers', () => {
  const c = pairChoices(3);
  for (const v of [c.answer, c.same, c.gap, c.other]) assert.equal(typeof v, 'number');
});

test('the build starts with no image at all and adds one thing a tap, up to the five of the book', () => {
  assert.deepEqual(imagesAt(0), []);
  assert.deepEqual(imagesAt(1), ['r1']);
  assert.deepEqual(imagesAt(2), ['r1', 'l1']);
  assert.deepEqual(imagesAt(3), ['r1', 'l1', 'l2']);
  assert.deepEqual(imagesAt(4), imagesAt(3)); // the ray's tap adds no image
  assert.deepEqual(imagesAt(5), ['r1', 'l1', 'l2', 'r2']);
  assert.deepEqual(imagesAt(6), ['r1', 'l1', 'l2', 'r2', 'r3']);
  assert.equal(imagesAt(7).length, 2 * COUNT);
  assert.deepEqual(imagesAt(LAST_BEAT), imagesAt(6));
});

test('steps and beats agree: every step ends where the next begins', () => {
  assert.equal(beatOf('one'), 0);
  STEPS.slice(1).forEach((id, i) => assert.equal(beatOf(id), beatOf(STEPS[i], 9), id));
  assert.equal(beatOf('book', 9), LAST_BEAT);
  for (const id of STEPS) assert.equal(stepOfBeat(beatOf(id, 9)), id);
  assert.equal(beatOf('nothing'), 0);
});

test('the words open one step at a time, so that nothing can jump to the crowded picture', () => {
  assert.deepEqual(openSteps(0), ['one']);
  assert.deepEqual(openSteps(1), ['one', 'two']);
  assert.deepEqual(openSteps(2), ['one', 'two', 'image']);
  assert.deepEqual(openSteps(3), ['one', 'two', 'image']); // half way through a step the next word stays shut
  assert.deepEqual(openSteps(8), STEPS);
  assert.deepEqual(openSteps(LAST_BEAT), STEPS);
  for (let b = 0; b < LAST_BEAT; b++) assert.ok(openSteps(b).includes(stepOfBeat(b + 1)), `beat ${b}`);
});

test('only the newest pair of distances is at full strength, all of them only in the book’s picture', () => {
  assert.deepEqual(barsAt(0), []);
  assert.deepEqual(barsAt(1), ['d1']);
  assert.deepEqual(barsAt(3), ['d1', 'd2', 'e']);
  assert.deepEqual(barsAt(5), ['d1', 'd2', 'd3']);
  assert.deepEqual(barsAt(7), []);
  assert.deepEqual(barsAt(LAST_BEAT), ['d1', 'd2', 'd3', 'd4']);
  for (const beat of [1, 2, 3, 5, 6]) assert.equal(barsAt(beat).filter((n) => isCurrentBar(n, beat)).length, 1);
  assert.equal(barsAt(LAST_BEAT).filter((n) => isCurrentBar(n, LAST_BEAT)).length, 4);
  assert.ok(barRows(LAST_BEAT) === 3 && barRows(2) === 1 && barRows(0) === 0);
});

test('each object stands before it is used, and its image is that object reflected in the other side’s mirror', () => {
  const next = { 3: 'l2', 5: 'r2', 6: 'r3' };
  for (const [beat, id] of Object.entries(OBJECT_AT)) {
    assert.ok(imagesAt(Number(beat) - 1).includes(id), id);
    const made = next[beat];
    const mirror = made[0] === 'r' ? M.m1 : M.m2;
    for (const x of places) near(imageAt(x, made[0], Number(made[1])), reflectIn(imageAt(x, id[0], Number(id[1])), mirror));
  }
});

test('the book’s d₃ and d₄ are the distances of the images it names, in front of M₁ and behind it', () => {
  for (const x of places) {
    const d = distances(x);
    near(M.m1 - imageAt(x, 'l', 1), d.d3);
    near(imageAt(x, 'r', 2) - M.m1, d.d3);
    near(M.m1 - imageAt(x, 'l', 2), d.d4);
    near(imageAt(x, 'r', 3) - M.m1, d.d4);
  }
});

test('the row adds only images that were not there, 0.6 s apart', () => {
  assert.equal(ROW_GAP, 0.6);
  assert.equal(new Set(ROW_ADDS).size, ROW_ADDS.length);
  for (const id of ROW_ADDS) assert.ok(!imagesAt(6).includes(id) && imagesAt(7).includes(id), id);
  assert.equal(ROW_ADDS.length + imagesAt(6).length, imagesAt(7).length);
});

test('shuffle keeps every item', () => {
  assert.deepEqual(shuffle([1, 2, 3, 4]).sort(), [1, 2, 3, 4]);
});
