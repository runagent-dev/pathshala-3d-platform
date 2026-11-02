// The maths of Torricelli's experiment (book pages 145–146, topic 5.4.1): P = hρg with the book's numbers, 76 cm of
// mercury ≈ 10⁵ N/m² ≈ 10.3 m of water, the vacuum left at the top, numbers grouped the Bangladeshi way, the test's
// choices and the strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/torricelli-barometer/src/reading.js';
import { STRINGS, createI18n } from '../../assets/torricelli-barometer/src/i18n.js';

describe('torricelli-barometer: P = hρg', () => {
  it('uses the book’s numbers: mercury 13.6 times as dense as water, g = 9.8', () => {
    assert.equal(r.RATIO, 13.6);
    assert.equal(r.G, 9.8);
    assert.equal(r.H_HG, 0.76);
    assert.equal(r.H_WATER, 10.3);
  });

  it('makes 76 cm of mercury about 10⁵ N/m², the air’s pressure of topic 5.4', () => {
    const P = r.columnPressure(0.76, r.RHO.mercury);
    assert.equal(P, 101293); // 0.76 × 13600 × 9.8 = 101292.8
    assert.ok(Math.abs(P - 1e5) / 1e5 < 0.02);
  });

  it('holds up 10.3 m of water (or cold drink) with the same pressure', () => {
    assert.equal(r.waterColumn(), 10.336);
    assert.ok(Math.abs(r.waterColumn() - r.H_WATER) < 0.05);
    const Pw = r.columnPressure(r.H_WATER, r.RHO.water);
    assert.equal(Pw, 100940);
    assert.ok(Math.abs(Pw - r.columnPressure(r.H_HG, r.RHO.mercury)) / Pw < 0.01);
    assert.ok(Math.abs(r.columnFor(r.columnPressure(r.H_HG, r.RHO.mercury), r.RHO.water) - 10.336) < 0.001);
  });

  it('leaves a vacuum at the top of the upright tube', () => {
    assert.ok(r.vacuumLength(0.76, 0) > 0.2);
  });

  it('groups digits the Bangladeshi way in Bangla and in threes in English', () => {
    assert.equal(r.groupBD(101293), '1,01,293');
    assert.equal(r.groupBD(13600), '13,600');
    assert.equal(r.groupBD(1960), '1,960');
    assert.equal(r.groupBD(980), '980');
    assert.equal(r.groupIntl(101293), '101,293');
    assert.equal(r.round(0.1 + 0.2, 2), 0.3);
  });
});

describe('torricelli-barometer: the test’s choices', () => {
  it('gives four different water columns, 10.3 m first', () => {
    const c = r.waterChoices();
    assert.equal(c[0].v, 10.3);
    assert.equal(new Set(c.map((x) => x.v)).size, 4);
  });
});

describe('torricelli-barometer: strings', () => {
  it('has every Bangla key in English and the other way round', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes numbers in Bangla digits through t.num and puts units in', () => {
    const t = createI18n('bn');
    assert.equal(t.num('0.76'), '০.৭৬');
    assert.ok(t('lbl_h', { h: 76 }).includes('৭৬&nbsp;cm'));
    assert.ok(!/[0-9]/.test(t('out_t_settled', { h: 76 }).replace(/<[^>]+>/g, '')));
  });

  it('writes the test’s questions as plain text (the quiz shows them as text, not HTML)', () => {
    for (const lang of ['bn', 'en'])
      for (const [k, v] of Object.entries(STRINGS[lang])) if (/^q_(vacuum|hold|water)$/.test(k)) assert.ok(!/[<&]/.test(v), `${lang} ${k}`);
  });

  it('uses the book’s words', () => {
    const bn = Object.values(STRINGS.bn).join(' ');
    for (const w of ['শূন্যতা', 'পারদ স্তম্ভ', 'বাতাসের চাপ', 'ব্যারোমিটার', 'উল্টে']) assert.ok(bn.includes(w), w);
  });
});
