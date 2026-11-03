// Superposition of water waves (book pages 192–193, topic 7.2.1 (v)): λ = v/f, the ripples' fall-off, crest on crest
// at equal paths and crest on trough at paths that differ by half wavelengths, where the balls sit, the panel's
// ratios and the strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/wave-interference/src/reading.js';
import { STRINGS, createI18n } from '../../assets/wave-interference/src/i18n.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

describe('wave-interference: the maths', () => {
  it('has λ = v/f = 5 cm and the default gap of 3λ', () => {
    close(r.LAMBDA, 0.05);
    close(r.GAP / r.LAMBDA, 3);
    close(r.K * r.LAMBDA, 2 * Math.PI);
  });

  it('lets a ripple fall off with distance, as 1/√r far away', () => {
    assert.ok(r.amplitudeAt(0) > r.amplitudeAt(0.1));
    const far = r.amplitudeAt(1) / r.amplitudeAt(4);
    assert.ok(Math.abs(far - 2) < 0.15, `far ratio ${far}`);
    // the slope is the derivative
    const h = 1e-6;
    close(r.amplitudeSlope(0.2), (r.amplitudeAt(0.2 + h) - r.amplitudeAt(0.2 - h)) / (2 * h), 1e-8);
  });

  it('spreads the front at v and leaves nothing ahead of it', () => {
    assert.equal(r.envelope(0.3, 1, 0, null), 0); // at t = 1 s the front is at 0.25 m
    assert.equal(r.envelope(0.1, 1, 0, null), 1);
    assert.equal(r.envelope(0.1, 1, null, null), 0);
    // after the dipper leaves, the tail moves off at v too
    assert.equal(r.envelope(0.05, 2, 0, 1), 0);
    assert.equal(r.envelope(0.4, 2, 0, 1), 1);
  });

  it('adds crest on crest on the centre line: twice one wave', () => {
    const one = r.steadyAmplitude(0, r.BALL_Z, [true, false]);
    const both = r.steadyAmplitude(0, r.BALL_Z, [true, true]);
    close(both / one, 2, 1e-9);
    close(r.pathDifference(0, r.BALL_Z), 0);
  });

  it('puts ball খ where the paths differ by 1½λ: crest on trough, almost still', () => {
    const [a, b] = r.defaultBalls();
    assert.equal(a.x, 0);
    close(Math.abs(r.pathDifference(b.x, b.z)), 1.5, 1e-6);
    const one = r.steadyAmplitude(a.x, a.z, [true, false]);
    const still = r.steadyAmplitude(b.x, b.z, [true, true]);
    assert.ok(still / one < 0.15, `still ${still / one}`); // "প্রায় ০" in the panel
    // each wave alone does make it bob
    assert.ok(r.steadyAmplitude(b.x, b.z, [true, false]) / one > 0.8);
    assert.ok(r.steadyAmplitude(b.x, b.z, [false, true]) / one > 0.8);
    // inside the tank
    assert.ok(b.x < r.TANK.w / 2 - 0.03);
  });

  it('finds strong and still lines for every gap, and counts the still lines', () => {
    for (const gap of r.GAPS) {
      const loud = r.pointOnLine(1, r.BALL_Z, gap);
      const quiet = r.pointOnLine(0.5, r.BALL_Z, gap);
      assert.ok(loud != null && quiet != null);
      const one = r.steadyAmplitude(0, r.BALL_Z, [true, false], gap);
      assert.ok(r.steadyAmplitude(loud, r.BALL_Z, [true, true], gap) / one > 1.8);
      assert.ok(r.steadyAmplitude(quiet, r.BALL_Z, [true, true], gap) / one < 0.1);
    }
    assert.equal(r.stillLines(0.15), 6);
    assert.equal(r.stillLines(0.1), 4);
  });

  it('a wave is a sine in time at a point: one period later it repeats', () => {
    const T = 1 / r.F;
    close(r.waveAt(0.12, 10, 0, null), r.waveAt(0.12, 10 + T, 0, null), 1e-12);
    close(r.waveAt(0.12, 10, 0, null), -r.waveAt(0.12, 10 + T / 2, 0, null), 1e-12);
  });

  it('doubling the amplitude carries four times the energy', () => {
    assert.equal(r.energyRatio(2), 4);
  });

  it('writes ratios for the panel without trailing zeros, with "about" when rounded', () => {
    assert.deepEqual(r.ratioText(2), { value: '2', about: false });
    assert.deepEqual(r.ratioText(1.98), { value: '2', about: false });
    assert.deepEqual(r.ratioText(1.9), { value: '1.9', about: false });
    assert.equal(r.ratioText(0.04).about, true);
  });
});

describe('wave-interference: the strings', () => {
  it('has every key in both languages', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });
  it('writes Bangla digits through t.num and fills the vars', () => {
    const t = createI18n('bn');
    assert.equal(t('note', { l: t.num(5), f: t.num(5) }).includes('৫ cm'), true);
    assert.equal(t('c_energy_4', { n: 4 }), '৪ গুণ');
    assert.ok(!t('why_energy', { zero: 0, two: 2, four: 4 }).match(/[0-9]/));
  });
  it('uses the book’s words', () => {
    const all = Object.values(STRINGS.bn).join(' ');
    for (const w of ['উপরিপাতন', 'বিস্তার', 'নিঃশেষ', 'মাধ্যমের কণাগুলো নিজ অবস্থানে থেকে শুধু স্পন্দিত হয়', 'বিস্তারের বর্গের সমানুপাতিক'])
      assert.ok(all.includes(w), w);
  });
});
