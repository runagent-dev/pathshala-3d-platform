// The maths of the specific-heat figure (book pages 178–179, topic 6.5): s = Q / m(T₂ − T₁), C = ms, the book's example
// of 10 kg of gold (s = 230) against 10 kg of water (s = 4200), and the test's choices. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/specific-heat/src/reading.js';
import { STRINGS, createI18n } from '../../assets/specific-heat/src/i18n.js';

describe('specific heat: s = Q / m(T₂ − T₁) and C = ms', () => {
  it("has the book's values and the book's heat capacities", () => {
    assert.equal(r.S.gold, 230);
    assert.equal(r.S.water, 4200);
    assert.equal(r.capacity(10, r.S.gold), 2300); // 10 × 230 J K⁻¹
    assert.equal(r.capacity(10, r.S.water), 42000); // 10 × 4200 J K⁻¹
    assert.ok(r.capacity(10, r.S.water) / r.capacity(10, r.S.gold) > 18); // "প্রায় 20 গুণ"
  });
  it('one press of the stove warms 10 kg of water by exactly 1 K and the gold by about 18 K', () => {
    assert.equal(r.rise(r.STEP_Q, r.MASS, r.S.water), 1);
    assert.equal(r.round(r.rise(r.STEP_Q, r.MASS, r.S.gold), 2), 18.26);
    assert.equal(r.finalT(r.STEP_Q, r.MASS, r.S.water), 31);
  });
  it('gives the heat back as s = Q / m(T₂ − T₁) for every press', () => {
    for (const id of r.IDS)
      for (let n = 1; n <= r.MAX_STEPS; n++) {
        const Q = r.heatAfter(n);
        const dT = r.rise(Q, r.MASS, r.S[id]);
        assert.ok(Math.abs(r.specific(Q, r.MASS, dT) - r.S[id]) < 1e-9);
      }
    assert.equal(r.rise(0, 10, 230), 0);
    assert.equal(r.heatAfter(4), 168000);
  });
  it('groups numbers the Bangladeshi way and in threes', () => {
    assert.equal(r.groupBD(42000), '42,000');
    assert.equal(r.groupBD(168000), '1,68,000');
    assert.equal(r.groupIntl(168000), '168,000');
    assert.equal(r.dec1(18.26), '18.3');
    assert.equal(r.dec1(4), '4');
  });
});

describe('specific heat: the test', () => {
  it('asks s of the gold given 23,000 J: it rises exactly 10 K and s = 230', () => {
    assert.equal(r.rise(r.Q3.Q, r.Q3.m, r.Q3.s), 10);
    const c = r.specificChoices(r.Q3);
    assert.equal(c[0].key, 'right');
    assert.equal(c[0].v, 230);
    assert.equal(c[1].v, 2300); // forgot m: that is C
    assert.equal(c[2].v, 100); // m × ΔT
    assert.equal(c[3].v, 23); // divided by m twice
    assert.equal(new Set(c.map((x) => x.v)).size, 4);
  });
  it('asks C = ms for the gold and for the water, with distinct wrong answers', () => {
    for (const id of r.IDS) {
      const c = r.capacityChoices(id);
      assert.equal(c[0].v, r.MASS * r.S[id]);
      assert.equal(new Set(c.map((x) => x.v)).size, 4);
    }
    assert.deepEqual(
      r.capacityChoices('gold').map((x) => x.v),
      [2300, 230, 23, 23000],
    );
  });
});

describe('specific heat: the words', () => {
  it('has every Bangla key in English too, and never hard-codes Bangla digits', () => {
    const bn = Object.keys(STRINGS.bn);
    const en = Object.keys(STRINGS.en);
    assert.deepEqual(
      bn.filter((k) => !en.includes(k)),
      [],
    );
    assert.deepEqual(
      en.filter((k) => !bn.includes(k)),
      [],
    );
    for (const [k, v] of Object.entries(STRINGS.bn)) assert.ok(!/[০-৯]/.test(v), `${k} has a Bangla digit`);
  });
  it('writes numbers with Bangla digits and the book’s unit symbols', () => {
    const t = createI18n('bn');
    assert.equal(t.num(42000), '৪২০০০');
    assert.match(t('lbl_name', { name: 'পানি', m: 10 }), /১০ kg/);
    assert.match(t('sum_C', { m: 10, s: '২৩০', C: '২,৩০০' }), /J K<sup>−1<\/sup>/);
  });
});
