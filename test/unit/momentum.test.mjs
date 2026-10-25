// The momentum figure's maths (assets/momentum/src/physics.js): p = m v, the believable crash, the numbers it shows
// and the test's choices.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  about,
  CRASH,
  calcChoices,
  clearance,
  compare,
  crashPlan,
  doubleChoices,
  GAP,
  group,
  MASS,
  momentum,
  plain,
  runAt,
  SCALE,
  SPEED,
  signChoices,
  signed,
} from '../../assets/momentum/src/physics.js';

describe('momentum: p = m v', () => {
  test('the book’s truck and bicycle at the same velocity', () => {
    assert.equal(momentum(MASS.truck, 5), 50000);
    assert.equal(momentum(MASS.bike, 5), 400);
    assert.equal(momentum(MASS.truck, 5) / momentum(MASS.bike, 5), 125);
  });
  test('a vector: to the left is negative, doubling v doubles p', () => {
    assert.equal(momentum(MASS.car, -4), -4000);
    assert.equal(momentum(MASS.bike, 8), 2 * momentum(MASS.bike, 4));
  });
  test('one arrow scale for both: the truck’s p arrow is 125 times the bicycle’s', () => {
    const bike = momentum(MASS.bike, 5) * SCALE.p;
    const truck = momentum(MASS.truck, 5) * SCALE.p;
    assert.equal(bike, 2);
    assert.equal(truck / bike, 125);
  });
});

describe('momentum: numbers as they are shown', () => {
  test('groups of three with a narrow space, U+2212 for minus', () => {
    assert.equal(group(50000), '50 000');
    assert.equal(group(-10000), '−10 000');
    assert.equal(group(4000), '4000');
    assert.equal(group(400), '400');
  });
  test('plain and signed numbers', () => {
    assert.equal(plain(0.4), '0.4');
    assert.equal(plain(-5), '−5');
    assert.equal(plain(2.0), '2');
    assert.equal(signed(5), '+5');
    assert.equal(signed(-5), '−5');
  });
  test('distances said "about"', () => {
    assert.deepEqual(about(1.99), { value: 2, unit: 'm' });
    assert.deepEqual(about(5.09), { value: 5.1, unit: 'm' });
    assert.deepEqual(about(0.32), { value: 32, unit: 'cm' });
    assert.deepEqual(about(0.013), { value: 1, unit: 'cm' });
    assert.deepEqual(about(0.001), { value: 1, unit: 'cm' });
  });
});

describe('momentum: the crash', () => {
  test('at 5 m/s the truck shoves the car about 2 m, the bicycle about a centimetre', () => {
    const truck = crashPlan('truck', 5);
    const bike = crashPlan('bike', 5);
    assert.ok(truck.s2 > 1.8 && truck.s2 < 2.2, `truck pushes ${truck.s2}`);
    assert.ok(bike.s2 > 0.005 && bike.s2 < 0.03, `bicycle pushes ${bike.s2}`);
    assert.ok(truck.crush > 3 * bike.crush, 'the truck dents it much more');
    assert.ok(bike.v1 < 0, 'the bicycle bounces back a little');
    assert.equal(truck.tHit, GAP / 5);
  });
  test('the same crash at every speed is believable: dent capped, the car always ahead of the vehicle', () => {
    for (const kind of ['truck', 'bike'])
      for (let u = SPEED.min; u <= SPEED.max; u++) {
        const plan = crashPlan(kind, u);
        assert.ok(plan.crush > 0 && plan.crush <= CRASH.maxCrush);
        for (let t = 0; t <= plan.tEnd + 0.5; t += 0.01) assert.ok(clearance(plan, t) > -1e-9, `${kind} at ${u} m/s, t = ${t}`);
      }
  });
  test('runAt is continuous and ends at rest where the plan says', () => {
    const plan = crashPlan('truck', 6);
    let prev = runAt(plan, 0);
    assert.equal(prev.phase, 'approach');
    assert.equal(prev.front, -GAP);
    for (let t = 0.005; t <= plan.tEnd + 0.2; t += 0.005) {
      const st = runAt(plan, t);
      assert.ok(Math.abs(st.front - prev.front) < 0.06, `front jumps at ${t}`);
      assert.ok(Math.abs(st.car - prev.car) < 0.06, `car jumps at ${t}`);
      prev = st;
    }
    assert.equal(prev.phase, 'rest');
    assert.ok(Math.abs(prev.car - plan.s2) < 1e-9);
    assert.ok(Math.abs(prev.front - (plan.crush + plan.s1)) < 1e-9);
  });
  test('before the impact the body moves at u, nothing else moves', () => {
    const plan = crashPlan('bike', 4);
    const st = runAt(plan, plan.tHit / 2);
    assert.equal(st.v, 4);
    assert.equal(st.car, 0);
    assert.equal(st.crush, 0);
    assert.ok(Math.abs(st.front + GAP / 2) < 1e-9);
  });
});

describe('momentum: the test', () => {
  test('calc: m × v, and the mistakes are all different from it', () => {
    const c = calcChoices(MASS.truck, 4);
    assert.deepEqual(
      c.map((x) => [x.value, x.unit]),
      [
        [40000, 'p'],
        [2500, 'p'],
        [10004, 'p'],
        [40000, 'force'],
      ],
    );
  });
  test('double: 2p right; 4p, p, p/2 wrong', () => {
    assert.deepEqual(
      doubleChoices(160).map((x) => x.value),
      [320, 640, 160, 80],
    );
  });
  test('sign: moving left at 4 m/s, the car’s momentum is −4000 kg m/s', () => {
    const c = signChoices(MASS.car, 4);
    assert.equal(c[0].value, -4000);
    assert.equal(new Set(c.map((x) => x.value)).size, 4);
  });
  test('compare: slow heavy, fast light, equal', () => {
    assert.equal(compare({ m: 1000, v: 1 }, { m: 60, v: 6 }), 'a');
    assert.equal(compare({ m: 60, v: 5 }, { m: 80, v: 3 }), 'a');
    assert.equal(compare({ m: 1000, v: 0.4 }, { m: 80, v: 5 }), 'equal');
    assert.equal(compare({ m: 80, v: 3 }, { m: 60, v: 5 }), 'b');
  });
});
