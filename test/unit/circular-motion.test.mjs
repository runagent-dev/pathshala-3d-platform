// The maths of the circular-motion figure (book p36, topic 2.2): points on a circle stay at the same distance
// from its centre, angles unwrap without jumps, the traced path grows to one whole turn, and the test's wrong
// answers come from real mistakes (the distance from the start instead of from the fixed point).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cm from '../../assets/circular-motion/src/reading.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

describe('circular motion: a point on the circle', () => {
  it('starts "up" and turns the way the example turns', () => {
    const up = cm.pointAt(10, 0);
    close(up.x, 0);
    close(up.y, 10);
    const quarter = cm.pointAt(10, 90);
    close(quarter.x, -10);
    close(quarter.y, 0);
  });
  it('is always r from the centre, at any angle', () => {
    for (let a = -720; a <= 720; a += 37) close(cm.distance(cm.pointAt(70, a)), 70);
  });
  it('angleOf undoes pointAt', () => {
    for (const a of [0, 45, 90, 135, 179, -45, -90, -170]) {
      const p = cm.pointAt(5, a);
      close(cm.angleOf(p.x, p.y), a);
    }
  });
  it('wraps angles into 0…360', () => {
    assert.equal(cm.wrap360(370), 10);
    assert.equal(cm.wrap360(-30), 330);
    assert.equal(cm.wrap360(720), 0);
  });
  it('measures the smaller angle between two directions', () => {
    assert.equal(cm.angleBetween(350, 10), 20);
    assert.equal(cm.angleBetween(10, 350), 20);
    assert.equal(cm.angleBetween(725, 0), 5);
    assert.equal(cm.angleBetween(90, 270), 180);
  });
  it('unwraps across the back without a jump of 360', () => {
    assert.equal(cm.unwrap(350, 10), 370);
    assert.equal(cm.unwrap(10, 350), -10);
    assert.equal(cm.unwrap(725, 0), 720);
    assert.equal(cm.unwrap(100, 120), 120);
  });
  it('turns 360° per period', () => {
    assert.equal(cm.turned(6, cm.EXAMPLES.fan.period), 360);
    assert.equal(cm.turned(2.5, cm.EXAMPLES.clock.period), 90);
  });
});

describe('circular motion: the traced path', () => {
  it('grows both ways from the start', () => {
    let cov = { lo: 30, hi: 30 };
    cov = cm.extendCoverage(cov, 120);
    cov = cm.extendCoverage(cov, -20);
    assert.deepEqual(cov, { lo: -20, hi: 120 });
    close(cm.coverageFraction(cov), 140 / 360);
  });
  it('stops at one whole turn', () => {
    let cov = { lo: 0, hi: 0 };
    for (let a = 0; a <= 1000; a += 7) cov = cm.extendCoverage(cov, a);
    assert.equal(cov.hi - cov.lo, 360);
    assert.equal(cm.coverageFraction(cov), 1);
    assert.equal(cov.hi, 994);
  });
});

describe('circular motion: distances and the test', () => {
  it('the real distances of the book examples', () => {
    assert.equal(cm.realDistance('fan', 70), 70);
    assert.equal(cm.realDistance('clock', 12), 12);
    assert.equal(cm.realDistance('moon', 60), 3.84); // 3,84,400 km = 3.84 lakh km
  });
  it('the distance from the start changes: 0 → r√2 → 2r → 0', () => {
    close(cm.chord(70, 0), 0);
    close(cm.chord(70, 90), 70 * Math.SQRT2);
    close(cm.chord(70, 180), 140);
    close(cm.chord(70, 360), 0, 1e-9);
  });
  it('the path walked along the circle: πr for half a turn', () => {
    close(cm.arc(70, 180), Math.PI * 70);
    close(cm.arc(12, 360), 2 * Math.PI * 12);
  });
  it('wrong answers from real mistakes: from the start, the path walked, half or double', () => {
    assert.deepEqual(cm.distanceMistakes('fan', 0.5), [140, 220, 35]);
    assert.deepEqual(cm.distanceMistakes('fan', 1), [0, 440, 140]);
    assert.deepEqual(cm.distanceMistakes('clock', 0.5), [24, 38, 6]);
    assert.deepEqual(cm.distanceMistakes('clock', 1), [0, 75, 24]);
    for (const id of cm.EXAMPLE_IDS)
      for (const f of [0.5, 1]) {
        const w = cm.distanceMistakes(id, f);
        assert.equal(new Set(w.map(String)).size, 3);
        assert.ok(!w.includes(cm.EXAMPLES[id].value));
      }
  });
  it('writes distances in the example’s decimals', () => {
    assert.equal(cm.fmt('fan', 70), '70');
    assert.equal(cm.fmt('moon', 3.844), '3.84');
    assert.equal(cm.fmt('moon', 0), '0');
  });
  it('clock hands at 10:10:00 and 15 s later', () => {
    assert.deepEqual(cm.clockHands(10 * 3600 + 10 * 60), { hour: 305, minute: 60, second: 0 });
    const later = cm.clockHands(10 * 3600 + 10 * 60 + 15);
    assert.equal(later.second, 90);
    close(later.minute, 61.5);
  });
});
