// The physics of the electromagnetic-force figure (book page 68, topic 3.2.2): the charged comb that lifts bits
// of paper against the Earth's pull, the book's 10^36, and the coil and bar magnet on a cart. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as p from '../../assets/electromagnetic-force/src/physics.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);

describe('the comb and the bits of paper', () => {
  it('pulls nothing without charge, at any distance', () => {
    for (const d of [0.5, 5, 20, 45, 200]) assert.equal(p.pullRatio(0, d), 0);
    assert.equal(p.reach(0), 0);
  });
  it('lifts a bit exactly where its pull equals the bit’s weight (the edge of its reach)', () => {
    for (let q = 1; q <= p.COMB.levels; q++) close(p.pullRatio(q, p.reach(q)), 1, 1e-9, `charge ${q}`);
  });
  it('reaches farther with more charge: about 4.5 cm when fully charged', () => {
    for (let q = 1; q < p.COMB.levels; q++) assert.ok(p.reach(q + 1) > p.reach(q));
    close(p.reach(p.COMB.levels), 45, 1e-9);
    assert.ok(p.reach(1) > 20 && p.reach(1) < 30, `one stroke: ${p.reach(1)} mm`);
  });
  it('pulls much harder close up: the pull grows as 1 / d⁵', () => {
    close(p.pullRatio(5, 20) / p.pullRatio(5, 40), 32, 1e-9);
    assert.ok(p.pullRatio(5, 100) < 0.02, 'from 10 cm the Earth wins');
  });
  it('measures the distance to the row of teeth tips (beside the comb: to its end)', () => {
    const comb = { cx: 0, h: 30, half: 60 };
    close(p.teethDistance({ x: 10, y: 0, z: 0 }, comb), 30);
    close(p.teethDistance({ x: 64, y: 0, z: 0 }, comb), 30 * Math.hypot(1, 4 / 30), 1e-9);
    close(p.teethDistance({ x: 0, y: 0, z: 40 }, comb), 50);
  });
  it('comes down inside its reach (so the bits jump), right down with no charge, then lifts them above it', () => {
    assert.equal(p.stopHeight(0), 12);
    for (let q = 1; q <= p.COMB.levels; q++) {
      assert.ok(p.stopHeight(q) < p.reach(q), `charge ${q}: stops at ${p.stopHeight(q)} mm, inside ${p.reach(q)} mm`);
      assert.ok(p.stopHeight(q) >= 12);
      assert.ok(p.LIFT_HEIGHT > p.reach(q), 'held up higher than it reaches: the bits are clearly in the air');
    }
  });
});

describe('the book’s 10^36', () => {
  it('is the electric force between two protons ÷ the gravitational force between them', () => {
    const r = p.protonForceRatio();
    assert.equal(p.STRENGTH_EXP, 36);
    assert.equal(Math.floor(Math.log10(r)), 36, `ratio ${r.toExponential(3)}`);
    close(r / 1e36, 1.236, 0.002);
  });
});

describe('the coil and the bar magnet', () => {
  it('a coil with no current does nothing', () => {
    assert.equal(p.interaction(false, 'N'), null);
    assert.equal(p.interaction(false, 'S'), null);
    assert.deepEqual(p.settleCart(30, null), { gap: 30, v: 0 });
  });
  it('like poles repel, unlike poles attract (the coil’s N end faces the magnet)', () => {
    assert.equal(p.interaction(true, 'N'), 'repel');
    assert.equal(p.interaction(true, 'S'), 'attract');
    assert.equal(p.facingPole('SN'), 'S');
    assert.equal(p.facingPole('NS'), 'N');
  });
  it('pulls and pushes along the track in the right direction', () => {
    assert.ok(p.cartAccel(20, 'attract') < 0, 'towards the coil');
    assert.ok(p.cartAccel(20, 'repel') > 0, 'away from it');
    assert.equal(p.cartAccel(20, null), 0);
  });
  it('the force falls off as 1 / r⁴ but never reaches zero (infinite range)', () => {
    const r0 = p.CONTACT;
    close(p.magnetPull(0), p.MAG.pull);
    close(p.magnetPull(r0) / p.magnetPull(0), 1 / 16, 1e-12);
    assert.ok(p.magnetPull(1e6) > 0);
    // even at the far end of the track it beats the wheels' friction, so the magnet always comes back
    assert.ok(p.magnetPull(p.MAG.gapMax) > p.MAG.friction);
  });
  it('an attracted cart rolls to the coil and stays; a repelled one rolls to the end block', () => {
    assert.deepEqual(p.settleCart(40, 'attract'), { gap: 0, v: 0 });
    assert.deepEqual(p.settleCart(0, 'repel'), { gap: p.MAG.gapMax, v: 0 });
    assert.deepEqual(p.settleCart(p.MAG.gapMax, 'attract'), { gap: 0, v: 0 });
  });
  it('runs into the coil (and says so) and speeds up as it comes closer', () => {
    let st = { gap: 40, v: 0 };
    let hit = null;
    let lastV = 0;
    for (let i = 0; i < 100 && !hit; i++) {
      st = p.stepCart(st, 'attract', 0.05);
      hit = st.hit;
      if (!hit) {
        assert.ok(st.v <= lastV, 'faster and faster towards the coil');
        lastV = st.v;
      }
    }
    assert.equal(hit, 'coil');
    assert.equal(st.gap, 0);
    assert.equal(st.v, 0);
  });
  it('stays put under no force (static friction), and a moving cart coasts to a stop', () => {
    assert.deepEqual(p.stepCart({ gap: 30, v: 0 }, null, 0.05), { gap: 30, v: 0, hit: null });
    let st = { gap: 10, v: 60 };
    for (let i = 0; i < 100; i++) st = p.stepCart(st, null, 0.05);
    assert.equal(st.v, 0);
    close(st.gap, 10 + (60 * 60) / (2 * p.MAG.friction), 0.6, 'v² / 2a');
  });
});

describe('the force arrows on the coil and the magnet', () => {
  it('shrink all along the track, from 38 mm at contact, but never vanish', () => {
    close(p.magnetArrowLength(0), 38);
    for (let gap = 0; gap < p.MAG.gapMax; gap += 5)
      assert.ok(p.magnetArrowLength(gap + 5) < p.magnetArrowLength(gap) - 0.3, `shorter at ${gap + 5} mm`);
    assert.ok(p.magnetArrowLength(p.MAG.gapMax) > 15, 'still well visible at the far end');
    assert.ok(p.magnetArrowLength(1e6) > 8);
  });
});
