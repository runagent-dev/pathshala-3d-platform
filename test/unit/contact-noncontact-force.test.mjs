// The maths of the contact-noncontact-force figure (book p67, topic 3.1.2): which kind of force the page's example is, its
// motion (real speeds), the telling moment the figure holds at, and the test's answer keys (one right answer, the
// others the usual mistakes) with their strings in both languages.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STRINGS } from '../../assets/contact-noncontact-force/src/i18n.js';
import * as f from '../../assets/contact-noncontact-force/src/motion.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

describe('force: push', () => {
  it('is a contact force', () => {
    assert.equal(f.EXAMPLE, 'push');
    assert.equal(f.KIND.push, 'contact');
  });
  it('does what the definition says: starts a body at rest, or changes a moving body’s velocity', () => {
    const start = f.actionAt(f.EXAMPLE, 0);
    const later = f.actionAt(f.EXAMPLE, f.KEY[f.EXAMPLE]);
    if (f.EFFECT[f.EXAMPLE] === 'change') assert.ok(start.speed > 0 && later.speed < start.speed);
    else {
      assert.equal(start.speed, 0);
      assert.ok(later.speed > 0);
    }
  });
  it('at the telling moment the force acts, touching', () => {
    const m = f.actionAt(f.EXAMPLE, f.KEY[f.EXAMPLE]);
    assert.ok(m.acting);
    assert.ok(m.touching);
    assert.equal(m.gap, null);
    assert.ok(f.KEY[f.EXAMPLE] > 0 && f.KEY[f.EXAMPLE] < f.DURATION[f.EXAMPLE]);
    assert.equal(f.moved(f.EXAMPLE, m), true);
  });
  it('ends at rest', () => {
    assert.equal(f.actionAt(f.EXAMPLE, f.DURATION[f.EXAMPLE]).speed, 0);
  });
  it('rounds without binary leftovers, and writes a gap in cm', () => {
    assert.equal(f.roundTo(0.1 + 0.2, 0.1), 0.3);
    assert.equal(f.gapCm(0.599), 60);
    assert.equal(f.gapCm(0.0233), 2.3);
    assert.equal(f.gapCm(-0.001), 0);
  });
  it('the push touches only while it pushes; the trolley rolls on after the hands let go', () => {
    const during = f.pushAt(f.KEY.push);
    assert.ok(during.touching && during.acting);
    close(during.speed, 0.5);
    const after = f.pushAt(f.PUSH.lean + 0.9 + 0.3);
    assert.ok(!after.touching && !after.acting && after.speed > 0);
    assert.ok(after.pos > after.person);
    const end = f.actionAt('push', 99);
    assert.equal(end.speed, 0);
  });
});

describe('force: push, the test', () => {
  it('each "which kind?" question has four different answers, the right one first, two of each kind', () => {
    const kindWord = { contact: 'স্পর্শ বল:', noncontact: 'অস্পর্শ বল:' };
    for (const [set, keys] of Object.entries(f.KIND_CHOICES)) {
      assert.equal(new Set(keys).size, 4);
      assert.ok(keys[0].endsWith('_ok'), `${set}: the right answer first`);
      assert.ok(STRINGS.bn[keys[0]].startsWith(kindWord[f.CHOICE_KIND[set]]), `${set}: the right answer names its kind`);
      const starts = keys.map((k) => STRINGS.bn[k].split(':')[0]);
      assert.equal(starts.filter((x) => x === 'স্পর্শ বল').length, 2, `${set}: two contact answers`);
      assert.equal(starts.filter((x) => x === 'অস্পর্শ বল').length, 2, `${set}: two non-contact answers`);
      for (const k of keys) {
        assert.ok(STRINGS.bn[k] && STRINGS.en[k], `${k} in both languages`);
        assert.ok(STRINGS.bn[`miss_${k}`] || k === keys[0], `a worked answer for the mistake ${k}`);
      }
      assert.ok(STRINGS.bn[`q_${set}`] && STRINGS.bn[`why_${set}`] && STRINGS.en[`why_${set}`], `${set}: question and worked answer`);
    }
    for (const [id, kind] of Object.entries(f.CASES)) assert.equal(f.CHOICE_KIND[id], kind);
  });
  it('a test has 3 to 5 different questions, each with its answers', () => {
    assert.ok(f.QUESTIONS.length >= 3 && f.QUESTIONS.length <= 5);
    assert.equal(new Set(f.QUESTIONS.map((q) => q.set ?? q.kind)).size, f.QUESTIONS.length);
    for (const q of f.QUESTIONS) if (q.kind !== 'effect') assert.ok(f.KIND_CHOICES[q.set], q.set);
  });
  it('"what is the force doing?" agrees with the motion at that moment, and every wrong answer has its note', () => {
    const a = f.actionAt(f.EXAMPLE, f.KEY[f.EXAMPLE]).speed;
    const b = f.actionAt(f.EXAMPLE, f.KEY[f.EXAMPLE] + 0.05).speed;
    assert.equal(f.EFFECT_RIGHT, b > a ? 'eff_faster' : 'eff_slower');
    assert.equal(new Set(f.EFFECT_CHOICES).size, 4);
    assert.ok(f.EFFECT_CHOICES.includes(f.EFFECT_RIGHT));
    for (const k of f.EFFECT_CHOICES.filter((x) => x !== f.EFFECT_RIGHT)) assert.ok(STRINGS.bn[`miss_${k}`] && STRINGS.en[`miss_${k}`], k);
    assert.ok(f.EFFECT_SHOW > f.KEY[f.EXAMPLE] && f.EFFECT_SHOW <= f.DURATION[f.EXAMPLE]);
  });
  it('every string has its Bangla and English, with the same placeholders', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
    for (const [k, bn] of Object.entries(STRINGS.bn)) {
      const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      assert.deepEqual(vars(bn), vars(STRINGS.en[k]), `${k}: the same placeholders`);
      assert.ok(!/[0-9]/.test(bn.replace(/<[^>]+>/g, '')), `${k}: no Latin digits in Bangla (numbers go through t.num)`);
    }
  });
  it('shuffles without losing or repeating anything', () => {
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    assert.deepEqual([...f.shuffle(['a', 'b', 'c', 'd'], random)].sort(), ['a', 'b', 'c', 'd']);
  });
});
