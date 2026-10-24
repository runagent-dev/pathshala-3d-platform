// The maths of the periodic-motion figure (book p37, topic 2.2): passes of the mark, counting repetitions,
// Kepler's equation for the comet, the spring, the ECG, and the test's wrong answers. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as m from '../../assets/periodic-motion/src/motion.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

describe('periodic motion: passes of the mark', () => {
  it('a periodic motion passes the mark once every period', () => {
    const motion = m.linearMotion(2, 0.25);
    const passes = m.passTimes(motion, 0, 10, 0.5);
    assert.deepEqual(passes, [0.5, 2.5, 4.5, 6.5, 8.5]);
  });
  it('counts a pass at the end of the interval, not at its start', () => {
    const motion = m.linearMotion(1, 0);
    assert.deepEqual(m.passTimes(motion, 0, 1, 0), [1]);
    assert.deepEqual(m.passTimes(motion, 1, 1.5, 0), []);
  });
  it('small steps find the same passes as one big step', () => {
    const motion = m.linearMotion(0.8, 0.55);
    const big = m.passTimes(motion, 0, 12, 0.25);
    const small = [];
    for (let t = 0; t < 12 - 1e-9; t += 0.05) small.push(...m.passTimes(motion, t, Math.min(12, t + 0.05), 0.25));
    assert.equal(small.length, big.length);
    small.forEach((v, i) => close(v, big[i], 1e-9));
  });
  it('a fan switched off slows down: every turn takes longer, and it stops', () => {
    const motion = m.slowingMotion(0.2, 0, 1.5);
    const passes = m.passTimes(motion, 0, 100, 0);
    assert.equal(passes.length, 7); // 7.5 turns in all
    const laps = passes.slice(1).map((v, i) => v - passes[i]);
    for (let i = 1; i < laps.length; i++) assert.ok(laps[i] > laps[i - 1]);
    assert.equal(motion.timeAt(10), Number.POSITIVE_INFINITY);
  });
});

describe('periodic motion: counting repetitions', () => {
  it('starts the clock at the first pass; total ÷ count is the period', () => {
    const c = m.createCounter();
    assert.equal(c.period, null);
    c.pass(0.76);
    assert.equal(c.started, true);
    assert.equal(c.count, 0);
    assert.equal(c.clock(1.5), 1.5 - 0.76);
    for (const t of [2.76, 4.76, 6.76]) c.pass(t);
    assert.equal(c.count, 3);
    close(c.total, 6);
    close(c.period, 2);
    assert.equal(c.laps.length, 3);
    for (const lap of c.laps) close(lap, 2);
    c.reset();
    assert.equal(c.started, false);
    assert.equal(c.total, 0);
  });
});

describe('periodic motion: the comet (Kepler)', () => {
  const e = m.EXAMPLES.comet.e;
  it('solves Kepler’s equation', () => {
    for (const M of [0, 0.1, 1, 2, 3, Math.PI, 4, 6]) {
      const E = m.eccentricAnomaly(M, e);
      close(E - e * Math.sin(E), ((M % m.TAU) + m.TAU) % m.TAU, 1e-10);
    }
  });
  it('is nearest the Sun at phase 0 and farthest at phase 0.5', () => {
    close(m.orbitAt(0, e).r, 1 - e);
    close(m.orbitAt(0.5, e).r, 1 + e);
  });
  it('is fast near the Sun and slow far away: v ratio (1 + e) / (1 − e)', () => {
    const speed = (o) => Math.hypot(o.vx, o.vy);
    close(speed(m.orbitAt(0, e)) / speed(m.orbitAt(0.5, e)), (1 + e) / (1 - e), 1e-9);
  });
  it('keeps to the vis-viva law (speed² ∝ 2/r − 1/a)', () => {
    const k = (o) => (o.vx ** 2 + o.vy ** 2) / (2 / o.r - 1);
    const k0 = k(m.orbitAt(0.1, e));
    for (const p of [0.2, 0.37, 0.5, 0.8]) close(k(m.orbitAt(p, e)), k0, 1e-6);
  });
  it('maps a point of the orbit back to its phase', () => {
    for (const p of [0.05, 0.3, 0.62, 0.9]) close(m.phaseOfAnomaly(m.orbitAt(p, e).E, e), p, 1e-10);
  });
  it('takes 76 years a lap', () => assert.equal(m.EXAMPLES.comet.period, 76));
});

describe('periodic motion: the spring and the heart', () => {
  it('a spring of 200 g and 5.5 N/m has a period of about 1.2 s', () => {
    close(2 * Math.PI * Math.sqrt(0.2 / 5.5), m.EXAMPLES.spring.period, 0.01);
  });
  it('the mass is at the top at phase 0 and passes a height on its way down at the phase given', () => {
    const amp = 0.05;
    close(m.springAt(0, amp).y, amp);
    for (const y of [0.04, 0, -0.03]) {
      const p = m.springPhaseDown(y, amp);
      close(m.springAt(p, amp).y, y, 1e-12);
      assert.ok(m.springAt(p + 1e-4, amp).vy < 0 || y === amp, 'going down');
    }
  });
  it('the ECG repeats every beat and its tallest wave is the mark', () => {
    const mark = m.EXAMPLES.heart.mark;
    let best = 0;
    for (let i = 0; i < 1000; i++) if (m.ecg(i / 1000) > m.ecg(best)) best = i / 1000;
    close(best, mark, 0.002);
    close(m.ecg(0.37), m.ecg(1.37), 1e-12);
  });
  it('75 beats a minute is a period of 0.8 s', () => close(60 / 75, m.EXAMPLES.heart.period));
});

describe('periodic motion: numbers and the test', () => {
  it('writes times as the panel does', () => {
    assert.equal(m.fmtTime(0.2, 's'), '0.20');
    assert.equal(m.fmtTime(152.0000001, 'yr'), '152');
    assert.equal(m.fmtNum(0.8), '0.8');
    assert.equal(m.fmtNum(1.25), '1.25');
    assert.equal(m.fmtNum(1 / 75), '0.013');
  });
  it('builds wrong answers from the usual mistakes, all different from the right one', () => {
    for (const [total, n] of [
      [5, 20],
      [12, 10],
      [228, 3],
      [16, 20],
    ]) {
      const wrong = m.periodMistakes(total, n);
      assert.equal(wrong.length, 3);
      const all = [total / n, ...wrong].map((v) => m.fmtNum(v));
      assert.equal(new Set(all).size, 4, all.join(' '));
    }
    assert.deepEqual(
      m.periodMistakes(5, 20).map((v) => m.fmtNum(v)),
      ['4', '0.26', '5'],
    );
  });
  it('heartbeat answers: the right one is 60 ÷ beats, the wrong ones differ', () => {
    for (const bpm of [72, 75, 80, 100]) {
      const all = [60 / bpm, ...m.heartMistakes(bpm)].map((v) => m.fmtNum(v));
      assert.equal(new Set(all).size, 4, all.join(' '));
    }
  });
});
