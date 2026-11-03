// The physics of the spring-mass-oscillation figure (book pages 188–190, topic 7.1): T = 2π√(m/k), f = 1/T, the
// motion x = −a cos ωt after a pull down by a, and K + U = ½ka² all the way. Pure code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/spring-mass-oscillation/src/reading.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);

describe('the period and the frequency', () => {
  it('T = 2π√(m/k): 1 kg on 100 N/m takes about 0.63 s; f = 1/T ≈ 1.59 Hz', () => {
    close(r.period(1, 100), 2 * Math.PI * 0.1, 1e-12);
    assert.equal(r.fixed(r.period(1, 100)), '0.63');
    assert.equal(r.fmt(r.frequency(1, 100), 2), '1.59');
    close(r.period(0.5, 100) * r.frequency(0.5, 100), 1, 1e-12);
  });
  it('four times the mass doubles T; four times k halves it; the amplitude does not appear', () => {
    close(r.period(1, 100) / r.period(0.25, 100), 2, 1e-12);
    close(r.period(0.5, 400) / r.period(0.5, 100), 0.5, 1e-12);
    close(r.periodRatio(4, 1), 2, 1e-12);
    assert.equal(r.period.length, 2);
  });
  it('the choices give periods from about 0.16 s to 0.63 s', () => {
    const all = r.MASSES.flatMap((m) => r.SPRINGS.map((k) => r.period(m, k)));
    close(Math.min(...all), 2 * Math.PI * 0.025, 1e-12);
    close(Math.max(...all), 2 * Math.PI * 0.1, 1e-12);
  });
});

describe('the motion after a pull down by a', () => {
  const m = 0.5;
  const k = 50;
  const a = 0.05;
  const w = r.omega(m, k);
  const T = r.period(m, k);
  it('starts at x = −a at rest, passes the equilibrium going up at T/4, reaches +a at T/2', () => {
    const s0 = r.motion(a, w, 0);
    close(s0.x, -a);
    close(s0.v, 0);
    const s1 = r.motion(a, w, T / 4);
    close(s1.x, 0, 1e-12);
    close(s1.v, a * w, 1e-12, 'fastest');
    assert.ok(s1.v > 0, 'going up');
    const s2 = r.motion(a, w, T / 2);
    close(s2.x, a, 1e-12);
    close(s2.v, 0, 1e-12);
    const s3 = r.motion(a, w, (3 * T) / 4);
    assert.ok(s3.v < 0, 'going down at 3T/4');
  });
  it('is back in the same phase after exactly one T (position and direction), not after T/2', () => {
    const t = 0.3 * T;
    const p = r.motion(a, w, t);
    const q = r.motion(a, w, t + T);
    close(p.x, q.x, 1e-12);
    close(p.v, q.v, 1e-12);
    const h = r.motion(a, w, t + T / 2);
    assert.ok(Math.sign(h.v) !== Math.sign(p.v));
  });
  it('the acceleration is −ω²x (from F = −kx = ma)', () => {
    for (const t of [0, 0.1, 0.37, 0.5]) {
      const s = r.motion(a, w, t);
      close(s.acc, -w * w * s.x, 1e-12);
      close(m * s.acc, r.force(k, s.x), 1e-12);
    }
  });
  it('K and U trade, and K + U = ½ka² all the time', () => {
    const E = 0.5 * k * a * a;
    for (let i = 0; i <= 20; i++) {
      const s = r.motion(a, w, (i / 20) * T);
      const e = r.energies(m, k, s.x, s.v);
      close(e.E, E, 1e-12);
    }
    const end = r.motion(a, w, 0);
    close(r.energies(m, k, end.x, end.v).K, 0);
    const mid = r.motion(a, w, T / 4);
    close(r.energies(m, k, mid.x, mid.v).U, 0, 1e-12);
  });
  it('counts whole oscillations', () => {
    assert.equal(r.fullOscillations(m, k, 0.99 * T), 0);
    assert.equal(r.fullOscillations(m, k, T), 1);
    assert.equal(r.fullOscillations(m, k, 3.2 * T), 3);
  });
  it('names the phase at the quarter points', () => {
    assert.equal(r.phaseName(0), 'bottom');
    assert.equal(r.phaseName(Math.PI / 2), 'up');
    assert.equal(r.phaseName(Math.PI), 'top');
    assert.equal(r.phaseName(1.5 * Math.PI), 'down');
    assert.equal(r.phaseName(2 * Math.PI + 0.1), 'bottom');
  });
});

describe('the spring and the pull', () => {
  it('hanging at rest stretches it by mg/k, never more than about 10 cm', () => {
    close(r.staticStretch(0.5, 100), 0.049, 1e-12);
    for (const m of r.MASSES) for (const k of r.SPRINGS) assert.ok(r.staticStretch(m, k) <= 0.1);
  });
  it('the pull is at most 8 cm, at least 3 cm for every pair, and the coils never close', () => {
    close(r.maxAmplitude(0.5, 100), 0.049 + r.SQUEEZE, 1e-12);
    assert.equal(r.maxAmplitude(1, 100), 0.08);
    close(r.maxAmplitude(0.25, 400), 0.006125 + r.SQUEEZE, 1e-12);
    for (const m of r.MASSES)
      for (const k of r.SPRINGS) {
        assert.ok(r.maxAmplitude(m, k) >= 0.03, `${m} kg on ${k} N/m`);
        assert.ok(r.maxAmplitude(m, k) <= r.staticStretch(m, k) + r.SQUEEZE + 1e-12);
      }
  });
  it('picks a tidy step for a time axis', () => {
    assert.equal(r.timeStep(0.7), 0.1);
    assert.equal(r.timeStep(1.6), 0.2);
    assert.equal(r.timeStep(2.5), 0.5);
  });
  it('numbers for sentences have no trailing zeros; readouts have fixed decimals', () => {
    assert.equal(r.fmt(0.5), '0.5');
    assert.equal(r.fmt(2), '2');
    assert.equal(r.fmt(-0.0001), '0');
    assert.equal(r.fixed(1.2566), '1.26');
    assert.equal(r.fixed(-0.001, 2), '0.00');
  });
});
