// The physics of the electromagnetic-force figure (book page 68, topic 3.2.2): the charged comb that lifts bits
// of paper against the Earth's pull and the book's 10^36. Pure code, no browser.
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
