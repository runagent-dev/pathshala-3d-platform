// The physics of the wave-types figure (book pages 194–195, topic 7.2.2): one travelling wave y = a sin(kx − ωt),
// across a rope (অনুপ্রস্থ) and along a spring (অনুদৈর্ঘ্য), with a front moving at v and particles that only swing in place.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as w from '../../assets/wave-types/src/reading.js';

const close = (a, b, eps = 1e-6, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);
const { WAVE } = w;
const k = (2 * Math.PI) / WAVE.lambda;
const om = 2 * Math.PI * WAVE.f;

describe('the travelling wave', () => {
  it('moves at v = fλ (0.625 m/s) and nothing ahead of the front moves', () => {
    close(w.speed(), WAVE.f * WAVE.lambda);
    close(w.speed(), 0.625);
    close(w.front(1), 0.625);
    assert.equal(w.displacement(0.9, 1.0, 0.08), 0);
    assert.equal(w.front(100), WAVE.L);
  });
  it('is a sin(kx − ωt) once the driver has settled', () => {
    const t = 4.13;
    for (const x of [0, 0.2, 0.55, 0.84, 1.2]) close(w.displacement(x, t, 0.08), 0.08 * Math.sin(k * x - om * t), 1e-12, `x=${x}`);
  });
  it('a crest moves on by v·Δt: the shape at x + vΔt later equals the shape at x now', () => {
    const t = 3.2;
    const dt = 0.17;
    for (const x of [0.1, 0.4, 0.7]) close(w.displacement(x + w.speed() * dt, t + dt, 0.08), w.displacement(x, t, 0.08), 1e-12);
  });
  it('the marked particle only swings in place: its displacement never exceeds a, it comes back after one period', () => {
    let max = 0;
    for (let t = 0; t < 20; t += 0.01) max = Math.max(max, Math.abs(w.displacement(WAVE.marked, t, 0.04)));
    assert.ok(max <= 0.04 + 1e-12 && max > 0.039);
    close(w.displacement(WAVE.marked, 7.3, 0.04), w.displacement(WAVE.marked, 7.3 + w.period(), 0.04), 1e-12);
  });
  it('the far end is still (the absorbing end)', () => {
    for (let t = 0; t < 10; t += 0.1) close(w.displacement(WAVE.L, t, 0.08), 0, 1e-12);
  });
  it('coils never cross in the spring (spacing stays above 0)', () => {
    for (let t = 2; t < 6; t += 0.05) for (let x = 0; x < WAVE.L; x += 0.01) assert.ok(w.spacing(x, t, WAVE.aSpring) > 0.5);
  });
});

describe('compressions and rarefactions', () => {
  it('compressions are where the coils crowd, rarefactions where they spread, half a wavelength apart', () => {
    const t = 5;
    const f = w.features(t);
    assert.ok(f.length >= 4);
    for (const p of f) {
      const s = w.spacing(p.x, t, WAVE.aSpring);
      if (p.kind === 'compression') close(s, 1 - WAVE.aSpring * k, 1e-6);
      else close(s, 1 + WAVE.aSpring * k, 1e-6);
    }
    for (let i = 1; i < f.length; i++) {
      close(f[i].x - f[i - 1].x, WAVE.lambda / 2, 1e-9);
      assert.notEqual(f[i].kind, f[i - 1].kind);
    }
  });
  it('they travel on at v', () => {
    const a = w.nearest(5, 'compression', 0.7);
    const b = w.nearest(5.2, 'compression', a.x + 0.1);
    close(b.x - a.x, w.speed() * 0.2, 1e-9);
  });
});

describe('which way the marked particle goes', () => {
  it('up or down on the rope, ahead or back on the spring', () => {
    const seen = new Set();
    for (let t = 2; t < 4; t += 0.05) seen.add(w.heading('rope', t));
    for (let t = 2; t < 4; t += 0.05) seen.add(w.heading('spring', t));
    assert.ok(seen.has('up') && seen.has('down') && seen.has('ahead') && seen.has('back'));
    assert.equal(w.heading('rope', 0.2), 'still');
  });
});
