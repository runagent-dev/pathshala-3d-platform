// The vector maths of the scalar-vector figure (book p38, 2.3): মান and দিক of an arrow, when two arrows are the
// same vector, where a dragged arrow lands, and the usual mistakes used as wrong answers in the test.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as v from '../../assets/scalar-vector/src/reading.js';

describe('scalar-vector: মান and দিক of an arrow', () => {
  it('turns মান and দিক into x and y, and back', () => {
    assert.deepEqual(v.components(5, 0), { x: 5, y: 0 });
    assert.deepEqual(v.components(2, 90), { x: 0, y: 2 });
    assert.deepEqual(v.components(4, 180), { x: -4, y: 0 });
    assert.deepEqual(v.polar(3, 4), { length: 5, angle: 53.130102354 });
    assert.deepEqual(v.polar(0, -2), { length: 2, angle: 270 });
    assert.deepEqual(v.polar(-1, 0), { length: 1, angle: 180 });
  });
  it('measures দিক from পূর্ব (east) towards উত্তর (north), 0–359°', () => {
    assert.equal(v.norm360(-90), 270);
    assert.equal(v.norm360(360), 0);
    assert.equal(v.norm360(405), 45);
  });
  it('snaps a dragged head to whole units and the eight compass directions, within 1–7 units', () => {
    assert.deepEqual(v.snapPolar(3.1, 3.9), { length: 5, angle: 45 });
    assert.deepEqual(v.snapPolar(0.1, 0.1), { length: 1, angle: 45 });
    assert.deepEqual(v.snapPolar(20, 0), { length: 7, angle: 0 });
    assert.deepEqual(v.snapPolar(-2, -0.1), { length: 2, angle: 180 });
    assert.deepEqual(v.snapPolar(0.2, -3), { length: 3, angle: 270 });
  });
  it('finds the head from the tail', () => {
    assert.deepEqual(v.headOf({ tail: [3, 2], length: 5, angle: 90 }), [3, 7]);
    assert.deepEqual(v.headOf({ tail: [1, 1], length: 2, angle: 180 }), [-1, 1]);
  });
  it('names the eight compass directions only', () => {
    assert.equal(v.compass(0), 'e');
    assert.equal(v.compass(45), 'ne');
    assert.equal(v.compass(90), 'n');
    assert.equal(v.compass(135), 'nw');
    assert.equal(v.compass(225), 'sw');
    assert.equal(v.compass(315), 'se');
    assert.equal(v.compass(360), 'e');
    assert.equal(v.compass(60), null);
  });
});

describe('scalar-vector: the same vector (চিত্র ২.০৩)', () => {
  const { A, B, C, D } = v.BOOK;
  it('A and B are the same vector, in different places', () => {
    assert.notDeepEqual(A.tail, B.tail);
    assert.deepEqual(v.compare(A, B), { sameMagnitude: true, sameDirection: true, equal: true, opposite: false });
  });
  it('C differs from A: equal মান, different দিক', () => {
    assert.deepEqual(v.compare(A, C), { sameMagnitude: true, sameDirection: false, equal: false, opposite: false });
  });
  it('D differs from C: same দিক, different মান', () => {
    assert.deepEqual(v.compare(C, D), { sameMagnitude: false, sameDirection: true, equal: false, opposite: false });
  });
  it('a reversed arrow is not the same vector', () => {
    const r = v.compare({ length: 3, angle: 30 }, { length: 3, angle: 210 });
    assert.equal(r.equal, false);
    assert.equal(r.opposite, true);
  });
  it('0° and 360° are the same দিক', () => assert.equal(v.sameDirection({ angle: 0 }, { angle: 360 }), true));
  it('A and B point উত্তর-পূর্ব, C and D উত্তর-পশ্চিম, as in the book', () => {
    assert.equal(v.compass(A.angle), 'ne');
    assert.equal(v.compass(C.angle), 'nw');
  });
  it('the book layout keeps every arrow on the paper and the three pairs fit tail to tail', () => {
    for (const x of [A, B, C, D]) assert.equal(v.fits(x.tail, x.length, x.angle), true);
    assert.deepEqual(v.commonTail(A, B), A.tail);
    assert.deepEqual(v.commonTail(A, C), A.tail);
    assert.deepEqual(v.commonTail(C, D), C.tail);
  });
  it('the book arrows lie apart, clear of the compass rose and the thermometer', () => {
    const list = [A, B, C, D];
    const [t1, t2] = v.thermoEnds(v.THERMO);
    for (let i = 0; i < list.length; i++) {
      const h = v.headOf(list[i]);
      assert.ok(v.segmentDistance(list[i].tail, h, [v.ROSE.x, v.ROSE.y], [v.ROSE.x, v.ROSE.y]) >= v.ROSE.r + 0.5);
      assert.ok(v.segmentDistance(list[i].tail, h, t1, t2) >= 1.4);
      for (let j = i + 1; j < list.length; j++) {
        const d = v.segmentDistance(list[i].tail, h, list[j].tail, v.headOf(list[j]));
        assert.ok(d >= 2, `${i}–${j}: ${d}`);
      }
    }
  });
});

describe('scalar-vector: moving arrows on the paper', () => {
  it('keeps a whole arrow on the paper', () => {
    assert.deepEqual(v.fitOnPaper([11, 9], 5, 90), [11, 4.5]);
    assert.deepEqual(v.fitOnPaper([0, 0], 3, 180), [3.5, 0.5]);
    assert.deepEqual(v.fitOnPaper([6, 5], 2, 45), [6, 5]);
  });
  it('puts a let-go arrow on the nearest grid corner where all of it is on the paper', () => {
    assert.deepEqual(v.fitOnGrid([4.4, 2.6], 5, 60), [4, 3]);
    assert.deepEqual(v.fitOnGrid([11.2, 8.8], 5, 60), [9, 5]);
    assert.deepEqual(v.fitOnGrid([0.2, 0.2], 3, 180), [4, 1]);
  });
  it('limits a turned head to the paper', () => {
    assert.equal(v.maxLengthFrom([3, 2], 90), 7);
    assert.equal(v.maxLengthFrom([3, 2], 180), 2);
    assert.equal(v.maxLengthFrom([11, 9], 0), 1);
  });
  it('lands on another tail when dropped close to it, otherwise on the grid', () => {
    const others = [{ name: 'A', tail: [3, 2] }];
    assert.deepEqual(v.landing([3.4, 2.3], { length: 5, angle: 60 }, others), { tail: [3, 2], dockedOn: 'A' });
    assert.deepEqual(v.landing([5.4, 2.6], { length: 5, angle: 60 }, others), { tail: [5, 3], dockedOn: null });
    assert.deepEqual(v.landing([11.2, 8.8], { length: 5, angle: 60 }, others), { tail: [9, 5], dockedOn: null });
  });
  it('lines a pair up away from the other arrows when it can', () => {
    const u = { tail: [1, 2], length: 4, angle: 45 };
    const w = { tail: [9, 2], length: 4, angle: 135 };
    const free = v.commonTail(u, w);
    const blocked = v.commonTail(u, w, { avoid: [[free, [free[0] + 3, free[1] + 3]]] });
    assert.notDeepEqual(blocked, free);
    for (const x of [u, w]) assert.ok(v.segmentDistance(blocked, v.headOf({ ...x, tail: blocked }), free, [free[0] + 3, free[1] + 3]) >= 0.9);
  });
  it('keeps the whole thermometer on the paper', () => {
    assert.deepEqual(v.thermoEnds({ at: [5, 5], angle: 0 }, 2), [
      [3, 5],
      [7, 5],
    ]);
    assert.deepEqual(v.fitThermo([0, 0], 0, 1.8), [2.3, 0.5]);
    assert.deepEqual(v.fitThermo([6, 9.9], 90, 1.8), [6, 7.7]);
    assert.deepEqual(v.fitThermo(v.THERMO.at, v.THERMO.angle), v.THERMO.at);
  });
  it('finds one tail for two arrows that both fit', () => {
    const u = { tail: [1, 2], length: 5, angle: 60 };
    const w = { tail: [9, 2], length: 5, angle: 120 };
    const tail = v.commonTail(u, w);
    assert.equal(v.fits(tail, 5, 60), true);
    assert.equal(v.fits(tail, 5, 120), true);
    assert.deepEqual(tail, [3, 2]);
  });
  it('measures the gap between two segments', () => {
    assert.equal(v.segmentDistance([0, 0], [4, 0], [0, 2], [4, 2]), 2);
    assert.equal(v.segmentDistance([0, 0], [4, 4], [0, 4], [4, 0]), 0);
    assert.equal(v.segmentDistance([0, 0], [1, 0], [3, 0], [5, 0]), 2);
  });
  it('lays out test arrows apart, clear of the compass rose', () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const list = [
      { length: 5, angle: 30 },
      { length: 5, angle: 30 },
      { length: 5, angle: 120 },
      { length: 3, angle: 30 },
      { length: 5, angle: 210 },
    ];
    const tails = v.placeApart(list, rand);
    assert.ok(tails);
    const segs = list.map((x, i) => [tails[i], v.headOf({ ...x, tail: tails[i] })]);
    segs.forEach(([a, b], i) => {
      assert.equal(v.fits(a, list[i].length, list[i].angle), true);
      assert.ok(v.segmentDistance(a, b, [v.ROSE.x, v.ROSE.y], [v.ROSE.x, v.ROSE.y]) >= v.ROSE.r + 0.5);
      for (let j = i + 1; j < segs.length; j++) assert.ok(v.segmentDistance(a, b, ...segs[j]) >= 1.3);
    });
  });
});

describe('scalar-vector: wrong readings from the usual mistakes', () => {
  it('gives three different wrong readings: one unit short, read backwards, east and west swapped', () => {
    assert.deepEqual(v.readingMistakes({ length: 4, angle: 45 }), [
      { length: 3, angle: 45 },
      { length: 4, angle: 225 },
      { length: 4, angle: 135 },
    ]);
  });
  it('stays different from the right answer for every direction', () => {
    for (let angle = 0; angle < 360; angle += 45)
      for (let length = 1; length <= 6; length++) {
        const list = v.readingMistakes({ length, angle });
        const keys = new Set([`${length}|${angle}`, ...list.map((x) => `${x.length}|${x.angle}`)]);
        assert.equal(list.length, 3);
        assert.equal(keys.size, 4);
        for (const x of list) assert.ok(x.length >= 1);
      }
  });
});
