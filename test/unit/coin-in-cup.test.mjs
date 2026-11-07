// The coin in the cup (book page 246, topic 9.1.1, চিত্র ৯.০৩): the empty cup's rim hides the whole coin, water makes
// it visible, the bent ray obeys n₁ sin θ₁ = n₂ sin θ₂ exactly and bends away from the normal, the coin looks raised on
// the eye's line, the test's choices are distinct, and every string has both languages. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createI18n, STRINGS } from '../../assets/coin-in-cup/src/i18n.js';
import * as r from '../../assets/coin-in-cup/src/reading.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);
const sin = (d) => Math.sin(r.rad(d));

describe('coin-in-cup: the optics', () => {
  it('hides the whole coin behind the rim of the empty cup', () => {
    const line = r.sightLine();
    assert.equal(line.hits, 'bottom');
    assert.ok(line.to.x > r.COIN.r, 'the eye sees the bottom only beyond the coin’s far edge');
    for (const x0 of [-r.COIN.r, 0, r.COIN.r]) {
      const t = r.trace(r.LEVEL.empty, { x0 });
      assert.equal(t.visible, false);
      assert.equal(t.water, false);
      near(t.points.at(-1).x, r.RIM.x); // stopped by the wall, below the rim
      assert.ok(t.points.at(-1).y < r.RIM.y);
    }
  });

  it('shows the coin once there is enough water, and never with n = 1', () => {
    const full = r.trace(r.LEVEL.full);
    assert.equal(full.visible, true);
    assert.ok(full.clearance > 0.3, 'the light passes well above the rim');
    assert.deepEqual(full.points.at(-1), r.EYE);
    const h = r.threshold();
    assert.ok(h > r.LEVEL.empty + 1 && h < r.LEVEL.full - 0.5, `the middle appears part way up (${h})`);
    assert.equal(r.trace(h - 0.01).visible, false);
    assert.equal(r.trace(h + 0.01).visible, true);
    // the far edge first; the middle later
    assert.ok(r.threshold({ x0: r.COIN.r }) < h);
    // with nothing to bend the light the rim hides it at any level
    assert.equal(r.threshold({ n: 1 }), null);
  });

  it('bends the light by n₁ sin θ₁ = n₂ sin θ₂, away from the normal, at a point on the surface', () => {
    for (const level of [2, 3.5, r.LEVEL.full]) {
      const t = r.trace(level);
      near(r.N_WATER * sin(t.theta1), r.N_AIR * sin(t.theta2), 1e-9);
      assert.ok(t.theta2 > t.theta1, 'away from the normal');
      near(t.surface.y, level);
      // the angles are those of the drawn segments
      const [C, S, E] = t.points;
      near(r.deg(Math.atan2(C.x - S.x, S.y - C.y)), t.theta1, 1e-9);
      near(r.deg(Math.atan2(S.x - E.x, E.y - S.y)), t.theta2, 1e-9);
    }
    near(r.refractAngle(30), r.deg(Math.asin(1.33 * 0.5)), 1e-9);
    assert.equal(r.refractAngle(60), null); // beyond the critical angle no light gets out
  });

  it('raises the coin: it looks shallower, right above the real one, on the eye’s line', () => {
    for (const level of [r.threshold() + 0.05, r.LEVEL.full]) {
      const t = r.trace(level);
      assert.ok(t.apparent < t.depth && t.apparent > 0.4 * t.depth);
      near(t.image.x, 0);
      // the image lies on the line from the eye through S, extended into the water
      const [, S, E] = t.points;
      const cross = (E.x - S.x) * (t.image.y - S.y) - (E.y - S.y) * (t.image.x - S.x);
      near(cross, 0, 1e-9);
    }
    // looking straight down it is d / n
    const down = r.trace(r.LEVEL.full, { eye: { x: 0, y: 30 } });
    near(down.apparent, down.depth / r.N_WATER, 1e-6);
  });

  it('gives four distinct whole-degree choices for the angle question, the answer first', () => {
    for (const a of [25, 30, 35, 40]) {
      const c = r.angleChoices(a);
      assert.equal(c[0].v, Math.round(r.refractAngle(a)));
      assert.equal(new Set(c.map((x) => x.v)).size, 4);
      for (const x of c) assert.ok(x.v > 0 && x.v < 90);
    }
  });

  it('keeps the water’s surface inside the cup’s round bottom corner', () => {
    near(r.innerRadius(r.CUP.base), r.CUP.ri - r.CUP.fillet);
    near(r.innerRadius(r.LEVEL.full), r.CUP.ri);
    assert.ok(r.innerRadius(r.CUP.base + 0.3) < r.CUP.ri);
  });
});

describe('coin-in-cup: the strings', () => {
  it('has every key in both languages and Bangla digits in Bangla', () => {
    const bn = Object.keys(STRINGS.bn).sort();
    const en = Object.keys(STRINGS.en).sort();
    assert.deepEqual(bn, en);
    const t = createI18n('bn');
    assert.equal(t.num(1.33), '১.৩৩');
    assert.equal(createI18n('en').num(1.33), '1.33');
  });
});
