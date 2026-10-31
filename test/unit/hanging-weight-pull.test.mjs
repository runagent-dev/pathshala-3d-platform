// The physics of the hanging-weight-pull figure (book pages 81–83, topic 3.7): a bucket on a rope over a well's pulley
// (T − Mg = Ma, up positive), and the book's examples: a hanging mass pulling a body on a smooth table (চিত্র ৩.০৯) and a
// mass at each end (চিত্র ৩.১০). Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/hanging-weight-pull/src/reading.js';
import { STRINGS, createI18n } from '../../assets/hanging-weight-pull/src/i18n.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

describe('the well: the bucket on the rope (T − Mg = Ma, up positive)', () => {
  it("is Newton's second law for the bucket: the sum of the forces on the left, mass × acceleration on the right", () => {
    for (const [T, M] of [
      [98, 10],
      [130, 10],
      [70, 10],
      [130, 12],
      [0, 5],
      [200, 3],
    ]) {
      const s = r.lift(T, M);
      close(s.W, M * r.G);
      close(s.net, T - M * r.G);
      close(s.T - s.W, s.M * s.a);
    }
  });

  it('is still when the pull equals the weight, goes up when it is more, down when it is less', () => {
    close(r.lift(98, 10).a, 0);
    close(r.holdPull(10), 98);
    assert.ok(r.lift(130, 10).a > 0);
    assert.ok(r.lift(70, 10).a < 0);
    // no pull at all: it falls freely, a = −g
    close(r.lift(0, 7).a, -r.G);
  });

  it("has the row of words' numbers: 0, +3.2, −2.8 and +1.03 ms⁻²", () => {
    const a = Object.fromEntries(r.IDS.map((id) => [id, r.round(r.lift(r.EXPERIMENTS[id].T, r.EXPERIMENTS[id].M).a, 2)]));
    assert.deepEqual(r.IDS, ['hold', 'pull', 'ease', 'full']);
    assert.deepEqual(a, { hold: 0, pull: 3.2, ease: -2.8, full: 1.03 });
    // the same pull with more water: less acceleration
    assert.ok(a.full < a.pull);
    assert.equal(r.EXPERIMENTS.full.T, r.EXPERIMENTS.pull.T);
  });

  it('snaps the steppers to their steps and limits', () => {
    assert.deepEqual(r.fixLift({ T: 131, M: 10.4 }), { T: 132, M: 10 });
    assert.deepEqual(r.fixLift({ T: -5, M: 99 }), { T: 0, M: 15 });
    assert.deepEqual(r.fixLift({ T: 'x', M: undefined }), { T: 130, M: 10 });
    for (const id of r.IDS) assert.deepEqual(r.fixLift(r.EXPERIMENTS[id]), r.EXPERIMENTS[id], id);
  });

  it('writes the acceleration with its sign: +3.2, −2.8 (U+2212), 0', () => {
    assert.equal(r.signed(3.2), '+3.2');
    assert.equal(r.signed(-2.8), '−2.8');
    assert.equal(r.signed(0), '0');
    assert.equal(r.signed(1e-12), '0');
  });
});

describe('the well: the run', () => {
  it('starts from rest half way down and moves s = ½at², v = at', () => {
    const a = 3.2;
    const w = r.bucketAt(a, 0.5);
    close(w.s, 0.5 * a * 0.25);
    close(w.v, a * 0.5);
    close(w.y, r.SHAFT.start + w.s);
    assert.equal(w.done, false);
    assert.deepEqual(r.bucketAt(a, 0), { y: r.SHAFT.start, v: 0, s: 0, done: false, end: null });
  });

  it('stops at the top going up and at the water going down', () => {
    const up = r.bucketAt(3.2, 10);
    close(up.y, r.SHAFT.top);
    assert.equal(up.end, 'top');
    const down = r.bucketAt(-2.8, 10);
    close(down.y, r.SHAFT.bottom);
    assert.equal(down.end, 'water');
    // it reaches the end exactly at runSeconds
    close(r.bucketAt(3.2, r.runSeconds(3.2)).y, r.SHAFT.top, 1e-9);
    close(r.bucketAt(-2.8, r.runSeconds(-2.8)).y, r.SHAFT.bottom, 1e-9);
  });

  it('stays where it is held when a = 0, for HOLD_SECONDS on the screen', () => {
    const w = r.bucketAt(0, 5);
    close(w.y, r.SHAFT.start);
    close(w.v, 0);
    close(r.runSeconds(0) * r.SLOW, r.HOLD_SECONDS);
  });

  it('lasts about a second for real in the experiments, a few seconds on the screen', () => {
    for (const id of ['pull', 'ease', 'full']) {
      const { T, M } = r.EXPERIMENTS[id];
      const s = r.runSeconds(r.lift(T, M).a) * r.SLOW;
      assert.ok(s > 1.4 && s < 6, `${id}: ${s} s on the screen`);
    }
    // the shaft: the start between the water and the top
    assert.ok(r.SHAFT.bottom < r.SHAFT.start && r.SHAFT.start < r.SHAFT.top);
  });
});

describe("the book's examples: one mass pulls a body on the table (চিত্র ৩.০৯, a = Mg/(M + m))", () => {
  it("is the book's equations: T = ma on the body and T − Mg = M(−a) on the hanging mass", () => {
    for (const [M, m] of [
      [2, 5],
      [5, 5],
      [5, 10],
      [1, 20],
    ]) {
      const { W, a, T } = r.pull(M, m);
      close(W, M * r.G);
      close(a, (M * r.G) / (M + m));
      close(T, m * a);
      close(T - M * r.G, M * -a);
    }
  });

  it('has a tension less than the weight, and an acceleration less than g, always', () => {
    for (const M of [0.5, 1, 2, 5, 10, 100])
      for (const m of [0.5, 1, 2, 5, 10, 100]) {
        const { W, a, T } = r.pull(M, m);
        assert.ok(T < W && a < r.G && T > 0);
      }
  });

  it('gives the window its starting numbers: M = 2 kg, m = 5 kg, a = 2.8 ms⁻², T = 14 N', () => {
    const { M, m } = r.BOOK.single;
    close(r.pull(M, m).a, 2.8);
    close(r.pull(M, m).T, 14);
  });
});

describe("the book's examples: a mass at each end (চিত্র ৩.১০, a = 5g/(m + 15))", () => {
  it("is the book's three equations, and a = 5g/(m + 15) for any body m", () => {
    for (const m of [1, 5, 10, 20]) {
      const s = r.twoWeights(10, 5, m);
      close(s.a, (5 * r.G) / (m + 15));
      assert.equal(s.left, true); // m₂ (10 kg, left) goes down
      close(s.T1 - 5 * r.G, 5 * s.a); // m₁ rises
      close(s.T1 - s.T2, m * -s.a); // the body goes left
      close(s.T2 - 10 * r.G, 10 * -s.a); // m₂ falls
      close(s.T1 - s.T2, 15 * s.a - 5 * r.G); // the book's T₁ − T₂ = 15a − 5g
    }
    close(r.twoWeights(10, 5, 5).a, 2.45);
  });

  it('does not move when the masses are equal, and mirrors when the heavier one is on the right', () => {
    close(r.twoWeights(5, 5, 5).a, 0);
    const l = r.twoWeights(10, 5, 5);
    const rr = r.twoWeights(5, 10, 5);
    assert.equal(rr.left, false);
    close(rr.a, l.a);
  });

  it('runs from rest and covers the distance in sqrt(2d/a)', () => {
    const a = 2.45;
    const d = r.TRAVEL.two;
    close(r.runTime(a, d), Math.sqrt((2 * d) / a));
    assert.equal(r.runAt(a, d, 10).done, true);
    close(r.runAt(a, d, 10).s, d);
  });
});

describe('the words', () => {
  it('has every Bangla string in English too, with the same {vars} in both', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
    const vars = (s) =>
      [...s.matchAll(/\{(\w+)\}/g)]
        .map((m) => m[1])
        .sort()
        .join();
    for (const key of Object.keys(STRINGS.bn)) assert.equal(vars(STRINGS.bn[key]), vars(STRINGS.en[key]), key);
  });

  it('writes numbers in Bangla digits (and Latin in English), the unit ms⁻² staying Latin', () => {
    const bn = createI18n('bn');
    const en = createI18n('en');
    assert.equal(bn('lbl_T', { v: '130' }), 'T = ১৩০ N');
    assert.equal(en('lbl_T', { v: '130' }), 'T = 130 N');
    const a = bn('lbl_a', { v: r.signed(-2.8) });
    assert.equal(a, 'a = −২.৮ ms<sup>−2</sup>');
    assert.ok(bn('why_calc', { a: '3.2', T: 130, M: 10, g: 9.8, W: 98 }).includes('ms<sup>−2</sup>'));
  });

  it('has no Bangla digit typed into a string (numbers come in as {vars})', () => {
    for (const [key, text] of Object.entries(STRINGS.bn)) assert.ok(!/[০-৯]/.test(text), `bn.${key}: ${text}`);
  });

  it('puts a no-break space between every number and its unit', () => {
    for (const lang of ['bn', 'en'])
      for (const [key, text] of Object.entries(STRINGS[lang]))
        assert.ok(!/(\}|[0-9০-৯]) (kg\b|N\b|\{u_N\}|\{u_n\}|\{u_a\}|\{u_v\}|m\/s)/.test(text), `${lang}.${key}: ${text}`);
  });

  it("uses the book's words: টান বল, একটি সুতায় একটি মাত্র টান বল, উপরের দিক ধনাত্মক, নিউটনের দ্বিতীয় গতিসূত্র", () => {
    const all = Object.values(STRINGS.bn).join(' ');
    for (const w of ['টান বল', 'একটি সুতায় একটি মাত্র টান বল', 'উপরের দিক ধনাত্মক', 'নিউটনের দ্বিতীয় গতিসূত্র', 'কপিকল']) assert.ok(all.includes(w), w);
  });
});

describe('the test (every set of four choices reads differently, the right one first)', () => {
  const distinct = (list) => new Set(list.map((x) => String(x.v))).size === list.length;

  it('has four different choices for every (T, M) of "how big is a?"', () => {
    for (const [T, M] of r.CALC_SETS) {
      const c = r.calcChoices(T, M);
      assert.ok(distinct(c), `${T}, ${M}: ${c.map((x) => x.v)}`);
      assert.equal(c[0].key, 'right');
      close(c[0].v, r.round(r.lift(T, M).a, 2));
      assert.ok(c[0].v > 0, 'the bucket goes up in this question');
    }
  });

  it('has four different choices for "held still: how big is T?"', () => {
    for (const M of r.HOLD_MASSES) {
      const c = r.holdChoices(M);
      assert.ok(distinct(c));
      close(c[0].v, M * r.G, 1e-6);
    }
  });

  it('has T < Mg in every "which way?" set', () => {
    for (const [T, M] of r.EASE_SETS) assert.ok(r.lift(T, M).a < 0, `${T}, ${M}`);
  });

  it('has four different choices for "the same pull, more water", the new a smaller but still up', () => {
    for (const [T, M, extra] of r.FULL_SETS) {
      const c = r.fullChoices(T, M, extra);
      assert.ok(distinct(c), `${T}, ${M}, ${extra}: ${c.map((x) => x.v)}`);
      assert.ok(c[0].v > 0 && c[0].v < r.lift(T, M).a);
    }
  });
});
