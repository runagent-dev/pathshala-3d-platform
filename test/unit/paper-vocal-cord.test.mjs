// A paper vocal cord (book pages 198–199, topic 7.3): the cut flap as a cantilever (shorter → higher frequency), the
// frequencies and wavelengths the figure shows (λ = v / f at 330 m/s), the drawn wave (slowed, shortened, one speed
// for every cut), the flaps' opening, the air's particles, and the strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/paper-vocal-cord/src/reading.js';
import { STRINGS, createI18n } from '../../assets/paper-vocal-cord/src/i18n.js';

describe('paper-vocal-cord: the maths', () => {
  it('a shorter flap vibrates faster, as 1 / L²', () => {
    const f14 = r.flapFrequency(14);
    const f7 = r.flapFrequency(7);
    assert.ok(Math.abs(f7 / f14 - 4) < 1e-9);
    assert.ok(Math.abs(r.flapFrequency(10) - 312.8) < 0.1);
  });

  it('shows about 160, 310 and 640 Hz for the long, medium and short flaps', () => {
    assert.equal(r.shownFrequency('long'), 160);
    assert.equal(r.shownFrequency('mid'), 310);
    assert.equal(r.shownFrequency('short'), 640);
  });

  it('λ = v / f from the frequency shown: 2.06, 1.06 and 0.52 m', () => {
    assert.equal(r.V_SOUND, 330);
    assert.equal(r.wavelength(160), 2.06);
    assert.equal(r.wavelength(310), 1.06);
    assert.equal(r.wavelength(640), 0.52);
  });

  it('names the voice: মোটা below 250 Hz, তীক্ষ্ণ from 450 Hz', () => {
    assert.equal(r.voiceOf(160), 'deep');
    assert.equal(r.voiceOf(310), 'middle');
    assert.equal(r.voiceOf(640), 'shrill');
  });

  it('draws every wave at one speed, slowed and shortened (v = fλ holds in the picture)', () => {
    const speeds = r.CUT_IDS.map((id) => r.drawnWave(r.shownFrequency(id)));
    for (const w of speeds) {
      assert.ok(Math.abs(w.speed - (330 * 1000 * r.LAMBDA_SCALE) / r.SLOW) < 1e-9);
      assert.ok(Math.abs(w.speed - w.fShow * w.lambda) < 1e-9);
    }
    assert.ok(speeds[0].lambda > speeds[1].lambda && speeds[1].lambda > speeds[2].lambda);
    assert.ok(Math.abs(r.drawnWave(310).fShow - 3.1) < 1e-9);
  });

  it('opens and shuts the flaps once a period; bends them from the hinge', () => {
    assert.equal(r.opening(0), 0);
    assert.equal(r.opening(Math.PI), 1);
    assert.ok(Math.abs(r.opening(2 * Math.PI)) < 1e-12);
    assert.equal(r.bendShape(0), 0);
    assert.equal(r.bendShape(1), 1);
    assert.ok(r.bendShape(0.5) < 0.5);
  });

  it('moves the air only after the wave arrives, squeezed when the flaps were open', () => {
    const w = r.drawnWave(310);
    const always = () => 1;
    const from = (a) => (tau) => (tau > a ? 1 : 0);
    // the source started at t = 0; at t = 0.1 s the wave has gone 0.1·v
    const out = r.airAt(w.speed * 0.2, 0.1, w, from(0));
    assert.equal(out.shift, 0);
    assert.equal(out.squeeze, 0);
    // a compression leaves when the flaps are most open (ωτ = π)
    const t = Math.PI / w.omega;
    assert.ok(Math.abs(r.airAt(0, t, w, always).squeeze - 1) < 1e-9);
    // one wavelength further out, the same phase a period later
    const a = r.airAt(10, 1.3, w, always);
    const b = r.airAt(10 + w.lambda, 1.3 + 1 / w.fShow, w, always);
    assert.ok(Math.abs(a.squeeze - b.squeeze) < 1e-9);
    assert.ok(Math.abs(a.shift - b.shift) < 1e-9);
    // the particles swing a tenth of λ either way
    let max = 0;
    for (let k = 0; k < 200; k++) max = Math.max(max, Math.abs(r.airAt(5, k / 200 / w.fShow, w, always).shift));
    assert.ok(Math.abs(max - 0.1 * w.lambda) < 0.01 * w.lambda);
  });

  it('rounds without binary leftovers', () => {
    assert.equal(r.roundTo(312.82, 10), 310);
    assert.equal(r.roundTo(1.0645, 0.01), 1.06);
  });
});

describe('paper-vocal-cord: the strings', () => {
  it('has every Bangla key in English and the reverse', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes Bangla digits and units after a no-break space', () => {
    const t = createI18n('bn');
    assert.equal(t('res_f', { f: t.num(310) }), '৩১০ Hz');
    assert.match(t('out_f', { f: t.num(310), voice: t('voice_middle') }), /<b>৩১০&nbsp;Hz<\/b>/);
    assert.match(t('key_line', { k: t.num(100) }), /সময় ১০০ গুণ ধীর/);
    assert.equal(createI18n('en')('lbl_lambda', { l: 1.06 }), 'λ ≈ 1.06&nbsp;m');
  });

  it('uses the book’s words', () => {
    const all = Object.values(STRINGS.bn).join(' ');
    for (const w of ['ভোকাল কর্ড', 'স্বরযন্ত্র', 'কম্পাঙ্ক', 'উৎস', 'মাধ্যম', 'রিসিভার', 'সংকোচন', 'প্রসারণ', 'মোটা', 'তীক্ষ্ণ', 'ফুঁ দাও'])
      assert.ok(all.includes(w), w);
  });
});
