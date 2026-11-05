// The optics of convex-mirror-image: the book's formula, the law of reflection on the exact sphere, and that the traced rays really
// meet at the image the formula gives.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  F0,
  fieldOf,
  FLAT_R,
  formulaError,
  fraction,
  imageOf,
  meet,
  MIRROR,
  miss,
  normalAtPoint,
  PENCIL,
  pencilsSeen,
  R0,
  reflect,
  sag,
  seenAt,
  threeRays,
  U,
} from '../../assets/convex-mirror-image/src/reading.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} ≉ ${b} (±${e})`);
const each = (fn) => {
  for (let u = U.min; u <= U.max; u += 0.5) fn(u);
};

test("the book's examples with f = 15 cm", () => {
  near(imageOf(30).v, -10);
  near(imageOf(30).m, 1 / 3);
  near(imageOf(30).height, 2);
  near(imageOf(15).v, -7.5);
  near(imageOf(15).m, 0.5);
  near(imageOf(60).v, -12);
  near(imageOf(10).v, -6);
});

test('1/u + 1/v = 1/f holds, f negative', () => {
  each((u) => near(formulaError(u, imageOf(u).v), 0, 1e-12));
});

test('p227: the image is always between P and F, upright, smaller; it shrinks and nears F as the object goes away', () => {
  let last = null;
  each((u) => {
    const i = imageOf(u);
    assert.ok(i.v < 0 && i.v > -F0, `between P and F at u = ${u}`);
    assert.ok(i.m > 0 && i.m < 1, 'smaller and upright');
    if (last) {
      assert.ok(i.height < last.height, 'farther: smaller');
      assert.ok(i.v < last.v, 'farther: nearer F');
    }
    last = i;
  });
});

test('every ray obeys the law of reflection on the exact sphere', () => {
  each((u) => {
    for (const r of threeRays(u)) {
      near(r.thetaI, r.thetaR, 1e-4);
      // the hit lies on the sphere and on the mirror
      near(Math.hypot(r.hit.x + R0, r.hit.y), R0, 1e-9);
      assert.ok(Math.abs(r.hit.y) < MIRROR.half, 'it lands on the glass');
      near(r.hit.x, -sag(R0, r.hit.y), 1e-9);
      const n = normalAtPoint(r.hit);
      near(Math.hypot(n.x, n.y), 1, 1e-9);
    }
  });
});

test('rule (i): a ray toward O comes back along itself; extended it reaches O', () => {
  each((u) => {
    const [c] = threeRays(u);
    near(c.thetaI, 0, 1e-4);
    near(c.back.x, -R0);
    const d = { x: c.hit.x - c.start.x, y: c.hit.y - c.start.y };
    const l = Math.hypot(d.x, d.y);
    near((c.out.x * d.x + c.out.y * d.y) / l, -1, 1e-9);
  });
});

test('rule (ii): a parallel ray leaves as if from F, a shade inside r/2 on the exact sphere', () => {
  const [, p] = threeRays(30);
  near(p.start.y, p.hit.y);
  assert.ok(p.back.x < -14.5 && p.back.x > -15, `crosses at ${p.back.x}`);
});

test('rule (iii): a ray toward F leaves very nearly parallel to the axis', () => {
  each((u) => {
    const [, , f] = threeRays(u);
    assert.ok(Math.abs(f.out.y) < 0.03, `slope ${f.out.y} at u = ${u}`);
  });
});

test('the three traced lines meet where the formula puts X′', () => {
  each((u) => assert.ok(miss(u) < 0.2, `miss ${miss(u)} cm at u = ${u}`));
  assert.ok(miss(15) < 0.08);
  const [c, p] = threeRays(30);
  const x = meet(c.hit, c.out, p.hit, p.out);
  near(x.x, -10, 0.1);
  near(x.y, 2, 0.05);
});

test("the rays stay off the rail and start at the pencil's point", () => {
  each((u) => {
    for (const r of threeRays(u)) {
      near(r.start.x, u);
      near(r.start.y, PENCIL);
      assert.ok(r.end.y <= 13.0001);
    }
  });
});

test('m as a short fraction when there is one', () => {
  assert.deepEqual(fraction(1 / 3), { n: 1, d: 3 });
  assert.deepEqual(fraction(0.5), { n: 1, d: 2 });
  assert.equal(fraction(3 / 11), null); // too long to say
});

test('8.8.2: the same mirror convex shows a much wider field, and more of the row', () => {
  const flat = fieldOf(FLAT_R);
  const conv = fieldOf(R0);
  assert.ok(conv.angle > flat.angle * 3);
  assert.equal(pencilsSeen(FLAT_R), 3);
  assert.equal(pencilsSeen(R0), 7);
  // a plane mirror: the view is the mirror image of the eye through the rim
  near(flat.halfWidth, (MIRROR.half * (66 + 76)) / 66, 0.05);
});

test('seenAt: the point of the face where an eye sees a point obeys the law', () => {
  const c = { x: 80, y: 8, z: 90 };
  const q = { x: 15, y: 3, z: 0 };
  const p = seenAt(c, q);
  near(Math.hypot(p.x + R0, p.y, p.z), R0, 1e-9);
  const n = { x: (p.x + R0) / R0, y: p.y / R0, z: p.z / R0 };
  const un = (a) => {
    const l = Math.hypot(a.x, a.y, a.z);
    return { x: a.x / l, y: a.y / l, z: a.z / l };
  };
  const a = un({ x: c.x - p.x, y: c.y - p.y, z: c.z - p.z });
  const b = un({ x: q.x - p.x, y: q.y - p.y, z: q.z - p.z });
  near(a.x * n.x + a.y * n.y + a.z * n.z, b.x * n.x + b.y * n.y + b.z * n.z, 1e-6);
  // and the reflect() of the figure is the plain one
  near(reflect({ x: -1, y: 0 }, { x: 1, y: 0 }).x, 1);
});
