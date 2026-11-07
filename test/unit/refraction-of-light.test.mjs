// The optics of refraction-of-light: the book's table and v = c/n, Snell's law at every boundary of trace(), the book's
// worked examples, the relative index, the reflected ray, and the shown numbers agreeing with each other.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spreadLabels } from '../../assets/refraction-of-light/src/graph.js';
import {
  APERTURE,
  clampAngle,
  MEDIA,
  measure,
  nextPreset,
  O,
  PRESETS,
  refractAngle,
  reflectance,
  relative,
  SLAB,
  sourceAt,
  speedMantissa,
  TABLE,
  TOP,
  trace,
} from '../../assets/refraction-of-light/src/reading.js';

const rad = (d) => (d * Math.PI) / 180;
const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} is not ${b}`);
/** The angle from the vertical of the segment a → b, degrees. */
const fromVertical = (a, b) => (Math.atan2(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 180) / Math.PI;

test("the book's table ৯.০১ and its উদাহরণ: v = c/n", () => {
  assert.deepEqual(
    TABLE.map((r) => r.n),
    [1, 1.00029, 1.33, 1.52, 2.42],
  );
  assert.deepEqual(
    TABLE.map((r) => speedMantissa(r.n)),
    [3, 3, 2.26, 1.97, 1.24], // the book prints 3, 3, 2.26, 2 and 1.24 (×10⁸ m/s); 3/1.52 = 1.97
  );
  near(speedMantissa(1.5), 2); // the fibre of p.243
});

test("Snell's law, n₁ sin θ₁ = n₂ sin θ₂, and bending toward the normal", () => {
  near(refractAngle(0, 1, 1.52), 0);
  for (const n of [1.33, 1.52, 2.42])
    for (const a of [10, 30, 50, 70, 80]) {
      const r = refractAngle(a, 1, n);
      near(Math.sin(rad(a)), n * Math.sin(rad(r)), 1e-9);
      assert.ok(r < a, 'into a denser medium the ray bends toward the normal');
    }
  // the denser, the more it bends
  assert.ok(refractAngle(50, 1, 2.42) < refractAngle(50, 1, 1.52));
  assert.ok(refractAngle(50, 1, 1.52) < refractAngle(50, 1, 1.33));
  // from a denser into a lighter medium it bends away (and past the critical angle nothing goes out)
  assert.ok(refractAngle(30, 1.52, 1) > 30);
  assert.equal(refractAngle(60, 1.52, 1), null);
});

test("the book's উদাহরণ: 45° into n = 1.6 gives 26°; 60° in and 45° out gives n = 1.22", () => {
  assert.equal(Math.round(refractAngle(45, 1, MEDIA.n16.n)), 26);
  near(Math.sin(rad(45)) / MEDIA.n16.n, 0.44, 0.005);
  near(MEDIA.nq.n, 1.22, 0.005);
  near(refractAngle(60, 1, MEDIA.nq.n), 45, 1e-9);
});

test("the relative index (9.1.2): the book's numbers", () => {
  assert.equal(relative(1.52, 1.33).toFixed(2), '1.14');
  assert.equal(relative(1.33, 1.52).toFixed(2), '0.88');
  assert.equal(relative(2.42, 1.33).toFixed(2), '1.82');
  assert.equal(relative(1.33, 2.42).toFixed(2), '0.55');
  assert.equal(relative(2.42, 1.52).toFixed(2), '1.59');
  assert.equal(relative(1.52, 2.42).toFixed(2), '0.63');
});

test('trace: from the torch to O, then Snell at every boundary, all in the plane z = 0', () => {
  for (const a of [0, 20, 50, 80]) {
    const g = trace(a, [{ top: TOP, n: 1.52 }], 0);
    const [s, hit, end] = g.points;
    near(hit.x, O.x);
    near(hit.y, O.y);
    near(Math.hypot(s.x - O.x, s.y - O.y), APERTURE);
    near(fromVertical(s, hit), a, 1e-9);
    near(fromVertical(hit, end), refractAngle(a, 1, 1.52), 1e-9);
    near(end.y, 0);
    assert.ok(
      g.points.every((p) => p.z === 0),
      'the first law: every point in the plane of incidence',
    );
    // the reflected ray: the same angle on the other side of the normal
    near(fromVertical(hit, g.reflected), a, 1e-9);
    assert.ok(g.reflected.x >= hit.x && g.reflected.y > hit.y);
  }
  // water over glass: the angle in the glass is what it would be from air (n₁ sin θ₁ is the same all the way down)
  const g = trace(50, [
    { top: TOP, n: 1.33 },
    { top: SLAB, n: 1.52 },
  ]);
  assert.equal(g.points.length, 4);
  near(g.angles[1], refractAngle(50, 1, 1.33), 1e-9);
  near(g.angles[2], refractAngle(g.angles[1], 1.33, 1.52), 1e-9);
  near(g.angles[2], refractAngle(50, 1, 1.52), 1e-9);
  near(Math.sin(rad(g.angles[1])) / Math.sin(rad(g.angles[2])), 1.52 / 1.33, 1e-9);
});

test('the source sits on its circle round O; angles are clamped to 0–80°', () => {
  const p = sourceAt(30);
  near(Math.hypot(p.x - O.x, p.y - O.y), APERTURE);
  assert.ok(p.x < O.x && p.y > O.y);
  assert.equal(clampAngle(-5), 0);
  assert.equal(clampAngle(95), 80);
  assert.equal(clampAngle('x'), 50);
});

test('more light reflects at a bigger angle (the book, p.245)', () => {
  near(reflectance(0, 1, 1.52), ((1.52 - 1) / (1.52 + 1)) ** 2, 1e-9);
  let last = 0;
  for (const a of [0, 20, 40, 60, 80]) {
    const r = reflectance(a, 1, 1.52);
    assert.ok(r >= last);
    last = r;
  }
  assert.ok(reflectance(80, 1, 1.52) > 0.3);
});

test('Measure: the shown sines divide to the shown ratio, which is n₂, at every whole angle', () => {
  for (const n of [1.33, 1.52, 2.42])
    for (let a = 1; a <= 80; a++) {
      const m = measure(a, 1, n);
      assert.equal(m.ratio, n, `${a}° into ${n}`);
      assert.equal(Number((m.s1 / m.s2).toFixed(2)), n);
    }
  assert.deepEqual(measure(50, 1, 1.52), { t1: 50, t2: 30.3, s1: 0.766, s2: 0.504, ratio: 1.52 });
  // water into glass at the three angles of the last step
  for (const a of PRESETS) {
    const g = trace(a, [
      { top: TOP, n: 1.33 },
      { top: SLAB, n: 1.52 },
    ]);
    assert.equal(measure(g.angles[1], 1.33, 1.52).ratio, 1.14);
  }
});

test('the next angle to measure: 30°, 50°, 70°, then none', () => {
  assert.equal(nextPreset([]), 30);
  assert.equal(nextPreset([{ t1: 30 }]), 50);
  assert.equal(nextPreset([{ t1: 30 }, { t1: 50 }]), 70);
  assert.equal(nextPreset([{ t1: 50 }, { t1: 30 }, { t1: 70 }]), null);
});

test('graph tags never overlap and stay inside', () => {
  const ys = spreadLabels([50, 52, 51, 200], 14, 10, 120);
  const sorted = [...ys].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i] - sorted[i - 1] >= 14 - 1e-9);
  assert.ok(ys.every((y) => y >= 10 && y <= 120));
});
