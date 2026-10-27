// Newton's third law (book p84, topic 3.8): the maths of the figure.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  APPLE_FALL,
  APPLE_MASS,
  EARTH_MASS,
  G,
  PAIRS,
  PUSH_FORCE,
  STROKE,
  appleAt,
  earthAcceleration,
  pushAt,
  pushStats,
  sci,
} from '../../assets/newtons-third-law/src/physics.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b)), `${a} vs ${b}`);

test('equal masses: the same force on both gives the same acceleration (10 N on 50 kg is 0.2 ms⁻²)', () => {
  const p = pushStats(PAIRS.equal.mA, PAIRS.equal.mB);
  close(p.aA, 0.2);
  close(p.aB, 0.2);
  close(p.vA, p.vB);
  close(p.sA, p.sB);
});

test('unequal masses: the same force, so the lighter skater accelerates twice as much and goes twice as far', () => {
  const p = pushStats(PAIRS.unequal.mA, PAIRS.unequal.mB);
  close(p.aA, 0.2);
  close(p.aB, 0.1);
  close(p.aA / p.aB, PAIRS.unequal.mB / PAIRS.unequal.mA);
  close(p.vA / p.vB, 2);
  close(p.sA / p.sB, 2);
});

test('the push lasts until the hands have moved apart by the stroke', () => {
  for (const { mA, mB } of Object.values(PAIRS)) {
    const p = pushStats(mA, mB);
    close(p.sA + p.sB, STROKE);
    const end = pushAt(mA, mB, p.T);
    close(end.dA + end.dB, STROKE);
  }
});

test('while the hands touch there is a force; afterwards there is none and the speed stays', () => {
  const { mA, mB } = PAIRS.unequal;
  const p = pushStats(mA, mB);
  assert.equal(pushAt(mA, mB, 0).phase, 'rest');
  assert.equal(pushAt(mA, mB, 0).force, false);
  const mid = pushAt(mA, mB, p.T / 2);
  assert.equal(mid.phase, 'push');
  assert.equal(mid.force, true);
  close(mid.vA, p.aA * (p.T / 2));
  const after = pushAt(mA, mB, p.T + 1);
  const later = pushAt(mA, mB, p.T + 3);
  assert.equal(after.phase, 'glide');
  assert.equal(after.force, false);
  assert.equal(after.aA, 0);
  close(after.vA, later.vA);
  close(later.dA - after.dA, 2 * p.vA); // uniform velocity: 2 s more at v
});

test('the two bodies move away from the start in step with F = ma (distance ratio is the inverse of the mass ratio)', () => {
  const { mA, mB } = PAIRS.unequal;
  for (const t of [0.5, 1, 2, 4]) {
    const s = pushAt(mA, mB, t);
    close(s.dA / s.dB, mB / mA);
  }
});

test('the force on A and on B is always the same size, whatever the masses', () => {
  const { mA, mB } = PAIRS.unequal;
  const p = pushStats(mA, mB);
  close(mA * p.aA, PUSH_FORCE);
  close(mB * p.aB, PUSH_FORCE);
  close(mA * p.vA, mB * p.vB); // equal force for equal time: (momentum is the next topic; this only checks the pair)
});

test('the apple falls from rest with g and lands after sqrt(2h/g)', () => {
  close(appleAt(0).fallen, 0);
  const end = appleAt(10);
  assert.equal(end.landed, true);
  close(end.fallen, APPLE_FALL);
  close(end.tLand, Math.sqrt((2 * APPLE_FALL) / G));
  close(appleAt(0.2).fallen, 0.5 * G * 0.04);
  close(appleAt(0.2).v, G * 0.2);
});

test("the Earth's acceleration for a 1 kg body is (m/M)g = 1.64 × 10⁻²⁴ ms⁻² (the book's numbers)", () => {
  const a = earthAcceleration(APPLE_MASS, EARTH_MASS);
  close(a, (1 / 5.98e24) * 9.8);
  const { mantissa, exponent } = sci(a);
  assert.equal(mantissa, 1.64);
  assert.equal(exponent, -24);
  close(G / a, EARTH_MASS / APPLE_MASS); // the apple's own acceleration g is M/m times the Earth's
});

test('sci() handles round numbers and rounding up to the next power', () => {
  assert.deepEqual(sci(5.98e24), { mantissa: 5.98, exponent: 24 });
  assert.deepEqual(sci(9.996e3), { mantissa: 1, exponent: 4 });
  assert.deepEqual(sci(0), { mantissa: 0, exponent: 0 });
});
