// Electric potential (book pages 287–289, topics 10.6 and 10.6.1): V = kq/r with the book's k, W = q₀V, V = W/q₀, the two
// spheres joined by a wire (1,800 V and 300 V → 1,050 V each) and earthed (0 V), the test's choices and the strings.
// Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createI18n, STRINGS } from '../../assets/electric-potential/src/i18n.js';
import * as r from '../../assets/electric-potential/src/reading.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≉ ${b}`);

describe('electric-potential: the maths', () => {
  it("uses the book's k: V = kq/r gives round volts for q = 10 nC", () => {
    assert.equal(r.K, 9e9);
    near(r.potentialAt(10), 900);
    near(r.potentialAt(15), 600);
    near(r.potentialAt(20), 450);
    near(r.potentialAt(30), 300);
  });

  it('twice as far, half the potential; inside the sphere it stays at the surface value', () => {
    near(r.potentialAt(20) / r.potentialAt(10), 0.5);
    near(r.potentialAt(5), 1800);
    near(r.potentialAt(2), 1800);
  });

  it('the work is q₀V, and dividing it by q₀ gives V at every point of the rail', () => {
    for (let cm = r.R_MIN; cm <= r.R_MAX; cm++) {
      near(r.workTo(cm), r.Q0_NC * r.potentialAt(cm));
      near(r.perUnit(r.workTo(cm)), r.potentialAt(cm));
    }
    near(r.workTo(10), 1800);
  });

  it('the repulsion grows as 1/r²: four times at half the distance', () => {
    near(r.forceAt(10) / r.forceAt(20), 4);
    near(r.forceAt(10), (9e9 * 10e-9 * 2e-9) / 0.01);
  });

  it('the wire: A 1,800 V and B 300 V before, electrons from B to A, 1,050 V each after', () => {
    const before = r.chargesAt(0);
    near(before.va, 1800);
    near(before.vb, 300);
    const after = r.chargesAt(r.Q_NC / 2);
    near(after.qa, 5);
    near(after.qb, 5);
    near(after.va, 1050);
    near(after.vb, 1050);
    const middle = r.chargesAt(2);
    assert.ok(middle.va > middle.vb && middle.va < before.va && middle.vb > before.vb);
  });

  it('earthing takes both to 0 V and never past it', () => {
    const e = r.chargesAt(r.Q_NC, r.Q_NC);
    near(e.qa, 0);
    near(e.qb, 0);
    near(e.va, 0);
    near(e.vb, 0);
  });

  it('rounds r to whole centimetres inside the rail, and groups numbers', () => {
    assert.equal(r.clampR(3), r.R_MIN);
    assert.equal(r.clampR(99), r.R_MAX);
    assert.equal(r.clampR(14.6), 15);
    assert.equal(r.group(1800), '1,800');
    assert.equal(r.group(900), '900');
    assert.equal(r.isWhole(900), true);
    assert.equal(r.isWhole(90 / 0.13), false);
  });
});

describe('electric-potential: the test', () => {
  it('every numeric question has four different choices with the right one first', () => {
    /** @type {[string, number[]][]} */
    const asked = [
      ['read', [15, 20, 30]],
      ['closer', [20, 30]],
      ['double', [10, 20, 30]],
      ['earth', [30]],
    ];
    for (const [kind, list] of asked)
      for (const cm of list) {
        const c = r.choicesFor(kind, cm);
        assert.equal(c.length, 4, kind);
        assert.equal(new Set(c.map((x) => x.v)).size, 4, `${kind} at ${cm}: ${c.map((x) => x.v)}`);
        assert.equal(c[0].key, 'right');
      }
  });

  it('the right answers are V = W/q₀, twice V at half the distance, the same V, 0 V', () => {
    assert.equal(r.choicesFor('read', 20)[0].v, 450);
    assert.equal(r.choicesFor('closer', 20)[0].v, 900);
    assert.equal(r.choicesFor('double', 30)[0].v, 300);
    assert.equal(r.choicesFor('earth', 30)[0].v, 0);
  });
});

describe('electric-potential: the strings', () => {
  it('has the same keys in both languages', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes numbers in Bangla digits and keeps the book’s terms', () => {
    const t = createI18n('bn');
    assert.equal(t.num(1050), '১০৫০');
    assert.match(t('rule_potential', { one: 1 }), /তড়িৎ বিভব/);
    assert.match(t('rule_join'), /বিভব পার্থক্যের/);
    assert.match(t('rule_earth'), /শূন্য বিভব/);
    assert.match(t('rule_potential', { one: 1 }), /^অসীম থেকে প্রতি একক টেস্ট চার্জ/);
  });

  it('never says electrons run from high to low like water: they go toward the higher potential', () => {
    const t = createI18n('bn');
    assert.doesNotMatch(t('rule_join'), /উঁচু থেকে নিচে/);
    assert.match(t('rule_join'), /ঋণাত্মক ইলেকট্রন যায় উঁচু বিভবের দিকে/);
    assert.match(t('doing_join'), /নিচু বিভব B থেকে উঁচু বিভব A/);
    assert.doesNotMatch(STRINGS.en.rule_join, /high to low/);
  });

  it('has a step name, an action and a rule for every step', () => {
    for (const id of r.STEPS) {
      assert.ok(STRINGS.bn[`ex_${id}`], id);
      assert.ok(STRINGS.bn[`rule_${id}`], id);
      assert.ok(STRINGS.bn[`lead_${id}`], id);
    }
  });
});
