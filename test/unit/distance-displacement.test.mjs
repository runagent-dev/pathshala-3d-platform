// The road of চিত্র ২.০৪ (book p39, topic 2.4) and the maths of distance and displacement in the
// distance-displacement figure: pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as road from '../../assets/distance-displacement/src/road.js';

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} is not ${b} ± ${tol}`);

describe('the road of Figure 2.04', () => {
  it('starts at A, the origin, and is 7.5 km long', () => {
    assert.deepEqual(road.pointAt(0), { x: 0, y: 0 });
    near(road.ROAD_END, 7.525, 1e-9, 'last sample');
    assert.ok(road.END <= road.ROAD_END);
  });
  it('has its samples a step of road apart (to a metre or so, the resolution of the tracing)', () => {
    for (let i = 1; i < road.COUNT; i++) {
      const d = Math.hypot(road.ROAD[2 * i] - road.ROAD[2 * i - 2], road.ROAD[2 * i + 1] - road.ROAD[2 * i - 1]);
      assert.ok(Math.abs(d - road.STEP) < 0.0015, `sample ${i}: ${d} km`);
    }
  });
  it('goes between samples in a straight line', () => {
    const p = road.pointAt(0.0125);
    near(p.x, 0.00545, 1e-9, 'x');
    near(p.y, -0.0117, 1e-9, 'y');
  });
  it('points the way km grows', () => {
    const h = road.headingAt(4);
    near(Math.hypot(h.x, h.y), 1, 1e-9, 'unit');
    assert.ok(h.x < -0.9, 'at B the road runs west');
  });
});

describe('displacement from A (the book: B 4 km along the road, 2 km straight)', () => {
  it('B: 2 km, north-east', () => {
    const d = road.displacement(road.STOPS.B);
    near(d.km, 2, 0.001, 'size');
    assert.equal(road.compass8(d.bearing), 'NE');
  });
  it('C: 1.31 km, north', () => {
    const d = road.displacement(road.STOPS.C);
    near(d.km, 1.311, 0.001, 'size');
    assert.equal(road.compass8(d.bearing), 'N');
  });
  it('A: zero, and a zero vector has no direction', () => {
    assert.deepEqual(road.displacement(0), { east: 0, north: 0, km: 0, bearing: null });
    assert.equal(road.compass8(null), null);
  });
  it('is never more than the distance along the road (to the metre of the road data)', () => {
    for (let km = 0; km <= road.END; km += 0.01) assert.ok(road.displacement(km).km <= km + 0.001, `at ${km} km`);
  });
});

describe('directions', () => {
  it('reads bearings clockwise from north', () => {
    assert.equal(road.bearingOf(0, 1), 0);
    assert.equal(road.bearingOf(1, 0), 90);
    assert.equal(road.bearingOf(0, -1), 180);
    assert.equal(road.bearingOf(-1, 0), 270);
  });
  it('rounds to the nearest of eight', () => {
    assert.equal(road.compass8(22), 'N');
    assert.equal(road.compass8(23), 'NE');
    assert.equal(road.compass8(350), 'N');
    assert.equal(road.compass8(-90), 'W');
  });
  it('turns by eighths', () => {
    assert.equal(road.turn('NE', 4), 'SW');
    assert.equal(road.turn('N', -2), 'W');
    assert.equal(road.turn('NW', 1), 'N');
  });
});

describe('distance travelled', () => {
  it('adds every leg, the way back too', () => {
    assert.equal(road.travelled([0, 4]), 4);
    assert.equal(road.travelled([0, 6, 0]), 12);
    assert.equal(road.travelled([0, 5, 3]), 7);
    assert.equal(road.travelled([0]), 0);
  });
});

describe('places on the road', () => {
  it('finds the km nearest to a point', () => {
    const b = road.pointAt(4);
    near(road.nearestKm(b.x, b.y), 4, 1e-6, 'B');
    near(road.nearestKm(b.x + 0.01, b.y + 0.05), 4, 0.06, 'next to B');
  });
  it('looks only where it is told to', () => assert.ok(road.nearestKm(0, 0, 2, 3) >= 2));
  it('names A, B and C', () => {
    assert.equal(road.stopAt(0), 'A');
    assert.equal(road.stopAt(4.01), 'B');
    assert.equal(road.stopAt(6), 'C');
    assert.equal(road.stopAt(5), null);
  });
});

describe('numbers', () => {
  it('rounds without binary leftovers', () => {
    assert.equal(road.roundTo(0.1 + 0.2, 0.1), 0.3);
    assert.equal(road.roundTo(1.31086, 0.001), 1.311);
  });
  it('formats km with two decimals, never negative', () => {
    assert.equal(road.fmtKm(4), '4.00');
    assert.equal(road.fmtKm(1.31086), '1.31');
    assert.equal(road.fmtKm(-0.001), '0.00');
    assert.equal(road.fmtKm(6, 0), '6');
  });
});
