// Mirage (book pages 251–252, topic 9.2.2): the book's three layers of air, Snell's law at each boundary, total
// internal reflection at the lowest one when the eye is far, none when it is near; the image's place; the strings.
// Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createI18n, STRINGS } from '../../assets/mirage/src/i18n.js';
import * as o from '../../assets/mirage/src/optics.js';

const D2R = Math.PI / 180;
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

describe('mirage: the layers', () => {
  it('have the refractive index highest above and lowest by the sand (the book: উপরের স্তরে বেশি, নিচের স্তরে কম)', () => {
    assert.ok(o.N.top > o.N.mid && o.N.mid > o.N.low);
    assert.ok(o.LAYER.a > o.LAYER.b && o.LAYER.b > 0);
    assert.ok(o.EYE.y > o.LAYER.a, 'the eye is in the upper layer');
  });
  it('give a critical angle at the lowest boundary from sin θc = n_low / n_mid', () => {
    near(Math.sin(o.CRIT_B * D2R), o.N.low / o.N.mid);
    assert.equal(o.deg(o.CRIT_B), 65);
  });
  it('refract by Snell’s law and report total reflection past the critical angle', () => {
    const r = o.refract(40, 1, 0.9);
    near(1 * Math.sin(40 * D2R), 0.9 * Math.sin(r * D2R));
    assert.ok(r > 40, 'into a lower index the angle grows');
    assert.equal(o.refract(80, 1, 0.9), null);
  });
});

describe('mirage: the ray from the tree’s top', () => {
  it('far away: refracted at the first boundary (r > i), totally reflected at the second, and reaches the eye', () => {
    const t = o.trace(o.EYE.far);
    assert.equal(t.kind, 'tir');
    assert.ok(t.r1 > t.i1);
    near(o.N.top * Math.sin(t.i1 * D2R), o.N.mid * Math.sin(t.r1 * D2R));
    assert.ok(t.iB > t.crit);
    const p = t.path;
    assert.equal(p.length, 5);
    near(p[1].y, o.LAYER.a);
    near(p[2].y, o.LAYER.b);
    near(p[3].y, o.LAYER.a);
    near(p[4].x, o.EYE.far, 1e-9);
    near(p[4].y, o.EYE.y);
    // symmetric about the reflection: the same slope down and up, in each layer
    near(p[1].x - p[2].x, p[2].x - p[3].x, 1e-9);
    const down = (p[0].y - p[1].y) / (p[0].x - p[1].x);
    const up = (p[4].y - p[3].y) / (p[3].x - p[4].x);
    near(down, up, 1e-6);
  });
  it('far away: the image of the top is below the ground, about a tree’s height down (upside down, as in water)', () => {
    const t = o.trace(o.EYE.far);
    assert.ok(t.image.y < 0);
    assert.ok(t.scale > 0.9 && t.scale < 1.1, `scale ${t.scale}`);
    assert.ok(t.water > o.EYE.far && t.water < o.TREE.x, 'the "water" lies between the eye and the tree');
  });
  it('near: the angle of incidence at the lowest boundary is below the critical angle, the ray ends in the sand', () => {
    const t = o.trace(o.EYE.near);
    assert.equal(t.kind, 'sand');
    assert.ok(t.iB < t.crit);
    assert.equal(t.image, null);
    near(t.path.at(-1).y, 0);
    near(o.N.mid * Math.sin(t.r1 * D2R), o.N.low * Math.sin(t.r2 * D2R));
  });
  it('the mirage shows from afar and not up close: one switch, at D_MIN', () => {
    let last = null;
    let switches = 0;
    for (let x = o.EYE.min; x <= o.EYE.max; x += 0.01) {
      const k = o.trace(x).kind;
      if (last && k !== last) switches++;
      last = k;
    }
    assert.equal(switches, 1);
    assert.equal(o.trace(o.TREE.topX - o.D_MIN - 0.01).kind, 'tir');
    assert.equal(o.trace(o.TREE.topX - o.D_MIN + 0.01).kind, 'sand');
    // the angle of incidence at the bottom grows with the distance
    assert.ok(o.trace(o.EYE.min).iB > o.trace(o.EYE.far).iB);
  });
  it('the direct ray goes straight from the top to the eye', () => {
    assert.deepEqual(o.direct(-2), [
      { x: o.TREE.topX, y: o.TREE.topY },
      { x: -2, y: o.EYE.y },
    ]);
  });
});

describe('mirage: the strings', () => {
  it('has every Bangla key in English and back', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });
  it('uses chapter 9’s লম্ব and বিভেদতল, the page’s ক্রান্তি কোণ and প্রতিবিম্ব (no অবাস্তব)', () => {
    for (const v of Object.values(STRINGS.bn)) assert.ok(!v.includes('অভিলম্ব'), v);
    assert.equal(STRINGS.bn.lbl_normal, 'লম্ব');
    assert.ok(STRINGS.bn.rule_bend.includes('ক্রান্তি কোণ'));
    assert.equal(STRINGS.bn.lbl_image, 'প্রতিবিম্ব');
    for (const v of Object.values(STRINGS.bn)) assert.ok(!v.includes('অবাস্তব') && !v.includes('সীমানা'), v);
    assert.ok(STRINGS.bn.out_far.includes('বিভেদতল'));
  });
  it('writes numbers with Bangla digits', () => {
    const t = createI18n('bn');
    assert.equal(t('out_far', { i: 75, c: 65 }).includes('৭৫°'), true);
  });
});
