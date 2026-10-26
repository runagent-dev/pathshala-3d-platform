// The physics of the hanging-weight-pull figure (book pages 81–82, topic 3.7): a hanging mass M pulls a block m over a
// smooth table through a string over a pulley, and the page-82 example with a mass at each end. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/hanging-weight-pull/src/reading.js';
import { STRINGS, createI18n } from '../../assets/hanging-weight-pull/src/i18n.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

describe('hanging weight: one mass pulls a block (a = Mg/(M + m))', () => {
  it("is the book's equations: T = ma on the block and T − Mg = M(−a) on the hanging mass", () => {
    for (const [M, m] of [
      [2, 5],
      [5, 5],
      [5, 10],
      [1, 20],
    ]) {
      const { W, a, T } = r.pull(M, m);
      close(W, M * r.G);
      close(a, (M * r.G) / (M + m));
      close(T, m * a); // the block
      close(T - M * r.G, M * -a); // the hanging mass (up is positive, so its acceleration is −a)
      close(T, (m * M * r.G) / (M + m)); // the book's T
    }
  });

  it('has a tension less than the weight, and an acceleration less than g, always', () => {
    for (const M of [0.5, 1, 2, 5, 10, 100])
      for (const m of [0.5, 1, 2, 5, 10, 100]) {
        const { W, a, T } = r.pull(M, m);
        assert.ok(T < W, `T ${T} < Mg ${W}`);
        assert.ok(a < r.G);
        assert.ok(T > 0);
      }
  });

  it('is shared: equal masses give half of g, and a grows with M and shrinks with m', () => {
    close(r.pull(5, 5).a, r.G / 2);
    assert.ok(r.pull(5, 5).a > r.pull(2, 5).a);
    assert.ok(r.pull(5, 10).a < r.pull(5, 5).a);
    // the numbers on the screen
    close(r.pull(2, 5).a, 19.6 / 7);
    close(r.pull(2, 5).T, 14);
    close(r.pull(5, 5).a, 4.9);
    close(r.pull(5, 5).T, 24.5);
    assert.equal(r.round(r.pull(5, 10).a, 2), 3.27);
    assert.equal(r.round(r.pull(5, 10).T, 2), 32.67);
  });

  it("doubling M makes a grow, but by less than double; doubling m makes it fall, but by less than half (the test's traps)", () => {
    for (const [M, m] of [
      [2, 4],
      [2, 6],
      [3, 6],
    ]) {
      const ratio = r.pull(2 * M, m).a / r.pull(M, m).a;
      assert.ok(ratio > 1 && ratio < 2, `M doubled: ${ratio}`);
    }
    for (const [M, m] of [
      [5, 5],
      [3, 3],
      [4, 3],
    ]) {
      const ratio = r.pull(M, 2 * m).a / r.pull(M, m).a;
      assert.ok(ratio < 1 && ratio > 0.5, `m doubled: ${ratio}`);
    }
  });
});

describe('hanging weight: a mass at each end (page 82)', () => {
  it("is the book's example: 10 kg on the left, 5 kg on the right, a 5 kg block", () => {
    const s = r.twoWeights(10, 5, 5);
    close(s.a, 2.45);
    assert.equal(s.left, true); // towards the heavier mass
    close(s.T2, 73.5);
    close(s.T1, 61.25);
    close(s.W2, 98);
    close(s.W1, 49);
    // the block: T₂ − T₁ = ma; the left mass falls: T₂ − m₂g = m₂(−a); the right one rises: T₁ − m₁g = m₁ a
    close(s.T2 - s.T1, 5 * s.a);
    close(s.T2 - 10 * r.G, 10 * -s.a);
    close(s.T1 - 5 * r.G, 5 * s.a);
    assert.notEqual(s.T2, s.T1); // two strings, two tensions
  });

  it('goes the other way when the right mass is heavier, with the same size of a', () => {
    const l = r.twoWeights(10, 5, 5);
    const rr = r.twoWeights(5, 10, 5);
    assert.equal(rr.left, false);
    close(rr.a, l.a);
    close(rr.T1, l.T2);
    close(rr.T2, l.T1);
  });

  it('does not move when the masses are equal (the tensions are then equal too)', () => {
    const s = r.twoWeights(5, 5, 5);
    close(s.a, 0);
    close(s.T2, s.T1);
    close(s.T1, 5 * r.G);
  });

  it('matches the single-mass law when the right mass is as small as it gets (a block with one weight, plus m₁ = 0)', () => {
    const one = r.pull(5, 5);
    const two = r.twoWeights(5, 0, 5);
    close(two.a, one.a);
    close(two.T2, one.T);
  });
});

describe('hanging weight: the run', () => {
  it('starts from rest and covers the distance in sqrt(2d/a)', () => {
    const a = 4.9;
    const d = 0.34;
    const T = r.runTime(a, d);
    close(T, Math.sqrt((2 * d) / a));
    const mid = r.runAt(a, d, T / 2);
    close(mid.s, d / 4); // s = a t²/2: a quarter of the way after half the time
    close(mid.v, a * (T / 2));
    assert.equal(mid.done, false);
    const end = r.runAt(a, d, T);
    close(end.s, d);
    assert.equal(end.done, true);
    const after = r.runAt(a, d, T + 5);
    close(after.s, d); // it stops where it lands
    close(after.v, a * T);
    close(r.runAt(a, d, 0).s, 0);
  });

  it('takes a few tenths of a second for real, which the screen slows by SLOW', () => {
    for (const id of r.IDS) {
      const sol = r.solve(r.EXPERIMENTS[id]);
      const real = r.runTime(sol.a, r.travel(r.EXPERIMENTS[id]));
      assert.ok(real > 0.2 && real < 1, `${id}: ${real} s`);
      const onScreen = real * r.SLOW;
      assert.ok(onScreen > 1 && onScreen < 4, `${id}: ${onScreen} s on screen`);
    }
  });

  it("has the four experiments the row of words names, in the book's order", () => {
    assert.deepEqual(r.IDS, ['w2', 'w5', 'heavy', 'two']);
    assert.equal(r.EXPERIMENTS.two.m2, 10); // the page-82 masses
    assert.equal(r.EXPERIMENTS.two.m1, 5);
    const a = r.IDS.map((id) => r.solve(r.EXPERIMENTS[id]).a);
    assert.ok(a[1] > a[0], 'M up, a up');
    assert.ok(a[2] < a[1], 'm up, a down');
  });

  it('sizes the bodies from their mass, heavier is bigger', () => {
    assert.ok(r.blockSize(10).w > r.blockSize(5).w && r.blockSize(5).w > r.blockSize(2).w);
    assert.ok(r.weightSize(10).rBottom > r.weightSize(5).rBottom && r.weightSize(5).rBottom > r.weightSize(2).rBottom);
  });

  it('writes numbers without trailing zeros', () => {
    assert.equal(r.plain(14), '14');
    assert.equal(r.plain(2.8), '2.8');
    assert.equal(r.plain(3.2666), '3.27');
    assert.equal(r.plain(61.25), '61.25');
  });
});

describe('hanging weight: the words', () => {
  it('has every Bangla string in English too, with the same {vars} in both', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
    const vars = (s) =>
      [...s.matchAll(/\{(\w+)\}/g)]
        .map((m) => m[1])
        .sort()
        .join();
    for (const key of Object.keys(STRINGS.bn)) assert.equal(vars(STRINGS.bn[key]), vars(STRINGS.en[key]), key);
  });

  it('writes numbers in Bangla digits (and Latin in English), with the units after them', () => {
    const bn = createI18n('bn');
    const en = createI18n('en');
    assert.equal(bn.num('14.5'), '১৪.৫');
    assert.equal(en.num('14.5'), '14.5');
    assert.equal(bn('val_N', { v: 14 }), '১৪ N');
    assert.equal(bn('out_ready', { M: 2, m: 5 }).includes('২ kg'), true);
    assert.equal(bn('lbl_sym', { name: bn('nm_T_sym'), val: bn('val_N', { v: '14' }) }), 'T = ১৪ N');
  });
});
