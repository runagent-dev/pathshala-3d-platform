// The types-of-friction figure's maths (assets/types-of-friction/src/physics.js): the three frictions on the 2 kg
// block (the same numbers as the sister figure friction-force: 9.8, 14.7 and 19.6 N maxima with 0, 1 and 2 kg on top),
// the static friction that matches the push, the block giving way, the steady pace, and what the screen shows.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  G,
  MASS,
  MU,
  NOTCHES,
  RATE,
  RATE_WHEELS_UP,
  V_STEADY,
  cruiseGoal,
  fmtForce,
  letGo,
  limits,
  round,
  simulate,
  step,
  weight,
} from '../../assets/types-of-friction/src/physics.js';

describe('types-of-friction: the numbers', () => {
  test('a 2 kg block: weight 19.6 N, μs = 0.5 gives 9.8 N, μk = 0.4 gives 7.84 N, on wheels 0.98 N', () => {
    assert.equal(G, 9.8);
    assert.equal(MASS, 2);
    assert.equal(round(weight(), 2), 19.6);
    const floor = limits('floor');
    assert.equal(round(floor.max, 2), 9.8);
    assert.equal(round(floor.move, 2), 7.84);
    const wheels = limits('wheels');
    assert.equal(round(wheels.max, 2), 0.98);
    assert.equal(round(wheels.move, 2), 0.98);
    assert.ok(MU.s > MU.k && MU.k > MU.r, 'μs > μk > rolling, as the page implies');
  });

  test('loaded with 1 kg and 2 kg the maximum is 14.7 and 19.6 N, as in friction-force', () => {
    assert.equal(round(limits('floor', 3).max, 2), 14.7);
    assert.equal(round(limits('floor', 4).max, 2), 19.6);
  });

  test('the three frictions get smaller: static maximum > kinetic > rolling', () => {
    const f = limits('floor');
    assert.ok(f.max > f.move);
    assert.ok(f.move > limits('wheels').move * 5);
  });

  test('forces on the screen: whole newtons when whole, else one decimal', () => {
    assert.equal(fmtForce(9.8), '9.8');
    assert.equal(fmtForce(7.84), '7.8');
    assert.equal(fmtForce(0.98), '1');
    assert.equal(fmtForce(3), '3');
    assert.equal(fmtForce(14.7), '14.7');
    assert.equal(fmtForce(0), '0');
  });
});

describe('types-of-friction: the step', () => {
  const rest = { on: 'floor', mass: 2, pull: 0, v: 0, x: 0, moving: false, friction: 0, broke: false };

  test('at rest the friction matches the push up to the maximum, and the block does not move', () => {
    let st = rest;
    for (let i = 0; i < 600; i++) st = step(st, 1 / 120, NOTCHES[1]); // pushing towards 6 N
    assert.equal(round(st.pull, 3), 6);
    assert.equal(round(st.friction, 3), 6);
    assert.equal(st.v, 0);
    assert.equal(st.x, 0);
    assert.equal(st.moving, false);
  });

  test('past 9.8 N the block gives way, and the friction drops to the kinetic value', () => {
    let st = { ...rest, pull: 9.7 };
    let broke = 0;
    for (let i = 0; i < 120 && broke === 0; i++) {
      st = step(st, 1 / 120, 14);
      if (st.broke) broke = i + 1;
    }
    assert.ok(broke > 0, 'it gave way');
    assert.ok(st.pull > 9.8 && st.pull < 9.9, `at the maximum (${st.pull})`);
    assert.equal(round(st.friction, 2), 7.84);
    assert.ok(st.moving);
  });

  test('friction never exceeds the push while it is held, and the net force speeds the block up', () => {
    let st = { ...rest, pull: 9.8, moving: true, v: 0.01, friction: 7.84 };
    const v0 = st.v;
    st = step(st, 0.1, 9.8);
    assert.ok(st.v > v0);
    assert.ok(Math.abs(st.v - (v0 + ((9.8 - 7.84) / 2) * 0.1)) < 1e-9);
  });

  test('let go, the sliding block stops (kinetic friction alone), and the friction matches the leftover push', () => {
    let st = { ...rest, pull: 7.84, moving: true, v: V_STEADY, friction: 7.84 };
    for (let i = 0; i < 240 && st.moving; i++) st = step(st, 1 / 120, 0);
    assert.equal(st.moving, false);
    assert.equal(st.v, 0);
    assert.ok(st.x > 0 && st.x < 0.1, `it stopped within a few centimetres (${st.x})`);
  });
});

describe('types-of-friction: letting go', () => {
  test('the push is 0 at once, and the friction alone stops the block (floor in a few centimetres, wheels slower)', () => {
    /** @type {Array<{ on: 'floor' | 'wheels', within: number }>} */
    const cases = [
      { on: 'floor', within: 0.08 },
      { on: 'wheels', within: 0.4 },
    ];
    for (const { on, within } of cases) {
      const { move } = limits(on, MASS);
      let st = letGo({ on, mass: MASS, pull: move, v: V_STEADY, x: 0, moving: true, friction: move, broke: false });
      assert.equal(st.pull, 0);
      let t = 0;
      while (st.moving && t < 2) {
        st = step(st, 1 / 120, 0);
        t += 1 / 120;
        assert.equal(st.pull, 0, 'nothing fades: the push stays 0');
      }
      assert.equal(st.moving, false);
      assert.equal(st.v, 0);
      assert.equal(st.friction, 0);
      assert.ok(t < within, `${on} stopped within ${within} s (${t.toFixed(3)} s)`);
    }
  });

  test('letting go of a block at rest changes nothing', () => {
    const st = letGo({ on: 'floor', mass: MASS, pull: 6, v: 0, x: 0, moving: false, friction: 6, broke: false });
    assert.equal(st.pull, 0);
    assert.equal(st.friction, 0);
  });
});

describe('types-of-friction: the whole story of a tap', () => {
  const last = (run, f) => run.filter(f).pop();

  test('on the floor: held, gives way at 9.8 N, the gauge falls to 7.8 N, a steady pace, then stops', () => {
    const run = simulate('floor', MASS, { seconds: 9, up: RATE.up, cruiseFor: 3 });
    const broke = run.find((s) => s.broke);
    assert.ok(broke, 'it gave way');
    assert.equal(round(broke.pull, 1), 9.8);
    // before that the friction equals the push every step
    for (const s of run.filter((x) => x.t < broke.t)) assert.ok(Math.abs(s.friction - s.pull) < 1e-9);
    // the gauge drops below the maximum at once, and settles at the kinetic friction
    const steady = run.find((s) => s.t > broke.t + 2.5 && s.moving);
    assert.ok(steady.pull < 9.8 - 1.5, `the push fell (${steady.pull})`);
    assert.ok(Math.abs(steady.pull - 7.84) < 0.1);
    assert.ok(Math.abs(steady.v - V_STEADY) < 0.01, `a steady pace (${steady.v})`);
    // steady pace: the push is the friction (balanced forces)
    assert.ok(Math.abs(steady.pull - steady.friction) < 0.1);
    // and it stops once the push lets go
    const end = run[run.length - 1];
    assert.equal(end.moving, false);
    assert.equal(end.pull, 0);
    assert.ok(end.x > 0.2 && end.x < 0.5, `it slid about 0.3 m (${end.x})`);
  });

  test('on wheels: it rolls on about 1 N, far less than the 7.8 N of sliding', () => {
    const run = simulate('wheels', MASS, { seconds: 9, up: RATE_WHEELS_UP, cruiseFor: 3.4 });
    const broke = run.find((s) => s.broke);
    assert.ok(broke && broke.pull < 1.1);
    const late = last(run, (s) => s.moving && s.t < broke.t + 3.3);
    assert.ok(Math.abs(late.friction - 0.98) < 1e-9);
    assert.ok(late.pull < 1.3, `the push stays near 1 N (${late.pull})`);
    assert.ok(late.pull * 6 < limits('floor').move);
    assert.equal(run[run.length - 1].moving, false);
  });

  test('the push the person keeps for the pace never goes below the friction while it speeds up', () => {
    /** @type {Array<'floor' | 'wheels'>} */
    const supports = ['floor', 'wheels'];
    for (const on of supports) {
      const { move } = limits(on, MASS);
      assert.ok(cruiseGoal(on, MASS, 0) > move);
      assert.ok(Math.abs(cruiseGoal(on, MASS, V_STEADY) - move) < 1e-9);
    }
  });

  test('a heavier block needs a bigger push to give way (N bigger, friction bigger)', () => {
    for (const m of [3, 4]) {
      const run = simulate('floor', m, { seconds: 4, up: 6 });
      const broke = run.find((s) => s.broke);
      assert.ok(Math.abs(broke.pull - limits('floor', m).max) < 0.1, `${m} kg gave way at ${broke.pull}`);
    }
  });
});

describe('types-of-friction: the human and trolley contact', () => {
  test('palms reach the box and trolley handle without stretched arms', async () => {
    const { createPusher } = await import('../../assets/types-of-friction/src/person.js');
    const { Vector3 } = await import('three');
    const person = createPusher();
    for (const height of [0.93, 0.95])
      for (const lean of [0.07, 0.15, 0.3, 0.38]) {
        const targets = [new Vector3(0.43, height, 0.18), new Vector3(0.43, height, -0.18)];
        person.pose({ lean, hands: targets });
        for (let i = 0; i < 2; i++) assert.ok(person.handAt(i).distanceTo(targets[i]) < 0.003);
        const bones = person.bones();
        for (const bone of bones.filter((b) => b[3] === 'arm')) assert.ok(bone[0].distanceTo(bone[1]) <= 0.291);
      }
  });
  test('a shoe in stance stays planted while the pushing person advances', async () => {
    const { createPusher } = await import('../../assets/types-of-friction/src/person.js');
    const { Vector3 } = await import('three');
    const person = createPusher(),
      v = new Vector3(),
      positions = [];
    for (const d of [0.12, 0.16, 0.2]) {
      person.root.position.x = d;
      person.pose({ distance: d, walking: true });
      person.root.updateMatrixWorld(true);
      positions.push(person.feet[0].getWorldPosition(v).x);
    }
    for (const x of positions) assert.ok(Math.abs(x - positions[0]) < 1e-8);
  });
  test('the loaded trolley wheels turn by travelled distance over their actual radius', async () => {
    const { createTrolley, TROLLEY } = await import('../../assets/types-of-friction/src/trolley.js');
    const trolley = createTrolley();
    for (const distance of [0, 0.12, 0.6]) {
      trolley.roll(distance);
      const wheels = [];
      trolley.root.traverse((o) => {
        if (o.name === 'Wheel') wheels.push(o);
      });
      assert.equal(wheels.length, 4);
      for (const w of wheels) assert.ok(Math.abs(w.rotation.z + distance / TROLLEY.wheel) < 1e-9);
    }
  });
});

describe('types-of-friction: equal forces mean unchanged velocity', () => {
  test('a balanced push cannot start the resting box', () => {
    let st = { on: 'floor', mass: MASS, pull: 7.84, v: 0, x: 0, moving: false, friction: 7.84, broke: false };
    for (let i = 0; i < 240; i++) st = step(st, 1 / 120, 7.84);
    assert.equal(st.v, 0);
    assert.equal(st.x, 0);
    assert.ok(Math.abs(st.friction - st.pull) < 1e-12);
  });
  test('the same balanced push keeps an already sliding box at its existing speed', () => {
    let st = { on: 'floor', mass: MASS, pull: 7.84, v: V_STEADY, x: 0, moving: true, friction: 7.84, broke: false };
    for (let i = 0; i < 240; i++) st = step(st, 1 / 120, 7.84);
    assert.ok(Math.abs(st.v - V_STEADY) < 1e-12);
    assert.ok(Math.abs(st.x - 2 * V_STEADY) < 1e-12);
    assert.ok(Math.abs(st.friction - st.pull) < 1e-12);
  });
});

describe('types-of-friction: connected anatomy', () => {
  test('the arms and clothing have closed edges throughout the pushing gait', async () => {
    const { Mesh, Vector3 } = await import('three');
    const { createPusher } = await import('../../assets/types-of-friction/src/person.js');
    const person = createPusher();
    for (const distance of [0, 0.12, 0.3]) {
      person.pose({ lean: 0.3, distance, walking: distance !== 0, hands: [new Vector3(0.43, 0.93, 0.18), new Vector3(0.43, 0.93, -0.18)] });
      let checked = 0;
      person.root.traverse((part) => {
        if (!(part instanceof Mesh) || !['ContinuousArm', 'ConnectedShirt', 'ConnectedTrousers'].includes(part.name)) return;
        const g = part.geometry,
          positions = g.attributes.position;
        const key = (i) => [positions.getX(i), positions.getY(i), positions.getZ(i)].map((v) => Math.round(v * 1e7)).join(',');
        const edges = new Map();
        for (let i = 0; i < (g.index?.count ?? g.drawRange.count); i += 3) {
          const ids = [0, 1, 2].map((offset) => key(g.index ? g.index.getX(i + offset) : i + offset));
          for (let j = 0; j < 3; j++) {
            const edge = [ids[j], ids[(j + 1) % 3]].sort().join('|');
            edges.set(edge, (edges.get(edge) || 0) + 1);
          }
        }
        assert.ok(
          [...edges.values()].every((count) => count === 2),
          `${part.name}: closed joints`,
        );
        checked++;
      });
      assert.equal(checked, 4);
    }
  });
});
