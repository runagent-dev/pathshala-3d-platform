// The barometer up a mountain (book page 146, topic 5.4.1): about 76, 67, 60 and 53 cm at 0, 1000, 2000 and 3000 m,
// the air's pressure by P = hρg, numbers grouped the Bangladeshi way, the test's choices and the strings. Pure code,
// no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/torricelli-barometer-mountain/src/reading.js';
import { STRINGS, createI18n } from '../../assets/torricelli-barometer-mountain/src/i18n.js';

describe('torricelli-barometer-mountain: the maths', () => {
  it('lowers the column higher up: about 76, 67, 60 and 53 cm', () => {
    assert.deepEqual(
      r.ALTITUDES.map((z) => r.toCm(r.columnAt(z))),
      [76, 67, 60, 53],
    );
    assert.equal(r.columnPressure(0.76, r.RHO.mercury), 101293);
    assert.equal(r.columnPressure(r.columnAt(2000), r.RHO.mercury), 79968);
    for (const z of r.ALTITUDES) assert.ok(r.vacuumLength(r.columnAt(z), 0) > 0.2);
  });

  it('groups digits the Bangladeshi way in Bangla and in threes in English', () => {
    assert.equal(r.groupBD(3000), '3,000');
    assert.equal(r.groupBD(101293), '1,01,293');
    assert.equal(r.groupIntl(101293), '101,293');
  });

  it('gives four different readings for the test, the right one first', () => {
    for (const z of r.ALTITUDES.slice(1)) {
      const cm = r.toCm(r.columnAt(z));
      const c = r.readChoices(cm);
      assert.equal(c[0].v, cm);
      assert.equal(new Set(c.map((x) => x.v)).size, 4);
    }
  });
});

describe('torricelli-barometer-mountain: strings', () => {
  it('has every Bangla key in English and the other way round', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes numbers in Bangla digits through t.num', () => {
    const t = createI18n('bn');
    assert.ok(!/[0-9]/.test(t('out_mt', { z: '2,000', h: 60 }).replace(/<[^>]+>/g, '')));
  });

  it('writes the test’s questions as plain text', () => {
    for (const lang of ['bn', 'en'])
      for (const [k, v] of Object.entries(STRINGS[lang])) if (/^q_mt_\w+$/.test(k)) assert.ok(!/[<&]/.test(v), `${lang} ${k}`);
  });

  it('uses the book’s words', () => {
    const bn = Object.values(STRINGS.bn).join(' ');
    for (const w of ['ব্যারোমিটার', 'পারদ স্তম্ভ', 'বাতাসের চাপ', 'শূন্যতা']) assert.ok(bn.includes(w), w);
  });
});
