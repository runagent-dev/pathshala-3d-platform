// The optics of plane-mirror-image: rays traced by the law of reflection, the image's place, the half-height mirror.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BOY,
  DIST,
  FULL,
  imageOf,
  mirrorHit,
  needed,
  neededCm,
  points,
  rays,
  reflect,
  round,
  SHORT,
  seenRange,
  sees,
  shuffle,
  snapDistance,
  snapEdge,
  toNormal,
  trace,
} from '../../assets/plane-mirror-image/src/reading.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} is not ${b}`);

test('the image is as far behind the mirror as the object is in front of it', () => {
  for (const d of [0.6, 1, 1.3, 10]) {
    const { x, y } = points(d);
    near(imageOf(x).x, d);
    near(imageOf(x).y, x.y);
    near(imageOf(y).x, -y.x);
  }
});

test('the law: r = d − 2(d·n)n keeps the angle and turns the ray round', () => {
  const r = reflect({ x: 0.6, y: 0.8 });
  near(r.x, -0.6);
  near(r.y, 0.8);
  near(toNormal({ x: 1, y: 1 }), 45);
});

test('at every distance the reflected rays reach the eye with θi = θr, and traced back reach X′ and Y′', () => {
  for (const d of [0.6, 0.85, 1, 1.3, 2, 10]) {
    const p = points(d);
    for (const a of [p.x, p.y]) {
      const m = mirrorHit(a, p.e);
      const r = trace(a, m, p.e, -a.x);
      near(r.thetaI, r.thetaR);
      near(r.miss, 0);
      near(r.back, a.y); // the extension, as far behind as the source is in front, is at the source's height
    }
  }
});

test('the ray from the feet lands at half the eye’s height, at any distance', () => {
  for (const d of [0.6, 1, 1.3, 10]) near(mirrorHit(points(d).y, points(d).e), BOY.eye / 2);
});

test('the mirror needed is half his height: the book’s 0.75 m, at 1 m and at 10 m', () => {
  assert.equal(neededCm(1).length, 0.75);
  assert.equal(neededCm(10).length, 0.75);
  assert.equal(neededCm(0.6).length, 0.75);
  assert.equal(neededCm(1).top, 1.45);
  assert.equal(neededCm(1).bottom, 0.7);
  // the exact length is a little under, because the top of the head is not quite over the eye
  for (const d of [0.6, 1, 10]) assert.ok(Math.abs(needed(d).length - BOY.H / 2) < 0.003);
  assert.ok(Math.abs(needed(1, 1.6).length - 0.8) < 0.003);
});

test('a short mirror hides the feet or the head, and the rays come from what it can still show', () => {
  assert.deepEqual(sees(1, SHORT.top, SHORT.bottom), { head: false, feet: false });
  assert.deepEqual(sees(1, 1.45, 0.7), { head: true, feet: true });
  assert.deepEqual(sees(10, 1.45, 0.7), { head: true, feet: true });
  assert.deepEqual(sees(1, 1.45, 0.75), { head: true, feet: false });
  assert.deepEqual(sees(1, FULL.top, FULL.bottom), { head: true, feet: true });
  const r = rays(1, 1.2, 0.95);
  assert.equal(r.head.full, false);
  near(r.head.m, 1.2);
  near(r.head.src.y, 2 * 1.2 - BOY.eye);
  near(r.head.thetaI, r.head.thetaR);
  near(r.head.miss, 0);
  near(r.feet.src.y, 2 * 0.95 - BOY.eye);
  const f = rays(1, 1.45, 0.7);
  assert.ok(f.head.full && f.feet.full);
  near(seenRange(1.2, 0.95).top, r.head.src.y);
});

test('a taller boy scales: eye and mirror with him', () => {
  const p = points(1, 1.2);
  near(p.e.y, (BOY.eye * 1.2) / BOY.H);
  near(mirrorHit(p.y, p.e), p.e.y / 2);
});

test('drags land on the readout’s steps and catch the height that shows him whole', () => {
  assert.equal(snapDistance(0.1), DIST.min);
  assert.equal(snapDistance(9), DIST.max);
  assert.equal(snapDistance(1.02), 1);
  assert.equal(snapDistance(1.03), 1.05);
  assert.equal(snapEdge('bottom', 0.712, 1.3, 1), 0.7);
  assert.equal(snapEdge('bottom', 0.8, 1.3, 1), 0.8);
  assert.equal(snapEdge('top', 1.436, 0.7, 1), 1.45);
  assert.equal(snapEdge('top', 0.5, 0.7, 1), 0.9); // never closer than the gap
  assert.equal(snapEdge('bottom', 1.2, 1.3, 1), 1.1);
  assert.equal(snapEdge('bottom', 0.1, 1.3, 1), 0.45);
  assert.equal(snapEdge('top', 2, 0.7, 1), 1.6);
});

test('helpers', () => {
  assert.equal(round(1.005), 1.01);
  assert.deepEqual([...shuffle([1, 2, 3])].sort(), [1, 2, 3]);
});
