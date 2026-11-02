// Water instead of mercury (book page 145, topic 5.4.1): mercury 13.6 times as dense as water, so the air that holds
// up 76 cm of mercury holds up about 10.3 m of water; the test's choices and the strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/torricelli-water-barometer/src/reading.js';
import { STRINGS, createI18n } from '../../assets/torricelli-water-barometer/src/i18n.js';

describe('torricelli-water-barometer: the maths', () => {
  it('holds up 10.3 m of water with the pressure of 76 cm of mercury', () => {
    assert.equal(r.RATIO, 13.6);
    assert.equal(r.waterColumn(), 10.336);
    assert.equal(r.columnPressure(0.76, r.RHO.mercury), 101293);
    assert.equal(r.columnPressure(r.H_WATER, r.RHO.water), 100940);
    assert.ok(Math.abs(r.columnFor(r.columnPressure(r.H_HG, r.RHO.mercury), r.RHO.water) - 10.336) < 0.001);
  });

  it('gives four different water columns, 10.3 m first', () => {
    const c = r.waterChoices();
    assert.equal(c[0].v, 10.3);
    assert.equal(new Set(c.map((x) => x.v)).size, 4);
  });
});

describe('torricelli-water-barometer: strings', () => {
  it('has every Bangla key in English and the other way round', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes numbers in Bangla digits through t.num', () => {
    const t = createI18n('bn');
    assert.ok(!/[0-9]/.test(t('rule_water', { k: 13.6, hHg: 76, h: 10.3 }).replace(/<[^>]+>/g, '')));
  });

  it('writes the test’s questions as plain text', () => {
    for (const lang of ['bn', 'en'])
      for (const [k, v] of Object.entries(STRINGS[lang])) if (/^q_(water|w_why|w_vac)$/.test(k)) assert.ok(!/[<&]/.test(v), `${lang} ${k}`);
  });

  it('uses the book’s words', () => {
    const bn = Object.values(STRINGS.bn).join(' ');
    for (const w of ['ঘনত্ব', 'গুণ', 'শূন্যতা', 'পারদ স্তম্ভ', 'কোল্ড ড্রিংকস']) assert.ok(bn.includes(w), w);
  });
});
