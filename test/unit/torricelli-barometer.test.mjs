// The maths of Torricelli's experiment (book pages 145–146, topic 5.4.1): P = hρg with the book's numbers, 76 cm of
// mercury ≈ 10⁵ N/m² ≈ 10.3 m of water, the tilted tube, the column up a mountain, the tank's jet, numbers grouped the
// Bangladeshi way, the test's choices and the strings. Pure code, no browser.
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

  it('keeps the vertical height of a tilted column and lengthens it along the tube', () => {
    assert.equal(r.tiltLength(0.76, 0), 0.76);
    assert.equal(r.toCm(r.tiltLength(0.76, 30)), 88);
    assert.equal(r.toCm(r.tiltLength(0.76, 40)), 99);
    for (const deg of r.TILTS) {
      const along = r.tiltLength(0.76, deg);
      assert.ok(Math.abs(along * Math.cos((deg * Math.PI) / 180) - 0.76) < 1e-9);
      // a vacuum is left at the top at every tilt the student can choose
      assert.ok(r.vacuumLength(0.76, deg) > 0.015, `vacuum at ${deg}°`);
    }
    assert.ok(r.vacuumLength(0.76, 0) > r.vacuumLength(0.76, 40));
  });

  it('lowers the column higher up: about 76, 67, 60 and 53 cm at 0, 1000, 2000 and 3000 m', () => {
    assert.deepEqual(
      r.ALTITUDES.map((z) => r.toCm(r.columnAt(z))),
      [76, 67, 60, 53],
    );
    assert.equal(r.columnPressure(r.columnAt(2000), r.RHO.mercury), 79968);
  });

  it('shoots the tank’s jet farther the deeper the hole is under the surface, and not at all at the surface', () => {
    assert.equal(r.holeDepth(), 0.22);
    assert.equal(r.columnPressure(r.holeDepth(), r.RHO.water), 2156);
    assert.ok(r.jetReach(0.22) > r.jetReach(0.1));
    assert.equal(r.jetReach(0), 0);
    assert.ok(r.holeDepth(r.TANK.low) > 0);
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
  it('reads the air’s pressure from the column, against the usual mistakes', () => {
    const c = r.pressureChoices(60);
    assert.equal(c[0].v, 79968);
    assert.equal(new Set(c.map((x) => x.v)).size, 4);
    assert.deepEqual(
      c.map((x) => x.key),
      ['right', 'cm', 'water', 'sea'],
    );
  });

  it('asks the vertical height of a tilted column: always 76, never the length along the tube', () => {
    for (const deg of [20, 30, 40]) {
      const c = r.tiltChoices(deg);
      assert.equal(c[0].v, 76);
      assert.equal(c.length, 4);
      assert.equal(new Set(c.map((x) => x.v)).size, 4, `${deg}°: four different answers`);
    }
  });

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
      for (const [k, v] of Object.entries(STRINGS[lang]))
        if (/^q_(vacuum|tilt|mt|water|straw|tank)$/.test(k)) assert.ok(!/[<&]/.test(v), `${lang} ${k}`);
  });

  it('uses the book’s words', () => {
    const bn = Object.values(STRINGS.bn).join(' ');
    for (const w of ['শূন্যতা', 'ব্যারোমিটার', 'কার্যকর বল', 'কোল্ড ড্রিংকস', 'চুমুক', 'পারদ স্তম্ভ', 'গুণ']) assert.ok(bn.includes(w), w);
  });
});
