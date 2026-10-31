// The maths of the spring figure (book p106–107, 4.3.2): F = kx and the book's V = ½kx², x in whole centimetres turned
// into metres, the comparison "twice the stretch: twice the force, four times the energy", and the test's choices.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  choicesFrom,
  clampK,
  clampX,
  compare,
  energy,
  energyMistakes,
  force,
  forceMistakes,
  metres,
  plain,
  stateOf,
} from '../../assets/spring-potential-energy/src/spring-maths.js';

test('spring: F = kx in newtons and V = ½kx² in joules, x from centimetres to metres', () => {
  assert.equal(metres(10), 0.1);
  assert.equal(metres(-5), 0.05);
  assert.equal(force(200, 10), 20);
  assert.equal(force(200, -10), 20); // pushed in: the same size of force
  assert.equal(energy(200, 10), 1);
  assert.equal(energy(200, 5), 0.25);
  assert.equal(energy(200, -10), 1); // squeezed or stretched by the same x: the same energy
  assert.equal(energy(100, 1), 0.005);
  assert.equal(energy(400, 3), 0.18);
  assert.equal(energy(300, 7), 0.735);
  assert.equal(force(300, 7), 21);
  assert.equal(energy(250, 0), 0);
});

test('spring: steps stay in range', () => {
  assert.equal(clampK(50), 100);
  assert.equal(clampK(260), 300);
  assert.equal(clampK(900), 400);
  assert.equal(clampX(11), 10);
  assert.equal(clampX(-12), -10);
  assert.equal(clampX(3.4), 3);
  assert.equal(stateOf(3), 'stretched');
  assert.equal(stateOf(-3), 'compressed');
  assert.equal(stateOf(0), 'rest');
  assert.equal(plain(0.1), '0.1');
  assert.equal(plain(0.25), '0.25');
  assert.equal(plain(1), '1');
});

test('spring: twice the stretch, twice the force, four times the energy', () => {
  const c = compare({ k: 200, x: 5 }, { k: 200, x: 10 });
  assert.deepEqual(c, { times: 2, F: 2, V: 4, from: { F: 10, V: 0.25 } });
  assert.equal(compare({ k: 200, x: -5 }, { k: 200, x: -10 }).V, 4); // pushed in twice as far
  assert.equal(compare({ k: 200, x: 5 }, { k: 200, x: -10 }), null); // the other way: not the same experiment
  assert.equal(compare({ k: 200, x: 3 }, { k: 200, x: 9 }).V, 9);
  assert.equal(compare({ k: 200, x: 5 }, { k: 300, x: 10 }), null); // another spring
  assert.equal(compare({ k: 200, x: 4 }, { k: 200, x: 6 }), null);
  assert.equal(compare({ k: 200, x: 10 }, { k: 200, x: 5 }), null);
  assert.equal(compare({ k: 200, x: 0 }, { k: 200, x: 5 }), null);
  assert.equal(compare(null, { k: 200, x: 5 }), null);
  // the numbers agree with the formula
  assert.equal(energy(200, 10) / energy(200, 5), 4);
  assert.equal(force(200, 10) / force(200, 5), 2);
});

test('spring: test choices are the answer and three distinct real mistakes', () => {
  const f = choicesFrom(force(200, 8), forceMistakes(200, 8));
  assert.equal(f[0].value, 16);
  assert.equal(f.length, 4);
  assert.equal(new Set(f.map((c) => c.value)).size, 4);
  assert.deepEqual(
    f.slice(1).map((c) => c.why),
    ['m_cm', 'm_halfF', 'm_sqF'],
  );
  const v = choicesFrom(energy(400, 6), energyMistakes(400, 6));
  assert.equal(v[0].value, 0.72);
  assert.deepEqual(
    v.map((c) => c.value),
    [0.72, 1.44, 12, 24],
  );
  assert.ok(v.every((c) => c.value > 0));
});
