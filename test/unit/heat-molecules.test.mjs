// The maths of the heat figure (book page 161, topic 6.1): the six heat steps, the state each one is in, how fast the
// molecules move, the lattice a solid is held to, and the test's choices. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/heat-molecules/src/reading.js';
import { STRINGS, createI18n } from '../../assets/heat-molecules/src/i18n.js';

describe('heat: the steps and the states', () => {
  it('has six steps, two in each state, hotter each time', () => {
    assert.equal(r.LEVELS.length, 6);
    for (let i = 1; i < r.LEVELS.length; i++) assert.ok(r.LEVELS[i] > r.LEVELS[i - 1]);
    assert.deepEqual(
      r.LEVELS.map((_, i) => r.stateOfStep(i)),
      ['solid', 'solid', 'liquid', 'liquid', 'gas', 'gas'],
    );
    for (const k of r.STATES) for (const i of r.STEPS_OF[k]) assert.equal(r.stateOfStep(i), k);
  });

  it('jumps a word of the row to its first step', () => {
    for (const k of r.STATES) assert.equal(r.stateOfStep(r.FIRST_STEP[k]), k);
    assert.deepEqual(r.FIRST_STEP, { solid: 0, liquid: 2, gas: 4 });
  });

  it('finds the nearest step and goes round: the button after the last step starts again', () => {
    for (let i = 0; i <= r.LAST_STEP; i++) assert.equal(r.stepOf(r.LEVELS[i]), i);
    assert.equal(r.stepOf(0.33), 1);
    assert.equal(r.nextStep(0), 1);
    assert.equal(r.nextStep(r.LAST_STEP), 0);
  });

  it('lets a solid’s bonds go between the melting levels and a liquid’s between the boiling levels', () => {
    assert.equal(r.solidness(0), 1);
    assert.equal(r.solidness(0.2), 1);
    assert.equal(r.solidness(0.46), 0);
    assert.equal(r.gasness(0.62), 0);
    assert.equal(r.gasness(0.78), 1);
    assert.ok(r.solidness(0.33) > 0 && r.solidness(0.33) < 1);
  });
});

describe('heat: the molecules move faster the hotter it is', () => {
  it('speeds up with every step, and a gas is the fastest', () => {
    for (let i = 1; i < r.LEVELS.length; i++) assert.ok(r.speedOf(r.LEVELS[i]) > r.speedOf(r.LEVELS[i - 1]));
    assert.ok(r.speedOf(r.LEVELS[4]) > 1.5 * r.speedOf(r.LEVELS[3]));
  });

  it('gives more kinetic energy for more speed (∝ speed²)', () => {
    assert.equal(r.energyOf(0), 1);
    assert.ok(Math.abs(r.energyOf(1) - (r.speedOf(1) / r.speedOf(0)) ** 2) < 1e-9);
    for (let i = 1; i < r.LEVELS.length; i++) assert.ok(r.energyOf(r.LEVELS[i]) > r.energyOf(r.LEVELS[i - 1]));
  });

  it('keeps a solid’s shake smaller than the gap between its molecules', () => {
    const gap = r.GAP - 2 * r.MOLECULE_R;
    assert.ok(r.strayOf(0.2) < gap / 2);
    assert.ok(r.strayOf(0.2) > r.strayOf(0));
  });
});

describe('heat: the lattice of a solid', () => {
  it('has 60 molecules in a 6 × 5 × 2 lattice inside the container, none overlapping', () => {
    assert.equal(r.COUNT, 60);
    const pts = Array.from({ length: r.COUNT }, (_, i) => r.homeOf(i));
    for (const [x, y, z] of pts) {
      assert.ok(Math.abs(x) + r.MOLECULE_R <= r.BOX.w / 2);
      assert.ok(Math.abs(z) + r.MOLECULE_R <= r.BOX.d / 2);
      assert.ok(y - r.MOLECULE_R >= 0 && y + r.MOLECULE_R <= r.LIQUID_TOP);
    }
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
        assert.ok(d >= 2 * r.MOLECULE_R, `molecules ${i} and ${j} overlap`);
      }
  });
});

describe('heat: the test', () => {
  it('puts the right answer first among four different ones', () => {
    for (const k of r.STATES) {
      const c = r.doingChoices(k);
      assert.equal(c[0], k);
      assert.equal(new Set(c).size, 4);
      assert.ok(c.includes('still'));
    }
    assert.equal(r.MORE_KEYS[0], 'faster');
    assert.equal(r.NAME_KEYS[0], 'heat');
    assert.equal(new Set(r.MORE_KEYS).size, 4);
    assert.equal(new Set(r.NAME_KEYS).size, 4);
  });
});

describe('heat: the words', () => {
  const keysOf = (lang) => Object.keys(STRINGS[lang]).sort();
  it('has every key in both languages', () => {
    assert.deepEqual(keysOf('bn'), keysOf('en'));
  });
  it('has a line for each step, a note for each wrong answer and each choice', () => {
    for (let i = 0; i <= r.LAST_STEP; i++) assert.ok(STRINGS.bn[`out_${i}`], `out_${i}`);
    for (const k of [...r.doingChoices('solid'), ...r.MORE_KEYS, ...r.NAME_KEYS]) assert.ok(STRINGS.bn[`c_${k}`], `c_${k}`);
    for (const k of ['solid', 'liquid', 'gas', 'still', 'slower', 'same', 'stop', 'electric', 'light', 'stored'])
      assert.ok(STRINGS.bn[`mis_${k}`], `mis_${k}`);
    for (const k of r.STATES) assert.ok(STRINGS.bn[`why_${k}`] && STRINGS.bn[`res_${k}`] && STRINGS.bn[`lbl_${k}`]);
  });
  it('writes numbers in Bangla digits', () => {
    const t = createI18n('bn');
    assert.equal(t.num(60), '৬০');
    assert.equal(createI18n('en').num(60), '60');
  });
});
