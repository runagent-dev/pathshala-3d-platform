// The optics of light-at-boundary: the law of reflection and Snell's law, on the exact points the drawing uses.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BLOCK,
  clampAngle,
  EVENTS,
  HIT,
  N_GLASS,
  paths,
  refractedAngle,
  START_ANGLE,
  shuffle,
  STUB,
} from '../../assets/light-at-boundary/src/reading.js';

const fromVertical = (from, to) => (Math.atan2(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) * 180) / Math.PI;
const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} is not ${b}`);

test('Snell: n₁ sin θ₁ = n₂ sin θ₂', () => {
  near(refractedAngle(0), 0);
  near(refractedAngle(50), 30.7, 0.05);
  near(refractedAngle(30), 19.47, 0.01);
  for (const a of [20, 35, 50, 70]) near(Math.sin((a * Math.PI) / 180), N_GLASS * Math.sin((refractedAngle(a) * Math.PI) / 180));
  near(refractedAngle(30, 1, 1), 30); // the same medium: no bend
});

test('the reflected ray leaves at the angle the light came in, on the other side', () => {
  for (const a of [20, 35, 50, 70]) {
    const g = paths(a);
    near(fromVertical(g.lens, g.hit), a);
    near(fromVertical(g.hit, g.reflected), a);
    assert.ok(g.lens.x < g.hit.x && g.reflected.x > g.hit.x);
    assert.ok(g.lens.y > g.hit.y && g.reflected.y > g.hit.y);
  }
});

test('the refracted ray bends toward the vertical and stays inside the block', () => {
  for (const a of [20, 35, 50, 70]) {
    const g = paths(a);
    near(fromVertical(g.hit, g.refracted), refractedAngle(a));
    assert.ok(fromVertical(g.hit, g.refracted) < a);
    near(g.refracted.y, 0);
    assert.ok(Math.abs(g.refracted.x) < BLOCK.halfLength);
  }
});

test('the absorbed part is short and ends just under the surface', () => {
  const g = paths(START_ANGLE);
  near(Math.hypot(g.stub.x - HIT.x, g.stub.y - HIT.y), STUB);
  assert.ok(g.stub.y < HIT.y && g.stub.y > HIT.y - 1);
});

test('three events, and angles stay in range', () => {
  assert.deepEqual(EVENTS, ['reflection', 'refraction', 'absorption']);
  assert.equal(clampAngle(5), 20);
  assert.equal(clampAngle(89), 70);
  assert.equal(clampAngle('x'), START_ANGLE);
  assert.deepEqual([...shuffle(EVENTS)].sort(), [...EVENTS].sort());
});
