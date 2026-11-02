import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HEAT, T1_CHOICES, percent, readings, roundV, volume } from '../../assets/gas-expansion/src/reading.js';

test('V = nRT/P: the litres follow the temperature (n and P fixed)', () => {
  assert.equal(roundV(volume(200)), 2.0);
  assert.equal(roundV(volume(300)), 3.0);
  assert.equal(roundV(volume(400)), 4.0);
  assert.equal(roundV(volume(500)), 5.0);
  assert.ok(Math.abs(volume(300) / volume(150) - 2) < 1e-12);
});

test('γ_P = ((V₂ − V₁)/V₁)/(T₂ − T₁) = 1/T₁ for every start', () => {
  for (const T1 of T1_CHOICES) {
    const r = readings(T1, T1 + HEAT);
    assert.ok(Math.abs(r.rel / r.dT - 1 / T1) < 1e-12);
    assert.equal(r.gamma, 1 / T1);
    assert.equal(r.dT, HEAT);
  }
});

test('the same heating gives the same rise in litres but a bigger share of a smaller V₁', () => {
  const [a, b, c] = T1_CHOICES.map((T1) => readings(T1, T1 + HEAT));
  assert.equal(a.dV, 1);
  assert.equal(b.dV, 1);
  assert.equal(c.dV, 1);
  assert.deepEqual(
    T1_CHOICES.map((T1) => percent(T1, HEAT)),
    [50, 33, 25],
  );
  assert.ok(a.rel > b.rel && b.rel > c.rel);
});
