// The maths of the temperature scales figure (book pages 163–164, topic 6.2): K = °C + 273.15, °F, the fixed points
// of figure 6.02, the graduations, the steps and the test's choices. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/temperature-scales/src/reading.js';
import { STRINGS, createI18n } from '../../assets/temperature-scales/src/i18n.js';

const seeded = (seed) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

describe('temperature scales: the book’s numbers', () => {
  it('reads the fixed points of figure 6.02 on all three scales', () => {
    assert.deepEqual(r.readings(0), { C: 0, K: 273.15, F: 32 });
    assert.deepEqual(r.readings(100), { C: 100, K: 373.15, F: 212 });
  });
  it('adds 273.15 to Celsius for Kelvin: 30 °C is 303.15 K (the book’s room)', () => {
    assert.equal(r.round2(r.toK(30)), 303.15);
    assert.equal(r.round2(r.kToC(303.15)), 30);
  });
  it('puts absolute zero at −273.15 °C = 0 K and the triple point at 0.01 °C = 273.16 K', () => {
    assert.equal(r.round2(r.toK(r.ABS_ZERO)), 0);
    assert.equal(r.round2(r.toK(r.TRIPLE_C)), r.TRIPLE_K);
    assert.equal(r.round2(r.toF(r.ABS_ZERO)), -459.67);
  });
  it('writes numbers with at most two decimals, no trailing zeros and a real minus', () => {
    assert.equal(r.fmt(303.15), '303.15');
    assert.equal(r.fmt(30), '30');
    assert.equal(r.fmt(0.01), '0.01');
    assert.equal(r.fmt(r.toF(0.01)), '32.02');
    assert.equal(r.fmt(-273.15), '−273.15');
    assert.equal(r.fmt(-0.001), '0');
  });
  it('a change of 10 °C is a change of 10 K', () => {
    assert.equal(r.change(40, 30), 10);
    assert.equal(r.change(20, 30), -10);
    assert.equal(r.change(30, 30), 0);
    assert.equal(r.change(0.01, 0), 0);
    assert.equal(r.round2(r.toK(40) - r.toK(30)), 10);
  });
});

describe('temperature scales: the steps and the drag', () => {
  it('walks the book’s temperatures in order and comes round again', () => {
    assert.deepEqual(r.STEPS, ['ice', 'boil', 'room', 'abs', 'triple']);
    assert.equal(r.nextStep('ice'), 'boil');
    assert.equal(r.nextStep('triple'), 'ice');
    assert.deepEqual(
      r.STEPS.map((s) => r.STEP_C[s]),
      [0, 100, 30, -273.15, 0.01],
    );
  });
  it('drags in whole degrees and never below absolute zero (or the tube’s end in the normal view)', () => {
    assert.equal(r.dragTo(41.4, false), 41);
    assert.equal(r.dragTo(-500, true), r.ABS_ZERO);
    assert.equal(r.dragTo(-273.2, true), r.ABS_ZERO);
    assert.equal(r.dragTo(-100, false), r.DRAG_MIN);
    assert.equal(r.dragTo(500, false), r.DRAG_MAX);
  });
});

describe('temperature scales: the graduations', () => {
  it('draws a graduation every 2 °C, longer every 10 °C, between the tube’s ends', () => {
    const t = r.ticksFor('C', r.LO_NORMAL, r.HI);
    assert.ok(t.length > 50 && t.length <= 64);
    assert.ok(t.every((x) => x.c >= r.LO_NORMAL - 1e-6 && x.c <= r.HI + 1e-6));
    assert.ok(t.find((x) => x.c === 0)?.major);
    assert.ok(t.find((x) => x.c === 100)?.major);
    assert.ok(!t.find((x) => x.c === 2)?.major);
  });
  it('makes the fixed points of each scale long marks: 273.15 and 373.15 K, 32 and 212 °F', () => {
    const k = r.ticksFor('K', r.LO_NORMAL, r.HI);
    for (const c of [0, 100]) assert.ok(k.some((x) => x.major && Math.abs(x.c - c) < 1e-6));
    const f = r.ticksFor('F', r.LO_NORMAL, r.HI);
    assert.ok(f.some((x) => x.major && Math.abs(r.toF(x.c) - 32) < 1e-6));
    assert.ok(f.some((x) => x.major && Math.abs(r.toF(x.c) - 212) < 1e-6));
  });
  it('uses coarser graduations when the tube shows the way down to absolute zero', () => {
    for (const id of r.SCALE_IDS) {
      const t = r.ticksFor(id, r.LO_ZOOM, r.HI);
      assert.ok(t.length > 5 && t.length < 50, `${id}: ${t.length}`);
    }
    assert.ok(
      r.ticksFor('K', r.LO_ZOOM, r.HI).some((x) => Math.abs(r.toK(x.c)) < 1e-6 && x.major),
      '0 K is a long mark',
    );
  });
});

describe('temperature scales: the test', () => {
  it('asks five different questions, each with four different choices that include the right answer', () => {
    for (let seed = 1; seed < 60; seed++) {
      const qs = r.makeQuiz(seeded(seed));
      assert.equal(qs.length, 5);
      assert.equal(new Set(qs.map((q) => q.kind.replace(/^f(boil|ice)$/, 'f'))).size, 5);
      for (const q of qs) {
        assert.equal(q.choices.length, 4);
        assert.equal(new Set(q.choices).size, 4, `${q.kind} ${q.choices}`);
        assert.ok(q.choices.includes(q.expected));
        for (const v of q.choices) if (v !== q.expected) assert.ok(q.notes[String(v)], `${q.kind}: no note for ${v}`);
      }
    }
  });
  it('gets the right answers from the book’s relations', () => {
    const qs = r.makeQuiz(seeded(7));
    for (const q of qs) {
      const c = q.scene.c;
      if (q.kind === 'c2k') assert.equal(q.expected, r.round2(r.toK(c)));
      if (q.kind === 'k2c') assert.equal(q.expected, c);
      if (q.kind === 'delta') assert.equal(q.expected, c - q.scene.from);
      if (q.kind === 'abs') assert.equal(q.expected, -273.15);
      if (q.kind === 'fboil') assert.equal(q.expected, 212);
      if (q.kind === 'fice') assert.equal(q.expected, 32);
    }
  });
  it('shows the question only the scale it names', () => {
    for (const q of r.makeQuiz(seeded(3))) {
      assert.equal(q.scene.show.length, 1);
      assert.equal(q.scene.show[0], q.kind === 'k2c' ? 'K' : 'C');
    }
  });
});

describe('temperature scales: the words', () => {
  it('has every Bangla key in English too, and every note a wrong choice can use', () => {
    for (const k of Object.keys(STRINGS.bn)) assert.ok(k in STRINGS.en, `en is missing ${k}`);
    for (const k of Object.keys(STRINGS.en)) assert.ok(k in STRINGS.bn, `bn is missing ${k}`);
    for (let seed = 1; seed < 30; seed++)
      for (const q of r.makeQuiz(seeded(seed))) {
        const base = q.kind.startsWith('f') ? 'f' : q.kind;
        assert.ok(`q_${q.kind}` in STRINGS.bn && `why_${base}` in STRINGS.bn);
        for (const note of Object.values(q.notes)) assert.ok(`mis_${base}_${note}` in STRINGS.bn, `mis_${base}_${note}`);
      }
  });
  it('shows numbers as Bangla digits and keeps the minus', () => {
    const t = createI18n('bn');
    assert.equal(t('lbl_cur', { v: r.fmt(-273.15), u: '°C' }), '−২৭৩.১৫&nbsp;°C');
    assert.equal(t.num('303.15'), '৩০৩.১৫');
  });
});
