// The falling apple's maths (assets/newton-apple/src/reading.js).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EARTH,
  G,
  HEIGHT,
  MASS,
  appleRadius,
  earthAcceleration,
  fallAt,
  fallTime,
  gChange,
  gravity,
  groupBD,
  landingSpeed,
  pull,
  radiusAt,
  roundTo,
  sci,
  strobeGaps,
  strobeHeights,
  weightChoices,
} from '../../assets/newton-apple/src/reading.js';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} is not ${b}`);

test('newton-apple: the book numbers give g of about 9.8', () => {
  near(gravity(), (6.67e-11 * 5.98e24) / (6.37e6 * 6.37e6));
  assert.equal(roundTo(gravity(), 1), 9.8);
  assert.equal(roundTo(gravity(), 2), 9.83);
  assert.equal(G, 6.67e-11);
  assert.equal(EARTH.R, 6.37e6);
});

test('newton-apple: F is proportional to m, and F ÷ m is g whatever the mass', () => {
  near(pull(0.4) / pull(0.2), 2);
  for (let m = MASS.min; m <= MASS.max + 1e-9; m += MASS.step) near(pull(m) / m, gravity(), 1e-12);
  assert.equal(roundTo(pull(0.2), 2), 1.97);
});

test('newton-apple: the pull falls with the square of the distance from the centre', () => {
  near(pull(1, EARTH.M, 2 * EARTH.R) / pull(1), 0.25);
});

test('newton-apple: a height of a few metres hardly changes g (the book: not worth counting)', () => {
  near(radiusAt(5), 6370005);
  assert.ok(gChange(5) > 0);
  assert.ok(gChange(HEIGHT.max) < 2e-6);
});

test('newton-apple: time and speed of the fall', () => {
  near(fallTime(3), Math.sqrt(6 / gravity()));
  assert.equal(roundTo(fallTime(3), 2), 0.78);
  assert.equal(roundTo(landingSpeed(3), 1), 7.7);
  near(landingSpeed(3), gravity() * fallTime(3));
  assert.equal(roundTo(fallTime(5), 2), 1.01);
});

test('newton-apple: fallAt runs from the branch to the ground and stays there', () => {
  assert.deepEqual(fallAt(0, 3), { t: 0, y: 3, v: 0, landed: false });
  const mid = fallAt(0.4, 3);
  near(mid.y, 3 - 0.5 * gravity() * 0.16);
  near(mid.v, gravity() * 0.4);
  const end = fallAt(9, 3);
  assert.equal(end.landed, true);
  assert.equal(end.y, 0);
  near(end.v, landingSpeed(3));
});

test('newton-apple: the strobe gaps grow by g dt² each time', () => {
  const ys = strobeHeights(5);
  assert.equal(ys.length, 11);
  assert.equal(ys[0], 5);
  const gaps = strobeGaps(ys);
  for (let i = 1; i < gaps.length; i++) near(gaps[i] - gaps[i - 1], gravity() * 0.01, 1e-9);
  assert.equal(strobeHeights(3, 0.25).length, 3);
});

test('newton-apple: the Earth hardly accelerates (the same F on a huge mass)', () => {
  near(earthAcceleration(0.2), pull(0.2) / EARTH.M);
  const { m, e } = sci(earthAcceleration(0.2), 1);
  assert.equal(e, -25);
  assert.equal(m, '3.3');
});

test('newton-apple: a 200 g apple is about 8 cm across; size follows the cube root of the mass', () => {
  assert.equal(roundTo(appleRadius(0.2) * 200, 0), 8);
  near(appleRadius(0.8) / appleRadius(0.1), 2, 1e-9);
});

test('newton-apple: sci and groupBD', () => {
  assert.deepEqual(sci(9.999e5, 2), { m: '1', e: 6 });
  assert.deepEqual(sci(0), { m: '0', e: 0 });
  assert.equal(groupBD(6370), '6,370');
  assert.equal(groupBD(6370000), '63,70,000');
  assert.equal(groupBD(950), '950');
});

test('newton-apple: the weight question has four different answers, the right one first', () => {
  for (const m of [0.15, 0.25, 0.3, 0.4]) {
    const list = weightChoices(m);
    assert.equal(new Set(list).size, 4);
    near(list[0], roundTo(m * gravity(), 2));
  }
});
