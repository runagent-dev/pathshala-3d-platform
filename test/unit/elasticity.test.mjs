// The maths of the elasticity figure (book pages 147–148, topic 5.5): বিকৃতি = (L − L₀)/L₀, পীড়ন = F/A in Pa, their
// constant ratio within the elastic limit (Hooke's law), the spring giving way past it and keeping a permanent set,
// the test's choices, and the strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/elasticity/src/reading.js';
import { STRINGS, createI18n } from '../../assets/elasticity/src/i18n.js';

describe('elasticity: strain and stress', () => {
  it('stretches 2 cm for every 1 N within the limit: x, then 2x', () => {
    assert.equal(r.lengthOf(r.FRESH, 0), 20);
    assert.equal(r.stretchOf(r.FRESH, 1), 2);
    assert.equal(r.stretchOf(r.FRESH, 2), 4);
    assert.equal(r.stretchOf(r.FRESH, 4), 8);
  });
  it('strain = (L − L₀)/L₀ has no unit; stress = F/A in Pa', () => {
    assert.equal(r.strain(r.FRESH, 2), 0.2);
    assert.equal(r.strain(r.FRESH, 3), 0.3);
    assert.equal(r.round((r.lengthOf(r.FRESH, 3) - r.L0) / r.L0), r.strain(r.FRESH, 3));
    assert.equal(r.stress(1), 100000);
    assert.equal(r.stress(4), 400000);
    assert.equal(r.AREA_M2 * 1e6, r.AREA_MM2); // 10 mm² = 0.00001 m²
  });
  it('stress ÷ strain is the same constant at every load within the limit (Hooke’s law)', () => {
    for (let n = 1; n <= r.LIMIT_N; n++) {
      assert.equal(r.ratio(r.FRESH, n), r.MODULUS);
      assert.ok(r.onHookeLine(r.FRESH, n));
    }
    assert.equal(r.ratio(r.FRESH, 0), null);
  });
});

describe('elasticity: past the elastic limit', () => {
  it('gives way: five weights stretch it far more than 5x', () => {
    const sp = r.load(r.FRESH, 5);
    assert.ok(r.overstretched(sp));
    assert.equal(r.stretchOf(sp, 5), 13);
    assert.ok(r.stretchOf(sp, 5) > 5 * r.stretchOf(r.FRESH, 1));
    assert.ok(r.ratio(sp, 5) < r.MODULUS);
    assert.equal(r.stretchOf(r.load(sp, 6), 6), 19);
  });
  it('keeps a permanent set with the weights off; within the limit it comes back', () => {
    let sp = r.FRESH;
    for (const n of [1, 2, 3, 4, 0]) sp = r.load(sp, n);
    assert.equal(r.lengthOf(sp, 0), 20);
    for (const n of [5, 6, 0]) sp = r.load(sp, n);
    assert.equal(r.lengthOf(sp, 0), 27);
    assert.equal(sp.peak, 6);
    // loaded again it stretches along a straight line from the set
    assert.equal(r.stretchOf(sp, 2), 11);
    assert.ok(!r.onHookeLine(sp, 2));
  });
  it('never goes past six weights or below none', () => {
    assert.deepEqual(r.load(r.FRESH, 9), { set: 0.35, peak: 6 });
    assert.deepEqual(r.load(r.FRESH, -2), { set: 0, peak: 0 });
  });
});

describe('elasticity: numbers in words and the test', () => {
  it('groups digits the Bangladeshi and the international way', () => {
    assert.equal(r.groupBD(1000000), '10,00,000');
    assert.equal(r.groupBD(300000), '3,00,000');
    assert.equal(r.groupIntl(1000000), '1,000,000');
    assert.equal(r.lakh(300000), 3);
  });
  it('has four different choices, the right one first, for every question', () => {
    const sets = [
      ...[1, 2, 3].map((n) => r.strainChoices(n)),
      ...[2, 3, 4].map((n) => r.stressChoices(n)),
      ...[3, 4].map((n) => r.hookeChoices(n)),
      r.limitChoices(),
    ];
    for (const c of sets) {
      assert.equal(c.length, 4);
      assert.equal(c[0].key, 'right');
      assert.equal(new Set(c.map((x) => x.key)).size, 4);
      // the same number may come twice only with and without a unit (strain: 0.2 and 0.2 cm)
      const vals = c.filter((x) => x.key !== 'unit').map((x) => x.v);
      assert.equal(new Set(vals).size, vals.length);
    }
    assert.equal(r.strainChoices(2)[0].v, 0.2);
    assert.equal(r.stressChoices(3)[0].v, 300000);
    assert.equal(r.stressChoices(3).find((x) => x.key === 'mm2').v, 0.3);
    assert.equal(r.hookeChoices(3)[0].v, 6);
    assert.equal(r.limitChoices()[0].v, 4);
  });
  it('has every Bangla string in English too, and Bangla digits', () => {
    for (const k of Object.keys(STRINGS.bn)) assert.ok(k in STRINGS.en, k);
    const t = createI18n('bn');
    assert.equal(t.num(0.35), '০.৩৫');
    assert.match(t('out_times', { n: t.num(2), x: t.num(4) }), /২টি ওজন/);
    // the questions are plain text (the test shows them as text, not HTML)
    for (const k of ['q_strain', 'q_stress', 'q_hooke', 'q_limit', 'q_set']) {
      assert.doesNotMatch(STRINGS.bn[k], /[<&]/, k);
      assert.doesNotMatch(STRINGS.en[k], /[<&]/, k);
    }
  });
});
