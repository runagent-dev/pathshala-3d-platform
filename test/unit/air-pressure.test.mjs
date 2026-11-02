// The maths of the air-pressure figure (book page 142, topic 5.4): the book's 10⁵ N/m², the pressure left in the box
// after each stroke, the force left over on one 10 cm × 10 cm face (F = ΔP × A, A in m²), the air column's weight over
// 1 m², numbers grouped the Bangladeshi way, the test's choices and the strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/air-pressure/src/reading.js';
import { STRINGS, createI18n } from '../../assets/air-pressure/src/i18n.js';

describe('air-pressure: the pump and the box', () => {
  it('starts with the book’s air pressure, 10⁵ N/m², inside and out', () => {
    assert.equal(r.P_AIR, 10 ** r.P_EXP);
    assert.equal(r.insidePressure(0), 100000);
    assert.equal(r.pressureDifference(0), 0);
  });

  it('takes 20,000 Pa out with each of five strokes, down to no air', () => {
    assert.equal(r.STROKES, 5);
    assert.deepEqual([0, 1, 2, 3, 4, 5].map(r.insidePressure), [100000, 80000, 60000, 40000, 20000, 0]);
    assert.equal(r.insidePressure(9), 0);
    assert.equal(r.insidePressure(-2), 100000);
    assert.equal(r.fixStrokes('3'), 3);
    assert.equal(r.fixStrokes(2.6), 3);
  });

  it('works out F = ΔP × A on one face, with 100 cm² = 0.01 m²', () => {
    assert.equal(r.toM2(r.FACE_CM2), 0.01);
    assert.deepEqual(
      [0, 1, 2, 3, 4, 5].map((n) => r.faceForce(r.pressureDifference(n))),
      [0, 200, 400, 600, 800, 1000],
    );
  });

  it('crumples more as the difference grows, from new (0) to crushed (1)', () => {
    const c = [0, 1, 2, 3, 4, 5].map((n) => r.crumpleFor(r.pressureDifference(n)));
    assert.equal(c[0], 0);
    assert.equal(c[5], 1);
    for (let i = 1; i < c.length; i++) assert.ok(c[i] > c[i - 1]);
  });

  it('draws a pressure arrow in proportion to the pressure', () => {
    assert.equal(r.arrowLength(r.P_AIR), 0.06);
    assert.equal(r.arrowLength(r.P_AIR / 2), 0.03);
    assert.equal(r.arrowLength(-5), 0);
  });
});

describe('air-pressure: the air column', () => {
  it('weighs 10⁵ N over 1 m², so P = F/A = 10⁵ N/m²', () => {
    assert.equal(r.columnWeight(), 100000);
    assert.equal(r.pressureOf(r.columnWeight(), r.COLUMN_AREA), r.P_AIR);
  });
});

describe('air-pressure: numbers and the test', () => {
  it('groups digits the Bangladeshi way in Bangla and in threes in English', () => {
    assert.equal(r.groupBD(100000), '1,00,000');
    assert.equal(r.groupBD(20000), '20,000');
    assert.equal(r.groupBD(0.01), '0.01');
    assert.equal(r.groupIntl(100000), '100,000');
    const t = createI18n('bn');
    assert.equal(t.num(r.groupBD(100000)), '১,০০,০০০');
    assert.equal(t.pow(10, 5), '১০<sup>৫</sup>');
  });

  it('gives four different force choices, the right one first, for every quiz stroke count', () => {
    for (const n of r.QUIZ_STROKES) {
      const c = r.forceChoices(n);
      assert.equal(c[0].key, 'right');
      assert.equal(c[0].v, r.faceForce(r.pressureDifference(n)));
      assert.equal(new Set(c.map((x) => x.v)).size, 4, `stroke ${n}`);
      assert.equal(c.find((x) => x.key === 'outside').v, 1000);
    }
  });

  it('has every string in both languages, and no Latin digits typed into the Bangla (only the units’ ²)', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
    for (const [k, v] of Object.entries(STRINGS.bn)) {
      if (k.startsWith('u_')) continue;
      const plain = v.replace(/\{\w+\}/g, '').replace(/<[^>]+>/g, '');
      assert.ok(!/[0-9]/.test(plain), `${k}: ${v}`);
    }
  });
});
