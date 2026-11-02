// The maths of the temperature-conversion figure (book p165–166, topic 6.2.1): T_C = T_K − 273.15°, T_C = 5/9 (T_F − 32°),
// the book's four examples and the test's questions. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/temperature-conversion/src/reading.js';
import { STRINGS, createI18n } from '../../assets/temperature-conversion/src/i18n.js';

describe('temperature-conversion: the three scales', () => {
  it('turns Celsius into Kelvin and Fahrenheit (and back) with the book’s relations', () => {
    assert.equal(r.toK(0), 273.15);
    assert.equal(r.toK(100), 373.15);
    assert.equal(r.toF(0), 32);
    assert.equal(r.toF(100), 212);
    assert.equal(r.fromK(373.15), 100);
    assert.equal(r.fromF(212), 100);
    assert.ok(Math.abs(r.fromF(r.toF(37.5)) - 37.5) < 1e-9);
    assert.ok(Math.abs(r.fromK(r.toK(-12.25)) + 12.25) < 1e-9);
  });

  it('gives the same fraction on all three scales: T_C/100 = (T_K − 273.15)/100 = (T_F − 32)/180', () => {
    for (const c of [-40, 0, 25, 36.8889, 100, 301.4375]) {
      const { k, f } = r.convert(c);
      assert.ok(Math.abs(c / 100 - (k - 273.15) / 100) < 1e-9);
      assert.ok(Math.abs(c / 100 - (f - 32) / 180) < 1e-9);
      assert.ok(Math.abs(r.fraction(c) - c / 100) < 1e-12);
    }
  });

  it('writes numbers the way the book does: two decimals at most, no trailing zeros, a real minus, never −0', () => {
    assert.equal(r.fmt(573.1500000001), '573.15');
    assert.equal(r.fmt(30), '30');
    assert.equal(r.fmt(36.888888), '36.89');
    assert.equal(r.fmt(-40), '−40');
    assert.equal(r.fmt(-0.001), '0');
    assert.equal(r.fmt(98.4, 1), '98.4');
  });
});

describe('temperature-conversion: the book’s four examples', () => {
  const ex = (id) => r.exampleOf(id);

  it('−40° C is −40° F (p165): the scales read the same number there and nowhere else', () => {
    assert.equal(ex('cf').c, -40);
    assert.equal(r.toF(-40), -40);
    assert.equal(r.sameNumber(-40), 'cf');
    assert.equal(r.sameNumber(-39), null);
    assert.equal(r.sameNumber(0), null);
  });

  it('Kelvin and Fahrenheit are equal at T_K = 574.59 K (p166)', () => {
    const { c, k, f } = r.convert(ex('kf').c);
    assert.equal(r.fmt(k), '574.59');
    assert.equal(r.fmt(f), '574.59');
    assert.equal(r.fmt(c), '301.44');
    assert.equal(r.sameNumber(ex('kf').c), 'kf');
  });

  it('a healthy body at 98.4° F is 36.89° C, close to 37° C (p166)', () => {
    const c = ex('body').c;
    assert.equal(r.fmt(c), '36.89');
    assert.equal(Math.round(c), 37);
    assert.equal(r.fmt(r.toF(c), 1), '98.4');
  });

  it('Celsius and Kelvin are never equal (p166): T_K − T_C is always 273.15', () => {
    for (let c = r.MIN_C; c <= r.MAX_C; c += 7.5) assert.ok(Math.abs(r.toK(c) - c - 273.15) < 1e-9);
    assert.equal(r.sameNumber(ex('ck').c), null);
  });

  it('keeps every example inside what the thermometers can draw, in the book’s order', () => {
    assert.deepEqual(
      r.EXAMPLES.map((e) => e.id),
      ['cf', 'kf', 'body', 'ck'],
    );
    for (const e of r.EXAMPLES) assert.equal(r.clampC(e.c), e.c);
    assert.equal(r.nextExample('ck'), 'cf');
    assert.equal(r.nextExample('cf'), 'kf');
    assert.equal(r.nextExample(null), 'cf');
  });
});

describe('temperature-conversion: the test', () => {
  const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  it('asks five questions, the right answer comes from the relations and the wrong ones are real mistakes', () => {
    assert.equal(r.QUESTION_KINDS.length, 5);
    for (let seed = 1; seed < 40; seed++) {
      for (const kind of r.QUESTION_KINDS) {
        const q = r.makeQuestion(kind, seeded(seed));
        assert.equal(q.choices.length, 4, kind);
        const values = q.choices.map((c) => c.v);
        for (let i = 0; i < values.length; i++)
          for (let j = i + 1; j < values.length; j++) assert.ok(Math.abs(values[i] - values[j]) > 0.005, `${kind}: two choices are the same`);
        const right = q.choices.filter((c) => c.note === null);
        assert.equal(right.length, 1, kind);
        assert.ok(Math.abs(right[0].v - q.expected) < 1e-9);
        for (const c of q.choices.filter((x) => x.note)) assert.ok(typeof c.note === 'string' && c.note.length > 0);
        // the right answer is the conversion of what the question gives
        if (kind === 'c2f') assert.ok(Math.abs(q.expected - r.toF(q.given.C)) < 1e-9);
        if (kind === 'f2c') assert.ok(Math.abs(q.expected - r.fromF(q.given.F)) < 1e-9);
        if (kind === 'c2k') assert.ok(Math.abs(q.expected - r.toK(q.given.C)) < 1e-9);
        if (kind === 'body') assert.equal(q.expected, 36.89);
        if (kind === 'eqCF') assert.equal(q.expected, -40);
      }
    }
  });

  it('shows the temperature the question is about, inside the drawn range', () => {
    for (let seed = 1; seed < 20; seed++)
      for (const kind of r.QUESTION_KINDS) {
        const q = r.makeQuestion(kind, seeded(seed));
        assert.equal(r.clampC(q.c), q.c);
      }
  });

  it('has a note and a worked answer in both languages for every mistake the test can make', () => {
    const notes = new Set();
    for (let seed = 1; seed < 60; seed++)
      for (const kind of r.QUESTION_KINDS) for (const c of r.makeQuestion(kind, seeded(seed)).choices) if (c.note) notes.add(`${kind}_${c.note}`);
    for (const lang of ['bn', 'en']) for (const n of notes) assert.ok(STRINGS[lang][`n_${n}`], `${lang} is missing n_${n}`);
    for (const kind of r.QUESTION_KINDS)
      for (const lang of ['bn', 'en']) {
        assert.ok(STRINGS[lang][`sol_${kind}`], `${lang} is missing sol_${kind}`);
        assert.ok(STRINGS[lang][`q_${kind}`], `${lang} is missing q_${kind}`);
      }
  });
});

describe('temperature-conversion: words', () => {
  it('has every key in both languages', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes numbers in Bangla digits, fixed numbers (5/9, 32) included, and Latin ones when asked', () => {
    const bn = createI18n('bn');
    assert.equal(bn.num('36.89'), '৩৬.৮৯');
    assert.match(bn('eq_c_f'), /৫/);
    assert.match(bn('eq_c_f'), /৩২/);
    assert.ok(!/[0-9]/.test(bn('eq_c_f').replace(/class="[^"]*"/g, '')));
    const en = createI18n('en');
    assert.match(en('eq_c_f'), /32/);
    const latinBn = createI18n('bn', { numerals: 'latin' });
    assert.match(latinBn('eq_c_f'), /32/);
  });

  it('uses the book’s terms for the three scales', () => {
    const bn = createI18n('bn');
    assert.equal(bn('sc_C'), 'সেলসিয়াস');
    assert.equal(bn('sc_K'), 'কেলভিন');
    assert.equal(bn('sc_F'), 'ফারেনহাইট');
    assert.match(bn('q_eqCF'), /কোন তাপমাত্রায় সেলসিয়াস এবং ফারেনহাইট স্কেল সমান/);
    assert.match(bn('q_body', { f: '98.4' }), /সুস্থ দেহের তাপমাত্রা/);
  });
});
