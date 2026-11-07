// Optical fibre (book page 253, topic 9.3.1): the book's critical angle (n₂ = 1.50 core, n₁ = 1.45 clad → 75°), the
// light traced through the fibre (Snell at the faces, total internal reflection at the core–clad wall, Fresnel where it
// leaks), the bends that never let the starting light out, the tilt that does, and the strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createI18n, STRINGS } from '../../assets/optical-fibre/src/i18n.js';
import * as r from '../../assets/optical-fibre/src/reading.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

describe('optical-fibre: the critical angle', () => {
  it('is the book’s 75° for core 1.50 and clad 1.45', () => {
    assert.equal(r.THETA_C, 75);
    assert.equal(Math.round(r.criticalAngle(r.N_CLAD_BOOK, r.N_CORE)), 75);
    near(r.criticalAngle(r.N_CLAD, r.N_CORE), 75, 1e-9);
    assert.equal(r.N_CLAD.toFixed(2), '1.45');
  });
  it('reflects everything from θc on, and only a part below it', () => {
    assert.equal(r.reflectance(75), 1);
    assert.equal(r.reflectance(80), 1);
    const at70 = r.reflectance(70);
    assert.ok(at70 > 0 && at70 < 0.1, `${at70}`);
    assert.ok(r.reflectance(74.5) > r.reflectance(70));
  });
  it('turns the tilt outside into θ₁ inside (sin α = 1.5 sin β, θ₁ = 90° − β)', () => {
    near(r.wallAngle(0), 90);
    near(r.wallAngle(r.ALPHA_START), 90 - (Math.asin(Math.sin((10 * Math.PI) / 180) / 1.5) * 180) / Math.PI);
    near(r.wallAngle(r.ALPHA_EDGE), 75, 1e-9);
  });
});

describe('optical-fibre: the centre line', () => {
  it('is straight when not bent and ends at the far face', () => {
    const line = r.centreLine(0);
    assert.equal(line.pieces.length, 1);
    const end = r.centreAt(line, line.length);
    near(end.x, r.FIBRE.length);
    near(end.y, 0);
  });
  it('bends into an S that ends level at the height asked for, smoothly', () => {
    for (const h of [-10, -4, 6, 10]) {
      const line = r.centreLine(h);
      const end = r.centreAt(line, line.length);
      near(end.x, r.FIBRE.length, 1e-9);
      near(end.y, h, 1e-9);
      near(end.tx, 1, 1e-9);
      // tangent continuous across the pieces
      let s = 0;
      for (const p of line.pieces.slice(0, -1)) {
        s += p.len;
        const a = r.centreAt(line, s - 1e-6);
        const b = r.centreAt(line, s + 1e-6);
        near(a.tx, b.tx, 1e-4);
        near(a.ty, b.ty, 1e-4);
      }
    }
  });
});

describe('optical-fibre: the light', () => {
  it('in a straight fibre meets every wall at the same θ₁ and all of it reaches the screen', () => {
    const tr = r.trace({ alpha: r.ALPHA_START, h: 0 });
    assert.ok(tr.hits.length >= 5);
    for (const hit of tr.hits) near(hit.theta, r.wallAngle(r.ALPHA_START), 1e-6);
    assert.equal(tr.leaked, false);
    assert.equal(tr.arrived, 1);
    assert.ok(tr.spot);
  });
  it('stays in the core at every bend of the range with the starting tilt (and up to 16°)', () => {
    for (const alpha of [0, 6, r.ALPHA_START, 14, 16])
      for (let h = -r.BEND_MAX; h <= r.BEND_MAX + 1e-9; h += 0.5) {
        const tr = r.trace({ alpha, h });
        assert.equal(tr.leaked, false, `alpha ${alpha}, h ${h}`);
        assert.ok(tr.minTheta >= r.THETA_C, `alpha ${alpha}, h ${h}: ${tr.minTheta}`);
        assert.equal(tr.arrived, 1);
      }
  });
  it('a bend lowers some θ₁ but keeps them over 75°', () => {
    const tr = r.trace({ alpha: r.ALPHA_START, h: 8 });
    assert.ok(tr.minTheta < r.wallAngle(r.ALPHA_START));
    assert.ok(tr.minTheta > r.THETA_C);
  });
  it('leaks into the clad below θc and the screen goes dark', () => {
    const tr = r.trace({ alpha: 35, h: 0 });
    assert.equal(tr.leaked, true);
    assert.ok(tr.hits[0].theta < r.THETA_C);
    assert.ok(tr.segs.some((s) => s.kind === 'clad'));
    assert.equal(tr.arrived, 0);
    // the light into the clad bends away from the normal (dense → light) and stops at the clad's outer face
    const leak = tr.segs.find((s) => s.kind === 'clad');
    const dy = Math.abs(leak.b.y - leak.a.y);
    near(dy, r.FIBRE.clad - r.FIBRE.core, 1e-6);
  });
  it('is just kept in at the edge tilt and lost just past it', () => {
    assert.equal(r.trace({ alpha: r.ALPHA_EDGE - 0.05, h: 0 }).leaked, false);
    assert.equal(r.trace({ alpha: r.ALPHA_EDGE + 0.05, h: 0 }).leaked, true);
  });
  it('with a clad as dense as the core goes straight on into the clad (the test’s question)', () => {
    const tr = r.trace({ alpha: 15.7, h: 0, nClad: r.N_CORE });
    assert.equal(tr.hits.length, 1);
    assert.equal(tr.hits[0].tir, false);
    const leak = tr.segs.find((s) => s.kind === 'clad');
    const core = tr.segs.find((s) => s.kind === 'core');
    const dir = (g) => Math.atan2(g.b.y - g.a.y, g.b.x - g.a.x);
    near(dir(leak), dir(core), 1e-9);
    assert.equal(tr.arrived, 0);
  });
  it('never shows 75° on a wall that leaks nor less on one that reflects', () => {
    assert.equal(r.shownTheta({ theta: 74.8, tir: false }), 74);
    assert.equal(r.shownTheta({ theta: 75.0, tir: true }), 75);
    assert.equal(r.shownTheta({ theta: 82.03, tir: true }), 82);
  });
});

describe('optical-fibre: strings', () => {
  it('has every Bangla key in English and back, with লম্ব (chapter 9’s word), never অভিলম্ব', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
    for (const v of Object.values(STRINGS.bn)) assert.ok(!v.includes('অভিলম্ব'));
    assert.equal(STRINGS.bn.lbl_normal, 'লম্ব');
  });
  it('has no hard-coded Bangla digits in the strings (numbers come in as vars)', () => {
    for (const [k, v] of Object.entries(STRINGS.bn)) assert.ok(!/[০-৯]/.test(v), k);
  });
  it('writes Bangla digits through the vars', () => {
    const t = createI18n('bn');
    assert.equal(t('lbl_t1', { a: 83 }), 'θ<sub>1</sub> = ৮৩°');
  });
});
