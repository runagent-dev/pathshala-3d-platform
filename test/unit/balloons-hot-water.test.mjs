import assert from 'node:assert/strict';
import { test } from 'node:test';
import { T_CHOICES, airRatio, drawnRatio, mL, percentUp, readings, waterRatio } from '../../assets/balloons-hot-water/src/reading.js';

test('the air balloon grows with the temperature in kelvin, as the book says of a gas', () => {
  assert.equal(airRatio(30), 1);
  assert.deepEqual(
    T_CHOICES.map((T) => percentUp(airRatio(T))),
    [7, 13, 20],
  );
  assert.deepEqual(
    T_CHOICES.map((T) => mL(airRatio(T))),
    [1070, 1130, 1200],
  );
});

test('the water balloon grows only a little: far less than the air in every case', () => {
  assert.equal(waterRatio(30), 1);
  assert.deepEqual(
    T_CHOICES.map((T) => percentUp(waterRatio(T))),
    [1, 2, 3],
  );
  for (const T of T_CHOICES) assert.ok(airRatio(T) - 1 > 5 * (waterRatio(T) - 1));
});

test('the picture draws the radius change 3 times too big, never smaller than the true change', () => {
  const true90 = Math.cbrt(airRatio(90)) - 1;
  assert.ok(Math.abs(drawnRatio(airRatio(90)) - 1 - 3 * true90) < 1e-12);
  assert.equal(drawnRatio(1), 1);
  const r = readings(90);
  assert.deepEqual(r.air, { ratio: airRatio(90), mL: 1200, pct: 20 });
  assert.equal(r.water.pct, 3);
});
