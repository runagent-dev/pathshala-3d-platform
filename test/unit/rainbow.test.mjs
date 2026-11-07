// The physics of the rainbow figure (book page 251, topic 9.2.1): water's refractive index by colour, the exact path of
// a ray through a round drop (Snell's law in, a reflection at the back, Snell's law out), the rainbow angles (red about
// 42°, violet about 41°), the back of the drop below the critical angle (a partial reflection, not total), how high the
// bow stands for a sun at a given height, and the test's choices and strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STRINGS } from '../../assets/rainbow/src/i18n.js';
import * as r from '../../assets/rainbow/src/reading.js';

const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg ?? ''} ${a} ≉ ${b}`);

describe('rainbow: water and colour', () => {
  it('uses typical indices of water: about 1.331 for red, 1.343 for violet, 1.333 for yellow', () => {
    near(r.nWater(656), 1.3311, 0.0004);
    near(r.nWater(589), 1.333, 0.0004);
    near(r.nWater(405), 1.3428, 0.0004);
  });
  it('bends violet more than red: the index falls from violet to red', () => {
    for (let i = 1; i < r.COLOURS.length; i++) assert.ok(r.nWater(r.COLOURS[i].nm) > r.nWater(r.COLOURS[i - 1].nm));
  });
  it("water's critical angle is about 48.6°", () => near(r.criticalDeg(1.333), 48.6, 0.05));
});

describe('rainbow: one ray through a drop', () => {
  it('obeys Snell’s law where it goes in and comes out, and stays on the drop’s surface', () => {
    const n = 1.333;
    const p = r.trace(n, 0.8);
    for (const q of [p.p1, p.p2, p.p3]) near(Math.hypot(q.x, q.y), 1, 1e-9, 'on the circle');
    // sin i = n sin r at p1, with the normal along the radius
    const cosIn = -(p.d0.x * p.p1.x + p.d0.y * p.p1.y);
    const cosR = -(p.d1.x * p.p1.x + p.d1.y * p.p1.y);
    near(Math.sqrt(1 - cosIn ** 2), n * Math.sqrt(1 - cosR ** 2), 1e-9);
    // the light out is symmetric with the light in: it leaves at the angle it came in
    const cosOut = p.d3.x * p.p3.x + p.d3.y * p.p3.y;
    near(cosOut, cosIn, 1e-9);
  });
  it('turns back toward the sun at 4r − 2i', () => {
    const p = r.trace(1.333, 0.86);
    near(p.theta, 4 * p.r - 2 * p.i, 1e-6);
  });
  it('gives the rainbow angles: red about 42.3°, violet about 40.7°, red outside', () => {
    near(r.THETA_RED, 42.35, 0.1);
    near(r.THETA_VIOLET, 40.72, 0.1);
    assert.ok(r.THETA_RED > r.THETA_VIOLET);
    assert.equal(r.wholeDeg(r.THETA_RED), 42);
    assert.equal(r.wholeDeg(r.THETA_VIOLET), 41);
  });
  it('the rainbow ray is where the turning is least (no aim brings the light further round)', () => {
    const n = r.nWater(589);
    const best = r.trace(n, r.rainbowAim(n)).theta;
    for (let b = 0.05; b < 1; b += 0.05) assert.ok(r.trace(n, b).theta <= best + 1e-9);
    near(best, r.rainbowDeg(n), 1e-9);
  });
  it('meets the back of the drop below the critical angle: an ordinary, partial reflection', () => {
    for (const c of r.COLOURS) {
      const n = r.nWater(c.nm);
      const p = r.trace(n, r.rainbowAim(n));
      assert.ok(p.back < r.criticalDeg(n) - 5, `${c.id}: ${p.back}°`);
      assert.ok(p.out, 'some light goes on out of the back');
    }
  });
  it('draws the big drop with a wider spread, in the same order (violet steepest inside, red steepest out)', () => {
    const red = r.DROP_PATHS[0];
    const violet = r.DROP_PATHS[r.DROP_PATHS.length - 1];
    assert.ok(violet.r < red.r, 'violet bends more going in');
    assert.ok(red.theta > violet.theta, 'red comes out further round');
    assert.ok(red.theta - violet.theta > 5, 'far enough apart to be seen');
  });
});

describe('rainbow: the sky', () => {
  it('the top of the bow stands θ − sun above the horizon', () => {
    near(r.topDeg(15), r.THETA_RED - 15, 1e-9);
    assert.ok(r.bowVisible(30));
    assert.ok(!r.bowVisible(43));
    assert.ok(!r.bowVisible(r.SUN.noon));
  });
  it('a sun on the horizon shows a half circle; a higher sun less', () => {
    near(r.halfArcDeg(0), 90, 1e-9);
    assert.ok(r.halfArcDeg(20) < 90 && r.halfArcDeg(20) > 0);
    assert.equal(r.halfArcDeg(50), 0);
  });
  it('the sun stays between 5° and 70°', () => {
    assert.equal(r.clampSun(80), 70);
    assert.equal(r.clampSun(-3), 5);
    assert.equal(r.clampSun('x'), r.SUN.start);
  });
  it('the height question: four different answers, the right one first', () => {
    const c = r.heightChoices(20);
    assert.equal(c[0].v, 22);
    assert.equal(new Set(c.map((x) => x.v)).size, 4);
  });
});

describe('rainbow: strings', () => {
  it('every Bangla string has an English one and back', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });
  it('uses the book’s words', () => {
    assert.match(STRINGS.bn.rule_in, /প্রতিসরণ/);
    assert.match(STRINGS.bn.out_back, /প্রতিফলিত/);
    assert.match(STRINGS.bn.rule_bow, /ব্যান্ড \(Band\)/);
    assert.match(STRINGS.bn.rule_bow, /সূর্যের বিপরীত আকাশে/);
    assert.match(STRINGS.bn.rule_noon, /ভরদুপুরে রংধনু দেখা যায় না/);
    // the reflection inside a real drop is not total: the figure never calls it that
    for (const s of Object.values(STRINGS.bn)) assert.doesNotMatch(s, /পূর্ণ অভ্যন্তরীণ/);
  });
});
