// The maths of the speed-velocity figure (book pages 40–41, topic 2.5): the book's example, a cycle ride from A to B
// along the winding road of চিত্র ২.০৪ (4 km of road, a সরণ of 2 km) in 20 minutes, and the same ride on a straight
// road. Pure code, no browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import * as m from '../../assets/speed-velocity/src/ride.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);

describe('the road of চিত্র ২.০৪', () => {
  it('is the same road as in distance-displacement', () => {
    const data = (f) => {
      const s = fs.readFileSync(new URL(`../../assets/${f}/src/road.js`, import.meta.url), 'utf8');
      return s.slice(s.indexOf('export const STEP'));
    };
    assert.equal(data('speed-velocity'), data('distance-displacement'));
  });
  it('puts B 4 km along the road and 2 km from A, to the north-east', () => {
    assert.equal(m.B_KM, 4);
    close(m.DISPLACEMENT.km, 2, 0.001);
    assert.equal(m.averages('winding').dir, 'NE');
  });
});

describe('the ride (20 minutes, an even speed)', () => {
  it('stands at A at the start and at B at the end, with no velocity while standing', () => {
    for (const path of m.PATHS) {
      const a = m.rideAt(path, 0);
      assert.deepEqual([a.km, a.x, a.y, a.bearing, a.dir], [0, 0, 0, null, null]);
      const b = m.rideAt(path, 20);
      close(b.x, m.B.x, 1e-9, path);
      close(b.y, m.B.y, 1e-9, path);
      assert.equal(b.dir, null);
      assert.equal(m.rideAt(path, 99).time, 20);
    }
  });
  it('covers the road evenly: 2 km after 10 minutes on the winding road, 1 km on the straight one', () => {
    close(m.rideAt('winding', 10).km, 2);
    close(m.rideAt('straight', 10).km, m.DISPLACEMENT.km / 2);
  });
  it('turns the velocity on the winding road but keeps it on the straight one', () => {
    const dirs = new Set([1, 4, 7, 10, 13, 16, 19].map((t) => m.rideAt('winding', t).dir));
    assert.ok(dirs.size >= 4, [...dirs].join(' '));
    const straight = new Set([1, 7, 13, 19].map((t) => m.rideAt('straight', t).dir));
    assert.deepEqual([...straight], ['NE']);
  });
});

describe('the book’s sums', () => {
  it('গড় দ্রুতি = 4 km ÷ 20 min = 12 km/h; গড় বেগ = 2 km ÷ 20 min = 6 km/h, north-east', () => {
    const w = m.averages('winding');
    close(w.speed, 12);
    close(w.velocity, 6, 0.001);
    assert.equal(m.short(w.velocity), '6');
    assert.equal(w.dir, 'NE');
  });
  it('on the straight road the speed is the size of the velocity', () => {
    const s = m.averages('straight');
    close(s.speed, s.velocity);
    assert.equal(m.short(s.speed), '6');
  });
  it('converts minutes to hours', () => {
    assert.equal(m.kmh(4, 10), 24);
    assert.equal(m.kmh(2, 30), 4);
  });
  it('writes numbers without trailing zeros, and readings with fixed decimals', () => {
    assert.equal(m.short(4.0001), '4');
    assert.equal(m.short(2.5), '2.5');
    assert.equal(m.fixed(2, 1), '2.0');
    assert.equal(m.fixed(-0.01, 1), '0.0');
  });
});
