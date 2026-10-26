// The maths of the scalar-vector figure (book p38, 2.3, "find your friend"): মান and দিক of an arrow on the field,
// when two arrows are the same vector (চিত্র ২.০৩), where the children walk, and the usual mistakes used as wrong
// answers in the test.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as v from '../../assets/scalar-vector/src/reading.js';

describe('scalar-vector: মান and দিক of an arrow', () => {
  it('turns মান and দিক into x (east) and y (north), and back', () => {
    assert.deepEqual(v.components(5, 0), [5, 0]);
    assert.deepEqual(v.components(2, 90), [0, 2]);
    assert.deepEqual(v.components(4, 180), [-4, 0]);
    assert.deepEqual(v.polar(3, 4), { length: 5, angle: 53.130102354 });
    assert.deepEqual(v.polar(0, -2), { length: 2, angle: 270 });
  });
  it('names the eight compass directions only, from পূর্ব turning towards উত্তর', () => {
    assert.equal(v.compass(0), 'e');
    assert.equal(v.compass(45), 'ne');
    assert.equal(v.compass(90), 'n');
    assert.equal(v.compass(135), 'nw');
    assert.equal(v.compass(225), 'sw');
    assert.equal(v.compass(315), 'se');
    assert.equal(v.compass(360), 'e');
    assert.equal(v.compass(-45), 'se');
    assert.equal(v.compass(60), null);
    assert.equal(v.angleOf('nw'), 135);
  });
  it('finds a head, a point along an arrow, and the tail that centres an arrow', () => {
    assert.deepEqual(v.headOf({ tail: [3, 2], length: 5, angle: 90 }), [3, 7]);
    assert.deepEqual(v.along({ tail: [0, 0], length: 10, angle: 0 }, 0.3), [3, 0]);
    const t = v.centredTail([10, 10], 8, 180);
    assert.deepEqual(t, [14, 10]);
    assert.deepEqual(v.along({ tail: t, length: 8, angle: 180 }, 0.5), [10, 10]);
  });
});

describe('scalar-vector: the friend and the clue', () => {
  it('the friend is 25 m উত্তর-পূর্ব of you: on the ring of every place 25 m away', () => {
    assert.equal(v.RING, 25);
    assert.equal(v.compass(v.FRIEND.angle), 'ne');
    assert.ok(Math.abs(v.distance(v.START, v.headOf(v.FRIEND)) - v.RING) < 1e-9);
  });
  it('no question mark on the ring sits where the friend is (the ring shows any place, not hints)', () => {
    assert.equal(v.RING_MARKS.length, 12);
    for (const a of v.RING_MARKS) assert.ok(Math.abs(v.norm360(a - v.FRIEND.angle)) >= 15);
  });
  it('the book’s examples: four scalars, three vectors', () => {
    const scalars = Object.keys(v.QUANTITIES).filter((k) => v.QUANTITIES[k] === 'scalar');
    const vectors = Object.keys(v.QUANTITIES).filter((k) => v.QUANTITIES[k] === 'vector');
    assert.deepEqual(scalars, ['temp', 'time', 'length', 'mass']);
    assert.deepEqual(vectors, ['position', 'velocity', 'force']);
  });
});

describe('scalar-vector: the same vector (চিত্র ২.০৩)', () => {
  const { A, B, C, D } = v.VECTORS;
  it('B and A are the same vector, in different places', () => {
    assert.notDeepEqual(A.tail, B.tail);
    assert.deepEqual(v.compare(B, A), { sameMagnitude: true, sameDirection: true, equal: true, opposite: false });
    assert.equal(v.verdict(B, A), 'equal');
  });
  it('C differs from A: equal মান, different দিক', () => {
    assert.equal(v.verdict(C, A), 'direction');
  });
  it('D differs from C: same দিক, different মান', () => {
    assert.equal(v.verdict(D, C), 'magnitude');
    assert.equal(D.length, C.length / 2);
  });
  it('each child is compared as the book’s caption does', () => {
    assert.deepEqual(v.PAIRS, { B: 'A', C: 'A', D: 'C' });
  });
  it('a reversed arrow is not the same vector, and 0° and 360° are one দিক', () => {
    const r = v.compare({ length: 3, angle: 30 }, { length: 3, angle: 210 });
    assert.equal(r.equal, false);
    assert.equal(r.opposite, true);
    assert.equal(v.sameDirection({ angle: 0 }, { angle: 360 }), true);
    assert.equal(v.verdict({ length: 2, angle: 0 }, { length: 4, angle: 90 }), 'both');
  });
  it('the arrows, the comparison copies and the compass keep apart on the field', () => {
    const seg = (x) => [x.tail, v.headOf(x)];
    const copies = {
      C: seg({ ...C, tail: A.tail }), // C slid onto A's tail
      D: seg({ ...D, tail: C.tail }), // D slid onto C's tail (it lies along C by design)
    };
    const segs = { A: seg(A), B: seg(B), C: seg(C), D: seg(D), copyC: copies.C };
    const names = Object.keys(segs);
    for (let i = 0; i < names.length; i++)
      for (let j = i + 1; j < names.length; j++) {
        const d = v.segmentDistance(...segs[names[i]], ...segs[names[j]]);
        if (names[i] === 'A' && names[j] === 'copyC') continue; // they share the tail
        assert.ok(d >= 9, `${names[i]}–${names[j]}: ${d} m`);
      }
    for (const n of ['A', 'B', 'D']) assert.ok(v.segmentDistance(...copies.D, ...segs[n]) >= 9, `copy of D – ${n}`);
    // the compass round the start (its letters 12 m out) stays clear of the children's arrows
    for (const n of ['B', 'C', 'D']) assert.ok(v.segmentDistance(v.START, v.START, ...segs[n]) >= 15, `compass – ${n}`);
  });
  it('a child standing at a tail or a head does not hide another arrow (about 8 m of grass behind it)', () => {
    const others = (n) => ['A', 'B', 'C', 'D'].filter((x) => x !== n).map((x) => [v.VECTORS[x].tail, v.headOf(v.VECTORS[x])]);
    for (const n of ['B', 'C', 'D']) {
      const x = v.VECTORS[n];
      for (const p of [x.tail, v.headOf(x)]) {
        const body = [p, [p[0], p[1] + 8]];
        for (const o of others(n)) assert.ok(v.segmentDistance(...body, ...o) >= 4, `${n} at ${p}`);
      }
    }
  });
  it('everything stays inside the 52 m square the camera frames', () => {
    for (const x of Object.values(v.VECTORS)) for (const p of [x.tail, v.headOf(x)]) assert.ok(Math.abs(p[0]) <= 26 && Math.abs(p[1]) <= 26, `${p}`);
  });
});

describe('scalar-vector: the test', () => {
  it('"where is the friend?": the right diagonal and the three usual mistakes, four different places', () => {
    for (const a of [45, 135, 225, 315]) {
      const opts = v.findOptions(a);
      assert.deepEqual(
        opts.map((o) => o.kind),
        ['right', 'opposite', 'eastwest', 'northsouth'],
      );
      assert.equal(new Set(opts.map((o) => o.angle)).size, 4);
      assert.equal(opts[0].angle, a);
    }
    assert.deepEqual(
      v.findOptions(315).map((o) => v.compass(o.angle)),
      ['se', 'nw', 'sw', 'ne'],
    );
    assert.throws(() => v.findOptions(90));
  });
  it('"which arrow equals A?": one equal, the others each wrong in a different way', () => {
    const A = { length: 16, angle: 45 };
    const opts = v.equalOptions(A, 90);
    assert.deepEqual(
      opts.map((o) => v.verdict(o, A)),
      ['equal', 'direction', 'magnitude', 'direction'],
    );
    assert.equal(v.compare(opts[3], A).opposite, true);
    assert.equal(opts[2].length, 8);
  });
  it('"why are they different?": the partner differs in দিক, in মান, or in both', () => {
    const p = { length: 16, angle: 0 };
    assert.equal(v.verdict(v.whyPartner(p, 'direction'), p), 'direction');
    assert.equal(v.verdict(v.whyPartner(p, 'magnitude'), p), 'magnitude');
    assert.equal(v.verdict(v.whyPartner(p, 'both', -90), p), 'both');
  });
  it('arrows centred in the six test places never come within 3 m of each other, whatever their দিক', () => {
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    for (let i = 0; i < v.CELLS.length; i++)
      for (let j = i + 1; j < v.CELLS.length; j++)
        for (const a of angles)
          for (const b of angles) {
            const u = { tail: v.centredTail(v.CELLS[i], v.TEST_L, a), length: v.TEST_L, angle: a };
            const w = { tail: v.centredTail(v.CELLS[j], v.TEST_L, b), length: v.TEST_L, angle: b };
            const d = v.segmentDistance(u.tail, v.headOf(u), w.tail, v.headOf(w));
            assert.ok(d >= 3, `cells ${i}, ${j} at ${a}°, ${b}°: ${d} m`);
          }
  });
  it('measures the gap between two segments', () => {
    assert.equal(v.segmentDistance([0, 0], [4, 0], [0, 2], [4, 2]), 2);
    assert.equal(v.segmentDistance([0, 0], [4, 4], [0, 4], [4, 0]), 0);
    assert.equal(v.segmentDistance([0, 0], [1, 0], [3, 0], [5, 0]), 2);
  });
});
