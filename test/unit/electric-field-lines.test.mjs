// The field of electric-field-lines: the book's numbers, the zero point, and the lines' rules (they start on + and end on
// −, never run into each other, twice the charge has twice the lines).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CONFIGS,
  fieldAt,
  fieldOfOne,
  fieldOnAxis,
  groupDigits,
  H,
  K,
  lengthOf,
  neutralPoint,
  planeDirections,
  Q,
  R,
  resample,
  roundField,
  sphereDirections,
  traceConfig,
  XA,
  XB,
} from '../../assets/electric-field-lines/src/field.js';

test("the book's example: 5 C at 10 m is 4.5 × 10⁸ N/C", () => {
  assert.equal(K, 9e9);
  assert.ok(Math.abs((K * 5) / 10 ** 2 - 4.5e8) < 1e-3);
});

test('the figure’s charge: 2,500 N/C at 12 cm, 10,000 N/C at 6 cm, four times at half the distance', () => {
  assert.ok(Math.abs(K * Q - 36) < 1e-9);
  assert.equal(roundField(fieldOfOne(0.12)), 2500);
  assert.equal(roundField(fieldOfOne(0.06)), 10000);
  assert.equal(roundField(fieldOfOne(0.1)), 3600);
  assert.ok(Math.abs(fieldOfOne(0.03) / fieldOfOne(0.06) - 4) < 1e-9);
});

test('E adds as vectors: on the axis, and pointing away from + at any point', () => {
  const ch = CONFIGS.single.charges;
  const e = fieldAt(ch, XA + 0.1, H, 0);
  assert.ok(Math.abs(e[0] - fieldOfOne(0.1)) < 1e-6);
  assert.ok(Math.abs(e[1]) < 1e-9 && Math.abs(e[2]) < 1e-9);
  assert.ok(fieldOnAxis(ch, XA - 0.1) < 0);
  const n = fieldAt(ch, XA + 0.1, H, 0, [0, 0, 0], -1);
  assert.ok(Math.abs(n[0] + e[0]) < 1e-6);
  // unlike charges, the middle: the two fields add, toward −q
  assert.equal(roundField(fieldOnAxis(CONFIGS.unlike.charges, 0)), 11250);
});

test('like charges: E = 0 exactly in the middle; unlike charges: nowhere between them', () => {
  assert.equal(roundField(fieldOnAxis(CONFIGS.like.charges, 0)), 0);
  assert.ok(Math.abs(neutralPoint(CONFIGS.like.charges)) < 1e-6);
  assert.equal(neutralPoint(CONFIGS.unlike.charges), null);
  assert.equal(neutralPoint(CONFIGS.double.charges), null);
});

test('a lattice of directions: unit vectors, the plane ones in z = 0', () => {
  for (const d of [...sphereDirections(24), ...planeDirections(16)]) assert.ok(Math.abs(Math.hypot(...d) - 1) < 1e-9);
  assert.ok(planeDirections(16).every((d) => d[2] === 0));
});

test('resample keeps the ends and the length', () => {
  const pts = [
    [0, 0, 0],
    [0.03, 0, 0],
    [0.03, 0.04, 0],
  ];
  const r = resample(pts, 0.005);
  assert.deepEqual(r[0], pts[0]);
  assert.ok(Math.hypot(r.at(-1)[0] - 0.03, r.at(-1)[1] - 0.04) < 1e-9);
  assert.ok(Math.abs(lengthOf(r) - 0.07) < 0.002);
});

test('rule (a): one charge, the lines run straight out from its surface', () => {
  const lines = traceConfig('single', { flat: true });
  assert.equal(lines.length, 16);
  for (const l of lines) {
    assert.equal(l.from, 0);
    assert.equal(l.to, -1);
    const [a, z] = [l.points[0], l.points.at(-1)];
    assert.ok(Math.abs(Math.hypot(a[0] - XA, a[1] - H, a[2]) - R) < 1e-6);
    // radial: the far end lies on the line through the start, from the centre
    const c = (a[0] - XA) * (z[1] - H) - (a[1] - H) * (z[0] - XA);
    assert.ok(Math.abs(c) < 1e-5);
  }
});

test('rule (a): between unlike charges the lines of + end on −, always running with E', () => {
  const lines = traceConfig('unlike', { flat: true });
  const ending = lines.filter((l) => l.from === 0 && l.to === 1);
  assert.ok(ending.length >= 10, `${ending.length} lines reach −q`);
  const l = ending[Math.floor(ending.length / 2)];
  const a = l.points[Math.floor(l.points.length / 2)];
  const b = l.points[Math.floor(l.points.length / 2) + 1];
  const e = fieldAt(CONFIGS.unlike.charges, a[0], a[1], a[2]);
  assert.ok((b[0] - a[0]) * e[0] + (b[1] - a[1]) * e[1] + (b[2] - a[2]) * e[2] > 0);
});

test('like charges: no line reaches the other charge, none runs through the middle', () => {
  for (const l of traceConfig('like', { flat: true })) {
    assert.equal(l.to, -1);
    for (const p of l.points) assert.ok(Math.hypot(p[0], p[1] - H, p[2]) > 0.003, 'a line through the zero');
  }
});

test('rule (b): −2q has twice the lines of +q', () => {
  const lines = traceConfig('double', { flat: true });
  const onNeg = lines.filter((l) => l.to === 0).length;
  const fromPos = lines.filter((l) => l.from === 1).length;
  assert.equal(fromPos, 16);
  // the lines of +q that end on −2q, and the rest of −2q's from far away
  assert.ok(Math.abs(onNeg - 2 * fromPos) <= 2, `${onNeg} lines on −2q`);
});

test('rule (d): two lines of a pair never meet (in the plane)', () => {
  for (const name of ['unlike', 'like', 'double']) {
    const lines = traceConfig(name, { flat: true }).map((l) => resample(l.points, 0.01));
    for (let i = 0; i < lines.length; i++)
      for (let j = i + 1; j < lines.length; j++)
        for (const p of lines[i]) {
          if (Math.hypot(p[0] - XA, p[1] - H) < R * 1.5 || Math.hypot(p[0] - XB, p[1] - H) < R * 1.5) continue;
          for (const q of lines[j]) assert.ok(Math.hypot(p[0] - q[0], p[1] - q[1]) > 2e-4, `${name}: lines ${i} and ${j} meet`);
        }
  }
});

test('numbers as they are shown', () => {
  assert.equal(groupDigits(100000, 'bn'), '1,00,000');
  assert.equal(groupDigits(100000, 'en'), '100,000');
  assert.equal(groupDigits(2500, 'bn'), '2,500');
  assert.equal(groupDigits(950), '950');
  assert.equal(roundField(-3604), -3600);
  assert.equal(Object.is(roundField(0.1), 0), true);
});
