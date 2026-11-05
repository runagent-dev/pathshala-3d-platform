// The maths of the equations-of-motion figure (book pages 45–46, topic 2.7), in the book's form: s = ut + ½at² and
// v = u + at for a car starting at 0 on the number line from −7 m to 10 m, the run that ends when the car reaches an end of the axis, the 0.1 s steps, and the test's numbers and usual
// mistakes. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as m from '../../assets/equations-of-motion/src/motion.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);

describe('the opening (u = 1.9 m/s, a = 1.7 ms⁻²)', () => {
  it('s and v at t = 2 s', () => {
    close(m.distance(1.9, 1.7, 2), 3.8 + 3.4);
    close(m.velocity(1.9, 1.7, 2), 5.3);
  });
  it('the two parts add up to s, and v² = u² + 2as', () => {
    const p = m.parts(1.9, 1.7, 2);
    close(p.ut + p.half, m.distance(1.9, 1.7, 2));
    close(p.half, 3.4);
    close(m.velocity(1.9, 1.7, 2) ** 2, 1.9 ** 2 + 2 * 1.7 * m.distance(1.9, 1.7, 2));
  });
  it('the car starts at 0', () => {
    assert.equal(m.stateAt({ u: 1.9, a: 1.7 }, 0).s, 0);
  });
  it('reaches the right end of the axis (10 m) after about 2.49 s and stops there', () => {
    const run = m.runEnd(1.9, 1.7);
    assert.equal(run.end, 'right');
    close(m.distance(1.9, 1.7, run.t), 10, 1e-9);
    close(run.t, 2.49, 1e-3);
    const s = m.stateAt({ u: 1.9, a: 1.7 }, 5);
    assert.equal(s.end, 'right');
    assert.equal(s.s, 10);
    close(s.t, run.t);
  });
});

describe('every slider setting', () => {
  const values = (k) => {
    const L = m.LIMITS[k];
    const out = [];
    for (let v = L.min; v <= L.max + 1e-9; v += 0.5) out.push(m.roundTo(v, 1));
    return out;
  };
  it('the car stays on the axis for the whole run, and stops only at an end or at 6 s', () => {
    let ends = 0;
    for (const u of values('u'))
      for (const a of values('a')) {
        const run = m.runEnd(u, a);
        assert.ok(run.t > 0 && run.t <= m.LIMITS.t.max + 1e-12);
        for (let k = 0; k <= 20; k++) {
          const s = m.distance(u, a, (run.t * k) / 20);
          assert.ok(s >= m.AXIS.min - 1e-9 && s <= m.AXIS.max + 1e-9, `${u} ${a}: s = ${s}`);
        }
        if (run.end) {
          ends++;
          close(m.distance(u, a, run.t), m.AXIS[run.end === 'right' ? 'max' : 'min'], 1e-7);
        } else assert.equal(run.t, m.LIMITS.t.max);
      }
    assert.ok(ends > 100);
  });
  it('the speed never passes 12 m/s on the axis (the scale of the v–t graph)', () => {
    for (const u of values('u')) for (const a of values('a')) assert.ok(Math.abs(m.velocity(u, a, m.runEnd(u, a).t)) < 12);
  });
});

describe('sliders and steps', () => {
  it('a value is kept in range and on 0.1 steps', () => {
    assert.equal(m.fixValue('u', 7), 5);
    assert.equal(m.fixValue('a', -3.26), -3);
    assert.equal(m.fixValue('u', 1.94), 1.9);
    assert.equal(m.fixValue('u', 'x'), m.START.u);
  });
  it('a step goes to the next 0.1 s, never past the run', () => {
    assert.equal(m.stepTime(0, 1, 6), 0.1);
    assert.equal(m.stepTime(1.23, 1, 6), 1.3);
    assert.equal(m.stepTime(1.23, -1, 6), 1.2);
    assert.equal(m.stepTime(1.2, -1, 6), 1.1);
    assert.equal(m.stepTime(0, -1, 6), 0);
    close(m.stepTime(2.6, 1, 2.618), 2.618);
  });
  it('the car turns back when u and a point opposite ways', () => {
    assert.equal(m.turnTime(-3, 1.5), 2);
    assert.equal(m.turnTime(2, 1), null);
    assert.equal(m.turnTime(2, 0), null);
  });
  it('the time to reach a point', () => {
    close(m.timeToReach(2, 0, 10), 5);
    assert.equal(m.timeToReach(-2, 0, 10), Number.POSITIVE_INFINITY);
    assert.equal(m.timeToReach(0, 0, 10), Number.POSITIVE_INFINITY);
    close(m.timeToReach(0, 2, 4), 2);
  });
  it('numbers for the panel', () => {
    assert.equal(m.fmt(-0.8), '−0.8');
    assert.equal(m.fixed(-0.04, 1), '0.0');
    assert.equal(m.fixed(2.5, 2), '2.50');
  });
});

describe('the test', () => {
  for (const [kind, setups] of Object.entries(m.QUIZ))
    it(`${kind}: four different choices, the right one among them, the car on the axis`, () => {
      for (const q of setups) {
        const { right, choices } = m.answers(kind, q);
        assert.equal(choices.length, 4, `${kind} ${JSON.stringify(q)}`);
        assert.equal(new Set(choices.map((c) => c.v)).size, 4);
        assert.equal(choices[0].v, right);
        assert.ok(choices.slice(1).every((c) => c.why));
        const s = m.distance(q.u, q.a, q.t);
        assert.ok(s >= m.AXIS.min && s <= m.AXIS.max);
        assert.ok(m.runEnd(q.u, q.a).t >= q.t - 1e-9, 'it gets there before reaching an end');
      }
    });
  it('the right answers', () => {
    assert.equal(m.answers('s', { u: 2, a: 1, t: 2 }).right, 6);
    assert.equal(m.answers('v', { u: 4, a: -1, t: 3 }).right, 1);
    assert.equal(m.answers('coef', { u: 1, a: 3, t: 0 }).right, 3);
    assert.equal(m.answers('turn', { u: -3, a: 1.5, t: 0 }).right, 2);
    assert.equal(m.answers('part', { u: 1, a: 2, t: 2 }).right, 4);
  });
  it('the part questions have a whole-metre s, so it can be read off the axis', () => {
    for (const q of m.QUIZ.part) assert.ok(Number.isInteger(m.roundTo(m.distance(q.u, q.a, q.t), 6)));
  });
});
