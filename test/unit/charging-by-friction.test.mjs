// Charging by rubbing (book pages 274–275, topic 10.2): electrons go glass → silk and flannel → plastic, only electrons
// move, the counts on each body, and the hanging rod's swing from Coulomb's law: like charges turn it away, unlike
// toward, more when nearer, hardly at all when far; the strings in both languages. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STRINGS } from '../../assets/charging-by-friction/src/i18n.js';
import { HANG_CHARGE, HELD, HELD_CHARGE, ROD, STAND } from '../../assets/charging-by-friction/src/layout.js';
import {
  COUNTS,
  chargeOf,
  forceKind,
  kindOf,
  movedAfter,
  PAIRS,
  SWING,
  settle,
  step,
  still,
  torqueY,
  heldReach,
} from '../../assets/charging-by-friction/src/physics.js';

describe('charging-by-friction: rubbing', () => {
  it('moves electrons the way the book says: glass → silk, flannel → plastic', () => {
    assert.equal(PAIRS.glass.from, 'rod');
    assert.equal(PAIRS.glass.to, 'cloth');
    assert.equal(PAIRS.plastic.from, 'cloth');
    assert.equal(PAIRS.plastic.to, 'rod');
    const m = COUNTS.moved;
    assert.equal(kindOf(chargeOf('glass', 'rod', m).net), 'positive');
    assert.equal(kindOf(chargeOf('glass', 'cloth', m).net), 'negative');
    assert.equal(kindOf(chargeOf('plastic', 'rod', m).net), 'negative');
    assert.equal(kindOf(chargeOf('plastic', 'cloth', m).net), 'positive');
  });
  it('starts neutral, keeps the protons, and conserves charge', () => {
    for (const pair of ['glass', 'plastic']) {
      for (const moved of [0, 1, 2.5, COUNTS.moved]) {
        const rod = chargeOf(pair, 'rod', moved);
        const cloth = chargeOf(pair, 'cloth', moved);
        assert.equal(rod.plus, COUNTS.rod, 'the protons stay');
        assert.equal(cloth.plus, COUNTS.cloth);
        assert.equal(rod.net + cloth.net, 0, 'what one loses the other gains');
      }
      assert.equal(chargeOf(pair, 'rod', 0).net, 0);
      assert.equal(chargeOf(pair, 'cloth', 0).net, 0);
    }
    // the flannel keeps at least one electron: it gives some, not all
    assert.ok(chargeOf('plastic', 'cloth', COUNTS.moved).minus >= 1);
  });
  it('moves one electron a stroke after the first, up to the most', () => {
    assert.equal(movedAfter(0), 0);
    assert.equal(movedAfter(1), 0);
    assert.equal(movedAfter(2), 1);
    assert.equal(movedAfter(COUNTS.strokes), COUNTS.moved);
    assert.equal(movedAfter(99), COUNTS.moved);
  });
  it('like charges repel, unlike attract', () => {
    assert.equal(forceKind(1, 1), 1);
    assert.equal(forceKind(-1, -1), 1);
    assert.equal(forceKind(1, -1), -1);
    assert.equal(forceKind(0, 1), 0);
  });
});

// the figure's own geometry: a hanging rod at stand A, the rod in the hand `near` (0 far … 1 close)
function setup(qHang, qHeld, near) {
  const c = [STAND.A.x, STAND.A.y, STAND.A.z];
  const u = [HELD.toHand.x, HELD.toHand.y, HELD.toHand.z];
  const a = [HELD.away.x, HELD.away.y, HELD.away.z];
  const tip = [c[0] + HELD.near.x, c[1] + HELD.near.y, c[2] + HELD.near.z].map((v, i) => v + a[i] * (1 - near) * HELD.reach);
  const pts = [];
  const qs = [];
  for (let j = 0; j < HELD_CHARGE.n; j++) {
    const d = (HELD_CHARGE.len * j) / (HELD_CHARGE.n - 1);
    pts.push(tip.map((v, i) => v + u[i] * d));
    qs.push((qHeld * heldReach(near)) / HELD_CHARGE.n);
  }
  const torque = (th) => torqueY(c, { ...HANG_CHARGE, q: qHang }, th, pts, qs);
  return { c, tip, torque };
}
/** The hanging rod's charged end at angle θ (x, z). */
const endAt = (c, th) => [c[0] - ROD.half * Math.cos(th), c[2] + ROD.half * Math.sin(th)];
const deg = (r) => (r * 180) / Math.PI;

describe('charging-by-friction: the hanging rod', () => {
  it('turns away from a like charge and toward an unlike one', () => {
    for (const [qh, qr, away] of [
      [1, 1, true],
      [-1, -1, true],
      [-1, 1, false],
    ]) {
      const { c, tip, torque } = setup(qh, qr, 1);
      const th = settle(torque);
      const d0 = Math.hypot(...endAt(c, 0).map((v, i) => v - [tip[0], tip[2]][i]));
      const d1 = Math.hypot(...endAt(c, th).map((v, i) => v - [tip[0], tip[2]][i]));
      assert.equal(d1 > d0, away, `q ${qh}, ${qr}: end went ${d1 > d0 ? 'away' : 'toward'} (${deg(th).toFixed(1)}°)`);
    }
  });
  it('turns clearly when near and not at all from the far end of the travel', () => {
    const near = Math.abs(deg(settle(setup(1, 1, 1).torque)));
    const far = Math.abs(deg(settle(setup(1, 1, 0).torque)));
    const attract = Math.abs(deg(settle(setup(-1, 1, 1).torque)));
    assert.ok(near > 25 && near < 60, `repelled ${near}°`);
    assert.ok(attract > 12 && attract < 40, `attracted ${attract}°`);
    assert.equal(far, 0);
    // nearer, more
    const mid = Math.abs(deg(settle(setup(1, 1, 0.5).torque)));
    assert.ok(far < mid && mid < near);
  });
  it('never lets the attracted end touch the rod in the hand', () => {
    const { c, tip, torque } = setup(-1, 1, 1);
    const th = settle(torque);
    const [ex, ez] = endAt(c, th);
    const gap = Math.hypot(ex - tip[0], ez - tip[2]);
    assert.ok(gap > 2 * ROD.r + 0.01, `gap ${gap}`);
  });
  it('a neutral rod feels nothing; the swing settles', () => {
    assert.equal(settle(setup(0, 1, 1).torque), 0);
    const { torque } = setup(1, 1, 1);
    const s = { theta: 0, omega: 0 };
    for (let i = 0; i < 12 / SWING.dt; i++) step(s, torque);
    assert.ok(still(s, torque));
  });
});

describe('charging-by-friction: strings', () => {
  it('has every key in both languages, the same {vars}, and the book’s terms', () => {
    const bn = STRINGS.bn;
    const en = STRINGS.en;
    assert.deepEqual(Object.keys(bn).sort(), Object.keys(en).sort());
    const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const k of Object.keys(bn)) assert.deepEqual(vars(bn[k]), vars(en[k]), k);
    for (const term of ['পজিটিভ বা ধনাত্মক চার্জযুক্ত', 'নেগেটিভ চার্জযুক্ত', 'আসক্তি', 'বিকর্ষণ', 'আকর্ষণ', 'সিল্কের সুতা', 'ফ্লানেল', 'চার্জ নিরপেক্ষ']) {
      assert.ok(
        Object.values(bn).some((s) => s.includes(term)),
        term,
      );
    }
  });
  it('asks questions in words only (the picture carries what is read off it)', () => {
    for (const k of Object.keys(STRINGS.bn).filter((x) => x.startsWith('q_') && !['q_count', 'q_score', 'q_result'].includes(x)))
      assert.ok(!/[0-9০-৯]/.test(STRINGS.bn[k]), k);
  });
});
