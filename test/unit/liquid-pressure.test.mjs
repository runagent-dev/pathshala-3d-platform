// The maths of the liquid-pressure figure (book page 134, topic 5.3): P = hρg for water (ρ = 1000 kg m⁻³, g = 9.8 m s⁻²),
// the column's weight F = (Ahρ)g with P = F/A, the depths of the three holes, the jets (deeper hole, further jet, for
// this tank), numbers grouped the Bangladeshi way, the test's choices and the strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/liquid-pressure/src/reading.js';
import { STRINGS, createI18n } from '../../assets/liquid-pressure/src/i18n.js';

describe('liquid-pressure: P = hρg', () => {
  it('gives the pressure at each hole in pascal', () => {
    assert.equal(r.pressure(r.HOLES.top), 1960);
    assert.equal(r.pressure(r.HOLES.mid), 3920);
    assert.equal(r.pressure(r.HOLES.bot), 5880);
    assert.equal(r.pressure(1), 9800);
    assert.equal(r.pressure(0.35), 3430);
  });

  it('grows in step with the depth: twice the depth, twice the pressure', () => {
    for (const h of [0.05, 0.15, 0.2, 0.3, 0.45]) assert.equal(r.pressure(r.round(2 * h, 2)), r.round(2 * r.pressure(h), 6));
    assert.equal(r.pressure(r.HOLES.bot) / r.pressure(r.HOLES.top), 3);
  });

  it('is the weight of the column above A divided by A, whatever A', () => {
    const c = r.column(0.4);
    assert.equal(c.A, 0.01);
    assert.equal(c.V, 0.004);
    assert.equal(c.m, 4);
    assert.equal(c.F, 39.2);
    assert.equal(r.round(c.F / c.A, 6), r.pressure(0.4));
    for (const cm2 of [25, 100, 400]) assert.equal(r.round(r.column(0.6, cm2).F / r.toM2(cm2), 6), r.pressure(0.6));
  });

  it('adds about one atmosphere every ten metres of water, as the book says', () => {
    assert.equal(r.pressure(10), 98000);
    assert.ok(Math.abs(r.depthPerAtm() - 10) < 0.4);
    assert.equal(r.ATM, 101325);
  });

  it('keeps A on the grid: 0.05 … 0.95 m in steps of 0.05', () => {
    assert.equal(r.fixDepth(0.43), 0.45);
    assert.equal(r.fixDepth(0.42), 0.4);
    assert.equal(r.fixDepth(-1), 0.05);
    assert.equal(r.fixDepth(3), 0.95);
    assert.equal(r.fixDepth('0.6'), 0.6);
    assert.equal(r.holeAt(0.4), 'mid');
    assert.equal(r.holeAt(0.45), null);
  });
});

describe('liquid-pressure: the jets', () => {
  it('leave a deeper hole faster (v = √(2gh))', () => {
    assert.ok(r.jetSpeed(r.HOLES.bot) > r.jetSpeed(r.HOLES.mid));
    assert.ok(r.jetSpeed(r.HOLES.mid) > r.jetSpeed(r.HOLES.top));
    assert.ok(Math.abs(r.jetSpeed(0.4) - 2.8) < 1e-9);
  });

  it('land further for a deeper hole on this stand, as in the picture', () => {
    const [a, b, c] = r.HOLE_IDS.map((id) => r.jetReach(r.HOLES[id]));
    assert.ok(a < b && b < c, `${a} < ${b} < ${c}`);
    assert.ok(c - b > 0.1, 'the bottom two jets land visibly apart');
  });

  it('fall to the ground where they land', () => {
    for (const id of r.HOLE_IDS) {
      const h = r.HOLES[id];
      assert.ok(Math.abs(r.jetDrop(h, r.jetReach(h)) - r.holeHeight(h)) < 1e-9);
    }
  });
});

describe('liquid-pressure: numbers and the test', () => {
  it('groups digits the Bangladeshi way in Bangla and in threes in English', () => {
    assert.equal(r.groupBD(98000), '98,000');
    assert.equal(r.groupBD(980000), '9,80,000');
    assert.equal(r.groupBD(1960), '1,960');
    assert.equal(r.groupIntl(980000), '980,000');
  });

  it('builds four different choices for every hole, the right one first', () => {
    for (const id of r.HOLE_IDS) {
      const c = r.holeChoices(id);
      assert.equal(c[0].key, 'right');
      assert.equal(c[0].v, r.pressure(r.HOLES[id]));
      assert.equal(new Set(c.map((x) => x.v)).size, 4);
    }
    const ten = r.tenMetreChoices();
    assert.deepEqual(
      ten.map((x) => x.v),
      [98000, 9800, 10000, 980000],
    );
  });

  it('has every key in both languages and Bangla digits through t.num', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
    const t = createI18n('bn');
    assert.equal(t.num('0.4'), '০.৪');
    assert.match(t('lbl_h', { v: t.num('0.4') }), /০\.৪/);
    assert.match(t('sum', { h: '0.4', rho: '1000', g: '9.8', P: '3,920' }), /৩,৯২০/);
  });
});
