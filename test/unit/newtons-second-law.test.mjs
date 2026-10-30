// The newtons-second-law figure's maths (assets/newtons-second-law/src/physics.js): F = ma for the handcart, the run
// (push, roll on, stopped by the sacks; or pushed back to rest), what the student measures, and the test's choices.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  BUFFER_X,
  CALC_CASES,
  CATCH_X,
  calcChoices,
  catcherAt,
  doubleChoices,
  EXAMPLE_IDS,
  markTimes,
  measured,
  momentum,
  PAIR_CASES,
  PUSH_TIME,
  pairRatio,
  planOf,
  EXAMPLES,
  forceBalance,
  plain,
  pusherAt,
  RATIO_KEYS,
  round,
  runAt,
  stampTimes,
} from '../../assets/newtons-second-law/src/physics.js';
import { DWELL, LEAD, playbackOf, playTime, SLOW } from '../../assets/newtons-second-law/src/clock.js';

describe('newtons-second-law: F = ma', () => {
  test('the four examples: 1, 2, 0.5 and −1 ms⁻²', () => {
    const a = Object.fromEntries(EXAMPLE_IDS.map((id) => [id, measured(planOf(id)).a]));
    assert.deepEqual(a, { base: 1, force: 2, mass: 0.5, back: -1 });
    // double the force: double a; double the mass: half a
    assert.equal(a.force / a.base, 2);
    assert.equal(a.mass / a.base, 0.5);
  });

  test('force and mass of each example', () => {
    assert.deepEqual([planOf('base').F, planOf('base').m], [100, 100]);
    assert.deepEqual([planOf('force').F, planOf('force').m], [200, 100]);
    assert.deepEqual([planOf('mass').F, planOf('mass').m], [100, 200]);
    assert.deepEqual([planOf('back').F, planOf('back').m], [100, 100]);
  });

  test('a = (v − u) / t over the push, from rest', () => {
    for (const { id, v } of [
      { id: 'base', v: 2 },
      { id: 'force', v: 4 },
      { id: 'mass', v: 1 },
    ]) {
      const m = measured(planOf(id));
      assert.deepEqual([m.u, m.v, m.t], [0, v, PUSH_TIME], id);
      assert.equal(m.a, round((m.v - m.u) / m.t, 3));
    }
  });

  test('back: pushed to 2 m/s, rolls to the person in front, pushed back to rest', () => {
    const plan = planOf('back');
    assert.deepEqual(
      plan.segs.map((s) => s.kind),
      ['push', 'coast', 'brake'],
    );
    const m = measured(plan);
    assert.deepEqual([m.u, m.v, m.t, m.a, m.F], [2, 0, 2, -1, -100]);
    const brake = plan.segs[2];
    assert.ok(Math.abs(brake.x0 - CATCH_X) < 1e-9);
    assert.ok(Math.abs(plan.xEnd - (CATCH_X + 2)) < 1e-9); // 2 m to stop (v² = 2as)
    assert.ok(plan.xEnd < BUFFER_X); // it stops before the sacks
    // the momentum falls from 200 to 0 kg m/s, as fast as the force says (100 N: 100 kg m/s each second)
    assert.equal(momentum(plan.m, m.u), 200);
    assert.equal(momentum(plan.m, m.v), 0);
    assert.equal((momentum(plan.m, m.v) - momentum(plan.m, m.u)) / m.t, m.F);
  });
});

describe('newtons-second-law: the run', () => {
  test('at rest before the push', () => {
    const r = runAt(planOf('base'), 0);
    assert.deepEqual([r.phase, r.x, r.v, r.F], ['rest', 0, 0, 0]);
  });

  test('during the push the velocity grows evenly; x = ½ a t²', () => {
    const plan = planOf('base');
    for (const t of [0.5, 1, 1.5]) {
      const r = runAt(plan, t);
      assert.equal(r.phase, 'push');
      assert.ok(Math.abs(r.v - t) < 1e-9);
      assert.ok(Math.abs(r.x - 0.5 * t * t) < 1e-9);
      assert.equal(r.F, 100);
    }
  });

  test('after the push it rolls on at the same velocity, then the sacks stop it', () => {
    const plan = planOf('force');
    const a = runAt(plan, 2.1);
    const b = runAt(plan, 2.3);
    assert.equal(a.phase, 'coast');
    assert.ok(Math.abs(a.v - 4) < 1e-9 && Math.abs(b.v - 4) < 1e-9);
    assert.equal(a.F, 0);
    const end = runAt(plan, 10);
    assert.equal(end.phase, 'stopped');
    assert.ok(Math.abs(end.x - (BUFFER_X + 0.12)) < 1e-9);
    assert.equal(end.v, 0);
  });

  test('the slowest run still reaches the sacks', () => {
    const plan = planOf('mass');
    assert.ok(plan.end > 6 && plan.end < 7);
    assert.equal(runAt(plan, plan.end + 0.01).phase, 'stopped');
  });

  test('a mark every second until it stops', () => {
    assert.deepEqual(markTimes(planOf('base')), [0, 1, 2, 3]);
    assert.equal(markTimes(planOf('mass')).length, 7);
  });

  test('the pusher lets go after 2 s and slows to a stop; the person in front waits, then goes back with it', () => {
    const plan = planOf('base');
    assert.equal(pusherAt(plan, 1).on, true);
    const off = pusherAt(plan, 2.2);
    assert.equal(off.on, false);
    assert.ok(off.v < 2 && off.v > 0);
    const later = pusherAt(plan, 5);
    assert.equal(later.v, 0);
    // stops well behind the cart
    assert.ok(later.dx < runAt(plan, 5).x);
    const back = planOf('back');
    assert.equal(catcherAt(back, 1).on, false);
    assert.equal(catcherAt(back, back.segs[2].t0 + 1).on, true);
    assert.ok(Math.abs(catcherAt(back, back.end + 1).dx - 2) < 1e-9);
  });
});

describe('newtons-second-law: the test', () => {
  test('a from F and the masses: four different answers, at most two decimals', () => {
    for (const c of CALC_CASES) {
      const ch = calcChoices(c.F, c.sacks);
      const all = [ch.right, ...ch.wrong.map((w) => w.value)];
      assert.equal(new Set(all).size, 4, JSON.stringify(c));
      for (const v of all) assert.equal(round(v, 2), v);
      assert.equal(ch.right, round(c.F / ch.M, 3));
    }
    assert.deepEqual(calcChoices(300, 1), {
      M: 150,
      right: 2,
      wrong: [
        { kind: 'cart', value: 3 },
        { kind: 'sacks', value: 6 },
        { kind: 'inverse', value: 0.5 },
      ],
    });
  });

  test('doubling: twice the force doubles a, twice the mass halves it', () => {
    assert.deepEqual(doubleChoices(1, 'force').right, 2);
    assert.deepEqual(doubleChoices(1, 'mass').right, 0.5);
    assert.deepEqual(doubleChoices(0.5, 'force').right, 1);
    for (const { a, w } of /** @type {Array<{ a: number, w: 'force' | 'mass' }>} */ ([
      { a: 1, w: 'force' },
      { a: 1, w: 'mass' },
      { a: 0.5, w: 'force' },
    ])) {
      const ch = doubleChoices(a, w);
      assert.equal(new Set([ch.right, ...ch.wrong.map((x) => x.value)]).size, 4);
    }
  });

  test('two carts: the ratio of their accelerations has words', () => {
    const ratios = PAIR_CASES.map((c) => pairRatio(c).ratio);
    assert.deepEqual(ratios, [1, 0.5, 2, 4]);
    for (const c of PAIR_CASES) {
      const r = pairRatio(c);
      assert.ok(RATIO_KEYS[r.ratio], `no words for ${r.ratio}`);
      // enough different answers with words
      const pool = new Set([r.ratio, r.byForce, r.byMass, r.flip, 1, 2, 0.5, 4, 0.25].filter((x) => RATIO_KEYS[x]));
      assert.ok(pool.size >= 4);
    }
  });

  test('numbers for sentences', () => {
    assert.equal(plain(0.5), '0.5');
    assert.equal(plain(2), '2');
    assert.equal(plain(-1), '-1');
    assert.equal(round(-0.0001, 2), 0);
    assert.equal(round(1.005, 2), 1.01);
  });
});

describe('newtons-second-law: resultant force with resistance and buffer contact', () => {
  test('20 N resistance changes the acceleration and breaks naive doubling of applied force', () => {
    const one = planOf({ ...EXAMPLES.base, friction: 20 });
    const two = planOf({ ...EXAMPLES.force, friction: 20 });
    const heavy = planOf({ ...EXAMPLES.mass, friction: 20 });
    assert.equal(one.a, 0.8);
    assert.equal(two.a, 1.8);
    assert.equal(heavy.a, 0.4);
    const r = runAt(two, 1);
    assert.equal(r.F, 180);
    assert.equal(r.applied, 200);
    assert.equal(r.drag, -20);
    assert.notEqual(two.a / one.a, 2);
    assert.equal(heavy.a / one.a, 0.5);
  });
  test('all external horizontal forces sum to ma, including the stopping contact force', () => {
    for (const ex of Object.values(EXAMPLES))
      for (const friction of [0, 20]) {
        const plan = planOf({ ...ex, friction });
        for (const seg of plan.segs) {
          const r = runAt(plan, seg.t0 + seg.dur / 2);
          const f = forceBalance(r, plan.m, plan.pushers);
          assert.ok(Math.abs(f.F1 + f.F2 + f.friction + f.contact - f.net) < 1e-7);
          assert.ok(Math.abs(f.net - plan.m * r.a) < 1e-7);
          assert.equal(f.normal, f.weight);
          const dt = Math.min(1e-4, seg.dur / 100);
          const rate = (plan.m * (runAt(plan, r.t + dt).v - runAt(plan, r.t - dt).v)) / (2 * dt);
          assert.ok(Math.abs(rate - r.F) < 1e-4);
        }
      }
  });
  test('after release friction slows the cart and can stop a heavy cart before the buffer', () => {
    const plan = planOf({ ...EXAMPLES.mass, friction: 20 });
    const a = runAt(plan, 2.5),
      b = runAt(plan, 3.5);
    assert.ok(b.v < a.v);
    assert.equal(a.F, -20);
    assert.equal(a.a, -0.1);
    assert.equal(plan.endReason, 'friction');
    assert.ok(plan.xEnd < BUFFER_X);
    const stopped = runAt(plan, plan.end + 0.1);
    assert.equal(stopped.v, 0);
    assert.equal(stopped.F, 0);
    assert.equal(stopped.drag, 0);
    assert.equal(stopped.contact, 0);
  });
  test('frictional pieces preserve position and velocity at every boundary', () => {
    for (const ex of Object.values(EXAMPLES)) {
      const p = planOf({ ...ex, friction: 20 });
      for (const seg of p.segs) {
        const time = seg.t0 + seg.dur;
        const a = runAt(p, time - 1e-8),
          b = runAt(p, time + 1e-8);
        assert.ok(Math.abs(a.x - b.x) < 1e-5);
        assert.ok(Math.abs(a.v - b.v) < 1e-5);
      }
    }
  });
});

describe('newtons-second-law: the slow clock a student can follow', () => {
  test('the velocity is stamped at each whole second of the measured push (and at its start when already moving)', () => {
    assert.deepEqual(stampTimes(planOf('base')), [1, 2]);
    assert.deepEqual(stampTimes(planOf('mass')), [1, 2]);
    // pushed back from 2 m/s: the stamps at 2.3 (u = 2), 3.3 and 4.3 s show 2, 1, 0 m/s
    const back = planOf('back');
    assert.deepEqual(stampTimes(back), [2.3, 3.3, 4.3]);
    assert.deepEqual(
      stampTimes(back).map((t) => round(runAt(back, t).v, 2)),
      [2, 1, 0],
    );
    // equal steps while the force acts: the step each second is a
    const force = planOf('force');
    const vs = [0, ...stampTimes(force)].map((t) => round(runAt(force, t).v, 2));
    assert.deepEqual(vs, [0, 2, 4]);
  });

  test('real time: no lead-in, no holds, one run second per real second', () => {
    const pb = playbackOf(1, [1, 2]);
    assert.deepEqual(pb, { speed: 1, lead: 0, dwell: 0, stops: [] });
    assert.deepEqual(playTime(1.5, pb), { t: 1.5, grow: 1, held: null });
  });

  test('slow: the arrows grow in, then half speed, held at each whole second', () => {
    const pb = playbackOf(SLOW, [2, 1]);
    assert.deepEqual(pb.stops, [1, 2]);
    // the lead-in: the clock waits at 0 while the arrows grow
    assert.deepEqual(playTime(LEAD / 2, pb), { t: 0, grow: 0.5, held: null });
    // half speed: 1 run second takes 2 real seconds
    assert.equal(playTime(LEAD + 1, pb).t, 0.5);
    // held at 1 s for DWELL real seconds
    const at1 = LEAD + 1 / SLOW;
    assert.deepEqual(playTime(at1 + DWELL / 2, pb), { t: 1, grow: 1, held: 1 });
    // then on again from 1 s
    assert.ok(Math.abs(playTime(at1 + DWELL + 1, pb).t - 1.5) < 1e-9);
    // past the last hold the clock runs on at half speed
    const at2 = at1 + DWELL + 1 / SLOW;
    assert.ok(Math.abs(playTime(at2 + DWELL + 2, pb).t - 3) < 1e-9);
    // set going again at 1.5 s (after a pause): no hold at 1 s, the next at 2 s
    assert.equal(playTime(0.5, { ...pb, lead: 0, from: 1.5 }).t, 1.75);
    assert.equal(playTime(1 + DWELL / 2, { ...pb, lead: 0, from: 1.5 }).held, 2);
  });
});
