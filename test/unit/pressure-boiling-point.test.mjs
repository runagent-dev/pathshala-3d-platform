// The maths and the words of the pressure-boiling-point figure (book page 182, topic 6.7): the boiling point in the
// open, high on a mountain and in a pressure cooker, how the water heats up to it and no further, the thermometer, the
// bubbles, and that every question has four answers and a note for each wrong one in both languages. Pure code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/pressure-boiling-point/src/reading.js';
import { STRINGS, createI18n } from '../../assets/pressure-boiling-point/src/i18n.js';

describe('pressure-boiling-point: boiling points', () => {
  it('is lower with less pressure and higher with more (the book’s rule)', () => {
    assert.equal(r.boilingPoint('plain'), 100);
    assert.ok(r.boilingPoint('mountain') < r.boilingPoint('plain'));
    assert.ok(r.boilingPoint('cooker') > r.boilingPoint('plain'));
    assert.equal(r.boilingPoint('nonsense'), 100);
  });

  it('labels the pressure and the cooking time of each case', () => {
    assert.deepEqual(
      r.CASES.map((c) => [r.DATA[c].pressure, r.DATA[c].cooking]),
      [
        ['normal', 'normal'],
        ['low', 'slow'],
        ['high', 'fast'],
      ],
    );
    assert.ok(r.DATA.mountain.arrow < r.DATA.plain.arrow && r.DATA.plain.arrow < r.DATA.cooker.arrow);
  });

  it('heats from the cold water to the boiling point and no further', () => {
    for (const c of r.CASES) {
      assert.equal(r.tempAt(c, 0), r.T0);
      assert.equal(r.tempAt(c, 1), r.boilingPoint(c));
      assert.equal(r.tempAt(c, 5), r.boilingPoint(c));
      let last = -Infinity;
      for (let k = 0; k <= 1.0001; k += 0.1) {
        assert.ok(r.tempAt(c, k) >= last);
        last = r.tempAt(c, k);
      }
    }
  });

  it('puts the red thread inside the scale and 100° C on it', () => {
    assert.equal(r.mercuryLevel(r.T_MIN), 0);
    assert.equal(r.mercuryLevel(r.T_MAX), 1);
    assert.ok(r.mercuryLevel(r.T_REF) > 0 && r.mercuryLevel(r.T_REF) < 1);
    assert.ok(r.mercuryLevel(r.boilingPoint('cooker')) < 1);
  });

  it('bubbles harder as the water nears its boiling point', () => {
    for (const c of r.CASES) {
      assert.equal(r.bubbleIntensity(c, 0), 0);
      assert.equal(r.bubbleIntensity(c, 1), 1);
    }
  });
});

describe('pressure-boiling-point: the story', () => {
  it('goes idle → heating → boiling', () => {
    assert.equal(r.phaseOf({ k: 0, heating: false }), 'idle');
    assert.equal(r.phaseOf({ k: 0, heating: true }), 'heating');
    assert.equal(r.phaseOf({ k: 0.4, heating: false }), 'heating');
    assert.equal(r.phaseOf({ k: 1, heating: false }), 'boiling');
  });

  it('goes to the next case in the book’s order and says what the next tap does', () => {
    assert.deepEqual(['plain', 'mountain', 'cooker'].map(r.nextCase), ['mountain', 'cooker', 'plain']);
    assert.equal(r.nextOf(0, ''), 'heat');
    assert.equal(r.nextOf(1, ''), 'next');
    assert.equal(r.nextOf(0.5, 'heat'), '');
  });

  it('has a scene for each question kind', () => {
    for (const kind of r.QUIZ_KINDS) assert.ok(r.CASES.includes(r.SCENES[kind].c), kind);
    assert.equal(r.QUIZ_KINDS.length, 5);
  });
});

describe('pressure-boiling-point: the words', () => {
  for (const lang of ['bn', 'en']) {
    it(`${lang}: each question has four answers, a worked answer and a note for every wrong one`, () => {
      const d = STRINGS[lang];
      for (const k of r.QUIZ_KINDS) {
        assert.ok(d[`q_${k}`], `q_${k}`);
        assert.ok(d[`why_${k}`], `why_${k}`);
        for (const i of [0, 1, 2, 3]) assert.ok(d[`q_${k}_${i}`], `q_${k}_${i}`);
        for (const i of [1, 2, 3]) assert.ok(d[`mis_${k}_${i}`], `mis_${k}_${i}`);
      }
    });
  }

  it('Bangla and English have the same keys', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('uses the book’s words and writes temperatures in Bangla digits', () => {
    const t = createI18n('bn');
    assert.match(t('rule_mountain'), /চাপ কম হলে স্ফুটনাঙ্ক কমে যায়/);
    assert.match(t('rule_cooker'), /চাপ বেশি হলে স্ফুটনাঙ্ক বেড়ে যায়/);
    assert.equal(t('val_bp_plain', { tb: 100 }), '১০০° C');
    assert.equal(t('val_bp_other', { tb: 90 }), 'প্রায় ৯০° C');
    assert.equal(createI18n('en')('val_bp_other', { tb: 120 }), 'about 120° C');
  });
});
