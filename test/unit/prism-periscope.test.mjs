// Periscope and binoculars (book page 254, topic 9.3.3): the critical angle of glass is the book's 41.8°, both
// periscope prisms meet the light at 45° on their hypotenuse faces and turn it 90° by total internal reflection, the
// head below the wall sees the wall, the wall stops the flower's straight light, and one barrel of the binoculars has
// four total internal reflections that fold a long path into a short body. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createI18n, STRINGS } from '../../assets/prism-periscope/src/i18n.js';
import * as r from '../../assets/prism-periscope/src/reading.js';

const close = (a, b, e = 1e-9) => Math.abs(a - b) < e;

describe('prism-periscope: the optics', () => {
  it('gives the book’s critical angle for glass in air, 41.8° (n = 1.5), and none from air into glass', () => {
    assert.equal(r.round(r.criticalAngle(), 1), 41.8);
    assert.ok(Number.isNaN(r.criticalAngle(1, 1.5)));
    // under water the prism's face would need more than 45°: no total reflection (the book's 9.2 example)
    assert.ok(r.criticalAngle(r.N.glass, r.N.water) > 45);
  });

  it('reflects by the law of reflection and measures incidence from the normal', () => {
    const d = r.reflect({ x: 1, y: 0 }, { x: 1, y: 1 });
    assert.ok(close(d.x, 0) && close(d.y, -1));
    assert.ok(close(r.incidence({ x: 1, y: 0 }, { x: 1, y: 1 }), 45));
    assert.ok(close(r.incidence({ x: 0, y: -1 }, { x: 0, y: 1 }), 0));
    assert.ok(close(r.turn({ x: 1, y: 0 }, { x: 0, y: -1 }), 90));
  });

  it('turns the light 90° twice in the periscope, each by total internal reflection at 45°', () => {
    const p = r.periscopePath(r.PERI.ywMax);
    assert.equal(p.seen, 'flower');
    for (const a of p.angles) assert.ok(close(a, 45));
    assert.deepEqual(p.total, [true, true]);
    for (const t of p.turns) assert.ok(close(t, 90));
    // it leaves going the way it came, lower down: into the eye
    assert.ok(close(p.out.x, 1) && close(p.out.y, 0));
    const last = p.points.at(-1);
    assert.equal(last.x, r.SCENE.eyeX);
    assert.equal(last.y, r.PERI.low);
  });

  it('sees the wall while the top window is below the wall’s top, the flower above it', () => {
    assert.ok(r.PERI.ywMin < r.SCENE.wall.top && r.PERI.ywMax > r.SCENE.wall.top);
    assert.equal(r.periscopePath(r.headY(0)).seen, 'wall');
    assert.equal(r.periscopePath(r.headY(0)).points[0].x, r.SCENE.wall.x1);
    assert.equal(r.periscopePath(r.headY(1)).seen, 'flower');
    assert.equal(r.periscopePath(r.headY(1)).points[0].x, r.SCENE.flower.x);
    assert.ok(close(r.headK(r.headY(0.4)), 0.4));
    // the head at the top looks straight at the flower's head
    assert.equal(r.headY(1), r.SCENE.flower.y);
  });

  it('has the flower’s straight light stopped by the wall below its top', () => {
    const b = r.blockedLight();
    assert.equal(b.blocked, true);
    assert.ok(b.at.y > 0 && b.at.y < r.SCENE.wall.top);
  });

  it('folds the binoculars’ light with four total internal reflections at 45°', () => {
    const b = r.binocularPath();
    assert.equal(b.at.length, 4);
    for (const a of b.angles) assert.ok(close(a, 45));
    assert.ok(b.total.every(Boolean));
    // each reflection turns it 90°: up, back, sideways, forward again
    const dirs = b.dirs;
    for (let i = 1; i < dirs.length; i++) assert.ok(close(r.turn(dirs[i - 1], dirs[i]), 90));
    assert.ok(close(dirs.at(-1).x, 1));
    // the points really are where the directions say: every segment runs along its direction
    const segs = [];
    for (let i = 1; i < b.points.length; i++) segs.push([b.points[i - 1], b.points[i]]);
    assert.ok(segs.every(([a, c]) => [a.x - c.x, a.y - c.y, a.z - c.z].filter((v) => Math.abs(v) > 1e-9).length === 1));
    // a long path in a short body
    assert.equal(r.round(b.length), 27);
    assert.equal(r.round(b.body), 14);
    assert.ok(b.length > 1.8 * b.body);
  });
});

describe('prism-periscope: the words', () => {
  it('has every Bangla string in English too, and no Bangla digits typed into strings', () => {
    for (const k of Object.keys(STRINGS.bn)) assert.ok(k in STRINGS.en, k);
    for (const [k, v] of Object.entries(STRINGS.bn)) assert.ok(!/[০-৯]/.test(v), k);
  });

  it('uses chapter 9’s লম্ব, never অভিলম্ব, and the book’s terms', () => {
    const all = Object.values(STRINGS.bn).join(' ');
    assert.ok(!all.includes('অভিলম্ব'));
    for (const term of ['পেরিস্কোপ', 'বাইনোকুলার', 'প্রিজম', 'পূর্ণ অভ্যন্তরীণ প্রতিফলন', 'সংকট কোণ', 'আপতন কোণ', 'সাবমেরিন', 'বাইনোকুলারের দৈর্ঘ্য কমানোর জন্য'])
      assert.ok(all.includes(term), term);
  });

  it('writes numbers in Bangla digits', () => {
    const t = createI18n('bn');
    assert.equal(t('lbl_angle', { a: 45 }), 'আপতন কোণ ৪৫°');
    assert.equal(createI18n('en')('lbl_angle', { a: 45 }), 'Incidence 45°');
  });
});
