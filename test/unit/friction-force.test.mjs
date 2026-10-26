// The physics of the friction figure (book pages 88–89, topic 3.9): a block pushed on a table, friction always equal
// and opposite to the push until the most the table can hold, that most growing with the weight on the block, and
// the rubbing. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as p from '../../assets/friction-force/src/physics.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

describe('friction: the most the table can hold', () => {
  it('the block weighs 19.6 N; each weight adds 1 kg (9.8 N)', () => {
    close(p.weightOf(0), 19.6);
    close(p.weightOf(1), 29.4);
    close(p.weightOf(2), 39.2);
    assert.equal(p.massOf(0), 2);
    assert.equal(p.massOf(2), 4);
  });

  it('the most friction is μ × weight: 9.8, 14.7, 19.6 N: it grows with the weight, in proportion', () => {
    close(p.capacity(0), 9.8);
    close(p.capacity(1), 14.7);
    close(p.capacity(2), 19.6);
    for (const l of p.LOADS) close(p.capacity(l) / p.weightOf(l), p.MU, 1e-9);
    // more weight, more friction, always
    assert.ok(p.capacity(1) > p.capacity(0) && p.capacity(2) > p.capacity(1));
  });

  it('keeps the number of weights between 0 and 2', () => {
    close(p.capacity(-3), p.capacity(0));
    close(p.capacity(9), p.capacity(2));
  });
});

describe('friction: one push', () => {
  it('starts with no push, then a gentle 5 N held for a second (the block does not move, friction equals it)', () => {
    const a = p.pushAt(0, 0);
    assert.equal(a.phase, 'rise');
    close(a.F, 0);
    close(a.slide, 0);
    const hold = p.pushAt(p.T_RISE + 0.5, 0);
    assert.equal(hold.phase, 'hold');
    close(hold.F, p.GENTLE);
    assert.equal(hold.moving, false);
    close(hold.slide, 0);
  });

  it('then grows steadily at 6 N/s; the block stays still until the push reaches the most (9.8 N here)', () => {
    const T = p.pushTimes(0);
    const early = p.pushAt(T.climb + 0.3, 0);
    assert.equal(early.phase, 'climb');
    close(early.F, p.GENTLE + p.RATE * 0.3, 1e-9);
    assert.equal(early.moving, false);
    close(early.slide, 0);
    const justBefore = p.pushAt(T.slip - 0.01, 0);
    assert.equal(justBefore.moving, false);
    assert.ok(justBefore.F < p.capacity(0));
    const at = p.pushAt(T.slip + 0.01, 0);
    assert.equal(at.phase, 'slip');
    assert.equal(at.moving, true);
    close(at.F, p.capacity(0));
  });

  it('with weights it takes a bigger push, and longer, before the block gives way', () => {
    const t0 = p.pushTimes(0).slip;
    const t1 = p.pushTimes(1).slip;
    const t2 = p.pushTimes(2).slip;
    assert.ok(t0 < t1 && t1 < t2);
    // the push at which it slides is the capacity
    for (const l of p.LOADS) close(p.pushAt(p.pushTimes(l).slip + 0.05, l).F, p.capacity(l));
  });

  it('while it slides it creeps along steadily and the push stays at the most (F = f, no net force)', () => {
    const T = p.pushTimes(1);
    let last = -1;
    for (let k = 1; k <= 10; k++) {
      const s = p.pushAt(T.slip + (p.T_SLIP * k) / 11, 1);
      assert.equal(s.phase, 'slip');
      assert.ok(s.slide > last, 'it keeps moving');
      close(s.F, p.capacity(1));
      last = s.slide;
    }
    close(p.pushAt(T.letGo - 1e-6, 1).slide, p.pushDistance(), 1e-4);
  });

  it('then the hand lets go: the push falls to zero and the block stays where it stopped', () => {
    const T = p.pushTimes(2);
    const mid = p.pushAt(T.letGo + p.T_LET_GO / 2, 2);
    assert.equal(mid.phase, 'letgo');
    assert.ok(mid.F > 0 && mid.F < p.capacity(2));
    const done = p.pushAt(T.done + 1, 2);
    assert.equal(done.phase, 'done');
    close(done.F, 0);
    close(done.slide, p.pushDistance());
    assert.equal(p.pushDuration(2), T.done);
  });

  it('never pushes backwards, and the push never passes the most', () => {
    for (const l of p.LOADS)
      for (let t = 0; t < p.pushDuration(l) + 1; t += 0.05) {
        const s = p.pushAt(t, l);
        assert.ok(s.F >= -1e-9 && s.F <= p.capacity(l) + 1e-9, `F ${s.F} at ${t}`);
        assert.ok(s.slide >= 0);
      }
  });

  it('creeps in smoothly: no jump in position when it starts to slide', () => {
    close(p.creep(0), 0);
    assert.ok(p.creep(0.02) < p.SLIP_SPEED * 0.02);
    close(p.creep(100) - p.creep(99), p.SLIP_SPEED, 1e-6);
  });
});

describe('friction: rubbing', () => {
  it('moves to and fro about the middle; friction is always against the motion (the push and friction turn round together)', () => {
    let right = 0;
    let left = 0;
    for (let t = 0.6; t < p.RUB.time - 0.05; t += 0.02) {
      const r = p.rubAt(t, 0);
      assert.ok(Math.abs(r.x) <= p.RUB.amplitude + 1e-9);
      if (r.v > 0.05) {
        assert.equal(r.dir, 1);
        right++;
      }
      if (r.v < -0.05) {
        assert.equal(r.dir, -1);
        left++;
      }
      close(r.F, r.f); // equal and opposite while it slides steadily
      assert.ok(r.F <= p.capacity(0) + 1e-9);
    }
    assert.ok(right > 20 && left > 20, 'goes both ways');
  });

  it('the friction shrinks to nothing as the block turns round (it is standing still then)', () => {
    const w = (2 * Math.PI) / p.RUB.period;
    const turn = Math.PI / 2 / w + p.RUB.period; // v = 0 here
    close(p.rubAt(turn, 0).v, 0, 1e-9);
    close(p.rubAt(turn, 0).F, 0, 1e-9);
  });

  it('ends back in the middle, at rest, with no push', () => {
    const e = p.rubAt(p.RUB.time + 0.01, 1);
    assert.equal(e.phase, 'done');
    close(e.x, 0);
    close(e.F, 0);
  });

  it('warms while it is rubbed (to fully warm in a few seconds) and cools slowly after', () => {
    let h = 0;
    for (let i = 0; i < 40; i++) h = p.warm(h, true, 0.1);
    close(h, 1, 1e-9);
    const cooled = p.warm(1, false, 1);
    assert.ok(cooled < 1 && cooled > 0.8);
    close(p.warm(0, false, 1), 0);
  });
});

describe('friction: the teeth in the zoom-in', () => {
  it('the surface repeats every period and its corners join up', () => {
    close(p.teethY(0), 0);
    close(p.teethY(p.TEETH.period), 0, 1e-9);
    close(p.teethY(0.45), 0.75);
    close(p.teethY(0.45 + 3 * p.TEETH.period), 0.75, 1e-9);
    close(p.teethY(-p.TEETH.period + 0.45), 0.75, 1e-9);
  });

  it('more weight, deeper bite: the block’s teeth sink further into the grooves', () => {
    assert.ok(p.biteOf(0) < p.biteOf(1) && p.biteOf(1) < p.biteOf(2));
    // the cut-off tips of the block's surface sit lower the deeper the bite
    assert.ok(p.upperY(0, p.biteOf(2)) < p.upperY(0, p.biteOf(0)));
  });

  it('the block sits on the table without overlapping it, and rides up and over the teeth when it slides', () => {
    for (const l of p.LOADS) {
      const bite = p.biteOf(l);
      close(p.climb(0, bite), 0, 1e-9);
      let top = 0;
      for (let s = 0; s <= p.TEETH.period; s += 0.05) {
        const g = p.climb(s, bite);
        assert.ok(g >= -1e-9);
        top = Math.max(top, g);
        // no tooth of the block is inside the table
        for (let x = 0; x < p.TEETH.period; x += 0.05) assert.ok(p.upperY(x - s, bite) + g >= p.teethY(x) - 1e-9);
      }
      assert.ok(top > 0.4 && top < 0.76, 'it has to lift over the teeth, by about a tooth');
      close(p.climb(p.TEETH.period, bite), 0, 1e-9); // one tooth on, it drops into the next groove
    }
  });
});
