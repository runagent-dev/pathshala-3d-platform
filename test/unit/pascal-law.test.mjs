// The maths of the Pascal's law figure (book page 141, topic 5.3.3): P = F₁/A₁, F₂ = PA₂ = F₁(A₂/A₁), the car lifts
// only when F₂ > W, d₂ = d₁(A₁/A₂) and F₁d₁ = F₂d₂, distances in the units people say, and the test's choices.
// Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/pascal-law/src/reading.js';
import { STRINGS, createI18n } from '../../assets/pascal-law/src/i18n.js';

describe('pascal-law: the pressure is passed on', () => {
  it('makes P = F₁/A₁ in pascal', () => {
    assert.equal(r.A1, 0.01);
    assert.equal(r.pressure(100), 10000);
    assert.equal(r.pressure(50), 5000);
    assert.equal(r.pressure(300), 30000);
  });

  it('multiplies the force by A₂/A₁ (the book: A₂/A₁ = 100 gives 100 times the force)', () => {
    assert.equal(r.area2(100), 1);
    assert.equal(r.area2(50), 0.5);
    assert.equal(r.area2(10), 0.1);
    assert.equal(r.force2(100, 100), 10000);
    assert.equal(r.force2(50, 100), 5000);
    for (const k of r.RATIOS)
      for (let F = 50; F <= 300; F += 50) {
        assert.equal(r.force2(F, k), F * k);
        // the same pressure under both pistons: F₂/A₂ = F₁/A₁
        assert.equal(r.round(r.force2(F, k) / r.area2(k), 6), r.pressure(F));
      }
  });

  it('lifts the 8,000 N car only when F₂ is more than its weight', () => {
    assert.equal(r.W, 8000);
    assert.equal(r.lifts(100, 100), true);
    assert.equal(r.lifts(50, 100), false);
    assert.equal(r.lifts(150, 50), false);
    assert.equal(r.lifts(200, 50), true);
    for (let F = 50; F <= 300; F += 50) assert.equal(r.lifts(F, 10), false); // 10 × is never enough for a person
    assert.equal(r.leastForce(100), 100);
    assert.equal(r.leastForce(50), 200);
    assert.equal(r.leastForce(10), null);
    // F₂ never equals W on the stepper's grid, so "more than" is never a tie
    for (const k of r.RATIOS) for (let F = 50; F <= 300; F += 50) assert.notEqual(r.force2(F, k), r.W);
  });

  it('starts where the first push lifts the car (the book’s 100 ×)', () => {
    assert.equal(r.RATIO_START, 100);
    assert.equal(r.lifts(r.F_START, r.RATIO_START), true);
  });
});

describe('pascal-law: force, not energy', () => {
  it('moves the big piston d₂ = d₁(A₁/A₂)', () => {
    assert.equal(r.rise(0.1, 100), 0.001);
    assert.equal(r.rise(0.1, 50), 0.002);
    assert.equal(r.rise(0.1, 10), 0.01);
    // the same oil leaves one cylinder and enters the other
    for (const k of r.RATIOS) assert.equal(r.round(r.A1 * 0.1, 9), r.round(r.area2(k) * r.rise(0.1, k), 9));
    assert.equal(r.volume(), 0.001); // one push: 1 litre
  });

  it('gives back the same work: F₁d₁ = F₂d₂', () => {
    for (const k of r.RATIOS)
      for (let F = 50; F <= 300; F += 50) assert.equal(r.work(F, r.STROKE), r.round(r.work(r.force2(F, k), r.rise(r.STROKE, k)), 6));
    assert.equal(r.work(100, 0.1), 10);
  });

  it('counts the pushes left before the lift is at its top', () => {
    assert.equal(r.pushesLeft(0, 100), 250);
    assert.equal(r.pushesLeft(0.001, 100), 249);
    assert.equal(r.pushesLeft(0, 50), 125);
    assert.equal(r.pushesLeft(r.RISE_MAX, 100), 0);
  });
});

describe('pascal-law: numbers and inputs', () => {
  it('says distances the way people do', () => {
    assert.deepEqual(r.distance(0.001), { v: 1, u: 'mm' });
    assert.deepEqual(r.distance(0.002), { v: 2, u: 'mm' });
    assert.deepEqual(r.distance(0.1), { v: 10, u: 'cm' });
    assert.deepEqual(r.distance(0.101), { v: 10.1, u: 'cm' });
    assert.deepEqual(r.distance(0.25), { v: 25, u: 'cm' });
    assert.deepEqual(r.distance(10), { v: 10, u: 'm' });
  });

  it('keeps the push and the piston on their grids', () => {
    assert.equal(r.fixForce(120), 100);
    assert.equal(r.fixForce(10), 50);
    assert.equal(r.fixForce(999), 300);
    assert.equal(r.fixForce('x'), r.F_START);
    assert.equal(r.fixRatio(50), 50);
    assert.equal(r.fixRatio('10'), 10);
    assert.equal(r.fixRatio(7), 100);
  });

  it('groups digits the Bangladeshi way in Bangla and in threes in English', () => {
    assert.equal(r.groupBD(10000), '10,000');
    assert.equal(r.groupBD(100000), '1,00,000');
    assert.equal(r.groupIntl(100000), '100,000');
    assert.equal(r.groupBD(0.01), '0.01');
  });
});

describe('pascal-law: the test', () => {
  const distinct = (list) => new Set(list.map((c) => c.v)).size === list.length;
  it('gives four different choices for F₂, the right one first', () => {
    for (const F of [50, ...r.QUIZ_FORCES])
      for (const k of [50, 100]) {
        const c = r.force2Choices(F, k);
        assert.equal(c.length, 4);
        assert.ok(distinct(c));
        assert.equal(c[0].v, F * k);
      }
  });

  it('gives four different choices for the rise', () => {
    for (const d of r.QUIZ_STROKES)
      for (const k of r.RATIOS) {
        const c = r.riseChoices(d, k);
        assert.ok(distinct(c));
        assert.equal(c[0].v, r.round(d / k, 6));
      }
  });

  it('gives four different choices for the pressure and for the energy', () => {
    for (const F of r.QUIZ_FORCES)
      for (const k of [50, 100]) {
        const p = r.pressureChoices(r.pressure(F), k);
        assert.ok(distinct(p));
        assert.equal(p[0].v, r.pressure(F));
        const w = r.workChoices(F, r.STROKE, k);
        assert.equal(w.length, 4);
        assert.ok(distinct(w));
        assert.equal(w[0].v, r.work(F, r.STROKE));
      }
  });
});

describe('pascal-law: strings', () => {
  it('has every Bangla key in English and the other way round', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes numbers in Bangla digits and puts the symbols in', () => {
    const t = createI18n('bn');
    assert.equal(t.num(10000), '১০০০০');
    const out = t('lbl_F1', { v: t.num(100) });
    assert.match(out, /১০০/);
    assert.match(out, /<sub>1<\/sub>/);
    assert.doesNotMatch(t('rule_energy', { F: 1, d1: 1, F2: 1, d2: 1, E: 1 }), /\{\w+\}/);
  });

  it('uses the book’s words for the law and the caveat', () => {
    assert.match(STRINGS.bn.rule_law, /আবদ্ধ পাত্রে তরল বা বায়বীয় পদার্থে/);
    assert.match(STRINGS.bn.rule_law, /সংলগ্ন গায়ে লম্বভাবে/);
    assert.match(STRINGS.bn.rule_energy, /বলবৃদ্ধিকরণ নীতি/);
    assert.match(STRINGS.bn.rule_use, /কলকারখানা কিংবা বিমান নিয়ন্ত্রণে/);
  });
});
