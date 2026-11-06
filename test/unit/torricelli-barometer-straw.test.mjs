// The straw (book page 145, topic 5.4.1): a cold drink (about as dense as water) never rises more than 10.3 m (the
// book's 10.5 m straw is longer), the steps, the test's choices and the strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/torricelli-barometer-straw/src/reading.js';
import { STRINGS, createI18n } from '../../assets/torricelli-barometer-straw/src/i18n.js';

describe('torricelli-barometer-straw: the maths', () => {
  it('lifts a cold drink at most 10.3 m with the air’s pressure (76 cm of mercury × 13.6)', () => {
    assert.equal(r.RATIO, 13.6);
    assert.equal(r.waterColumn(), 10.336);
    assert.ok(Math.abs(r.columnPressure(r.H_WATER, r.RHO.drink) - r.columnPressure(r.H_HG, r.RHO.mercury)) < 1000);
    assert.equal(r.STRAW_LONG, 10.5);
    assert.ok(r.STRAW_LONG > r.H_WATER);
    assert.deepEqual(r.STEPS, ['rest', 'suck', 'max']);
  });

  it('gives four different heights for the test, 10.3 m first', () => {
    const c = r.waterChoices();
    assert.equal(c[0].v, 10.3);
    assert.equal(new Set(c.map((x) => x.v)).size, 4);
  });
});

describe('torricelli-barometer-straw: strings', () => {
  it('has every Bangla key in English and the other way round', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes numbers in Bangla digits through t.num', () => {
    const t = createI18n('bn');
    assert.ok(!/[0-9]/.test(t('rule_max', { h: 10.3 }).replace(/<[^>]+>/g, '')));
  });

  it('writes the test’s questions as plain text', () => {
    for (const lang of ['bn', 'en'])
      for (const [k, v] of Object.entries(STRINGS[lang]))
        if (/^q_(straw|st_where|st_suck|st_max)$/.test(k)) assert.ok(!/[<&]/.test(v), `${lang} ${k}`);
  });

  it('uses the book’s words', () => {
    const bn = Object.values(STRINGS.bn).join(' ');
    for (const w of ['স্ট্র', 'কোল্ড ড্রিংকস', 'চুমুক', 'বাতাসের চাপ', 'কার্যকর বল']) assert.ok(bn.includes(w), w);
  });
});
