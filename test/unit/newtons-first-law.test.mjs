// The physics of the newtons-first-law figure (book p64, topic 3.1): the same push every time, a book sliding with
// friction on three floors and without friction on the fourth, the marks it leaves, and the test's curved wall.
// Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as m from '../../assets/newtons-first-law/src/motion.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

describe("newton's first law: the push", () => {
  it('is the same every time: from rest to V0 over the stroke, in the push time', () => {
    close(m.PUSH_ACC, 15);
    const start = m.runAt(0, 0.35);
    assert.equal(start.phase, 'push');
    close(start.x, -m.PUSH.stroke);
    close(start.v, 0);
    for (const id of m.SURFACE_IDS) {
      const end = m.runAt(m.PUSH.time, m.SURFACES[id].mu);
      close(end.x, 0, 1e-12); // the front edge reaches the floor's start (the tape's 0)
      close(end.v, m.V0, 1e-12); // whatever the floor: the launcher's plate is the same
    }
  });
});

describe("newton's first law: sliding with friction", () => {
  it('slows evenly (a = μg) and stops after V0²/(2μg) in V0/(μg)', () => {
    close(m.stopDistance(0.35), 9 / (2 * 0.35 * 9.8));
    close(m.stopTime(0.35), 3 / (0.35 * 9.8));
    const T = m.stopTime(0.18);
    const s = m.slideAt(T, 0.18);
    close(s.x, m.stopDistance(0.18));
    close(s.v, 0);
    assert.equal(s.moving, false);
    const half = m.slideAt(T / 2, 0.18);
    close(half.v, m.V0 / 2);
    close(half.x, (3 / 4) * m.stopDistance(0.18)); // three quarters of the way in half the time
  });
  it('stays stopped afterwards (no force, at rest: it stays at rest)', () => {
    const T = m.stopTime(0.05);
    const later = m.slideAt(T + 10, 0.05);
    close(later.x, m.stopDistance(0.05));
    close(later.v, 0);
    assert.equal(m.runAt(m.PUSH.time + T + 5, 0.05).phase, 'stopped');
  });
  it('goes farther on smoother floors: mat 1.31 m, wood 2.55 m, ice 9.18 m', () => {
    const d = (id) => m.round(m.stopDistance(m.SURFACES[id].mu), 2);
    assert.deepEqual([d('mat'), d('wood'), d('ice')], [1.31, 2.55, 9.18]);
    assert.ok(d('mat') < d('wood') && d('wood') < d('ice'));
  });
  it('leaves marks every 0.1 s that get closer together as it slows', () => {
    const mu = m.SURFACES.wood.mu;
    const xs = m.markTimes(10, mu).map((t) => m.slideAt(t, mu).x);
    assert.equal(xs.length, Math.floor(m.stopTime(mu) / m.STEP) + 1);
    const gaps = xs.slice(1).map((x, i) => x - xs[i]);
    for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] < gaps[i - 1]);
  });
});

describe("newton's first law: no friction", () => {
  it('never stops', () => {
    assert.equal(m.stopTime(0), Number.POSITIVE_INFINITY);
    assert.equal(m.stopDistance(0), Number.POSITIVE_INFINITY);
    assert.equal(m.runAt(1000, 0).phase, 'slide');
  });
  it('keeps exactly the same velocity, so equal distances in equal times', () => {
    for (const t of [0, 0.5, 3, 60, 3600]) {
      const s = m.slideAt(t, 0);
      close(s.v, m.V0);
      close(s.x, m.V0 * t, 1e-9 * Math.max(1, t));
    }
    const xs = m.markTimes(2, 0).map((t) => m.slideAt(t, 0).x);
    const gaps = xs.slice(1).map((x, i) => x - xs[i]);
    for (const g of gaps) close(g, m.V0 * m.STEP, 1e-9);
  });
});

describe("newton's first law: the test's curved wall", () => {
  it('runs straight in, round a quarter circle, and out along +z at the end of the wall', () => {
    const a = m.curveAt(0);
    close(a.x, -m.CURVE.lead);
    close(a.z, -m.CURVE.r);
    const end = m.curveAt(m.curveEnd());
    close(end.x, m.CURVE.r, 1e-12);
    close(end.z, 0, 1e-12);
    close(end.heading, Math.PI / 2);
    // every point of the turn is at the same distance from the centre (the wall keeps it on the circle)
    for (const k of [0.2, 0.5, 0.8]) {
      const p = m.curveAt(m.CURVE.lead + ((k * Math.PI) / 2) * m.CURVE.r);
      close(Math.hypot(p.x, p.z), m.CURVE.r, 1e-12);
    }
  });
  it('the right path goes straight on from the wall’s end; the wrong ones turn or fly outward', () => {
    const paths = m.candidatePaths(0.6);
    const straight = paths.straight.at(-1);
    close(straight.x, m.CURVE.r);
    close(straight.z, 0.6);
    const circle = paths.circle.at(-1);
    close(Math.hypot(circle.x, circle.z), m.CURVE.r, 1e-12);
    const out = paths.outward.at(-1);
    close(out.x - m.CURVE.r, out.z); // 45° away from the centre
    const spiral = paths.spiral.at(-1);
    assert.ok(spiral.x < straight.x && spiral.x > circle.x); // turning, but less than the circle
    // the four ends are well apart (their letters do not crowd)
    const ends = [straight, circle, out, spiral];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(Math.hypot(ends[i].x - ends[j].x, ends[i].z - ends[j].z) > 0.12);
  });
});
