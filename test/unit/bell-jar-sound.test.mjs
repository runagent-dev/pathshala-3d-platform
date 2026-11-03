// The bell-jar experiment (book page 199, topic 7.3): the pump empties the jar slowly and reaches zero, the valve
// fills it again, the gauge's pressure and the percentage agree, the sound follows the air, the hammer keeps striking
// at the same rate and every string exists in both languages. Pure
// code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/bell-jar-sound/src/reading.js';
import { STRINGS, createI18n } from '../../assets/bell-jar-sound/src/i18n.js';

describe('bell-jar-sound: the maths', () => {
  it('pumps the air out slowly at the end, yet reaches zero in about 7 s', () => {
    let f = 1;
    let t = 0;
    const at = {};
    while (f > 0 && t < 30) {
      f = r.pumpOut(f, 0.01);
      t += 0.01;
      if (!at.half && f <= 0.5) at.half = t;
    }
    assert.equal(f, 0);
    assert.ok(t > 6 && t < 9, `emptied in ${t} s`);
    assert.ok(at.half < 2, 'half the air goes in the first two seconds');
    assert.ok(Math.abs(r.pumpTime(1, 0) - t) < 0.05);
    assert.ok(r.pumpOut(0.1, 0.5) < 0.1);
  });

  it('lets the air back in within a few seconds', () => {
    let f = 0;
    let t = 0;
    while (f < 1 && t < 10) {
      f = r.letIn(f, 0.01);
      t += 0.01;
    }
    assert.equal(f, 1);
    assert.ok(t < 3, `filled in ${t} s`);
  });

  it('shows a pressure that agrees with the percentage', () => {
    assert.equal(r.pressure(1), r.P_ATM);
    assert.equal(r.kPaShown(1), 101);
    assert.equal(r.kPaShown(0), 0);
    assert.equal(r.kPaShown(0.3), 30);
  });

  it('makes the sound follow the air: loud, soft, faint, none', () => {
    assert.equal(r.loudWord(1), 'loud');
    assert.equal(r.loudWord(0.5), 'soft');
    assert.equal(r.loudWord(0.1), 'faint');
    assert.equal(r.loudWord(0), 'none');
    assert.equal(r.loudness(0), 0);
  });

  it('keeps the hammer striking at the same rate whatever the air', () => {
    assert.equal(r.strikesBy(1), r.STRIKES);
    assert.equal(r.hammerSwing(0), 0);
    assert.ok(r.hammerSwing(0.5 / r.STRIKES) > 0.99);
    assert.ok(r.hammerSwing(1 / r.STRIKES) < 1e-6);
  });

  it('turns the needle from −135° at 0 to +135° at 120 kPa, a full jar inside the scale', () => {
    assert.ok(Math.abs(r.needleAngle(0) + (135 * Math.PI) / 180) < 1e-9);
    assert.ok(Math.abs(r.needleAngle(120) - (135 * Math.PI) / 180) < 1e-9);
    assert.ok(r.needleAngle(r.P_ATM) < r.needleAngle(120));
  });

  it('reads air amounts by name, fraction or percentage', () => {
    assert.equal(r.airOf('vacuum'), 0);
    assert.equal(r.airOf('half'), 0.5);
    assert.equal(r.airOf(0.3), 0.3);
    assert.equal(r.airOf(40), 0.4);
    assert.equal(r.airOf('x'), 1);
  });
});

describe('bell-jar-sound: the words', () => {
  it('has every string in Bangla and English', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });
  it('writes numbers with Bangla digits and the unit after them', () => {
    const t = createI18n('bn');
    assert.equal(t('lbl_gauge', { p: 101 }), 'চাপ ১০১&nbsp;kPa');
    assert.ok(t('note', { c: 330 }).includes('৩৩০'));
    assert.ok(!/[0-9]/.test(t('why_water', { cw: 1493 }).replace(/m\/s|&nbsp;/g, '')));
  });
});
