// The energy figure's maths (assets/energy/src/energy.js): the hill, mgh and ½mv², the total kept on the way down,
// the braking heat, and the Bangladeshi grouping of joules.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HILL, START_X, TOTAL, energyOf, groupJ, heightAt, slopeAt, speedAt, step, xAtHeight } from '../../assets/energy/src/energy.js';

const run = (s, until, dt = 1 / 120, max = 60) => {
  let t = 0;
  while (!until(s) && t < max) {
    s = step(s, dt);
    t += dt;
  }
  return { s, t };
};

test('energy: the hill is 5 m high, flat at both feet, and smooth', () => {
  assert.equal(heightAt(0), HILL.height);
  assert.equal(heightAt(HILL.half), 0);
  assert.equal(heightAt(-HILL.half - 3), 0);
  assert.ok(Math.abs(slopeAt(HILL.half - 1e-6)) < 1e-4);
  assert.ok(Math.abs(heightAt(xAtHeight(2, 1)) - 2) < 1e-9);
  assert.ok(xAtHeight(2, -1) < 0);
});

test('energy: at the top it has mgh = 70 × 9.8 × 5 = 3430 J', () => {
  assert.ok(Math.abs(TOTAL - 3430) < 1e-9);
  const e = energyOf({ phase: 'top', x: 0, v: 0 });
  assert.ok(Math.abs(e.potential - 3430) < 1e-9);
  assert.equal(e.kinetic, 0);
});

test('energy: pedalling up reaches the top at rest, the work done equal to what it has', () => {
  const { s, t } = run({ phase: 'climb', x: START_X, v: 0, heat: 0 }, (x) => x.phase !== 'climb');
  assert.equal(s.phase, 'top');
  assert.equal(s.v, 0);
  assert.ok(t > 6 && t < 14, `climb took ${t} s`);
  const mid = energyOf({ phase: 'climb', x: xAtHeight(2, -1), v: 3 });
  assert.ok(Math.abs(mid.work - mid.total) < 1e-9);
  assert.ok(Math.abs(mid.kinetic - 315) < 1e-9);
});

test('energy: rolling down keeps the total; at the bottom v = √(2gh) ≈ 9.9 m/s', () => {
  for (const y of [4, 2.5, 1]) {
    const e = energyOf({ phase: 'roll', x: xAtHeight(y, 1), v: speedAt(y) });
    assert.ok(Math.abs(e.total - TOTAL) < 1e-6);
    assert.ok(Math.abs(e.kinetic - 0.5 * 70 * speedAt(y) ** 2) < 1e-6);
  }
  const { s, t } = run({ phase: 'roll', x: 0, v: 0, heat: 0 }, (x) => x.phase === 'flat');
  assert.ok(Math.abs(s.v - Math.sqrt(2 * 9.8 * 5)) < 1e-9);
  assert.ok(t > 3 && t < 9, `roll took ${t} s`);
});

test('energy: braking takes all the kinetic energy away as heat', () => {
  const { s } = run({ phase: 'brake', x: 20, v: speedAt(0), heat: 0 }, (x) => x.phase === 'stopped');
  assert.equal(s.v, 0);
  assert.ok(Math.abs(s.heat - TOTAL) < 1e-6);
  const e = energyOf(s);
  assert.equal(e.total, 0);
});

test('energy: joules rounded to tens, grouped the Bangladeshi way', () => {
  assert.equal(groupJ(3430), '3,430');
  assert.equal(groupJ(686), '690');
  assert.equal(groupJ(0), '0');
  assert.equal(groupJ(123456), '1,23,460');
});
