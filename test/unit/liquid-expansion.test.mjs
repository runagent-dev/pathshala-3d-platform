// The maths of the liquid-expansion figure (book pages 171-173, topic 6.3.2): the level in the flask's neck (falls from
// A to B because the bulb expands first, then rises to C), V_B = AB × area, V_L = BC × area, V_a = V_L − V_B, and the
// thermometer's column. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/liquid-expansion/src/reading.js';
import { STRINGS, createI18n } from '../../assets/liquid-expansion/src/i18n.js';

describe('liquid-expansion: the flask (Fig 6.06)', () => {
  it('starts at the mark A, falls to B once the bulb has expanded, then rises to C', () => {
    const { AB, BC } = r.FLASK;
    assert.equal(r.levelOffset(0), 0);
    assert.ok(Math.abs(r.levelOffset(r.H1) + AB) < 1e-9, 'at the end of step 1 the level is AB below A');
    assert.ok(Math.abs(r.levelOffset(1) - (BC - AB)) < 1e-9, 'at the end the level is AC = BC − AB above A');
  });

  it('only falls, then only rises (never wobbles)', () => {
    let prev = 0;
    for (let i = 0; i <= 30; i++) {
      const y = r.levelOffset((i / 30) * r.H1);
      assert.ok(y <= prev + 1e-9);
      prev = y;
    }
    for (let i = 0; i <= 70; i++) {
      const y = r.levelOffset(r.H1 + (i / 70) * (1 - r.H1));
      assert.ok(y >= prev - 1e-9);
      prev = y;
    }
  });

  it('gives the container V_B = AB × area, the liquid V_L = BC × area and V_a = V_L − V_B', () => {
    const v = r.volumes({ AB: 1.5, BC: 3 }, 2);
    assert.equal(v.VB, 3);
    assert.equal(v.VL, 6);
    assert.equal(v.Va, 3);
    assert.equal(v.AC, 1.5);
    assert.equal(r.volumes({ AB: 1, BC: 3 }).Va, 4);
    assert.equal(r.volumes({ AB: 2, BC: 5 }).Va, 6);
  });

  it('makes the apparent expansion what is seen: the rise from A to C times the area', () => {
    for (const d of [{ AB: 1, BC: 3 }, { AB: 1, BC: 4 }, { AB: 2, BC: 5 }, r.FLASK]) {
      const v = r.volumes(d);
      assert.ok(Math.abs(v.Va - r.levelOffset(1, d) * r.NECK_AREA) < 1e-9);
    }
  });

  it('grows the bulb only while the container is expanding', () => {
    assert.equal(r.bulbScale(0), 1);
    assert.ok(r.bulbScale(r.H1) > 1);
    assert.equal(r.bulbScale(1), r.bulbScale(r.H1));
  });
});

describe('liquid-expansion: the thermometer (Fig 6.05)', () => {
  it('goes up, stays when taken out, comes down when shaken', () => {
    const [rest, warm, out, shaken] = r.THERMO_COLUMN;
    assert.equal(rest, r.THERMO.T0);
    assert.equal(warm, r.THERMO.hot);
    assert.equal(out, warm, 'the narrow bend holds the column');
    assert.equal(shaken, rest);
    assert.ok(warm > rest && warm < r.THERMO.TMAX);
  });

  it('reads with one decimal', () => {
    assert.equal(r.oneDecimal(39), '39.0');
    assert.equal(r.oneDecimal(36.66), '36.7');
  });
});

describe('liquid-expansion: words', () => {
  it('has the same keys in Bangla and English', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });
  it('writes numbers in Bangla digits', () => {
    const t = createI18n('bn');
    assert.equal(t.num('39.0'), '৩৯.০');
    assert.match(t('out_t1', { T: '39.0', u: '°C' }), /৩৯\.০/);
  });
});
