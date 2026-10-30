// The maths of assets/mass-energy (book p119, topic 4.6): the book's reaction, E = mc², the fuel and the bulb.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  C,
  chainSplits,
  energy,
  energyPerSplit,
  fissionFraction,
  fuel,
  indianParts,
  MASS,
  NUCLEUS,
  reaction,
  sci,
  sigRound,
  U_KG,
} from '../../assets/mass-energy/src/reading.js';

test('the book: c = 3 × 10⁸ m/s, so 1 g fully turned into energy gives 9 × 10¹³ J', () => {
  assert.equal(C, 3e8);
  assert.equal(energy(0.001), 9e13);
  assert.equal(energy(1), 9e16);
});

test("the book's reaction keeps the nucleons and the charge: 1 + 235 = 92 + 141 + 3, 0 + 92 = 36 + 56", () => {
  assert.equal(NUCLEUS.n.A + NUCLEUS.U.A, NUCLEUS.Kr.A + NUCLEUS.Ba.A + 3 * NUCLEUS.n.A);
  assert.equal(NUCLEUS.n.Z + NUCLEUS.U.Z, NUCLEUS.Kr.Z + NUCLEUS.Ba.Z + 3 * NUCLEUS.n.Z);
});

test('the right side weighs 0.1859 u less than the left, about 173 MeV', () => {
  const r = reaction();
  assert.equal(r.left, 236.0526);
  assert.equal(r.right, 235.8667);
  assert.equal(r.defect, 0.1859);
  assert.ok(r.right < r.left);
  const MeV = r.defect * 931.494;
  assert.ok(MeV > 170 && MeV < 176, `${MeV} MeV`);
});

test('one split gives 2.78 × 10⁻¹¹ J (E = mc² with the missing mass in kg)', () => {
  const E = energyPerSplit();
  assert.equal(+E.toPrecision(3), 2.78e-11);
  assert.equal(E, reaction().defect * U_KG * C * C);
});

test('splitting turns about 0.079% of the uranium into energy', () => {
  const f = fissionFraction();
  assert.equal(+(f * 100).toFixed(3), 0.079);
  assert.equal(f, reaction().defect / MASS.U);
});

test('the fuel: 1 g split lights a 100 W bulb for about 23 years; fully converted, about 28 500 years', () => {
  const split = fuel(1);
  assert.equal(+split.E.toPrecision(3), 7.12e10);
  assert.equal(sigRound(split.years, 2), 23);
  const full = fuel(1, 'full');
  assert.equal(full.E, 9e13);
  assert.equal(sigRound(full.years, 2), 29000);
  // ten times the fuel, ten times the energy
  assert.ok(Math.abs(fuel(10).E / split.E - 10) < 1e-9);
  assert.equal(sigRound(fuel(1000, 'full').years, 2), 29000000);
});

test('scientific notation for the panel', () => {
  assert.deepEqual(sci(2.7782e-11), { m: '2.78', e: -11 });
  assert.deepEqual(sci(9e16), { m: '9', e: 16 });
  assert.deepEqual(sci(3e8), { m: '3', e: 8 });
  assert.deepEqual(sci(9.996e13), { m: '1', e: 14 });
  assert.deepEqual(sci(7.1182e10), { m: '7.12', e: 10 });
});

test('big numbers the Bangladeshi way: 2 crore 90 lakh, 2 lakh 90 thousand', () => {
  assert.deepEqual(indianParts(29_000_000), { crore: 2, lakh: 90, thousand: 0, rest: 0 });
  assert.deepEqual(indianParts(290_000), { crore: 0, lakh: 2, thousand: 90, rest: 0 });
  assert.deepEqual(indianParts(2_300), { crore: 0, lakh: 0, thousand: 2, rest: 300 });
});

test('the chain: 1 + 3 + 9 = 13 nuclei after three steps', () => {
  assert.equal(chainSplits(1), 1);
  assert.equal(chainSplits(3), 13);
});
