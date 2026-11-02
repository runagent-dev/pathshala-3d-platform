// The maths of the heat-units figure (book page 161, topic 6.1): 1 cal = 4.2 J, 1 gm of water rises 1°C per calorie,
// the food calorie (k cal) is 1000 cal, and the test's choices. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/calorie-joule/src/reading.js';
import { STRINGS, createI18n } from '../../assets/calorie-joule/src/i18n.js';

describe('heat units: calorie and joule', () => {
  it('has the book’s 1 cal = 4.2 J and the food calorie k cal = 1000 cal', () => {
    assert.equal(r.CAL_J, 4.2);
    assert.equal(r.FOOD_CAL, 1000);
    assert.equal(r.joules(1), 4.2);
  });

  it('turns n calories into n × 4.2 J, without float noise, and back', () => {
    assert.equal(r.joules(3), 12.6);
    assert.equal(r.joules(5), 21);
    assert.equal(r.fmt(r.joules(3)), '12.6');
    assert.equal(r.fmt(r.joules(5)), '21');
    assert.equal(r.fmt(0.2380952), '0.2');
    assert.equal(r.calories(4.2), 1);
    assert.equal(r.calories(12.6), 3);
  });

  it('raises 1 gm of water by 1°C for each calorie', () => {
    for (let n = 0; n <= r.MAX_STEPS; n++) assert.equal(r.rise(n), n);
    assert.equal(r.rise(2, 2), 1); // two grams need twice the heat for the same rise
  });

  it('steps one calorie at a time and starts again after the last', () => {
    assert.equal(r.nextCount(0), 1);
    assert.equal(r.nextCount(4), 5);
    assert.equal(r.nextCount(r.MAX_STEPS), 0);
  });
});

describe('heat units: the test', () => {
  const rightFirst = (items) => {
    assert.equal(items[0].key, 'right');
    assert.equal(new Set(items.map((x) => `${x.v}${x.unit || ''}`)).size, items.length, 'four different answers');
    assert.equal(items.length, 4);
  };
  it('puts the right answer first among four different ones', () => {
    rightFirst(r.calToJChoices());
    rightFirst(r.waterChoices());
    rightFirst(r.foodChoices());
    for (const n of r.QUIZ_RISES) {
      rightFirst(r.calChoices(n));
      rightFirst(r.jouleChoices(n));
    }
  });
  it('has the right values', () => {
    assert.equal(r.calToJChoices()[0].v, 4.2);
    assert.equal(r.waterChoices()[0].v, 1);
    assert.equal(r.foodChoices()[0].v, 1000);
    assert.equal(r.calChoices(3)[0].v, 3);
    assert.equal(r.jouleChoices(3)[0].v, '12.6');
  });
  it('makes the wrong choices from real mistakes', () => {
    const j = r.jouleChoices(3);
    assert.equal(j.find((x) => x.key === 'cal').v, 3); // forgot to multiply by 4.2
    assert.equal(j.find((x) => x.key === 'divide').v, '0.71'); // divided instead
    assert.equal(r.calChoices(3).find((x) => x.key === 'times').v, '12.6'); // gave the joules
    assert.equal(r.calToJChoices().find((x) => x.key === 'ten').v, 42);
  });
});

describe('heat units: the words', () => {
  const keysOf = (lang) => Object.keys(STRINGS[lang]).sort();
  it('has every key in both languages', () => {
    assert.deepEqual(keysOf('bn'), keysOf('en'));
  });
  it('has a why and a note for each wrong choice', () => {
    const kinds = {
      calj: ['flip', 'ten', 'same'],
      water: ['joule', 'oneJ', 'food'],
      cal: ['times', 'divide', 'one'],
      joule: ['cal', 'divide', 'one'],
      food: ['same', 'joule', 'hundred'],
    };
    for (const [kind, wrong] of Object.entries(kinds)) {
      assert.ok(STRINGS.bn[`why_${kind}`], `why_${kind}`);
      assert.ok(STRINGS.bn[`q_${kind}`], `q_${kind}`);
      for (const w of wrong) assert.ok(STRINGS.bn[`mis_${kind}_${w}`], `mis_${kind}_${w}`);
    }
  });
  it('writes numbers in Bangla digits and keeps no digit in the strings', () => {
    const t = createI18n('bn');
    assert.equal(t.num('12.6'), '১২.৬');
    for (const [k, v] of Object.entries(STRINGS.bn)) assert.ok(!/[০-৯]/.test(v), `${k} has a hard-coded digit`);
  });
});
