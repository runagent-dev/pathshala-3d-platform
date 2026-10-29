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
    close(hold.f, p.GENTLE);
    assert.equal(hold.moving, false);
    close(hold.slide, 0);
  });

  it('then grows steadily at 6 N/s; friction equals the push and the block stays still until the push reaches the most (9.8 N here)', () => {
    const T = p.pushTimes(0);
    const early = p.pushAt(T.climb + 0.3, 0);
    assert.equal(early.phase, 'climb');
    close(early.F, p.GENTLE + p.RATE * 0.3, 1e-9);
    close(early.f, early.F);
    assert.equal(early.moving, false);
    close(early.slide, 0);
    const justBefore = p.pushAt(T.slip - 0.01, 0);
    assert.equal(justBefore.moving, false);
    assert.ok(justBefore.F < p.capacity(0));
    close(justBefore.f, justBefore.F);
  });

  it('once the push passes the most the block gives way: friction stays at the most, the push goes on past it, the block speeds up', () => {
    for (const l of p.LOADS) {
      const T = p.pushTimes(l);
      const c = p.capacity(l);
      let lastV = -1;
      let lastX = -1;
      for (let k = 1; k <= 12; k++) {
        const s = p.pushAt(T.slip + (p.T_SLIP * k) / 12.5, l);
        assert.equal(s.phase, 'slip');
        assert.equal(s.moving, true);
        close(s.f, c); // friction does not grow any more
        assert.ok(s.F > c, `the push is more than the friction (${s.F} vs ${c})`);
        assert.ok(s.F <= c + p.extraOf(l) + 1e-9);
        assert.ok(s.v > lastV, 'it keeps speeding up');
        assert.ok(s.slide > lastX);
        lastV = s.v;
        lastX = s.slide;
      }
    }
  });

  it('the acceleration is (push − friction) / mass: the same 1.2 m/s² whatever the weights, since the extra push is mass × 1.2', () => {
    for (const l of p.LOADS) {
      close(p.extraOf(l) / p.massOf(l), p.A_NET, 1e-9);
      const T = p.pushTimes(l);
      // steady part: once the extra push has built up, the speed grows by A_NET each second
      const a = p.pushAt(T.slip + 0.5, l);
      const b = p.pushAt(T.slip + 0.6, l);
      close((b.v - a.v) / 0.1, p.A_NET, 1e-6);
      close((a.F - a.f) / p.massOf(l), p.A_NET, 0.02);
    }
    assert.ok(p.extraOf(0) < p.extraOf(1) && p.extraOf(1) < p.extraOf(2));
  });

  it('with weights it takes a bigger push, and longer, before the block gives way', () => {
    const t0 = p.pushTimes(0).slip;
    const t1 = p.pushTimes(1).slip;
    const t2 = p.pushTimes(2).slip;
    assert.ok(t0 < t1 && t1 < t2);
    for (const l of p.LOADS) close(p.pushAt(p.pushTimes(l).slip - 1e-6, l).F, p.capacity(l), 1e-4);
  });

  it('then the hand lets go: the push is gone at once, friction alone slows the block (μg = 4.9 m/s²) to a stop', () => {
    for (const l of p.LOADS) {
      const T = p.pushTimes(l);
      const c = p.capacity(l);
      const first = p.pushAt(T.release + 1e-6, l);
      assert.equal(first.phase, 'coast');
      close(first.F, 0);
      close(first.f, c);
      assert.equal(first.moving, true);
      const later = p.pushAt(T.release + 0.05, l);
      close(first.v - later.v, p.SLOWING * 0.05, 1e-3);
      const done = p.pushAt(T.done + 1, l);
      assert.equal(done.phase, 'done');
      close(done.F, 0);
      close(done.f, 0);
      close(done.v, 0);
      close(done.slide, p.pushDistance(), 1e-9);
      assert.equal(p.pushDuration(l), T.done);
    }
  });

  it('stops where the physics says, the same place whatever the weights (≈ 0.19 m), with no jump in position', () => {
    close(p.pushDistance(), 0.192, 0.003);
    for (const l of p.LOADS) {
      const T = p.pushTimes(l);
      const before = p.pushAt(T.release - 1e-6, l);
      const after = p.pushAt(T.release + 1e-6, l);
      close(before.slide, after.slide, 1e-4);
      close(before.v, after.v, 1e-4);
      const end = p.pushAt(T.done - 1e-6, l);
      close(end.slide, p.pushDistance(), 1e-4);
      close(end.v, 0, 1e-3);
    }
  });

  it('never pushes backwards, never stops with the push less than friction while it speeds up, and the block never goes back', () => {
    for (const l of p.LOADS)
      for (let t = 0; t < p.pushDuration(l) + 1; t += 0.02) {
        const s = p.pushAt(t, l);
        assert.ok(s.F >= -1e-9, `F ${s.F} at ${t}`);
        assert.ok(s.slide >= -1e-9 && s.v >= -1e-9);
        if (!s.moving) close(s.f, s.F, 1e-9); // at rest friction is exactly the push
      }
  });

  it('the pad follows the block while the hand pushes and stays where the hand let go', () => {
    const T = p.pushTimes(1);
    const mid = p.pushAt(T.slip + 0.3, 1);
    close(mid.padX, mid.slide);
    const late = p.pushAt(T.release + 0.05, 1);
    assert.ok(late.padX < late.slide);
    close(late.padX, p.pushAt(T.release - 1e-6, 1).slide, 1e-4);
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

describe('friction force: rope-pulling anatomy', () => {
  it('hands reach a horizontal rope while the knees stay above the floor', async () => {
    const { createPuller } = await import('../../assets/friction-force/src/person.js');
    const { Vector3 } = await import('three');
    const human = createPuller();
    for (const effort of [0, 0.5, 1])
      for (const shift of [-0.1, 0, 0.1]) {
        const targets = [new Vector3(0.29 - shift / 2, 0.9, 0.12), new Vector3(0.29 - shift / 2, 0.9, -0.12)];
        human.pose({ lean: -0.12 - 0.1 * effort, hipY: 0.81 - 0.04 * effort, hands: targets });
        for (let i = 0; i < 2; i++) assert.ok(human.handAt(i).distanceTo(targets[i]) < 0.003);
        for (const leg of human.bones().filter((b) => b[3] === 'leg')) assert.ok(leg[1].y > 0.03, 'knee/ankle above floor');
      }
  });
  it('the backward shuffle keeps a stance shoe planted', async () => {
    const { createPuller } = await import('../../assets/friction-force/src/person.js');
    const { Vector3 } = await import('three');
    const human = createPuller(),
      v = new Vector3(),
      x = [];
    for (const distance of [0.12, 0.16, 0.2]) {
      human.root.position.x = distance;
      human.pose({ distance, walking: true });
      human.root.updateMatrixWorld(true);
      x.push(human.feet[0].getWorldPosition(v).x);
    }
    for (const value of x) assert.ok(Math.abs(value - x[0]) < 1e-8);
  });
});
