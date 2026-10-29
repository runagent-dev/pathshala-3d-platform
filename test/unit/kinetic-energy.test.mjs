// The maths of assets/kinetic-energy (book p104, topic 4.3.1): T = ½mv², the ideal bow, the bale, the ratios.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  choicesFrom,
  DRAW_MAX,
  depthIn,
  drawFor,
  energyRatio,
  kinetic,
  MASSES,
  maxSpeed,
  plain,
  ratioExact,
  ratioText,
  speedFrom,
  speedsFor,
  stored,
} from '../../assets/kinetic-energy/src/energy.js';

test('T = ½mv² in joules', () => {
  assert.equal(kinetic(0.02, 30), 9);
  assert.equal(kinetic(0.02, 60), 36);
  assert.equal(plain(kinetic(0.03, 30)), '13.5');
  assert.equal(kinetic(0.04, 50), 50);
});

test('the ideal bow: the draw for a speed stores exactly that T, and gives that speed back', () => {
  for (const m of MASSES)
    for (const v of speedsFor(m)) {
      const s = drawFor(m, v);
      assert.ok(s <= DRAW_MAX + 1e-9);
      assert.ok(Math.abs(stored(s) - kinetic(m, v)) < 1e-9);
      assert.ok(Math.abs(speedFrom(m, s) - v) < 1e-9);
    }
  assert.equal(maxSpeed(0.02), 60);
  assert.equal(maxSpeed(0.03), 50);
  assert.equal(maxSpeed(0.04), 50);
  // twice the speed needs twice the draw and four times the stored energy
  assert.ok(Math.abs(drawFor(0.02, 60) / drawFor(0.02, 30) - 2) < 1e-12);
});

test('depth in the bale grows with T (W = Fs)', () => {
  assert.ok(Math.abs(depthIn(kinetic(0.02, 60)) / depthIn(kinetic(0.02, 30)) - 4) < 1e-12);
  assert.ok(Math.abs(depthIn(kinetic(0.04, 30)) / depthIn(kinetic(0.02, 30)) - 2) < 1e-12);
  assert.ok(depthIn(50) < 0.45); // never through the bale
});

test('ratios as text', () => {
  assert.equal(ratioText(energyRatio({ m: 0.02, v: 60 }, { m: 0.02, v: 30 })), '4');
  assert.equal(ratioText(energyRatio({ m: 0.02, v: 30 }, { m: 0.02, v: 60 })), '0.25');
  assert.equal(ratioText(energyRatio({ m: 0.02, v: 30 }, { m: 0.02, v: 20 })), '2.25');
  assert.equal(ratioText(energyRatio({ m: 0.02, v: 40 }, { m: 0.02, v: 60 })), '0.44');
  assert.equal(ratioExact(energyRatio({ m: 0.02, v: 40 }, { m: 0.02, v: 60 })), false);
  assert.equal(ratioExact(energyRatio({ m: 0.02, v: 30 }, { m: 0.02, v: 20 })), true);
  assert.equal(ratioText(energyRatio({ m: 0.04, v: 30 }, { m: 0.02, v: 30 })), '2');
});

test('choices: four distinct, zero allowed', () => {
  const c = choicesFrom(0, [9, 0.3, 0.01, 9]);
  assert.equal(c.length, 4);
  assert.ok(c.includes(0));
});
