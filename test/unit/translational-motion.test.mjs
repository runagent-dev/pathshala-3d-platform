// Translational motion (book p36, topic 2.2): the car is one rigid body. Straight ahead every point goes the same
// distance in the same direction (চলন গতি); round a bend each point follows its own circle; a point on the
// rolling wheel traces arches (a cycloid: 8 × radius per turn of the wheel, against 2π × radius for the car).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as m from '../../assets/translational-motion/src/motion.js';

const close = (a, b, tol = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} ≉ ${b}`);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const len = (v) => Math.hypot(...v);

describe('translational motion: the car (real size, metres)', () => {
  it('has wheels that move it exactly 2 m per turn', () => close(2 * Math.PI * m.CAR.wheelR, 2));
  it('drives 4 m straight (two turns of a wheel) and a quarter circle round the bend', () => {
    assert.equal(m.D_MAX.straight, 4);
    close(m.D_MAX.turn, (m.TURN_R * Math.PI) / 2);
  });
  it('clamps the distance to its path', () => {
    assert.equal(m.clampD('straight', -1), 0);
    assert.equal(m.clampD('straight', 9), 4);
    assert.equal(m.clampD('turn', 'x'), 0);
  });
});

describe('going straight: চলন গতি', () => {
  it('moves every painted point by the same vector (same distance, same direction)', () => {
    for (const d of [0.5, 1.7, 4]) {
      for (const k of m.DOT_KEYS) {
        const move = sub(m.dotAt('straight', k, d), m.dotAt('straight', k, 0));
        close(move[0], d, 1e-12, k);
        close(move[1], 0, 1e-12, k);
        close(move[2], 0, 1e-12, k);
        close(m.dotDistance('straight', k, d), d, 1e-12, k);
      }
    }
  });
  it('says the distances are all the same', () => {
    assert.equal(m.allSame(m.DOT_KEYS.map((k) => m.dotDistance('straight', k, 3))), true);
  });
});

describe('round the bend: not চলন গতি', () => {
  it('keeps the car rigid (the distances between points never change)', () => {
    const a0 = m.dotAt('turn', 'front', 0);
    const b0 = m.dotAt('turn', 'back', 0);
    for (const d of [1, 4, m.D_MAX.turn]) close(len(sub(m.dotAt('turn', 'front', d), m.dotAt('turn', 'back', d))), len(sub(a0, b0)), 1e-9);
  });
  it('carries each point round its own circle about the turn centre', () => {
    const centre = [m.CAR.rearAxle, 0, -m.TURN_R];
    for (const k of m.DOT_KEYS) {
      const r = m.turnRadius(m.DOTS[k]);
      for (const d of [0, 2, m.D_MAX.turn]) {
        const p = m.dotAt('turn', k, d);
        close(Math.hypot(p[0] - centre[0], p[2] - centre[2]), r, 1e-9, k);
      }
    }
  });
  it('turns the car a quarter turn and moves the outer points farther', () => {
    const end = m.pose('turn', m.D_MAX.turn);
    close(end.heading, Math.PI / 2);
    const ds = Object.fromEntries(m.DOT_KEYS.map((k) => [k, m.dotDistance('turn', k, m.D_MAX.turn)]));
    close(ds.roof, 8, 0.05); // the roof's middle is about 5.09 m from the centre: 5.09 × π/2
    assert.ok(ds.front > ds.door && ds.door > ds.back && ds.back > ds.roof, JSON.stringify(ds));
    assert.equal(m.allSame(Object.values(ds)), false);
    // the panel shows every one of them differently (one decimal)
    assert.equal(new Set(Object.values(ds).map(m.fmtM)).size, 4);
  });
  it('agrees with the length of the sampled path', () => {
    const tr = m.sampleTrail((d) => m.dotAt('turn', 'front', d), m.D_MAX.turn, 0.005);
    close(m.lengthAt(tr, m.D_MAX.turn), m.dotDistance('turn', 'front', m.D_MAX.turn), 1e-4);
  });
  it('steers both front wheels round the same centre (Ackermann)', () => {
    const { left, right } = m.steer('turn');
    assert.ok(left > right && right > 0);
    close(Math.tan(left) * (m.TURN_R - m.CAR.track / 2), m.CAR.wheelbase, 1e-12);
    assert.deepEqual(m.steer('straight'), { left: 0, right: 0 });
  });
});

describe('the point on the rolling wheel (ঘূর্ণায়মান চাকা)', () => {
  const r = m.CAR.wheelR;
  it('traces a cycloid: 8 × radius of path for each turn of the wheel', () => {
    const tr = m.sampleTrail((d) => m.wheelDotAt('straight', d, { rho: r, out: 0 }), 2, 0.0005);
    close(m.lengthAt(tr, 2), 8 * r, 1e-4);
  });
  it('starts on the road and touches it again after each turn (2 m)', () => {
    for (const d of [0, 2, 4]) close(m.wheelDotAt('straight', d, { rho: r })[1], 0, 1e-12, `at ${d} m`);
    close(m.wheelDotAt('straight', 1, { rho: r })[1], 2 * r, 1e-12, 'top half way');
  });
  it('is at rest where it touches the road, and goes twice as fast as the car at the top', () => {
    const h = 1e-5;
    const speed = (d) => len(sub(m.wheelDotAt('straight', d + h, { rho: r }), m.wheelDotAt('straight', d - h, { rho: r }))) / (2 * h);
    close(speed(2), 0, 1e-4);
    close(speed(1), 2, 1e-4);
  });
  it('goes farther than the body over the drive, so it is left out of চলন গতি', () => {
    const tr = m.sampleTrail((d) => m.wheelDotAt('straight', d), 4, 0.005);
    const wheel = m.lengthAt(tr, 4);
    assert.ok(wheel > 4.5 && wheel < 5, String(wheel)); // the painted point sits a little inside the tread
    // but its displacement after whole turns equals the car's
    const move = sub(m.wheelDotAt('straight', 4), m.wheelDotAt('straight', 0));
    close(move[0], 4, 1e-9);
    close(move[1], 0, 1e-9);
  });
});

describe('numbers as the figure shows them', () => {
  it('rounds without binary leftovers', () => {
    assert.equal(m.roundTo(0.1 + 0.2, 0.1), 0.3);
    assert.equal(m.roundTo(10.377, 0.01), 10.38);
  });
  it('writes metres with one decimal', () => {
    assert.equal(m.fmtM(4), '4.0');
    assert.equal(m.fmtM(10.377), '10.4');
  });
});
