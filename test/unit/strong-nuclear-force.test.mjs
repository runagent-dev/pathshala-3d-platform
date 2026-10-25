// The maths of the strong-nuclear-force figure (book p69, topic 3.2.4): the strong pull is about 100 times the
// electric push near the nucleus but gone past 10⁻¹⁵ m (1 fm); the electric push follows Coulomb's law; the
// nuclei are round clusters of touching balls. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as m from '../../assets/strong-nuclear-force/src/reading.js';

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} is not ${b} ± ${tol}`);
const grid = Array.from({ length: Math.round(m.MAX_PULL / m.STEP) + 1 }, (_, i) => m.roundTo(i * m.STEP, m.STEP));

describe('the electric push of the other protons', () => {
  it('is Coulomb’s law: k·e² in N·fm² and 1/r²', () => {
    near(m.KE2, 8.988e9 * 1.602e-19 ** 2 * 1e30, 0.1, 'k·e²');
    const r1 = m.R_EFFECTIVE + 1;
    const r2 = m.R_EFFECTIVE + 2;
    near(m.electricForce(1) / m.electricForce(2), (r2 * r2) / (r1 * r1), 1e-9, 'inverse square');
  });
  it('is about 200 N near the nucleus and gets weaker farther out, but never stops', () => {
    near(m.electricForce(0), 200, 5, 'at the nucleus');
    for (let i = 1; i < grid.length; i++) assert.ok(m.electricForce(grid[i]) < m.electricForce(grid[i - 1]));
    assert.ok(m.electricForce(50) > 0);
  });
});

describe('the strong nuclear force', () => {
  it('pulls about a hundred times harder than the electric push near the nucleus (the book: একশ গুণ)', () => {
    const peak = Math.max(...grid.map((d) => m.strongForce(d) / m.electricForce(d)));
    assert.ok(peak > 80 && peak < 200, `peak ratio ${peak}`);
    near(m.strongForce(0.5) / m.electricForce(0), m.BOOK_RATIO, 1, 'at its strongest');
  });
  it('acts out to 10⁻¹⁵ m and not beyond', () => {
    for (const d of grid) {
      if (d <= m.RANGE) assert.ok(m.strongForce(d) > 0, `acts at ${d} fm`);
      else assert.equal(m.strongForce(d), 0, `gone at ${d} fm`);
    }
    assert.equal(m.strongForce(1.06), 0);
  });
  it('grows as the proton is pulled out, then falls away (a short, very stiff spring that snaps)', () => {
    assert.ok(m.strongForce(0.1) < m.strongForce(0.3));
    assert.ok(m.strongForce(0.3) < m.strongForce(0.5));
    assert.ok(m.strongForce(0.7) > m.strongForce(0.9));
    assert.ok(m.strongForce(0.9) > m.strongForce(1.0));
  });
});

describe('letting the proton go', () => {
  it('within 10⁻¹⁵ m it snaps back; farther out it is pushed away', () => {
    for (const d of grid) assert.equal(m.verdict(d), d <= m.RANGE ? 'back' : 'away', `at ${d} fm`);
    assert.equal(m.forcesAt(0.6).verdict, 'back');
    assert.equal(m.forcesAt(1.1).verdict, 'away');
    assert.equal(m.forcesAt(1.04).d, 1); // read to 0.1 fm: the reading and the verdict agree
    assert.equal(m.forcesAt(1.06).verdict, 'away');
  });
  it('flies off faster and faster, pushed by a weakening force', () => {
    let s = { d: 1.1, v: 0 };
    let last = 0;
    for (let i = 0; i < 60; i++) {
      s = m.flightStep(s.d, s.v, 1 / 60);
      assert.ok(s.v > last);
      last = s.v;
    }
    assert.ok(s.d > 3 && s.d < 8, `after 1 s: ${s.d} fm`);
  });
});

describe('the arrows and the readout', () => {
  it('a bigger force draws a longer arrow, on a compressed scale', () => {
    assert.ok(m.arrowLength(20000) > m.arrowLength(200));
    assert.ok(m.arrowLength(200) > m.arrowLength(50));
    assert.ok(m.arrowLength(20000) / m.arrowLength(200) < 100);
    assert.equal(m.arrowLength(0), 0);
  });
  it('the orange arrow shrinks as the pull fades, but stays longer than the blue one while the pull wins', () => {
    assert.ok(m.strongArrowLength(0.6) > m.strongArrowLength(0.8));
    assert.ok(m.strongArrowLength(0.8) > m.strongArrowLength(1));
    for (const d of grid) if (d > 0 && d <= m.RANGE) assert.ok(m.strongArrowLength(d) > m.electricArrowLength(d), `at ${d} fm`);
    assert.equal(m.strongArrowLength(1.1), 0);
    assert.ok(Math.max(...grid.map((d) => m.strongArrowLength(d))) <= 2.35, 'never longer than the nucleus is wide');
  });
  it('writes distances to 0.1 × 10⁻¹⁵ m', () => {
    assert.equal(m.fmt(0.64), '0.6');
    assert.equal(m.fmt(1), '1.0');
    assert.equal(m.fmt(2.449), '2.4');
  });
});

describe('nuclei as clusters of balls', () => {
  it('packs balls into a round cluster with almost no overlap, the same every time', () => {
    const a = m.packCluster(12, { seed: 5 });
    assert.deepEqual(a, m.packCluster(12, { seed: 5 }));
    for (let i = 0; i < a.length; i++)
      for (let j = i + 1; j < a.length; j++) {
        const d = Math.hypot(a[i][0] - a[j][0], a[i][1] - a[j][1], a[i][2] - a[j][2]);
        assert.ok(d > 2 * m.R_NUCLEON * 0.86, `balls ${i} and ${j} overlap: ${d}`);
      }
    const R = m.clusterRadius(a);
    assert.ok(R > 2 && R < 3.2, `carbon-sized: ${R} fm`);
  });
  it('chooses the protons: the right number, spread through the cluster', () => {
    const p = m.chooseProtons(92, 36);
    assert.equal(p.filter(Boolean).length, 36);
    assert.equal(p.length, 92);
  });
});
