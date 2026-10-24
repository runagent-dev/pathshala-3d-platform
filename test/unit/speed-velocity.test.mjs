// The physics of the speed-velocity figure (book pages 40–41, topic 2.5): the whirling stone, its throw when the
// rope is let go, and the book's example on the road of চিত্র ২.০৪. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as m from '../../assets/speed-velocity/src/motion.js';
import { ROAD } from '../../assets/speed-velocity/src/road-data.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);

describe('the whirling stone (r = 1 m, 4 m/s)', () => {
  it('goes round in 2πr / v = 1.57 s (6.28 m in a turn)', () => {
    close(m.PERIOD, (2 * Math.PI) / 4, 1e-12);
    assert.equal(m.fmt(m.PERIOD), '1.57');
    assert.equal(m.fmt(2 * Math.PI * m.STONE.r), '6.28');
  });
  it('keeps its speed: the velocity is always 4 m/s long', () => {
    for (let deg = 0; deg < 360; deg += 7) {
      const s = m.stoneAt(deg);
      close(Math.hypot(s.ve, s.vn), 4, 1e-12, `at ${deg}°`);
    }
  });
  it('has its velocity along the tangent (at right angles to the rope), anticlockwise', () => {
    for (let deg = 0; deg < 360; deg += 11) {
      const s = m.stoneAt(deg);
      close(s.e * s.ve + s.n * s.vn, 0, 1e-12, `radius · velocity at ${deg}°`);
      assert.ok(s.e * s.vn - s.n * s.ve > 0, 'anticlockwise seen from above');
    }
    // at the east point it moves north, at the north point west
    assert.equal(m.dirOf(m.stoneAt(0).heading), 'N');
    assert.equal(m.dirOf(m.stoneAt(90).heading), 'W');
  });
  it('so its velocity changes direction while its speed stays the same', () => {
    const a = m.stoneAt(0);
    const b = m.stoneAt(180);
    close(Math.hypot(a.ve, a.vn), Math.hypot(b.ve, b.vn), 1e-12);
    close(a.ve + b.ve, 0, 1e-12);
    close(a.vn + b.vn, 0, 1e-12);
  });
  it('hangs below the hand as a conical pendulum: tan = g r / v²', () => {
    close(m.DROOP, (9.8 * 1) / 16, 1e-12);
    close(m.HEIGHT, m.STONE.hand - m.DROOP, 1e-12);
    close(m.ROPE, Math.hypot(1, m.DROOP), 1e-12);
  });
  it('names the eight directions of a compass', () => {
    assert.deepEqual([0, 45, 90, 135, 180, 225, 270, 315].map(m.dirOf), ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE']);
    assert.equal(m.dirOf(22), 'E');
    assert.equal(m.dirOf(23), 'NE');
    assert.equal(m.dirOf(-10), 'E');
    assert.equal(m.dirOf(350), 'E');
  });
});

describe('letting go of the rope', () => {
  it('sends the stone straight on along its velocity at that moment (the tangent), not outwards', () => {
    for (const deg of [0, 37, 90, 200, 333]) {
      const thr = m.throwFrom(deg);
      const s = m.stoneAt(deg);
      close(thr.dir.e, s.ve / 4, 1e-12);
      close(thr.dir.n, s.vn / 4, 1e-12);
      // seen from above, every point of the flight is on that straight line
      for (const tau of [0.1, 0.3, 0.5, 0.7, 1.2]) {
        const f = m.flightAt(deg, tau, thr);
        const cross = (f.e - thr.from.e) * thr.dir.n - (f.n - thr.from.n) * thr.dir.e;
        close(cross, 0, 1e-9, `off the line at ${deg}°, ${tau} s`);
      }
    }
  });
  it('falls freely while it flies (g = 9.8 m/s²) and lands after √(2h/g)', () => {
    close(m.AIR_TIME, Math.sqrt((2 * (m.HEIGHT - m.STONE.size)) / 9.8), 1e-12);
    const f = m.flightAt(0, 0.3);
    close(f.h, m.HEIGHT - 0.5 * 9.8 * 0.09, 1e-12);
    close(f.d, 4 * 0.3, 1e-12);
    assert.equal(m.flightAt(0, m.AIR_TIME + 0.01).phase === 'air', false);
  });
  it('always lands on the same circle, ahead of where it was let go', () => {
    for (const deg of [0, 100, 250]) {
      const { land } = m.throwFrom(deg);
      close(Math.hypot(land.e, land.n), m.LAND_RADIUS, 1e-9);
      const bearing = (Math.atan2(land.n, land.e) * 180) / Math.PI;
      close(m.wrap(bearing - deg), m.LAND_AHEAD, 1e-6);
    }
  });
  it('lands in the pond when let go as the velocity points at it, and misses when let go facing the pond', () => {
    assert.equal(m.throwFrom(m.AIM).wet, true);
    assert.equal(m.throwFrom(m.AIM + 12).wet, true);
    assert.equal(m.throwFrom(m.AIM - 12).wet, true);
    // the usual mistake: letting go when the stone is between the student and the pond (thinking it flies outwards)
    assert.equal(m.throwFrom(m.POND.bearing).wet, false);
    assert.equal(m.throwFrom(m.AIM + 180).wet, false);
  });
  it('slides to a stop on the grass, or sinks in the pond', () => {
    const dry = m.throwFrom(m.POND.bearing);
    assert.equal(m.flightAt(m.POND.bearing, 10, dry).phase, 'rest');
    close(dry.slide, 16 / (2 * m.STONE.slide), 1e-12);
    const wet = m.throwFrom(m.AIM);
    assert.equal(m.flightAt(m.AIM, 10, wet).phase, 'gone');
    assert.equal(wet.slide, 0);
  });
});

describe('the road of চিত্র ২.০৪ (book page 41: A to B in 20 minutes)', () => {
  it('has B 4 km along the road and 2 km in a straight line from A', () => {
    const b = m.roadAt(4);
    close(b.e, ROAD.B.at[0], 1e-9);
    close(b.n, ROAD.B.at[1], 1e-9);
    close(Math.hypot(b.e, b.n), 2, 1e-3);
  });
  it('works out the book’s sums: average speed 4 km ÷ 20 min = 12 km/h, average velocity 2 km ÷ 20 min = 6 km/h', () => {
    assert.equal(m.RIDE_SPEED, 12);
    const r = m.rideAt(4);
    close(r.minutes, 20, 1e-9);
    close(r.avgSpeed, 12, 1e-9);
    close(r.avgVelocity, 6, 1e-3);
    assert.equal(m.dirOf(r.heading), 'NE'); // the সরণ points from A towards B
    assert.equal(m.kmh(4, 20), 12);
    assert.equal(m.kmh(2, 20), 6);
  });
  it('keeps the average speed at 12 km/h all the way, while the average velocity changes', () => {
    const v = [0.5, 1, 2, 3, 4].map((km) => m.rideAt(km));
    for (const r of v) close(r.avgSpeed, 12, 1e-9);
    assert.ok(new Set(v.map((r) => r.avgVelocity.toFixed(2))).size === 5);
    for (const r of v) assert.ok(r.displacement <= r.distance + 1e-9, 'the displacement is never longer than the road');
  });
  it('has nothing to divide at A', () => {
    const r = m.rideAt(0);
    assert.equal(r.avgSpeed, null);
    assert.equal(r.avgVelocity, null);
    assert.equal(r.displacement, 0);
  });
  it('stops at B and never goes back before A', () => {
    assert.equal(m.rideAt(9).km, 4);
    assert.equal(m.rideAt(-1).km, 0);
  });
});

describe('numbers', () => {
  it('formats without trailing zeros or binary leftovers', () => {
    assert.equal(m.fmt(4), '4');
    assert.equal(m.fmt(2.4), '2.4');
    assert.equal(m.fmt(0.1 + 0.2), '0.3');
    assert.equal(m.fmt(12.0004, 1), '12');
    assert.equal(m.fmt(null), '');
  });
  it('keeps a fixed number of decimals for numbers that change while you watch', () => {
    assert.equal(m.fixed(2.4, 2), '2.40');
    assert.equal(m.fixed(12, 1), '12.0');
  });
});
