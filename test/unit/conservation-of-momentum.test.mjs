// The physics of the conservation-of-momentum figure (book pages 72–73, topic 3.5.1): two balls collide on a
// straight track with no force from outside; momentum is the same before, during and after, and (the book's
// assumption) kinetic energy is the same before and after. Pure code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as c from '../../assets/conservation-of-momentum/src/collision.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);
const P = (m1, m2, a, b) => m1 * a + m2 * b;
const K = (m1, m2, a, b) => 0.5 * m1 * a * a + 0.5 * m2 * b * b;

describe('the two equations give v₁ and v₂', () => {
  it('gives the examples their clean numbers', () => {
    assert.deepEqual(c.elastic(3, 1, 2, 0), { v1: 1, v2: 3 }); // momentum 6 = 3 + 3, energy 6 = 1.5 + 4.5
    assert.deepEqual(c.elastic(2, 2, 3, 1), { v1: 1, v2: 3 }); // equal masses swap
    assert.deepEqual(c.elastic(1, 3, 2, 0), { v1: -1, v2: 1 }); // light into heavy: bounces back
    assert.deepEqual(c.elastic(3, 1, 2, -2), { v1: 0, v2: 4 }); // head-on: 6 + (−2) = 0 + 4
  });
  it('keeps momentum and kinetic energy for every setup the student can make', () => {
    for (const [m1, m2] of [
      [3, 1],
      [2, 2],
      [1, 3],
      [1.5, 4],
    ])
      for (let u1 = c.U_MIN; u1 <= c.U_MAX; u1++)
        for (let u2 = c.U_MIN; u2 < u1; u2++) {
          const { v1, v2 } = c.elastic(m1, m2, u1, u2);
          close(P(m1, m2, v1, v2), P(m1, m2, u1, u2), 1e-7, `momentum ${m1},${m2},${u1},${u2}`);
          close(K(m1, m2, v1, v2), K(m1, m2, u1, u2), 1e-7, `energy ${m1},${m2},${u1},${u2}`);
          assert.ok(v1 <= v2 + 1e-12, 'after the collision they move apart (m₁ no faster than m₂)');
        }
  });
  it('equal masses swap their velocities', () => {
    for (const [u1, u2] of [
      [3, 1],
      [2, -2],
      [1, 0],
    ])
      assert.deepEqual(c.elastic(2, 2, u1, u2), { v1: u2, v2: u1 });
  });
  it('v₂ from the momentum equation alone matches, once v₁ is known', () => {
    const q = { m1: 1, m2: 3, u1: 3, u2: -1 };
    const { v1, v2 } = c.elastic(q.m1, q.m2, q.u1, q.u2);
    assert.equal(c.v2FromMomentum(q, v1), v2);
  });
  it('the examples with masses adding up to 4 kg and whole-number velocities give halves (sums show exactly)', () => {
    for (const [m1, m2] of [
      [3, 1],
      [2, 2],
      [1, 3],
    ])
      for (let u1 = -2; u1 <= 3; u1++)
        for (let u2 = -3; u2 < u1; u2++) {
          const { v1, v2 } = c.elastic(m1, m2, u1, u2);
          assert.equal(v1 * 2, Math.round(v1 * 2));
          assert.equal(v2 * 2, Math.round(v2 * 2));
        }
  });
});

describe('a valid setup', () => {
  it('needs m₁ faster to the right than m₂ (else they never meet)', () => {
    assert.equal(c.collides({ u1: 2, u2: 0 }), true);
    assert.equal(c.collides({ u1: 1, u2: 1 }), false);
    assert.deepEqual(c.normalize({ m1: 3, m2: 1, u1: 1, u2: 1 }, 'u1'), { m1: 3, m2: 1, u1: 1, u2: 0 });
    assert.deepEqual(c.normalize({ m1: 3, m2: 1, u1: 1, u2: 1 }, 'u2'), { m1: 3, m2: 1, u1: 2, u2: 1 });
    assert.deepEqual(c.normalize({ m1: 3, m2: 1, u1: 3, u2: 3 }, 'u2'), { m1: 3, m2: 1, u1: 3, u2: 2 });
    assert.deepEqual(c.normalize({ m1: 3, m2: 1, u1: -3, u2: -3 }, 'u1'), { m1: 3, m2: 1, u1: -2, u2: -3 });
  });
  it('keeps velocities whole and within −3…3, masses within 0.5…5 kg', () => {
    assert.deepEqual(c.normalize({ m1: 9, m2: 0.1, u1: 7.4, u2: -9 }), { m1: 5, m2: 0.5, u1: 3, u2: -1 });
    assert.deepEqual(c.normalize({ m1: 2, m2: 2, u1: 1.6, u2: 0.4 }), { m1: 2, m2: 2, u1: 2, u2: 0 });
  });
  it('keeps u₁ − u₂ at most 4 m/s: the velocity the student did not just set gives way', () => {
    assert.deepEqual(c.normalize({ m1: 3, m2: 1, u1: 3, u2: -3 }, 'u1'), { m1: 3, m2: 1, u1: 3, u2: -1 });
    assert.deepEqual(c.normalize({ m1: 3, m2: 1, u1: 3, u2: -3 }, 'u2'), { m1: 3, m2: 1, u1: 1, u2: -3 });
    for (const q of c.reachableSetups()) assert.deepEqual(c.normalize(q), q);
    assert.equal(c.reachableSetups().length, 54); // 3 mass pairs × 18 velocity pairs
  });
  it('no velocity after the collision is faster than 5 m/s, so every arrow fits the track in view', () => {
    let fastest = 0;
    for (const q of c.reachableSetups()) {
      const { v1, v2 } = c.elastic(q.m1, q.m2, q.u1, q.u2);
      fastest = Math.max(fastest, Math.abs(v1), Math.abs(v2));
    }
    assert.equal(fastest, 5);
    assert.ok(fastest * c.ARROW <= 0.5);
  });
  it('knows the examples', () => {
    assert.equal(c.presetMatching(c.PRESETS.headon), 'headon');
    assert.equal(c.presetMatching({ m1: 3, m2: 1, u1: 3, u2: 0 }), '');
  });
});

describe('one run on screen', () => {
  const setups = c.reachableSetups(); // every setup the student can make
  it('the total momentum is the same at every moment, the contact included', () => {
    for (const q of setups) {
      const p = c.plan(q);
      for (let k = 0; k <= 200; k++) {
        const w = c.stateAt(p, (p.T * k) / 200);
        close(w.p1 + w.p2, p.P, 1e-6, `${JSON.stringify(q)} at ${k}`);
      }
    }
  });
  it('the kinetic energy is the same before and after (it dips only while they touch)', () => {
    for (const q of setups) {
      const p = c.plan(q);
      const a = c.stateAt(p, 0);
      const b = c.stateAt(p, p.T);
      close(a.k1 + a.k2, p.K, 1e-9);
      close(b.k1 + b.k2, p.K, 1e-9);
      const mid = c.stateAt(p, p.Tb + p.Tc / 2);
      assert.ok(mid.k1 + mid.k2 < p.K + 1e-9);
    }
  });
  it('the balls touch at the contact and never overlap; they stay inside the window with their arrows', () => {
    for (const q of setups) {
      const p = c.plan(q);
      close(p.x2c - p.x1c, p.r1 + p.r2, 1e-6, 'touching');
      for (let k = 0; k <= 100; k++) {
        const w = c.stateAt(p, (p.T * k) / 100);
        assert.ok(w.x2 - w.x1 >= p.r1 + p.r2 - 1e-6, 'no overlap');
        for (const [x, r, v] of [
          [w.x1, p.r1, w.v1],
          [w.x2, p.r2, w.v2],
        ]) {
          const lo = Math.min(x - r, x + c.ARROW * v);
          const hi = Math.max(x + r, x + c.ARROW * v);
          assert.ok(lo >= c.WINDOW.left - 1e-6 && hi <= c.WINDOW.right + 1e-6, `${JSON.stringify(q)} inside at ${k}`);
        }
      }
    }
  });
  it('runs slowed 10 times before and after, at most 0.25 s of real time each, with the contact in between', () => {
    const p = c.plan(c.PRESETS.light);
    close(p.Tb, p.tb * c.SLOW);
    close(p.Ta, p.ta * c.SLOW);
    close(p.T, p.Tb + c.CONTACT + p.Ta);
    assert.ok(p.tb <= c.T_CAP && p.ta <= c.T_CAP);
    assert.equal(c.stateAt(p, p.Tb).phase, 'before');
    assert.equal(c.stateAt(p, p.Tb + 0.01).phase, 'contact');
    assert.equal(c.stateAt(p, p.T).phase, 'after');
    // half way through the contact both move with the centre of mass (the balls are squeezed most)
    const mid = c.stateAt(p, c.momentAt(p, 'contact'));
    close(mid.v1, mid.v2, 1e-9);
    close(mid.v1, p.P / (p.m1 + p.m2), 1e-9);
  });
  it('moves at u before and at v after: the distance covered in real time', () => {
    const p = c.plan(c.PRESETS.heavy);
    const a = c.stateAt(p, 0);
    const b = c.stateAt(p, p.Tb);
    close(b.x1 - a.x1, p.u1 * p.tb, 1e-5);
    const e = c.stateAt(p, p.T);
    close(e.x2 - p.x2c, p.v2 * p.ta, 1e-5);
  });
  it('the strip covers zero, the parts and the total', () => {
    const r = c.stripRange(c.plan(c.PRESETS.headon));
    assert.deepEqual(r, { lo: 0, hi: 6 });
    const l = c.stripRange(c.plan(c.PRESETS.light));
    assert.deepEqual(l, { lo: -1, hi: 2 });
  });
});

describe('numbers', () => {
  it('writes sums without trailing zeros and with a real minus sign; live readouts with fixed decimals', () => {
    assert.equal(c.fmt(-1.5), '−1.5');
    assert.equal(c.fmt(2), '2');
    assert.equal(c.fmt(1.125, 3), '1.125');
    assert.equal(c.fmt(0.1 + 0.2), '0.3');
    assert.equal(c.fmt(4.5, 1, 1), '4.5');
    assert.equal(c.fmt(3, 1, 1), '3.0');
    assert.equal(c.fmt(-0.00001, 1, 1), '0.0');
  });
});
