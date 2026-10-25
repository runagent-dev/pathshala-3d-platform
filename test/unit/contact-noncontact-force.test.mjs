// The maths of the contact-noncontact-force figure (book p67, topic 3.1.2): which of the page's examples are
// contact and which non-contact forces, the motion of each (real speeds: a crane's hoist, a push, friction
// slowing a crate at μg, free fall at g with bounces, a nail pulled to a magnet), the telling moments the figure
// stops at, and the test's answer keys (one right answer, the others the usual mistakes).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as f from '../../assets/contact-noncontact-force/src/motion.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

describe('force: the page’s five examples', () => {
  it('three need touching (crane, push, friction), two do not (gravity, magnet)', () => {
    assert.deepEqual(f.EXAMPLE_IDS, ['crane', 'push', 'friction', 'fall', 'magnet']);
    assert.deepEqual(
      f.EXAMPLE_IDS.filter((id) => f.KIND[id] === 'contact'),
      ['crane', 'push', 'friction'],
    );
    assert.deepEqual(
      f.EXAMPLE_IDS.filter((id) => f.KIND[id] === 'noncontact'),
      ['fall', 'magnet'],
    );
  });
  it('each does what the definition says: starts a body at rest, or changes a moving body’s velocity', () => {
    for (const id of f.EXAMPLE_IDS) {
      const start = f.actionAt(id, 0);
      const later = f.actionAt(id, f.KEY[id]);
      if (f.EFFECT[id] === 'change') assert.ok(start.speed > 0 && later.speed < start.speed, `${id} slows a moving body`);
      else {
        assert.equal(start.speed, 0, `${id} starts at rest`);
        assert.ok(later.speed > 0, `${id} is moving at its telling moment`);
      }
    }
  });
  it('at the telling moment the force acts, and a contact force touches while a non-contact one has a gap', () => {
    for (const id of f.EXAMPLE_IDS) {
      const m = f.actionAt(id, f.KEY[id]);
      assert.ok(m.acting, `${id} acts`);
      if (f.KIND[id] === 'contact') {
        assert.ok(m.touching, `${id} touches`);
        assert.equal(m.gap, null);
      } else {
        assert.ok(!m.touching, `${id} does not touch`);
        assert.ok(m.gap > 0, `${id} has a gap`);
      }
      assert.ok(f.KEY[id] > 0 && f.KEY[id] < f.DURATION[id]);
    }
  });
  it('every example ends at rest: speed 0 at the end of its action (also the magnet, whose times add to 2.3499…)', () => {
    for (const id of f.EXAMPLE_IDS) {
      assert.equal(f.actionAt(id, f.DURATION[id]).speed, 0, `${id} at its end`);
      assert.equal(f.speedText(f.actionAt(id, f.DURATION[id]).speed), '0.0');
    }
    assert.equal(f.magnetAt(f.DURATION.magnet).speed, 0);
  });
  it('the panel waits for the body to move: crane taking up the slack, hands reaching, magnet brought near', () => {
    assert.equal(f.moved('crane', f.actionAt('crane', 0.2)), false);
    assert.equal(f.moved('push', f.actionAt('push', 0.3)), false);
    assert.equal(f.moved('fall', f.actionAt('fall', 0.2)), false);
    assert.equal(f.moved('magnet', f.actionAt('magnet', 0.8)), false);
    assert.equal(f.moved('friction', f.actionAt('friction', 0)), true); // already sliding
    for (const id of f.EXAMPLE_IDS) assert.equal(f.moved(id, f.actionAt(id, f.KEY[id])), true, `${id} moves by its telling moment`);
    // the crane's pull is drawn once it lifts the block
    assert.equal(f.craneAt(0.3).acting, false);
    assert.equal(f.craneAt(f.CRANE.take).acting, true);
  });
  it('gravity pulls the football all the time: held, falling and lying on the floor', () => {
    assert.ok(f.fallAt(0).acting && f.fallAt(0).held);
    assert.ok(f.fallAt(f.KEY.fall).acting && !f.fallAt(f.KEY.fall).held);
    assert.ok(f.fallAt(f.DURATION.fall).acting && f.fallAt(f.DURATION.fall).resting);
    assert.equal(f.fallAt(f.KEY.fall).dir, 'down');
  });
  it('the magnet’s pull grows as the gap closes', () => {
    let last = -1;
    for (let t = f.MAGNET.slide + f.MAGNET.wait; t <= f.DURATION.magnet; t += 0.1) {
      const k = f.magnetAt(t).strength;
      assert.ok(k >= last && k <= 1);
      last = k;
    }
    assert.equal(f.magnetAt(f.DURATION.magnet).strength, 1);
  });
  it('rounds without binary leftovers and writes speeds with one decimal', () => {
    assert.equal(f.roundTo(0.1 + 0.2, 0.1), 0.3);
    assert.equal(f.roundTo(1.118, 0.01), 1.12);
    assert.equal(f.speedText(0.5), '0.5');
    assert.equal(f.speedText(1.118), '1.1');
    assert.equal(f.speedText(-0.0001), '0.0');
  });
});

describe('force: the motions', () => {
  it('a move from rest to rest covers its distance and ends at rest', () => {
    const m = f.trapezoid({ dist: 1.3, vmax: 0.5, accel: 1 });
    close(m.T, 1.3 / 0.5 + 0.5);
    assert.deepEqual(m.at(m.T + 1), { s: 1.3, v: 0 });
    close(m.at(m.T / 2).v, 0.5);
    let last = 0;
    for (let t = 0; t <= m.T; t += 0.01) {
      const p = m.at(t);
      assert.ok(p.s >= last - 1e-12 && p.v <= 0.5 + 1e-12);
      last = p.s;
    }
    const short = f.trapezoid({ dist: 0.1, vmax: 1, accel: 1 }); // never reaches 1 m/s
    assert.ok(short.vmax < 1);
    close(short.at(short.T).s, 0.1);
  });
  it('friction slows the crate at μg = 1.96 m/s² from 2 m/s: it stops after about 1 s and 1 m', () => {
    const a = f.FRICTION.mu * f.G;
    close(a, 1.96);
    const end = f.slide(5, 2, a);
    close(end.stop, 2 / 1.96);
    close(end.s, 4 / (2 * 1.96));
    assert.equal(end.v, 0);
    close(f.slide(0.5, 2, a).v, 2 - 0.98);
    // shown twice slower: 0.9 s on screen is 0.45 s real
    close(f.frictionAt(0.9).speed, 2 - 1.96 * 0.45);
    assert.equal(f.frictionAt(f.DURATION.friction).speed, 0);
    assert.equal(f.frictionAt(f.DURATION.friction).acting, false); // stopped: no more sliding friction
  });
  it('a ball let go falls at g, lands at √(2gh), bounces lower each time and comes to rest', () => {
    const h = f.FALL.h;
    const t0 = Math.sqrt((2 * h) / f.G);
    close(f.drop(0.3, h).v, -f.G * 0.3);
    close(f.drop(0.3, h).y, h - 0.5 * f.G * 0.09);
    const landing = f.drop(t0 - 1e-9, h);
    close(Math.abs(landing.v), Math.sqrt(2 * f.G * h), 1e-6);
    let peak1 = 0;
    let peak2 = 0;
    for (let t = t0; t < f.dropDuration(h); t += 0.002) {
      const p = f.drop(t, h);
      assert.ok(p.y >= -1e-12);
      if (p.bounces === 1) peak1 = Math.max(peak1, p.y);
      if (p.bounces === 2) peak2 = Math.max(peak2, p.y);
    }
    close(peak1, h * f.FALL.e ** 2, 0.01);
    assert.ok(peak2 < peak1);
    assert.equal(f.drop(f.dropDuration(h) + 0.01, h).resting, true);
    // shown 3 times slower, after the hands open
    close(f.fallAt(f.KEY.fall).speed, f.G * 0.3);
    assert.ok(f.fallAt(f.KEY.fall).gap > 0.4);
  });
  it('the nail is pulled the last 3 cm faster and faster, and touches the magnet at the end', () => {
    const { near, T } = f.MAGNET;
    assert.deepEqual(f.pull(0, near, T), { s: 0, v: 0, gap: near });
    close(f.pull(T, near, T).s, near);
    let v = 0;
    for (let k = 0.05; k < 1; k += 0.05) {
      const p = f.pull(k * T, near, T);
      assert.ok(p.v > v);
      v = p.v;
      close(p.gap, near - p.s);
    }
    const end = f.magnetAt(f.DURATION.magnet);
    assert.ok(end.touching && end.acting && end.gap === null);
    const before = f.magnetAt(0);
    assert.ok(!before.acting && before.magnet === f.MAGNET.far);
  });
  it('the push touches only while it pushes; the trolley rolls on after the hands let go', () => {
    const during = f.pushAt(f.KEY.push);
    assert.ok(during.touching && during.acting);
    close(during.speed, 0.5);
    const after = f.pushAt(f.PUSH.lean + 0.9 + 0.3);
    assert.ok(!after.touching && !after.acting && after.speed > 0);
    assert.ok(after.pos > after.person);
    const end = f.actionAt('push', 99);
    assert.equal(end.speed, 0);
  });
  it('the crane lifts the block 1.3 m at up to 0.5 m/s and keeps holding it (the pull still acts)', () => {
    const end = f.actionAt('crane', f.DURATION.crane);
    close(end.pos, 1.3);
    assert.equal(end.speed, 0);
    assert.ok(end.acting && end.touching);
    assert.equal(f.craneAt(0).acting, false);
  });
});

describe('force: the test', () => {
  it('each new case has four different answers, the right one first, of the right kind', () => {
    for (const [id, keys] of Object.entries(f.KIND_CHOICES)) {
      assert.equal(new Set(keys).size, 4);
      assert.ok(keys[0].endsWith('_ok'), `${id}: the right answer first`);
      assert.ok(f.CASES[id] === 'contact' || f.CASES[id] === 'noncontact');
    }
    assert.deepEqual(Object.keys(f.CASES).sort(), Object.keys(f.KIND_CHOICES).sort());
  });
  it('"what is the force doing?" agrees with the motion at that moment', () => {
    for (const [id, right] of Object.entries(f.EFFECT_RIGHT)) {
      const a = f.actionAt(id, f.KEY[id]).speed;
      const b = f.actionAt(id, f.KEY[id] + 0.05).speed;
      assert.equal(right, b > a ? 'eff_faster' : 'eff_slower', id);
      assert.ok(f.EFFECT_CHOICES.includes(right));
    }
    assert.equal(new Set(f.EFFECT_CHOICES).size, 4);
    assert.equal(new Set(f.EVIDENCE_CHOICES).size, 4);
  });
  it('"same kind as which example?": one of the same kind, three of the other', () => {
    for (const id of ['magnet', 'fall']) {
      const list = f.sameChoices(id);
      assert.equal(list.length, 4);
      assert.equal(new Set(list).size, 4);
      assert.ok(!list.includes(id));
      assert.equal(f.KIND[list[0]], f.KIND[id]);
      for (const x of list.slice(1)) assert.notEqual(f.KIND[x], f.KIND[id]);
    }
  });
  it('shuffles without losing or repeating anything', () => {
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const out = f.shuffle(['a', 'b', 'c', 'd'], random);
    assert.deepEqual([...out].sort(), ['a', 'b', 'c', 'd']);
  });
});
