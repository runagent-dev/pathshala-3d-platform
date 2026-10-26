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
  plain,
  pusherAt,
  RATIO_KEYS,
  round,
  runAt,
} from '../../assets/newtons-second-law/src/physics.js';

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
