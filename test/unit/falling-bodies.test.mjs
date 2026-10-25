// The physics of the falling-bodies figure (book pp. 48–49, topic 2.8): free fall (v = gt, h = ½gt²), the fall in air
// with drag (terminal speed), the picture times, the paper's flutter, and the test's wrong answers. Pure code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as f from '../../assets/falling-bodies/src/fall.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

describe('falling bodies: without air (বিনা বাধায়)', () => {
  it('the tube is ½·g·(0.3 s)² = 0.441 m tall, so a free fall takes exactly 0.3 s', () => {
    close(f.H, 0.441);
    close(f.landTime(), 0.3, 1e-12);
    close(f.fallen(f.landTime()), f.H, 1e-12);
  });
  it('h = ½gt² and v = gt from rest, as the book writes them (u = 0)', () => {
    for (const t of [0.05, 0.1, 0.17, 0.25]) {
      close(f.fallen(t), 0.5 * 9.8 * t * t, 1e-12);
      close(f.speed(t), 9.8 * t, 1e-12);
    }
    close(f.fallen(0), 0);
    close(f.fallen(-1), 0);
    close(f.fallen(5), f.H); // it stops on the floor
  });
  it('at 0.1, 0.2, 0.3 s: v = 0.98, 1.96, 2.94 m/s (1 : 2 : 3) and h = 4.9, 19.6, 44.1 cm (1 : 4 : 9)', () => {
    const ts = f.stepTimes();
    assert.deepEqual(ts, [0.1, 0.2, 0.3]);
    assert.deepEqual(
      ts.map((t) => f.round(f.freeV(t), 2)),
      [0.98, 1.96, 2.94],
    );
    assert.deepEqual(
      ts.map((t) => f.round(f.freeH(t) * 100, 1)),
      [4.9, 19.6, 44.1],
    );
    assert.deepEqual(
      ts.map((t) => f.round(f.freeV(t) / f.freeV(ts[0]), 6)),
      [1, 2, 3],
    );
    assert.deepEqual(
      ts.map((t) => f.round(f.freeH(t) / f.freeH(ts[0]), 6)),
      [1, 4, 9],
    );
  });
  it('the textbook numbers: v after 3 s is 29.4 m/s, h after 2 s is 19.6 m', () => {
    close(f.freeV(3), 29.4, 1e-12);
    close(f.freeH(2), 19.6, 1e-12);
  });
});

describe('falling bodies: in air (বাতাসের বাধা)', () => {
  it('a body in air is always behind the free fall, and its speed never passes the terminal speed', () => {
    for (const vt of [1, 4.2, 47])
      for (const t of [0.05, 0.1, 0.2, 0.29]) {
        assert.ok(f.fallen(t, vt) < f.fallen(t));
        assert.ok(f.speed(t, vt) < Math.min(vt, f.speed(t)));
      }
  });
  it('the speed is the rate of the height fallen (numerically)', () => {
    for (const vt of [1, 4.2, 47])
      for (const t of [0.05, 0.15, 0.25]) {
        const dt = 1e-6;
        close((f.fallen(t + dt, vt) - f.fallen(t - dt, vt)) / (2 * dt), f.speed(t, vt), 1e-5);
      }
  });
  it('the stone hardly feels the air (lands within 0.2 ms of the free fall); the flat paper takes about 0.51 s', () => {
    const stone = f.landTime(f.BODIES.stone.vt);
    assert.ok(stone > 0.3 && stone - 0.3 < 2e-4, `stone ${stone}`);
    const paper = f.landTime(f.BODIES.paper.vt);
    assert.ok(paper > 0.5 && paper < 0.53, `paper ${paper}`);
    close(f.fallen(paper, f.BODIES.paper.vt), f.H, 1e-9);
  });
  it('the same paper crumpled lands almost with the stone (within 15 ms), far sooner than flat', () => {
    const ball = f.landTime(f.BODIES.crumpled.vt);
    assert.ok(ball - f.landTime(f.BODIES.stone.vt) < 0.015, `crumpled ${ball}`);
    assert.ok(ball < f.landTime(f.BODIES.paper.vt) - 0.15);
  });
  it('a very large terminal speed is the same as no air', () => {
    close(f.fallen(0.2, 1e6), f.fallen(0.2), 1e-9);
    close(f.landTime(1e6), f.landTime(), 1e-9);
  });
  it('everything is down at the end: 0.51 s with a flat paper, 0.31 s with a crumpled one', () => {
    close(f.endTime('paper'), f.landTime(f.BODIES.paper.vt));
    close(f.endTime('crumpled'), f.landTime(f.BODIES.crumpled.vt));
  });
});

describe('falling bodies: the flat paper flutters only in air', () => {
  it('no flutter without air or before the release', () => {
    assert.deepEqual(f.flutter(0.2), { x: 0, tilt: 0, yaw: 0 });
    assert.deepEqual(f.flutter(0, 1), { x: 0, tilt: 0, yaw: 0 });
  });
  it('it sways at most 6 mm and rocks at most 0.5 rad, and lies flat when it lands', () => {
    for (let t = 0; t <= 0.6; t += 0.005) {
      const p = f.flutter(t, f.BODIES.paper.vt);
      assert.ok(Math.abs(p.x) <= 0.006 + 1e-12 && Math.abs(p.tilt) <= 0.5 + 1e-12);
    }
    const land = f.landTime(f.BODIES.paper.vt);
    close(f.flutter(land, f.BODIES.paper.vt).tilt, 0, 1e-9);
    close(f.flutter(land + 0.2, f.BODIES.paper.vt).tilt, 0, 1e-9);
  });
});

describe('falling bodies: steps and numbers', () => {
  it('the next and the previous picture time', () => {
    close(f.nextStep(0), 0.1);
    close(f.nextStep(0.1), 0.2);
    close(f.nextStep(0.15), 0.2);
    close(f.nextStep(0.29), 0.3);
    close(f.nextStep(0.3 - 1e-12), 0.4); // a hair below a picture time counts as being on it
    close(f.prevStep(0.3), 0.2);
    close(f.prevStep(0.25), 0.2);
    close(f.prevStep(0.1), 0);
    close(f.prevStep(0), 0);
  });
  it('numbers for sentences have no trailing zeros; readouts keep their decimals', () => {
    assert.equal(f.fmt(0.30006), '0.3');
    assert.equal(f.fmt(0.5117), '0.51');
    assert.equal(f.fmt(29.4), '29.4');
    assert.equal(f.fixed(4.9, 1), '4.9');
    assert.equal(f.fixed(0.98, 2), '0.98');
    assert.equal(f.fixed(2, 2), '2.00');
  });
});

describe('falling bodies: the test', () => {
  it('the right answer first, then three different mistakes in the order given', () => {
    assert.deepEqual(f.pickWrong(29.4, [44.1, 14.7, 88.2, 3.27]), [29.4, 44.1, 14.7, 88.2]);
  });
  it('a mistake equal to the right answer (gt = ½gt² when t = 2) or to another mistake is skipped', () => {
    const t = 2;
    const right = 0.5 * 9.8 * t * t; // 19.6
    const list = f.pickWrong(right, [9.8 * t * t, 0.5 * 9.8 * t, 9.8 * t, (0.5 * 9.8 * t) ** 2]);
    assert.deepEqual(list, [19.6, 39.2, 9.8, 96.04]);
    assert.equal(new Set(list.map((v) => f.fmt(v))).size, 4);
  });
  it('always four different positive values, even when the mistakes run out', () => {
    const list = f.pickWrong(2, [2, 0, -1]);
    assert.equal(list.length, 4);
    assert.equal(new Set(list).size, 4);
    assert.ok(list.every((v) => v > 0));
  });
});
