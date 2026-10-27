// The maths of the law-of-gravitation figure (book pages 78–79, topic 3.7): F = Gm₁m₂/r² with the book's G (twice a
// mass, twice the force; twice the distance, a quarter), the iron spheres' sizes, the Earth's g = GM/R² ≈ 9.8 m s⁻²
// from the book's M and R, the plain words that replace powers of ten (a force written out, "the weight of an ant"),
// the student's five steps (each one change, the arrows never longer than the figure's scale), the test's right
// answers with their usual mistakes (as "how many times"), and the strings: no power of ten in a sentence.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as lg from '../../assets/law-of-gravitation/src/physics.js';
import { STRINGS, createI18n } from '../../assets/law-of-gravitation/src/i18n.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≈ ${b}`);

describe('law of gravitation: F = G m₁m₂ / r²', () => {
  it('uses the book’s constant, 6.67 × 10⁻¹¹ N m² kg⁻²', () => {
    assert.equal(lg.G, 6.67e-11);
    close(lg.force(1, 1, 1), lg.G);
  });
  it('two 1,000 kg spheres 1 m apart pull with 6.67 × 10⁻⁵ N', () => {
    close(lg.force(1000, 1000, 1), 6.67e-5);
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

describe('law of gravitation: plain words instead of powers of ten', () => {
  it('rounds without binary leftovers (3.335 → 3.34)', () => {
    assert.equal(lg.roundTo(3.335, 2), 3.34);
    assert.equal(lg.roundTo(1.6675, 2), 1.67);
  });
  it('writes a small force out in full, three significant digits, no power of ten', () => {
    assert.equal(lg.decimal(6.67e-5), '0.0000667');
    assert.equal(lg.decimal(1.6675e-5), '0.0000167');
    assert.equal(lg.decimal(3.335e-5), '0.0000334');
    assert.equal(lg.decimal(0), '0');
  });
  it('the pull between the 1,000 kg spheres 1 m apart is the weight of about 6.8 mg: an ant', () => {
    // the note says "about the weight of an ant": a small ant weighs a few milligrams (1 to 10 mg)
    const mg = lg.milligramsOf(lg.force(1000, 1000, 1));
    assert.ok(mg > 6.5 && mg < 7.1, `${mg} mg`);
    assert.ok(Math.abs(lg.milligramsOf(6.67e-5, 9.8) - 6.8) < 0.02);
    // every pull in the learn pictures is between a quarter of that and that: an ant or less, never more than 7 mg
    for (const n of [0, 1, 2, 3]) {
      const st = lg.stateAfter(n);
      const w = lg.milligramsOf(lg.force(st.m1, st.m2, st.r));
      assert.ok(w > 1.5 && w < 7.1, `step ${n}: ${w} mg`);
    }
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
  const distinct = (c) => assert.equal(new Set(c).size, c.length, 'four different choices on the screen');
  it('one mass doubled: twice; squared by mistake; halved; unchanged', () => {
    const c = lg.massFactors(2);
    assert.deepEqual(c, [2, 4, 0.5, 1]);
    distinct(c);
  });
  it('the factors are what the figure really does: one mass doubled doubles the force', () => {
    const F0 = lg.force(1000, 1000, 2);
    close(lg.force(2000, 1000, 2) / F0, lg.massFactors(2)[0]);
    close(lg.force(2000, 2000, 2) / F0, lg.massFactors(2)[1]); // both doubled: the "squared" mistake is the two-mass answer
  });
  it('the distance doubled: a quarter; the square forgotten; the wrong way; the wrong way squared', () => {
    const c = lg.distanceFactors(2);
    assert.deepEqual(c, [0.25, 0.5, 2, 4]);
    distinct(c);
    close(lg.force(1000, 1000, 2) / lg.force(1000, 1000, 1), c[0]);
  });
  it('the distance halved: four times; twice; a half; a quarter', () => {
    const c = lg.distanceFactors(0.5);
    assert.deepEqual(c, [4, 2, 0.5, 0.25]);
    distinct(c);
    close(lg.force(1000, 1000, 1) / lg.force(1000, 1000, 2), c[0]);
  });
  it('the weight two radii from the centre: a quarter; the distance not squared; unchanged; the wrong way squared', () => {
    // every choice starts from the 9.8 the question states, so the last one is 4 × 9.8 = 39.2 (not 4 × 9.83)
    const g0 = 9.8;
    const c = lg.heightChoices(2);
    close(c[0], g0 / 4);
    close(c[1], g0 / 2);
    close(c[2], g0);
    close(c[3], g0 * 4);
    assert.equal(lg.roundTo(c[0], 1), 2.5);
    assert.equal(lg.roundTo(c[1], 1), 4.9);
    assert.equal(lg.roundTo(c[3], 1), 39.2);
    assert.equal(new Set(c.map((x) => lg.roundTo(x, 1))).size, 4, 'four different choices on the screen');
    // and the true answer from M and R agrees with the shown one: GM/(2R)² = 2.46, shown as 2.5
    assert.equal(lg.roundTo(lg.gravity(lg.EARTH.M, 2 * lg.EARTH.R), 1), lg.roundTo(c[0], 1));
  });
  it('one mass made 3 times as big: 3; squared by mistake 9; a third; unchanged', () => {
    const c = lg.massFactors(3);
    assert.deepEqual([c[0], c[1], c[3]], [3, 9, 1]);
    close(c[2], 1 / 3);
    close(lg.force(3000, 1000, 2) / lg.force(1000, 1000, 2), c[0]);
    assert.equal(new Set(c).size, 4);
  });
  it('R for a weight 1 m up: about the Earth’s radius; the height; the diameter; km read as m', () => {
    const c = lg.radiusChoices();
    close(c[0], 6.37e6 + 1);
    assert.equal(c[1], 1);
    close(c[2], 1.274e7);
    close(c[3], 6370);
    // the figure writes them in km (6,370 km · 1 m · 12,740 km · 6,370 m): four different numbers with their units
    assert.equal(Math.round(c[0] / 1000), 6370);
    assert.equal(Math.round(c[2] / 1000), 12740);
  });
});

describe('law of gravitation: the strings (plain words first)', () => {
  const bn = STRINGS.bn;
  it('Bangla and English have the same strings', () => {
    assert.deepEqual(Object.keys(bn).sort(), Object.keys(STRINGS.en).sort());
  });
  it('no sentence has a power of ten or scientific notation (the formula has symbols, never numbers like 10⁻⁵)', () => {
    for (const lang of ['bn', 'en'])
      for (const [key, text] of Object.entries(STRINGS[lang])) {
        assert.ok(!/10<sup>|১০|× ?10|\d\.\d+ ?[×x] ?10|e-\d/.test(text), `${lang}.${key}: ${text}`);
        assert.ok(!/<sup>/.test(text), `${lang}.${key}: write powers through the vars in app.js, not in the string`);
      }
  });
  it('the learn sentences say বাম গোলক / ডান গোলক and টান, not m₁ m₂ F', () => {
    for (const key of ['rule_start', 'rule_dist', 'rule_m1', 'rule_m2', 'out_start', 'act_double_m1', 'act_double_m2', 'q_mass'])
      assert.ok(!/\{(m1|m2|F|law)\}/.test(bn[key]), `${key} uses a symbol: ${bn[key]}`);
    assert.match(bn.act_double_m1, /বাম গোলক/);
    assert.match(bn.act_double_m2, /ডান গোলক/);
    assert.match(bn.note_spheres, /পিঁপড়া/);
  });
  it('numbers come in as vars, so ?numerals=latin still shows Latin digits', () => {
    const latin = createI18n('bn', { numerals: 'latin' });
    assert.equal(latin('act_double_r', { two: '2' }), 'দূরত্ব 2 গুণ করো');
    assert.equal(createI18n('bn')('act_double_r', { two: '2' }), 'দূরত্ব ২ গুণ করো');
    for (const [key, text] of Object.entries(bn))
      assert.ok(!/[0-9]/.test(text.replace(/\{\w+\}/g, '')), `${key} has a Latin digit written into it: ${text}`);
  });
});
