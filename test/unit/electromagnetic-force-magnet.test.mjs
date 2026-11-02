// The physics of the electromagnetic-force-magnet figure (book page 68, topic 3.2.2): the coil and the bar magnet
// on a cart. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as p from '../../assets/electromagnetic-force-magnet/src/physics.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);

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
