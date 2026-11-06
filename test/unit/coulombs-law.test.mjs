// Coulomb's law (book pages 279–281, topic 10.4): the book's k, its sign rule, both worked examples (−9 × 10¹¹ N; the
// third charge at x = 0.43 m from +9 C, from 7x² + 18x − 9 = 0), the a × 10ⁿ form, the test's choices and the strings.
// Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createI18n, STRINGS } from '../../assets/coulombs-law/src/i18n.js';
import * as r from '../../assets/coulombs-law/src/reading.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≉ ${b}`);

describe('coulombs-law: the maths', () => {
  it("uses the book's k and its example (a): +1 C and −1 C 10 cm apart give −9 × 10¹¹ N", () => {
    assert.equal(r.K, 9e9);
    near(r.coulomb(r.EX_A.q1, r.EX_A.q2, r.EX_A.r), -9e11);
    assert.deepEqual(r.sci(r.coulomb(1, -1, 0.1)), { m: -9, e: 11, neg: true });
  });

  it("follows the book's sign rule: like charges positive (repel), unlike negative (attract)", () => {
    assert.ok(r.coulomb(1, 1, 0.2) > 0);
    assert.ok(r.coulomb(-1, -1, 0.2) > 0);
    assert.ok(r.coulomb(1, -1, 0.2) < 0);
    assert.equal(r.kindOf(2, 1), 'repel');
    assert.equal(r.kindOf(-2, 1), 'attract');
    assert.equal(r.kindOf(0, 1), 'none');
  });

  it('falls as 1/r²: twice as far, a quarter; and grows with each charge', () => {
    near(r.coulomb(1, 1, 0.2) / r.coulomb(1, 1, 0.1), 0.25);
    near(r.coulomb(1, 1, 0.3) / r.coulomb(1, 1, 0.1), 1 / 9);
    near(r.coulomb(3, 1, 0.2) / r.coulomb(1, 1, 0.2), 3);
    near(r.coulomb(2, 2, 0.2) / r.coulomb(1, 1, 0.2), 4);
  });

  it("solves the book's example (b): 9(1 − x)² = 16x² → 7x² + 18x − 9 = 0 → x = 0.43 (or −3)", () => {
    const [a, b] = r.bookRoots();
    near(a, -3);
    near(b, 3 / 7);
    near(r.balanceX(), 3 / 7);
    assert.equal(r.round(r.balanceX(), 2), 0.43);
    const f = r.forcesOnQ(r.balanceX());
    near(f.f1, f.f2, 1e-12);
    near(f.net, 0, 1e-6);
    // nearer +9 C the push to the right wins; nearer +16 C the push to the left
    assert.ok(r.forcesOnQ(0.3).net > 0);
    assert.ok(r.forcesOnQ(0.6).net < 0);
    // the place does not depend on the third charge
    near(r.forcesOnQ(r.balanceX(), { q: 5 }).net / 5, 0, 1e-6);
  });

  it('writes numbers in the a × 10ⁿ form, rounded, without trailing zeros', () => {
    assert.deepEqual(r.sci(2.25e11), { m: 2.25, e: 11, neg: false });
    assert.deepEqual(r.sci(9.216e-12), { m: 9.22, e: -12, neg: false });
    assert.deepEqual(r.sci(9.996e11), { m: 1, e: 12, neg: false });
    assert.deepEqual(r.sci(0), { m: 0, e: 0, neg: false });
    assert.deepEqual(r.sci(-4.5e11), { m: -4.5, e: 11, neg: true });
  });

  it('rounds axis tops to 1, 2, 2.5, 5 or 10 times a power of ten', () => {
    assert.equal(r.niceCeil(9), 10);
    assert.equal(r.niceCeil(18), 20);
    assert.equal(r.niceCeil(36), 50);
    assert.equal(r.niceCeil(2.2), 2.5);
    assert.equal(r.niceCeil(0), 1);
  });

  it("builds the test's choices from real mistakes, all different, the right one first", () => {
    const F = 8e11;
    const far = r.choicesFor('far', F);
    assert.deepEqual(
      far.map((c) => c.key),
      ['right', 'half', 'same', 'double'],
    );
    near(far[0].v, 2e11);
    const charge = r.choicesFor('charge', F);
    near(charge[0].v, 2.4e12);
    near(charge.find((c) => c.key === 'nine').v, 7.2e12);
    const point = r.choicesFor('point');
    assert.equal(point[0].v, 0.6);
    for (const list of [far, charge, point]) assert.equal(new Set(list.map((c) => c.v)).size, 4);
  });
});

describe('coulombs-law: the strings', () => {
  it('has every key in both languages', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes every digit in Bangla on a Bangla page and keeps the units in Latin letters', () => {
    const t = createI18n('bn');
    assert.equal(t('lbl_r', { r: 10 }), 'r = ১০ cm');
    assert.match(t('rule_found'), /০\.৪৩ m/);
    assert.doesNotMatch(t('rule_found'), /[0-9]/);
    const latin = createI18n('bn', { numerals: 'latin' });
    assert.match(latin('rule_found'), /0\.43 m/);
  });

  it("uses the book's words", () => {
    const t = createI18n('bn');
    assert.match(t('rule_attract'), /বিপরীত চার্জ একে অন্যকে <b>আকর্ষণ<\/b> করে/);
    assert.match(t('rule_repel'), /এক ধরনের চার্জ একে অন্যকে <b>বিকর্ষণ<\/b> করে/);
    assert.match(t('rule_law', { q1q2: 'q₁q₂', k: 'k' }), /কুলম্বের সূত্র/);
    assert.match(t('intro'), /বিদ্যুৎ অপরিবাহী স্ট্যান্ডে/);
  });
});
