// The maths of the equations-of-motion figure (book pages 45–46, topic 2.7): v = u + at, V = (u + v)/2,
// s = Vt = ut + ½at², v² = u² + 2as for a train with uniform acceleration, the steppers' limits (a braking train
// stops, it never goes backwards), and the test's numbers and usual mistakes. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as m from '../../assets/equations-of-motion/src/motion.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);

/** Every plan the steppers can reach. */
function allPlans() {
  const out = [];
  for (let u = m.LIMITS.u.min; u <= m.LIMITS.u.max; u += m.LIMITS.u.step)
    for (let a = m.LIMITS.a.min; a <= m.LIMITS.a.max + 1e-9; a = m.roundTo(a + m.LIMITS.a.step, 2))
      for (let t = m.LIMITS.t.min; t <= m.LIMITS.t.max; t += m.LIMITS.t.step) if (m.valid(u, a, t)) out.push({ u, a, t });
  return out;
}

describe('the opening example (u = 4 m/s, a = 1 m/s², t = 6 s)', () => {
  it('ends at v = u + at = 10 m/s, with V = 7 m/s and s = 42 m', () => {
    assert.deepEqual(m.solve(m.START), { u: 4, a: 1, t: 6, v: 10, V: 7, s: 42, ut: 24, half: 18 });
  });
});

describe('the equations of motion agree with each other for every plan', () => {
  const plans = allPlans();
  it('covers speeding up, steady and braking trains', () => {
    assert.ok(plans.some((p) => p.a > 0) && plans.some((p) => p.a === 0) && plans.some((p) => p.a < 0));
    assert.ok(plans.length > 300);
  });
  it('s = Vt = ((u + v)/2)·t = ut + ½at², and v² = u² + 2as', () => {
    for (const p of plans) {
      const { u, a, t, v, V, s } = m.solve(p);
      close(v, u + a * t, 1e-9, 'v');
      close(V, (u + v) / 2, 1e-9, 'V');
      close(s, V * t, 1e-9, 's = Vt');
      close(s, u * t + 0.5 * a * t * t, 1e-9, 's = ut + ½at²');
      close(v * v, u * u + 2 * a * s, 1e-6, 'v² = u² + 2as');
    }
  });
  it('the average velocity is the velocity at half the time (the book, page 46)', () => {
    for (const p of plans) close(m.velocityAt(p.u, p.a, p.t / 2), m.averageVelocity(p.u, p.a, p.t), 1e-9);
  });
  it('the distance is the area under the velocity–time line: the sum of its 1-second strips', () => {
    for (const p of plans) {
      const marks = [0, ...m.secondMarks(p.u, p.a, p.t)];
      let area = 0;
      for (let k = 0; k < p.t; k++) {
        const v0 = m.velocityAt(p.u, p.a, k);
        const v1 = m.velocityAt(p.u, p.a, k + 1);
        const strip = ((v0 + v1) / 2) * 1;
        close(marks[k + 1] - marks[k], strip, 1e-9, `strip ${k}`);
        area += strip;
      }
      close(area, m.distance(p.u, p.a, p.t), 1e-9);
    }
  });
  it('in equal seconds the distances are not equal when it accelerates (the book, page 45), equal when a = 0', () => {
    const marks = [0, ...m.secondMarks(4, 1, 6)];
    const gaps = marks.slice(1).map((x, k) => m.roundTo(x - marks[k], 6));
    assert.deepEqual(gaps, [4.5, 5.5, 6.5, 7.5, 8.5, 9.5]);
    const steady = [0, ...m.secondMarks(6, 0, 4)];
    assert.deepEqual(
      steady.slice(1).map((x, k) => x - steady[k]),
      [6, 6, 6, 6],
    );
  });
  it('with no acceleration v = u and s = vt', () => {
    for (const p of plans.filter((q) => q.a === 0)) {
      const r = m.solve(p);
      assert.equal(r.v, r.u);
      close(r.s, r.v * r.t);
    }
  });
});

describe('the train only goes forwards', () => {
  it('every reachable plan keeps v ≥ 0 all the way', () => {
    for (const p of allPlans()) for (let k = 0; k <= 20; k++) assert.ok(m.velocityAt(p.u, p.a, (p.t * k) / 20) >= -1e-9);
  });
  it('braking from 12 m/s at 1.5 m/s² it stops after 8 s', () => {
    assert.equal(m.stopTime(12, -1.5), 8);
    assert.equal(m.stopTime(12, 0), Infinity);
  });
  it('one more second than it takes to stop is refused', () => {
    assert.deepEqual(m.stepPlan({ u: 12, a: -1.5, t: 8 }, 't', 1), { u: 12, a: -1.5, t: 8, note: 'stops' });
  });
  it('braking harder cuts the time to when it stops', () => {
    assert.deepEqual(m.stepPlan({ u: 4, a: -0.5, t: 6 }, 'a', -1), { u: 4, a: -1, t: 4, note: 'cut' });
    assert.deepEqual(m.stepPlan({ u: 4, a: -1, t: 4 }, 'u', -1), { u: 3, a: -1, t: 3, note: 'cut' });
  });
  it('at rest, a negative acceleration is refused (it would go backwards)', () => {
    assert.deepEqual(m.stepPlan({ u: 0, a: 0, t: 5 }, 'a', -1), { u: 0, a: 0, t: 5, note: 'backwards' });
    assert.deepEqual(m.stepPlan({ u: 1, a: -1, t: 1 }, 'u', -1), { u: 1, a: -1, t: 1, note: 'backwards' });
  });
  it('the steppers stop at the ends of their ranges', () => {
    assert.equal(m.stepPlan({ u: 15, a: 0, t: 5 }, 'u', 1).note, 'max');
    assert.equal(m.stepPlan({ u: 4, a: -1.5, t: 2 }, 'a', -1).note, 'min');
    assert.equal(m.stepPlan({ u: 4, a: 1, t: 1 }, 't', -1).note, 'min');
    assert.deepEqual(m.stepPlan({ u: 4, a: 1, t: 6 }, 'a', 1), { u: 4, a: 1.5, t: 6, note: null });
  });
  it('fixPlan makes any numbers allowed', () => {
    assert.deepEqual(m.fixPlan({ u: 4.4, a: 0.7, t: 6.2 }), { u: 4, a: 0.5, t: 6 });
    assert.deepEqual(m.fixPlan({ u: 99, a: -9, t: 99 }), { u: 15, a: -1.5, t: 10 });
    assert.deepEqual(m.fixPlan({ u: 6, a: -1.5, t: 9 }), { u: 6, a: -1.5, t: 4 });
    assert.deepEqual(m.fixPlan({ u: 0, a: -1, t: 3 }), { u: 0, a: 0, t: 3 });
    assert.deepEqual(m.fixPlan({}), m.START);
  });
});

describe('time from distance (dragging the train)', () => {
  it('is the inverse of s(τ), speeding up, steady or braking to a stop', () => {
    for (const [u, a, t] of [
      [4, 1, 6],
      [0, 1.5, 8],
      [6, 0, 5],
      [12, -1.5, 8],
    ]) {
      for (let k = 0; k <= 10; k++) {
        const tau = (t * k) / 10;
        close(m.timeAt(u, a, m.distanceAt(u, a, tau), t), tau, 1e-6, `${u},${a} at ${tau}`);
      }
      assert.equal(m.timeAt(u, a, -5, t), 0);
      assert.equal(m.timeAt(u, a, 1e6, t), t);
    }
  });
});

describe('numbers', () => {
  it('in sentences have no trailing zeros and a real minus sign', () => {
    assert.equal(m.fmt(42), '42');
    assert.equal(m.fmt(6.5), '6.5');
    assert.equal(m.fmt(2.25), '2.25');
    assert.equal(m.fmt(0.1 + 0.2), '0.3');
    assert.equal(m.fmt(-1.5), '−1.5');
    assert.equal(m.fmt(-0.0001), '0');
    assert.equal(m.fixed(12.345, 1), '12.3');
    assert.equal(m.fixed(-0.04, 1), '0.0');
  });
  it('the velocity axis gets a round top above the fastest velocity', () => {
    assert.deepEqual(m.niceAxis(10), { max: 10, step: 2 });
    assert.deepEqual(m.niceAxis(15), { max: 16, step: 4 });
    assert.deepEqual(m.niceAxis(0), { max: 2, step: 1 });
    assert.deepEqual(m.niceAxis(4.5), { max: 5, step: 1 });
    for (let top = 0; top <= 30; top += 0.5) {
      const ax = m.niceAxis(top);
      assert.ok(ax.max >= top && ax.max / ax.step <= 6, `top ${top}`);
    }
  });
});

describe('the test', () => {
  const kinds = { v: ['v'], s: ['s', 'area'], avg: ['avg', 'mid'], zero: ['zero-v', 'zero-s'], brake: ['brake-s', 'brake-t'] };
  it('uses numbers a real train can have, inside the steppers’ ranges', () => {
    for (const [set, list] of Object.entries(m.QUIZ))
      for (const q of list) {
        const t = q.t ?? m.stopTime(q.u, q.a);
        assert.deepEqual(m.fixPlan({ ...q, t }), { u: q.u, a: q.a, t }, `${set} ${JSON.stringify(q)}`);
        if (set === 'zero') assert.equal(q.a, 0);
        if (set === 'brake') assert.ok(q.a < 0 && Number.isInteger(t), `${JSON.stringify(q)} stops after a whole number of seconds`);
      }
  });
  it('has the right answers', () => {
    assert.equal(m.answers('v', { u: 4, a: 1, t: 6 }).right, 10);
    assert.equal(m.answers('s', { u: 4, a: 1, t: 6 }).right, 42);
    assert.equal(m.answers('area', { u: 4, a: 1, t: 6 }).right, 42);
    assert.equal(m.answers('avg', { u: 4, a: 1, t: 6 }).right, 7);
    assert.equal(m.answers('mid', { u: 12, a: -1, t: 6 }).right, 9);
    assert.equal(m.answers('zero-v', { u: 6, a: 0, t: 5 }).right, 6);
    assert.equal(m.answers('zero-s', { u: 6, a: 0, t: 5 }).right, 30);
    assert.equal(m.answers('brake-s', { u: 12, a: -1.5 }).right, 48); // 0 = 12² − 2 × 1.5 × s
    assert.equal(m.answers('brake-t', { u: 12, a: -1.5 }).right, 8);
  });
  it('always has at least three different wrong answers, none equal to the right one', () => {
    for (const [set, list] of Object.entries(m.QUIZ))
      for (const q of list)
        for (const kind of kinds[set]) {
          const { right, wrong } = m.answers(kind, { ...q, t: q.t ?? m.stopTime(q.u, q.a) });
          const distinct = new Set(
            Object.values(wrong)
              .filter((w) => w >= 0 && m.fmt(w) !== m.fmt(right))
              .map((w) => m.fmt(w)),
          );
          assert.ok(distinct.size >= 3, `${kind} ${JSON.stringify(q)}: ${[...distinct]}`);
        }
  });
});
