import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COPPER,
  alphaFrom,
  coefficient,
  densityAfter,
  drawnScale,
  fixed,
  percentGrowth,
  sizeAt,
} from '../../assets/solid-thermal-expansion/src/reading.js';

const near = (a, b, eps) => assert.ok(Math.abs(a - b) <= eps, `${a} is not within ${eps} of ${b}`);

test("the book's copper rod: 10 m at 20 C is 10.0167 m at 120 C", () => {
  near(sizeAt('length', 120), 10.0167, 1e-9);
  assert.equal(fixed(sizeAt('length', 120), 4), '10.0167');
});

test('the book: alpha from the measurement is 16.7e-6 per degree', () => {
  near(alphaFrom(10, 10.0167, 20, 120), 16.7e-6, 1e-10);
});

test('beta = 2 alpha and gamma = 3 alpha', () => {
  near(coefficient('area'), 2 * COPPER.alpha, 1e-15);
  near(coefficient('volume'), 3 * COPPER.alpha, 1e-15);
});

test('a plate and a cube of side 10 m', () => {
  near(sizeAt('area', 120), 100.334, 1e-9);
  near(sizeAt('volume', 120), 1005.01, 1e-9);
});

test('nothing grows without heat; the growth is 1 : 2 : 3', () => {
  for (const q of ['length', 'area', 'volume']) assert.equal(percentGrowth(q, 20), 0);
  const [a, b, c] = ['length', 'area', 'volume'].map((q) => percentGrowth(q, 120));
  near(b / a, 2, 1e-12);
  near(c / a, 3, 1e-12);
  assert.equal(fixed(a, 3), '0.167');
});

test("the book's gold example: 19.30 gm/cc, alpha 14e-6, 100 C more: 19.22 gm/cc", () => {
  assert.equal(fixed(densityAfter(19.3, 14e-6, 100), 2), '19.22');
});

test('the drawing is bigger when hotter, and the same when not heated', () => {
  assert.equal(drawnScale(20), 1);
  assert.ok(drawnScale(120) > drawnScale(70));
  assert.ok(drawnScale(120) < 1.3); // still a modest, calm size
});

test('fixed trims zeros when asked', () => {
  assert.equal(fixed(10, 4, true), '10');
  assert.equal(fixed(10.5, 4, true), '10.5');
});
