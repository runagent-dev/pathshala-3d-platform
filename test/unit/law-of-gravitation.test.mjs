// The maths of the law-of-gravitation figure (book pages 78–79, topic 3.7): F = Gm₁m₂/r² with the book's G (twice a
// mass, twice the force; twice the distance, a quarter), the iron spheres' sizes, the Earth's g = GM/R² ≈ 9.8 m s⁻²
// from the book's M and R, numbers written as a × 10ⁿ, the student's five steps (each one change, the arrows never
// longer than the figure's scale), and the test's right answers with their usual mistakes.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as lg from '../../assets/law-of-gravitation/src/physics.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≈ ${b}`);

describe('law of gravitation: F = G m₁m₂ / r²', () => {
  it('uses the book’s constant, 6.67 × 10⁻¹¹ N m² kg⁻²', () => {
    assert.equal(lg.G, 6.67e-11);
    close(lg.force(1, 1, 1), lg.G);
  });
  it('two 1,000 kg spheres 1 m apart pull with 6.67 × 10⁻⁵ N', () => {
    close(lg.force(1000, 1000, 1), 6.67e-5);
    assert.deepEqual(lg.sci(lg.force(1000, 1000, 1)), { m: '6.67', e: -5 });
  });
  it('twice one mass gives twice the force, twice both gives four times', () => {
    for (const r of [1, 1.5, 2]) {
      close(lg.force(2000, 1000, r) / lg.force(1000, 1000, r), 2);
      close(lg.force(1000, 2000, r) / lg.force(1000, 1000, r), 2);
      close(lg.force(2000, 2000, r) / lg.force(1000, 1000, r), 4);
    }
  });
  it('twice the distance gives a quarter of the force, half the distance four times', () => {
    for (const r of [0.5, 1, 2]) {
      close(lg.force(1000, 1000, 2 * r) / lg.force(1000, 1000, r), 0.25);
      close(lg.force(1000, 1000, r / 2) / lg.force(1000, 1000, r), 4);
    }
  });
  it('the force is the same on both bodies (it does not depend on which is m₁)', () => {
    close(lg.force(4000, 1000, 2), lg.force(1000, 4000, 2));
  });
});

describe('law of gravitation: the iron spheres', () => {
  it('1,000 kg of iron is a ball about 62 cm across; twice the mass is 1.26 times as wide', () => {
    close(lg.sphereRadius(1000), 0.3115, 1e-3);
    close(lg.sphereRadius(2000) / lg.sphereRadius(1000), Math.cbrt(2));
  });
  it('the spheres never touch in any picture of the figure (1 m apart at the closest)', () => {
    assert.ok(2 * lg.sphereRadius(1000) < 1);
    assert.ok(lg.sphereRadius(4000) + lg.sphereRadius(1000) < 2);
  });
});

describe('law of gravitation: the Earth', () => {
  it('g = GM/R² from the book’s numbers is about 9.8 m s⁻²', () => {
    assert.deepEqual(lg.EARTH, { M: 5.98e24, R: 6.37e6 });
    close(lg.gravity(), 9.83, 1e-3);
    assert.equal(lg.roundTo(lg.gravity(), 1), 9.8);
  });
  it('the weight of a body is GMm/R² = mg: twice the mass, twice the weight, the same g', () => {
    close(lg.weight(1), lg.gravity());
    close(lg.weight(2), 2 * lg.gravity());
    close(lg.weight(2) / 2, lg.weight(1));
  });
});

describe('law of gravitation: numbers as a × 10ⁿ', () => {
  it('rounds without binary leftovers and carries into the next power', () => {
    assert.equal(lg.roundTo(3.335, 2), 3.34);
    assert.equal(lg.roundTo(1.6675, 2), 1.67);
    assert.deepEqual(lg.sci(1.6675e-5), { m: '1.67', e: -5 });
    assert.deepEqual(lg.sci(3.335e-5), { m: '3.34', e: -5 });
    assert.deepEqual(lg.sci(9.996e-6), { m: '1.00', e: -5 });
    assert.deepEqual(lg.sci(5.98e24), { m: '5.98', e: 24 });
    assert.deepEqual(lg.sci(6.37e6), { m: '6.37', e: 6 });
  });
  it('writes a value at a chosen power of ten, so choices compare at a glance', () => {
    assert.deepEqual(lg.sci(4.16875e-6, 2, -5), { m: '0.42', e: -5 });
    assert.deepEqual(lg.sci(8.3375e-6, 2, -5), { m: '0.83', e: -5 });
  });
});

describe('law of gravitation: the student’s five steps', () => {
  it('start with two 1,000 kg spheres 1 m apart, and each step changes one thing', () => {
    assert.deepEqual(lg.stateAfter(0), { example: 'dist', m1: 1000, m2: 1000, r: 1, placed: false, kg: 1 });
    const keys = ['m1', 'm2', 'r', 'placed', 'kg'];
    for (let n = 1; n <= lg.STEPS.length; n++) {
      const a = lg.stateAfter(n - 1);
      const b = lg.stateAfter(n);
      const changed = keys.filter((k) => a[k] !== b[k]);
      assert.equal(changed.length, 1, `step ${n} changes ${changed.join(', ')}`);
    }
    assert.deepEqual(lg.stateAfter(5), { example: 'earth', m1: 2000, m2: 2000, r: 2, placed: true, kg: 2 });
  });
  it('the distance doubled gives a quarter; then the masses double it, then double it again', () => {
    const F = (n) => {
      const st = lg.stateAfter(n);
      return lg.force(st.m1, st.m2, st.r);
    };
    close(F(1) / F(0), 0.25);
    close(F(2) / F(1), 2);
    close(F(3) / F(2), 2);
  });
  it('the mass example starts where the distance example ends', () => {
    const end = lg.stateAfter(1);
    assert.deepEqual({ m1: end.m1, m2: end.m2, r: end.r }, lg.BASES.mass);
  });
  it('every arrow of the learn pictures is drawn between a quarter and the full length of the scale', () => {
    for (let n = 0; n <= 3; n++) {
      const st = lg.stateAfter(n);
      const L = lg.arrowLength(lg.force(st.m1, st.m2, st.r));
      assert.ok(L >= 0.25 * lg.ARROW_REF - 1e-9 && L <= lg.ARROW_REF + 1e-9, `step ${n}: ${L}`);
    }
    close(lg.arrowLength(lg.force(4000, 1000, 2)), lg.ARROW_REF); // the test's big and small spheres
  });
});

describe('law of gravitation: the test’s choices (right answer first, then the usual mistakes)', () => {
  const F0 = lg.force(1000, 1000, 2);
  it('one mass doubled: twice; squared by mistake; halved; unchanged', () => {
    const c = lg.massChoices(F0, 2);
    close(c[0], 2 * F0);
    close(c[1], 4 * F0);
    close(c[2], F0 / 2);
    close(c[3], F0);
    assert.equal(new Set(c.map((x) => lg.sci(x, 2, -5).m)).size, 4, 'four different choices on the screen');
  });
  it('the distance doubled: a quarter; the square forgotten; the wrong way; the wrong way squared', () => {
    const F1 = lg.force(1000, 1000, 1);
    const c = lg.distanceChoices(F1, 2);
    close(c[0], F1 / 4);
    close(c[1], F1 / 2);
    close(c[2], 2 * F1);
    close(c[3], 4 * F1);
  });
  it('the distance halved: four times; twice; a half; a quarter', () => {
    const c = lg.distanceChoices(F0, 0.5);
    close(c[0], 4 * F0);
    close(c[1], 2 * F0);
    close(c[2], F0 / 2);
    close(c[3], F0 / 4);
  });
  it('g: about 9.8; R not squared; the diameter; R in km', () => {
    const c = lg.gravityChoices();
    close(c[0], lg.gravity());
    close(c[1], (lg.G * lg.EARTH.M) / lg.EARTH.R, 1e-9);
    close(c[2], lg.gravity() / 4);
    close(c[3], lg.gravity() * 1e6);
    assert.equal(lg.roundTo(c[2], 1), 2.5);
  });
  it('R for a weight 1 m up: about the Earth’s radius; the height; the diameter; km read as m', () => {
    const c = lg.radiusChoices();
    close(c[0], 6.37e6 + 1);
    assert.equal(c[1], 1);
    close(c[2], 1.274e7);
    close(c[3], 6370);
    assert.deepEqual(lg.sci(c[0]), { m: '6.37', e: 6 });
  });
});
