// Torricelli's tube tilted (book page 146, topic 5.4.1): the vertical height stays 76 cm, the length along the tube
// grows as 76 / cos θ, a vacuum is left at every tilt; the test's choices and the strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/torricelli-barometer-tilt/src/reading.js';
import { STRINGS, createI18n } from '../../assets/torricelli-barometer-tilt/src/i18n.js';

describe('torricelli-barometer-tilt: the maths', () => {
  it('keeps the vertical height of a tilted column and lengthens it along the tube', () => {
    assert.equal(r.tiltLength(0.76, 0), 0.76);
    assert.equal(r.toCm(r.tiltLength(0.76, 30)), 88);
    assert.equal(r.toCm(r.tiltLength(0.76, 40)), 99);
    for (const deg of r.TILTS) {
      assert.ok(Math.abs(r.tiltLength(0.76, deg) * Math.cos((deg * Math.PI) / 180) - 0.76) < 1e-9);
      assert.ok(r.vacuumLength(0.76, deg) > 0.015, `vacuum at ${deg}°`);
    }
    assert.ok(r.vacuumLength(0.76, 0) > r.vacuumLength(0.76, 40));
  });

  it('asks the vertical height: always 76, never the length along the tube', () => {
    for (const deg of [20, 30, 40]) {
      const c = r.tiltChoices(deg);
      assert.equal(c[0].v, 76);
      assert.equal(new Set(c.map((x) => x.v)).size, 4, `${deg}°: four different answers`);
    }
  });
});

describe('torricelli-barometer-tilt: strings', () => {
  it('has every Bangla key in English and the other way round', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes numbers in Bangla digits through t.num', () => {
    const t = createI18n('bn');
    assert.ok(!/[0-9]/.test(t('out_tilt', { deg: 30, h: 76 }).replace(/<[^>]+>/g, '')));
  });

  it('writes the test’s questions as plain text', () => {
    for (const lang of ['bn', 'en'])
      for (const [k, v] of Object.entries(STRINGS[lang])) if (/^q_(tilt|tilt_why)$/.test(k)) assert.ok(!/[<&]/.test(v), `${lang} ${k}`);
  });

  it('uses the book’s words', () => {
    const bn = Object.values(STRINGS.bn).join(' ');
    for (const w of ['পারদ স্তম্ভ', 'শূন্যতা', 'বাতাসের চাপ', 'খাড়া উচ্চতা']) assert.ok(bn.includes(w), w);
  });
});
