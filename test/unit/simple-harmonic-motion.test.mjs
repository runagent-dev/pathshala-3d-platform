// The physics of the simple harmonic motion figure (book p37, topic 2.2): x = x0 cos ωt, the speed zero at the
// ends and greatest at the equilibrium point, one period for the full back-and-forth, the strobe dots, and the
// claim that the swing's small-swing period is good to 1.3 % up to 25°.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as shm from '../../assets/simple-harmonic-motion/src/motion.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

describe('simple harmonic motion: periods', () => {
  it('swing: T = 2π √(L / g) for L = 1.5 m', () => close(shm.period('swing'), 2 * Math.PI * Math.sqrt(1.5 / 9.8)));
  it('spring: T = 2π √(m / k) = 1.2566 s for 2 kg on 50 N/m', () => close(shm.period('spring'), (2 * Math.PI) / 5));
  it('the spring stretches m g / k to its equilibrium point', () => close(shm.springStretch(), 0.392));
  it('the small-swing period is within 1.3 % of the real one up to 25°', () => {
    // the real period of a pendulum: T0 / AGM(1, cos(θ0 / 2))
    const agm = (a, b) => {
      for (let i = 0; i < 30; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
      return a;
    };
    const exact = shm.period('swing') / agm(1, Math.cos((shm.SWING.maxDeg * Math.PI) / 180 / 2));
    assert.ok(exact / shm.period('swing') - 1 < 0.013);
  });
});

describe('simple harmonic motion: speed over one period', () => {
  for (const example of shm.EXAMPLES) {
    const T = shm.period(example);
    const x0 = shm.startAmplitude(example);
    it(`${example}: at rest at the end it was let go from`, () => {
      const m = shm.motionAt(example, x0, 0);
      assert.deepEqual([m.x, m.speed, m.phase], [x0, 0, 0]);
    });
    it(`${example}: greatest speed |x0| ω at the equilibrium point`, () => {
      const m = shm.motionAt(example, x0, T / 4);
      close(m.x, 0, 1e-12);
      close(m.speed, m.maxSpeed, 1e-12);
      close(m.maxSpeed, x0 * shm.omega(example));
    });
    it(`${example}: zero again at the other end, after half a period`, () => {
      const m = shm.motionAt(example, x0, T / 2);
      close(m.x, -x0, 1e-12);
      close(m.speed, 0, 1e-12);
    });
    it(`${example}: the speed grows all the way from the end to the equilibrium point, then falls`, () => {
      const speeds = Array.from({ length: 21 }, (_, i) => shm.motionAt(example, x0, (i / 40) * T).speed);
      for (let i = 1; i <= 10; i++) assert.ok(speeds[i] > speeds[i - 1]);
      for (let i = 11; i <= 20; i++) assert.ok(speeds[i] < speeds[i - 1]);
    });
    it(`${example}: back where it started after one period`, () => {
      const m = shm.motionAt(example, -x0, T);
      close(m.x, -x0, 1e-12);
      close(m.phase, 0, 1e-9);
    });
  }
  it('the period does not depend on the amplitude', () => {
    const T = shm.period('swing');
    for (const a of shm.amplitudeRange('swing')) close(shm.motionAt('swing', a, T).x, a, 1e-12);
  });
});

describe('simple harmonic motion: places and dots', () => {
  it('names the place and the way it goes', () => {
    assert.deepEqual(shm.placeOf(0), { place: 'end', going: 'in' });
    assert.deepEqual(shm.placeOf(0.12), { place: 'between', going: 'in' });
    assert.deepEqual(shm.placeOf(0.25), { place: 'middle', going: 'out' });
    assert.deepEqual(shm.placeOf(0.4), { place: 'between', going: 'out' });
    assert.deepEqual(shm.placeOf(0.5), { place: 'end', going: 'in' });
    assert.deepEqual(shm.placeOf(0.74), { place: 'middle', going: 'in' });
    assert.deepEqual(shm.placeOf(0.99), { place: 'end', going: 'out' });
  });
  it('9 dots from end to end, every T/16, close together near the ends', () => {
    const f = shm.strobe();
    assert.equal(f.length, 9);
    assert.deepEqual([f[0], f[4], f[8]], [1, 0, -1]);
    const gaps = f.slice(1).map((v, i) => f[i] - v);
    for (let i = 1; i < 4; i++) assert.ok(gaps[i] > gaps[i - 1]);
    close(shm.strobeStep('spring'), shm.period('spring') / 16);
  });
  it('amplitudes: the swing 8°…25° along its arc, the spring 4.5…9 cm', () => {
    const [lo, hi] = shm.amplitudeRange('swing');
    close(shm.degOf(lo), 8);
    close(shm.degOf(hi), 25);
    assert.deepEqual(shm.amplitudeRange('spring'), [0.045, 0.09]);
    close(shm.arcOf(18), (1.5 * 18 * Math.PI) / 180);
  });
  it('the period from a half journey: 2h, and the usual mistakes', () => {
    assert.deepEqual(shm.periodChoices(1.5), { right: 3, wrong: [1.5, 0.75, 6] });
  });
});
