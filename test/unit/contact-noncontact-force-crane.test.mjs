// The maths of the contact-noncontact-force-crane figure (book p67, topic 3.1.2): which kind of force the page's example is, its
// motion (real speeds), the telling moment the figure holds at, and the test's answer keys (one right answer, the
// others the usual mistakes) with their strings in both languages.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STRINGS } from '../../assets/contact-noncontact-force-crane/src/i18n.js';
import * as f from '../../assets/contact-noncontact-force-crane/src/motion.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

describe('force: crane', () => {
  it('is a contact force', () => {
    assert.equal(f.EXAMPLE, 'crane');
    assert.equal(f.KIND.crane, 'contact');
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
  it('a move from rest to rest covers its distance and ends at rest', () => {
    const m = f.trapezoid({ dist: 1.3, vmax: 0.5, accel: 1 });
    close(m.T, 1.3 / 0.5 + 0.5);
    assert.deepEqual(m.at(m.T + 1), { s: 1.3, v: 0 });
    close(m.at(m.T / 2).v, 0.5);
    let last = 0;
    for (let t = 0; t <= m.T; t += 0.01) {
      const p = m.at(t);
      assert.ok(p.s >= last - 1e-12 && p.v <= 0.5 + 1e-12);
      last = p.s;
    }
    const short = f.trapezoid({ dist: 0.1, vmax: 1, accel: 1 }); // never reaches 1 m/s
    assert.ok(short.vmax < 1);
    close(short.at(short.T).s, 0.1);
  });
  it('the crane lifts the block 1.3 m at up to 0.5 m/s and keeps holding it (the pull still acts)', () => {
    const end = f.actionAt('crane', f.DURATION.crane);
    close(end.pos, 1.3);
    assert.equal(end.speed, 0);
    assert.ok(end.acting && end.touching);
    assert.equal(f.craneAt(0).acting, false);
  });
});

describe('force: crane, the test', () => {
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
