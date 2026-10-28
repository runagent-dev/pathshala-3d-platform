import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as v from '../../assets/scalar-vector/src/reading.js';
import { JOURNEY, pointAt, cumulativeLengths } from '../../assets/scalar-vector/src/journey.js';

describe('scalar-vector: magnitude, direction and the book’s arrows', () => {
  it('converts east/north components and names only exact compass directions', () => {
    assert.deepEqual(v.components(5, 0), [5, 0]);
    assert.deepEqual(v.components(2, 90), [0, 2]);
    assert.deepEqual(v.components(4, 180), [-4, 0]);
    assert.deepEqual(v.polar(3, 4), { length: 5, angle: 53.130102354 });
    assert.equal(v.compass(-45), 'se');
    assert.equal(v.compass(360), 'e');
    assert.equal(v.compass(60), null);
    assert.deepEqual(v.headOf({ tail: [3, 2], length: 5, angle: 90 }), [3, 7]);
  });
  it('A and B are equal wherever they are drawn; C differs in direction, D in magnitude', () => {
    const { A, B, C, D } = v.VECTORS;
    assert.notDeepEqual(A.tail, B.tail);
    assert.equal(v.verdict(A, B), 'equal');
    assert.equal(v.verdict(A, C), 'direction');
    assert.equal(v.verdict(C, D), 'magnitude');
    assert.equal(D.length, C.length / 2);
    assert.deepEqual(v.PAIRS, { B: 'A', C: 'A', D: 'C' });
    assert.equal(v.verdict(A, { ...A, tail: [999, -999] }), 'equal');
  });
  it('reversing a vector changes it, while a full turn does not', () => {
    assert.equal(v.compare({ length: 3, angle: 30 }, { length: 3, angle: 210 }).opposite, true);
    assert.equal(v.sameDirection({ angle: 0 }, { angle: 360 }), true);
    assert.equal(v.verdict({ length: 2, angle: 0 }, { length: 4, angle: 90 }), 'both');
  });
  it('uses the book’s scalar and vector examples', () => {
    assert.deepEqual(
      Object.keys(v.QUANTITIES).filter((k) => v.QUANTITIES[k] === 'scalar'),
      ['temp', 'time', 'length', 'mass'],
    );
    assert.deepEqual(
      Object.keys(v.QUANTITIES).filter((k) => v.QUANTITIES[k] === 'vector'),
      ['position', 'velocity', 'force'],
    );
  });
});

describe('scalar-vector: the illustrated journey is metrically honest', () => {
  it('is 120 m along the path, but ends 20 m north of its start', () => {
    const dense = Array.from({ length: 2001 }, (_, i) => pointAt(i / 2000));
    assert.ok(Math.abs(cumulativeLengths(dense).at(-1) - 120) < 0.01);
    const [sx, sy] = JOURNEY.start;
    const [fx, fy] = JOURNEY.finish;
    assert.equal(fx - sx, 0);
    assert.equal(fy - sy, 20);
    assert.equal(v.polar(fx - sx, fy - sy).length, JOURNEY.magnitude);
    assert.equal(v.compass(v.polar(fx - sx, fy - sy).angle), JOURNEY.direction);
    assert.ok(JOURNEY.length > JOURNEY.magnitude);
  });
  it('walks by distance and clamps to the endpoints', () => {
    assert.deepEqual(pointAt(-1), JOURNEY.start);
    assert.deepEqual(pointAt(0), JOURNEY.start);
    assert.deepEqual(pointAt(1), JOURNEY.finish);
    assert.deepEqual(pointAt(2), JOURNEY.finish);
    const half = Array.from({ length: 1001 }, (_, i) => pointAt(i / 2000));
    assert.ok(Math.abs(cumulativeLengths(half).at(-1) - 60) < 0.01);
    for (let i = 1; i < JOURNEY.lengths.length; i++) assert.ok(JOURNEY.lengths[i] > JOURNEY.lengths[i - 1]);
  });
});
