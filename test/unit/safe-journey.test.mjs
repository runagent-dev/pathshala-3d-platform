// The physics of the safe-journey figure (book pages 74–75, topic 3.5.2): a loaded truck and a small car at the same
// speed collide head-on. With m₂ ≈ 0 (the book) the truck goes on at u and the car leaves at 3u, a change of 4u;
// kinetic energy grows with the square of the speed. Pure code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as c from '../../assets/safe-journey/src/crash.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);

describe('the book’s sums', () => {
  it('m₂ ≈ 0: v₁ = u and v₂ = 3u, so the car’s velocity changes by 4u', () => {
    for (const u of [1, 5.5, 16.7]) {
      const { v1, v2 } = c.elastic(20000, 0, u, -u);
      close(v1, u, 1e-9, 'v₁');
      close(v2, 3 * u, 1e-9, 'v₂');
      close(v2 - -u, 4 * u, 1e-9, 'change');
    }
  });
  it('real masses (20,000 kg and 1,000 kg): close to the book, v₁ ≈ 0.81u, v₂ ≈ 2.81u', () => {
    const { v1, v2 } = c.elastic(20000, 1000, 1, -1);
    close(v1, 17 / 21, 1e-9, 'v₁');
    close(v2, 59 / 21, 1e-9, 'v₂');
    // momentum and kinetic energy are kept
    close(20000 * v1 + 1000 * v2, 20000 - 1000, 1e-3, 'momentum');
    close(0.5 * 20000 * v1 ** 2 + 0.5 * 1000 * v2 ** 2, 0.5 * 21000, 1e-3, 'energy');
    // the car's change is m₁/m₂ = 20 times the truck's
    close((v2 + 1) / (1 - v1), 20, 1e-6, 'ratio of changes');
  });
  it('the plan gives the velocities in km/h at every speed', () => {
    for (const v of c.SPEEDS) {
      const p = c.plan(v);
      assert.deepEqual(p.kmh, { u: v, v1: v, v2: 3 * v, change: 4 * v, truckChange: 0 });
      const r = c.plan(v, 'real');
      close(r.kmh.v1, (17 / 21) * v, 1e-5, 'real v₁');
      close(r.kmh.v2, (59 / 21) * v, 1e-5, 'real v₂');
    }
  });
});

describe('kinetic energy grows with the square of the speed', () => {
  it('1, 4 and 9 cubes at 20, 40 and 60 km/h; half the speed is a quarter', () => {
    assert.deepEqual(
      c.SPEEDS.map((v) => c.cubes(v)),
      [1, 4, 9],
    );
    close(c.cubes(30), 2.25);
    close(c.cubes(50), 6.25);
    close(c.kinetic(1000, 40) / c.kinetic(1000, 20), 4, 1e-6, 'twice the speed');
    close(c.kinetic(1000, 20), 15432.099, 1e-3, '½ × 1000 × (20/3.6)²');
  });
  it('the crumple follows the energy', () => {
    assert.deepEqual(
      c.SPEEDS.map((v) => c.crumpleDepth(v)),
      [0.15, 0.6, 1.35],
    );
  });
  it('normalizeSpeed picks the nearest speed offered', () => {
    assert.equal(c.normalizeSpeed(39), 40);
    assert.equal(c.normalizeSpeed('60'), 60);
    assert.equal(c.normalizeSpeed('x'), 20);
    assert.equal(c.normalizeSpeed(200), 60);
  });
});

describe('one run', () => {
  const sample = (p, n = 400) => Array.from({ length: n + 1 }, (_, i) => c.stateAt(p, (p.duration * i) / n));
  it('starts at the start gap, touches at the contact, ends with v₁ and v₂', () => {
    for (const masses of ['book', 'real'])
      for (const v of c.SPEEDS) {
        const p = c.plan(v, masses);
        const s0 = c.stateAt(p, 0);
        assert.equal(s0.phase, 'ready');
        close(s0.front - s0.x1, p.gap, 1e-9, 'start gap');
        const touch = c.stateAt(p, p.approach);
        close(touch.x1, 0, 1e-9, 'truck front at the meeting point');
        close(touch.front, 0, 1e-9, 'car front at the meeting point');
        const end = c.stateAt(p, p.duration + 1);
        assert.equal(end.phase, 'end');
        close(end.v1, p.v1, 1e-12);
        close(end.v2, p.v2, 1e-12);
        close(end.crumple, p.c, 1e-12);
        // the car went flight m after the contact ended
        close(end.rear - c.stateAt(p, p.approach + p.contact).rear, p.flight, 1e-9, 'flight');
      }
  });
  it('positions are continuous and the car never goes into the truck', () => {
    for (const masses of ['book', 'real'])
      for (const v of c.SPEEDS) {
        const p = c.plan(v, masses);
        let prev = null;
        for (const st of sample(p, 1200)) {
          assert.ok(st.front >= st.x1 - 1e-9, `car in front of the truck (${v}, ${masses}, ${st.phase} k=${st.k})`);
          assert.ok(st.crumple >= -1e-12 && st.crumple <= p.c + 1e-9, 'crumple within 0…c');
          if (prev) {
            assert.ok(Math.abs(st.x1 - prev.x1) < 0.2, 'truck moves smoothly');
            assert.ok(Math.abs(st.rear - prev.rear) < 0.2, 'car moves smoothly');
          }
          prev = st;
        }
        // squashed most when both move together (half way through the contact)
        const mid = c.stateAt(p, p.approach + p.contact / 2);
        close(mid.crumple, p.c, 1e-9, 'crumple at mid-contact');
        close(mid.front, mid.x1, 1e-9, 'fronts together at mid-contact');
        close(mid.v1, mid.v2, 1e-9, 'same velocity at mid-contact');
      }
  });
  it('the total momentum is the same at every moment (no force from outside)', () => {
    const p = c.plan(40, 'real');
    const p0 = c.momentum(p, c.stateAt(p, 0));
    for (const st of sample(p)) close(c.momentum(p, st), p0, 1e-3, `momentum at ${st.phase} ${st.k}`);
  });
  it('the car’s velocity goes from −u through zero to 3u during the contact', () => {
    const p = c.plan(60);
    const vs = Array.from({ length: 101 }, (_, i) => c.stateAt(p, p.approach + (p.contact * i) / 100).v2);
    close(vs[0], -p.u, 1e-9);
    close(vs[100], 3 * p.u, 1e-9);
    for (let i = 1; i <= 100; i++) assert.ok(vs[i] >= vs[i - 1] - 1e-9, 'it only grows');
    assert.ok(
      vs.some((x) => Math.abs(x) < 0.5),
      'passes through zero',
    );
  });
  it('screen times: the run lasts a few seconds at every speed', () => {
    for (const v of c.SPEEDS) {
      const p = c.plan(v);
      assert.ok(p.duration > 3 && p.duration < 7, `duration ${p.duration} at ${v}`);
      assert.ok(p.after > 0.5, `flight long enough to see (${p.after} s)`);
    }
  });
});
