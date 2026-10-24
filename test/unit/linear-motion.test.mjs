// The physics of the linear-motion figure (book p36, topic 2.2): a striker sliding with friction, a ball falling
// freely or thrown sideways, the strobe times, and the straight-line check. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as m from '../../assets/linear-motion/src/motion.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

describe('linear motion: the striker slides with friction', () => {
  it('slows evenly: a = μg, v0 = √(2·a·d), stops after T = v0 / a at distance d', () => {
    const s = m.slideFor(0.5);
    close(s.a, m.STRIKER.mu * m.G);
    close(s.v0, Math.sqrt(2 * s.a * 0.5));
    close(s.T, s.v0 / s.a);
    close(m.slideAt(s.T, s), 0.5);
    close(m.slideAt(s.T + 3, s), 0.5); // and stays stopped
    close(m.slideAt(0, s), 0);
    close(m.slideAt(s.T / 2, s), 0.375); // three quarters of the way in half the time
  });
  it('covers less and less in equal times (the strobe gaps shrink)', () => {
    const s = m.slideFor(0.5);
    const times = m.strobeTimes(s.T, 0.1);
    const gaps = times.slice(1).map((t, i) => m.slideAt(t, s) - m.slideAt(times[i], s));
    for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] < gaps[i - 1]);
  });
  it('room to slide: straight ahead from the base line to 2.5 cm short of the frame', () => {
    close(m.roomAlong(m.STRIKER.start, m.dirFromAngle(0)), m.STRIKER.start.z + m.BOARD.half - m.STRIKER.r - m.STRIKER.margin, 1e-12);
    close(m.roomAlong({ x: 0, z: 0 }, m.dirFromAngle(90)), m.BOARD.half - m.STRIKER.r - m.STRIKER.margin, 1e-12);
  });
  it('a push in any direction stays on the board and goes in a straight line along the push', () => {
    const lim = m.BOARD.half - m.STRIKER.r;
    for (let angle = -180; angle <= 180; angle += 15) {
      for (const strength of [0, 0.3, 1]) {
        const p = m.pushFrom(m.STRIKER.start, angle, strength);
        assert.ok(Math.abs(p.end.x) <= lim && Math.abs(p.end.z) <= lim, `angle ${angle}: off the board`);
        close(Math.abs(((m.angleOf(p.dir) - angle + 540) % 360) - 180), 0, 1e-9); // the same direction
        const path = m.strobeTimes(p.T, 0.05).map((t) => {
          const d = m.slideAt(t, p);
          return { x: p.start.x + p.dir.x * d, z: p.start.z + p.dir.z * d };
        });
        assert.ok(m.isStraight(path));
      }
    }
  });
  it('a stronger push slides further; a light one at least minDist', () => {
    const light = m.pushFrom(m.STRIKER.start, 0, 0);
    const strong = m.pushFrom(m.STRIKER.start, 0, 1);
    close(light.dist, m.STRIKER.minDist);
    assert.ok(strong.dist > light.dist && strong.v0 > light.v0);
  });
});

describe('linear motion: the ball falls freely', () => {
  it('takes √(2h/g) to fall (0.39 s from the holder)', () => {
    close(m.fallTime(m.FALL), Math.sqrt((2 * m.FALL) / m.G));
    close(m.round(m.fallTime(), 3), 0.395);
  });
  it('drops ½·g·t², never below the board', () => {
    close(m.fallAt(0.1), 0.5 * m.G * 0.01);
    close(m.fallAt(10), m.FALL);
    close(m.fallAt(-1), 0);
  });
  it('covers more and more in equal times (the strobe gaps grow)', () => {
    const times = m.strobeTimes(m.fallTime(), m.BALL.step);
    const gaps = times.slice(1).map((t, i) => m.fallAt(t) - m.fallAt(times[i]));
    for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] > gaps[i - 1]);
  });
  it('a drop goes straight down; a sideways throw moves x = v·t as it falls and lands v·T away', () => {
    const T = m.fallTime();
    close(m.flightAt(0.2, 0).x, 0);
    close(m.flightAt(0.2, 1).x, 0.2);
    close(m.flightAt(0.2, 1).y, -m.fallAt(0.2));
    close(m.flightAt(5, 1).x, T); // stops where it lands
  });
});

describe('linear motion: strobe pictures and the straight-line check', () => {
  it('strobe times are exact multiples of the step', () => {
    assert.deepEqual(m.strobeTimes(1, 0.1), [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
    assert.deepEqual(m.strobeTimes(m.fallTime(), 0.05), [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35]);
  });
  it('points on a line are 0 m from it; a point off it by its perpendicular distance', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 1, y: 1, z: 0 };
    close(m.maxDeviation([{ x: 0.3, y: 0.3, z: 0 }, b], a, b), 0, 1e-12);
    close(m.maxDeviation([{ x: 1, y: 0, z: 0 }], a, b), Math.SQRT1_2, 1e-12);
  });
  it('the drop is straight; the throw is curved, at most h/4 · R/√(R²+h²) from the chord (≈ 9 cm)', () => {
    const T = m.fallTime();
    const sample = (vx) => Array.from({ length: 201 }, (_, i) => m.flightAt((T * i) / 200, vx));
    assert.ok(m.isStraight(sample(0)));
    const thrown = sample(m.BALL.vx);
    assert.ok(!m.isStraight(thrown));
    const h = m.FALL;
    const R = m.BALL.vx * T;
    const dev = m.maxDeviation(thrown, thrown[0], thrown[200]);
    close(dev, (h / 4) * (R / Math.hypot(R, h)), 1e-4);
    assert.equal(Math.round(dev * 100), 9);
    assert.equal(m.farthestIndex(thrown, thrown[0], thrown[200]), 100); // halfway in time (and in x)
  });
});

describe('linear motion: the test’s four paths', () => {
  it('all start at the striker; only "straight" goes along the push in a straight line', () => {
    const p = m.STRIKER.start;
    const paths = m.candidatePaths(p, 25, 0.4);
    const heading = (pts, i) => m.angleOf({ x: pts[i + 1].x - pts[i].x, z: pts[i + 1].z - pts[i].z });
    for (const [name, pts] of Object.entries(paths)) {
      assert.deepEqual(pts[0], { x: p.x, z: p.z });
      const len = pts.slice(1).reduce((sum, q, i) => sum + Math.hypot(q.x - pts[i].x, q.z - pts[i].z), 0);
      close(len, 0.4, 1e-9);
      if (name !== 'ahead') close(heading(pts, 0), 25, 1); // they leave along the push
    }
    assert.ok(m.isStraight(paths.straight) && m.isStraight(paths.ahead));
    assert.ok(!m.isStraight(paths.turn) && !m.isStraight(paths.curve));
    close(heading(paths.straight, 30), 25, 1e-9);
    close(heading(paths.ahead, 30), 0, 1e-9); // straight, but the wrong way
    close(heading(paths.turn, 39), 0, 2); // ends going straight ahead
    assert.ok(heading(paths.curve, 39) > 60); // ends curving further out
  });
});
