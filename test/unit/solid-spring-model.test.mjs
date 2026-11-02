import assert from 'node:assert/strict';
import test from 'node:test';
import { A_MAX, LEVELS, amplitude, edgeGrowth, levelOf, meanShift, nextLevel, swing } from '../../assets/solid-spring-model/src/reading.js';

test('a cold lattice does not shake and does not grow', () => {
  assert.equal(amplitude(0), 0);
  assert.equal(edgeGrowth(0), 0);
});

test('the shake grows with the temperature', () => {
  assert.ok(amplitude(0.5) < amplitude(1));
  assert.equal(amplitude(1), A_MAX);
  assert.equal(amplitude(5), A_MAX);
});

test('the special spring: further out than in', () => {
  assert.ok(swing(1, 0.1) > -swing(-1, 0.1));
});

test('the mean shift equals the average of a whole shake', () => {
  const amp = 0.1;
  let sum = 0;
  const n = 20000;
  for (let i = 0; i < n; i++) sum += swing(Math.sin((2 * Math.PI * i) / n), amp);
  assert.ok(Math.abs(sum / n - meanShift(amp)) < 1e-5);
});

test('hotter means a bigger cube', () => {
  assert.ok(edgeGrowth(1) > edgeGrowth(0.5));
  assert.ok(edgeGrowth(0.5) > 0);
});

test('levels', () => {
  assert.deepEqual(
    LEVELS.map((l) => l.id),
    ['cold', 'warm', 'hot'],
  );
  assert.equal(levelOf(0.4), 'warm');
  assert.equal(nextLevel('cold'), 'warm');
  assert.equal(nextLevel('hot'), null);
});
