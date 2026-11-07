// Total internal reflection (book pages 248–251, topic 9.2): Snell's law from the dense side, the critical angle the
// book prints (41.8° for glass and air, n = 1.50; 62.5° under water, the formula's own value), Fresnel's reflected part,
// the drawn points, the prism, the book's 75° example, the graph's curves and the strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { curves } from '../../assets/total-internal-reflection/src/graph.js';
import { createI18n, STRINGS } from '../../assets/total-internal-reflection/src/i18n.js';
import * as r from '../../assets/total-internal-reflection/src/reading.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

describe('total-internal-reflection: the critical angle', () => {
  it('is the book’s 41.8° for glass (n = 1.50) and air, and 62.5° under water', () => {
    assert.equal(r.thetaC('air'), 41.8);
    assert.equal(r.thetaC('water'), 62.5);
    near(Math.sin((r.criticalAngle(1, 1.5) * Math.PI) / 180), 1 / 1.5);
    assert.equal(r.criticalAngle(1.5, 1.5), 90);
  });

  it('gives the book’s 75° example: sin θ = 1.40, θc = 43.6°', () => {
    assert.deepEqual(r.book75(), { sinTheta: 1.4, thetaC: 43.6 });
    assert.equal(r.refracted(75, 1, 1.45), null);
  });
});

describe('total-internal-reflection: the light at O', () => {
  it('bends away from the normal from glass into air (n₁ sin θ₁ = n₂ sin θ₂)', () => {
    near(r.refracted(30), 48.590377890729, 1e-9);
    near(Math.sin((r.refracted(20) * Math.PI) / 180), 1.5 * Math.sin((20 * Math.PI) / 180), 1e-12);
    for (const a of [5, 15, 25, 35, 41]) assert.ok(r.refracted(a) > a);
    assert.equal(r.refracted(0), 0);
    near(r.refracted(45, 1.33), 52.89, 0.01); // water above, the book’s 45°
  });

  it('names the book’s three cases and reaches 90° exactly at θc', () => {
    assert.equal(r.caseOf(30), 'less');
    assert.equal(r.caseOf(41.8), 'critical');
    assert.equal(r.caseOf(42), 'more');
    assert.equal(r.caseOf(45, 'water'), 'less');
    assert.equal(r.caseOf(62.5, 'water'), 'critical');
    const L = r.lightAt(41.8);
    assert.equal(L.theta1, 90);
    assert.equal(L.R, 1);
    assert.equal(r.lightAt(60).theta1, null);
  });

  it('reflects about 4 % head on, a little more at 30°, all of it from θc on (Fresnel)', () => {
    near(r.reflectance(0), 0.04, 1e-12);
    const at30 = r.reflectance(30);
    assert.ok(at30 > 0.04 && at30 < 0.08, `${at30}`);
    assert.ok(r.reflectance(41) > r.reflectance(40));
    assert.equal(r.reflectance(42), 1);
    assert.equal(r.lightAt(60).R, 1);
    // from either side the same, at matching angles (Stokes): glass → air at θ₂ and air → glass at θ₁
    near(r.reflectance(30), r.reflectance(r.refracted(30), 1.5, 1), 1e-12);
  });

  it('snaps a drag to whole degrees, and onto θc within half a degree', () => {
    assert.equal(r.snapAngle(33.4), 33);
    assert.equal(r.snapAngle(41.6), 41.8);
    assert.equal(r.snapAngle(42.2), 41.8);
    assert.equal(r.snapAngle(62.2, 'water'), 62.5);
    assert.equal(r.snapAngle(95), r.ANGLE.max);
    assert.equal(r.snapAngle(-3), 0);
    assert.equal(r.stepAngle(41, 1), 41.8);
    assert.equal(r.stepAngle(41.8, 1), 42);
    assert.equal(r.stepAngle(42, -1), 41.8);
    assert.equal(r.stepAngle(41.8, -1), 41);
    assert.equal(r.stepAngle(80, 1), 80);
  });
});

describe('total-internal-reflection: what is drawn', () => {
  it('enters the curved face along a radius, reflects as a mirror image, refracts at θ₁', () => {
    const p = r.points(30);
    const rad = (a) => Math.atan2(-a.x, -a.y) / (Math.PI / 180);
    near(rad(p.slit), 30, 1e-9);
    near(rad(p.entry), 30, 1e-9);
    near(Math.hypot(p.entry.x, p.entry.y), r.BLOCK.r, 1e-9);
    near(p.reflExit.x, -p.entry.x, 1e-12);
    near(p.reflExit.y, p.entry.y, 1e-12);
    near(Math.atan2(p.refrEnd.x, p.refrEnd.y) / (Math.PI / 180), r.refracted(30), 1e-9);
    assert.equal(r.points(60).refrEnd, null);
    // at θc the refracted ray runs along the surface
    near(r.points(41.8).refrEnd.y, 0, 1e-9);
  });

  it('turns the prism’s light by 90° at 45° on its long face, which passes through O', () => {
    const p = r.prismPath();
    assert.equal(p.incidence, 45);
    assert.equal(p.turned, 90);
    const [a, , c] = p.corners;
    near((0 - a.y) * (c.x - a.x) - (0 - a.x) * (c.y - a.y), 0, 1e-12); // O on the long face
    assert.ok(p.incidence > r.thetaC('air'));
    assert.equal(p.enter.x, 0);
    assert.equal(p.exit.y, 0);
  });
});

describe('total-internal-reflection: the graph', () => {
  it('climbs to 90° at θc and stops; the reflected part ends at 100 %', () => {
    for (const out of ['air', 'water']) {
      const g = curves(out);
      assert.equal(g.c, r.thetaC(out));
      assert.deepEqual(g.t1.at(-1), [g.c, 90]);
      assert.ok(g.t1.every(([, d], i) => i === 0 || d >= g.t1[i - 1][1]));
      assert.ok(g.r.every(([a, p]) => (a >= g.c ? p === 100 : p < 100)));
      assert.ok(g.r.every(([a], i) => i === 0 || a >= g.r[i - 1][0]));
    }
  });
});

describe('total-internal-reflection: the strings', () => {
  it('has every Bangla key in English and the other way round', () => {
    const bn = Object.keys(STRINGS.bn).sort();
    const en = Object.keys(STRINGS.en).sort();
    assert.deepEqual(bn, en);
  });

  it('writes the book’s terms and the symbols with subscripts', () => {
    const t = createI18n('bn');
    assert.match(t('rule_critical'), /ক্রান্তি কোণ বা সংকট কোণ/);
    assert.match(t('rule_more'), /পূর্ণ অভ্যন্তরীণ প্রতিফলন/);
    assert.match(t('rule_critical'), /θ<sub>c<\/sub>/);
    assert.equal(t('lbl_t2', { a: 30 }), 'θ<sub>2</sub> = ৩০°');
  });

  it('follows the digits asked for, in the book’s fixed numbers too', () => {
    const t = createI18n('bn', { numerals: 'latin' });
    assert.match(t('c_crit_right'), /^41\.8°/);
    assert.equal(t('lbl_t1', { a: 48.6 }), 'θ<sub>1</sub> = 48.6°');
  });

  it('gives every test choice its own note for the mistake', () => {
    for (const key of Object.keys(STRINGS.bn).filter((k) => /^c_\w+_/.test(k) && !k.endsWith('_right'))) {
      assert.ok(STRINGS.bn[key.replace(/^c_/, 'mis_')], `${key} has a note`);
    }
  });
});
