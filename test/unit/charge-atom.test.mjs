import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ATOMS, coulombs, E_CHARGE, extraChoices, kindOf, netCharge, removedChoices, shells } from '../../assets/charge-atom/src/reading.js';

test('charge-atom: the book’s shells fill 2, then 8, then 8 (চিত্র ১০.০১, argon)', () => {
  assert.deepEqual(shells(18), [2, 8, 8]);
  assert.deepEqual(shells(17), [2, 8, 7]);
  assert.deepEqual(shells(1), [1]);
  assert.deepEqual(shells(2), [2]);
  assert.deepEqual(shells(3), [2, 1]);
  assert.deepEqual(shells(0), []);
  assert.equal(
    shells(ATOMS.ar.protons).reduce((a, b) => a + b, 0),
    18,
  );
});

test('charge-atom: equal protons and electrons make the atom neutral; fewer electrons +, more −', () => {
  assert.equal(netCharge(18, 18), 0);
  assert.equal(netCharge(18, 17), 1);
  assert.equal(netCharge(18, 16), 2);
  assert.equal(netCharge(17, 18), -1);
  assert.equal(kindOf(0), 'neutral');
  assert.equal(kindOf(2), 'positive');
  assert.equal(kindOf(-1), 'negative');
});

test('charge-atom: the charge in coulombs uses the book’s e = 1.6 × 10⁻¹⁹ C', () => {
  assert.equal(E_CHARGE, 1.6e-19);
  assert.deepEqual(coulombs(1), { sign: 1, m: 1.6, exp: -19 });
  assert.deepEqual(coulombs(-1), { sign: -1, m: 1.6, exp: -19 });
  assert.deepEqual(coulombs(2), { sign: 1, m: 3.2, exp: -19 });
  assert.deepEqual(coulombs(3), { sign: 1, m: 4.8, exp: -19 });
  assert.deepEqual(coulombs(18), { sign: 1, m: 2.88, exp: -18 });
  assert.deepEqual(coulombs(0), { sign: 0, m: 0, exp: 0 });
});

test('charge-atom: the test’s choices are distinct, the right one first', () => {
  const r = removedChoices(18, 2).map((c) => c.v);
  assert.deepEqual(r, [2, -2, 0, 18]);
  assert.equal(new Set(r).size, 4);
  const e = extraChoices();
  assert.equal(e[0].key, 'right');
  assert.deepEqual(e[0].q, { sign: -1, m: 1.6, exp: -19 });
  assert.equal(new Set(e.map((c) => JSON.stringify(c.q))).size, 4);
});
