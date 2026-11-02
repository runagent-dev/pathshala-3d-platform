// The maths of the evaporation figure (book topic 6.4, pages 177–178): two vessels with the same amount of liquid, one
// thing different about the second, and how much each has left as time goes on. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/evaporation/src/reading.js';
import { STRINGS, createI18n } from '../../assets/evaporation/src/i18n.js';

describe('evaporation: the six things it depends on', () => {
  it('lists them in the book’s order and has a case for each', () => {
    assert.deepEqual(r.FACTORS, ['wind', 'area', 'liquid', 'pressure', 'warm', 'dry']);
    for (const f of r.FACTORS) assert.ok(r.CASES[f].plain && r.CASES[f].changed, f);
  });

  it('starts both vessels with the same amount of liquid', () => {
    for (const f of r.FACTORS) {
      assert.equal(r.remaining(r.CASES[f].plain, 0), r.V0);
      assert.equal(r.remaining(r.CASES[f].changed, 0), r.V0);
      assert.equal(r.percentLeft(r.CASES[f].plain, 0), 100);
    }
  });

  it('loses the liquid faster in the changed vessel, whichever factor it is', () => {
    for (const f of r.FACTORS) {
      const { plain, changed } = r.CASES[f];
      assert.ok(r.lossRate(changed) > r.lossRate(plain), `${f}: faster`);
      for (const t of [1, 3, 5, 8]) assert.ok(r.remaining(changed, t) <= r.remaining(plain, t), `${f} at ${t}`);
      assert.equal(r.emptierAt(f, 5), 'changed', f);
    }
  });

  it('says "same" before anything has happened', () => {
    for (const f of r.FACTORS) assert.equal(r.emptierAt(f, 0), 'same');
  });
});

describe('evaporation: how much is left', () => {
  it('takes 5 cc a time unit from a plain 50 cm² dish: 44% is left at the end', () => {
    const plain = r.CASES.wind.plain;
    assert.equal(r.lossRate(plain), 5);
    assert.equal(r.remaining(plain, 10), 40);
    assert.equal(r.percentLeft(plain, 10), 44);
    assert.equal(r.percentLeft(plain, 5), 72);
  });

  it('empties the faster vessels before the end of the run, and not the slow ones', () => {
    assert.equal(r.dryAt(r.CASES.wind.changed), 6);
    assert.equal(r.dryAt(r.CASES.liquid.changed), 4.5);
    assert.equal(r.dryAt(r.CASES.pressure.changed), 3);
    assert.equal(r.dryAt(r.CASES.wind.plain), null);
    assert.equal(r.remaining(r.CASES.pressure.changed, 5), 0);
    assert.equal(r.percentLeft(r.CASES.pressure.changed, 10), 0);
  });

  it('never goes below nothing, and stops the clock at the end of the run', () => {
    assert.equal(r.remaining(r.CASES.pressure.changed, 99), 0);
    assert.equal(r.remaining(r.CASES.wind.plain, 99), r.remaining(r.CASES.wind.plain, r.T_END));
    assert.equal(r.remaining(r.CASES.wind.plain, -4), r.V0);
  });

  it('is the book’s glass and plate: the same water dries sooner in the wide plate', () => {
    const { plain: glass, changed: plate } = r.CASES.area;
    assert.ok(plate.A > glass.A);
    assert.equal(plate.k, glass.k, 'the same liquid, the same rate per cm²');
    assert.equal(r.percentLeft(glass, 10), 67);
    assert.equal(r.dryAt(plate), 7.5);
    assert.ok(r.percentLeft(plate, 5) < r.percentLeft(glass, 5));
  });

  it('gives the same water a deep layer in the glass and a thin one on the plate', () => {
    const { plain: glass, changed: plate } = r.CASES.area;
    assert.equal(r.depth(glass, 0), 3);
    assert.equal(r.depth(plate, 0), 0.75);
    assert.ok(r.depth(glass, 5) < r.depth(glass, 0));
  });
});

describe('evaporation: the vapour drawn', () => {
  it('is strongest for the fastest case and none once a vessel is dry', () => {
    const fastest = Math.max(...r.FACTORS.map((f) => r.vapour(r.CASES[f].changed, 0)));
    assert.equal(fastest, 1);
    assert.equal(r.vapour(r.CASES.pressure.changed, 5), 0);
    assert.ok(r.vapour(r.CASES.wind.plain, 0) < r.vapour(r.CASES.wind.changed, 0));
  });

  it('gives a round vessel the radius of its surface', () => {
    assert.ok(Math.abs(r.radiusOf(50) - Math.sqrt(50 / Math.PI)) < 1e-12);
    assert.ok(Math.abs(Math.PI * r.radiusOf(120) ** 2 - 120) < 1e-9);
  });
});

describe('evaporation: the words', () => {
  it('has every Bangla key in English too, and the other way round', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('has a chip, a full name, two vessel names and a rule for every factor', () => {
    const t = createI18n('bn');
    for (const f of r.FACTORS) for (const k of [`f_${f}`, `fn_${f}`, `n_${f}_plain`, `n_${f}_changed`, `rule_${f}`]) assert.notEqual(t(k), k, k);
  });

  it('writes numbers in Bangla digits', () => {
    const t = createI18n('bn');
    assert.equal(t.num(44), '৪৪');
    assert.equal(t('q_count', { i: 3, n: 5 }), 'প্রশ্ন ৩ / ৫');
  });
});
