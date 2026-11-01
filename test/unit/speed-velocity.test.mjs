// The physics of the speed-velocity figure (book page 40, topic 2.5): boy 1's zig-zag of 100 m and boy 2's straight
// 50 m, both in 20 s. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as m from '../../assets/speed-velocity/src/motion.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);

describe('the two runs (the book: 100 m in 20 s, 50 m in 20 s)', () => {
  it('gives দ্রুতি 5 m/s and বেগ 2.5 m/s', () => {
    assert.equal(m.SPEED, 5);
    assert.equal(m.VELOCITY, 2.5);
    const r = m.runAt(20);
    assert.deepEqual([r.distance, r.displacement, r.speed, r.velocity], [100, 50, 5, 2.5]);
    assert.equal(m.runAt(0).speed, null);
    close(m.runAt(8).speed, 5, 1e-12);
    close(m.runAt(8).velocity, 2.5, 1e-12);
  });
  it('draws boy 1 a zig-zag exactly 100 m long, whose straight-line displacement is less', () => {
    let len = 0;
    for (let i = 1; i < m.PATH.length; i++) len += Math.hypot(m.PATH[i].e - m.PATH[i - 1].e, m.PATH[i].n - m.PATH[i - 1].n);
    close(len * m.SCALE, 100, 1e-9);
    const end = m.pathAt(100);
    close(end.e, m.PATH.at(-1).e, 1e-9);
    assert.ok(m.runAt(20).straight1 < 100);
    // he changes direction on the way, but his দ্রুতি is the same number throughout
    assert.notEqual(m.pathAt(5).heading, m.pathAt(25).heading);
  });
  it('sends boy 2 straight along his angle, 50 m', () => {
    for (const a of [0, 40, 135, 270]) {
      const p = m.lineAt(50, a);
      close(Math.hypot(p.e - m.START.two.e, p.n - m.START.two.n) * m.SCALE, 50, 1e-9, `at ${a}°`);
      close(m.wrap((Math.atan2(p.n - m.START.two.n, p.e - m.START.two.e) * 180) / Math.PI), a, 1e-9);
    }
  });
  it('names the eight directions of a compass', () => {
    assert.deepEqual([0, 45, 90, 135, 180, 225, 270, 315].map(m.dirOf), ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE']);
    assert.equal(m.dirOf(40), 'NE');
    assert.equal(m.dirOf(-10), 'E');
  });
  it('writes numbers without trailing zeros', () => {
    assert.equal(m.fmt(2.5), '2.5');
    assert.equal(m.fmt(5), '5');
    assert.equal(m.fixed(2.5, 1), '2.5');
  });
});
