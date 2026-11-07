import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assign,
  balance,
  D,
  gapDeg,
  layout,
  leafAngle,
  leafShare,
  NEUTRAL,
  parts,
  pull,
  regionOf,
  RUBBED,
  SCENES,
  sceneLeaf,
  shiftFrom,
  TOUCH_TAKES,
} from '../../assets/gold-leaf-electroscope/src/reading.js';

const scenes = Object.entries(SCENES);

test('gold-leaf-electroscope: the leaves balance: zero charge hangs straight, more charge opens wider, the sign does not matter', () => {
  assert.equal(leafAngle(0), 0);
  assert.ok(leafAngle(1) > 0);
  assert.ok(leafAngle(2) > leafAngle(1));
  assert.ok(leafAngle(3) > leafAngle(2));
  assert.equal(leafAngle(-2), leafAngle(2));
  // the angle found really is the balance
  assert.ok(Math.abs(balance(leafAngle(2)) - 0.033 * 4) < 1e-9);
  // three beads open each leaf about 38°
  assert.ok(Math.abs(gapDeg(3) - 76) <= 2);
});

test('gold-leaf-electroscope: induction falls with distance and takes the sign of the body', () => {
  assert.ok(pull(7, D.near) > pull(7, 30));
  assert.ok(pull(7, 30) > pull(7, D.far));
  assert.equal(pull(-7, 20), -pull(7, 20));
  assert.equal(shiftFrom([{ q: RUBBED.glass, d: D.far }]), 0);
  assert.equal(shiftFrom([{ q: RUBBED.glass, d: D.near }]), 2);
  assert.equal(shiftFrom([{ q: RUBBED.comb, d: D.near }]), -2);
  assert.equal(shiftFrom([{ q: 0, d: 0 }, null]), 0);
});

test('gold-leaf-electroscope: charge is kept: the parts always add up to Q', () => {
  for (let Q = -5; Q <= 5; Q++) {
    for (let s = -3; s <= 3; s++) {
      const p = parts(Q, s);
      assert.equal(p.leaf * 2 + p.disc, Q, `Q ${Q}, shift ${s}`);
      assert.equal(p.total, Q);
    }
  }
  assert.equal(leafShare(5), 2);
  assert.equal(leafShare(-5), -2);
  assert.equal(leafShare(0), 0);
});

test('gold-leaf-electroscope: the number of electrons on the metal is NEUTRAL − Q, and a place holds one', () => {
  for (let Q = -5; Q <= 5; Q++) {
    for (let s = -2; s <= 3; s++) {
      const list = layout(Q, s);
      assert.equal(list.length, NEUTRAL - Q, `Q ${Q}, shift ${s}`);
      assert.equal(new Set(list).size, list.length);
    }
  }
});

test('gold-leaf-electroscope: only the electrons that must move do, and none is lost', () => {
  const from = layout(0, 0);
  const to = layout(0, 2);
  const moved = assign(from, to);
  assert.deepEqual([...moved].sort(), [...to].sort());
  const changed = moved.filter((x, i) => x !== from[i]);
  assert.equal(changed.length, 4); // two from each leaf, up to the disc
  assert.ok(changed.every((x) => regionOf(x) === 'disc'));
  // an electron not on the metal stays off it
  assert.equal(assign([null, 'L0'], ['L0'])[0], null);
});

test("gold-leaf-electroscope: the book's story in the scenes", () => {
  const gap = Object.fromEntries(scenes.map(([k, sc]) => [k, gapDeg(sceneLeaf(sc))]));
  assert.equal(gap.parts, 0); // no charge, the leaves hang together
  assert.ok(gap.near > 40); // near without touching: they open
  assert.equal(SCENES.near.Q, 0); // by induction: the electroscope's own charge stays zero
  assert.equal(SCENES.touch.Q, TOUCH_TAKES); // by touch: electrons left, it stays positive
  assert.ok(gap.touch > 40); // and the leaves stay apart with the rod gone
  assert.ok(gap.testNeg < gap.touch); // a negative body: smaller
  assert.ok(gap.testNeg > 0); // visibly, not shut
  assert.ok(gap.testPos > gap.touch); // a positive body: wider
  // both leaves always carry one charge, the same on each
  assert.equal(sceneLeaf(SCENES.testPos), 3);
});
