// The maths of the floating-or-sinking figure (book page 138, topic 5.3.2): weight and buoyancy, the book's উদাহরণ
// V₁/V = ρ/ρw, where each body comes to rest in the tank, the submarine's ballast, the test's choices and the strings.
// Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/float-or-sink/src/reading.js';
import { STRINGS, createI18n } from '../../assets/float-or-sink/src/i18n.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

describe('float-or-sink: weight and buoyancy', () => {
  it('weighs the three 10 cm cubes and the water a whole one pushes aside (g = 9.8)', () => {
    assert.equal(r.VOLUME, 0.001);
    assert.equal(r.buoyancy(r.VOLUME), 9.8);
    assert.equal(r.weight(r.CASES.wood.rho), 4.9);
    assert.equal(r.weight(r.CASES.brick.rho), 19.6);
    assert.equal(r.weight(r.CASES.tin.rho), 9.8);
  });

  it('tells what each density does in water', () => {
    assert.equal(r.fate(500), 'floats');
    assert.equal(r.fate(2000), 'sinks');
    assert.equal(r.fate(1000), 'stays');
    assert.equal(r.fate(999), 'floats');
  });

  it('works the book’s উদাহরণ: wood of 0.5 × 10³ kg/m³ floats 50% under (V₁/V = ρ/ρw)', () => {
    assert.equal(r.MATERIALS.wood.rho, 500);
    assert.equal(r.fractionUnder(500), 0.5);
    assert.equal(r.percentUnder(500), 50);
    assert.equal(r.percentUnder(900), 90);
    assert.equal(r.percentUnder(240), 24);
    assert.equal(r.percentUnder(920), 92);
    assert.equal(r.percentUnder(2000), 100, 'a body denser than water is wholly under');
    assert.equal(r.rhoK(500), 0.5);
  });
});

describe('float-or-sink: the bodies come to rest where the book says', () => {
  it('floats a dropped block sunk just so far that B = W (Vρ = V₁ρw)', () => {
    for (const id of ['cork', 'wood', 'ice']) {
      const rho = r.MATERIALS[id].rho;
      const b = r.createBody({ m: rho * r.VOLUME, y: 0.465 });
      const t = r.settle(b);
      assert.ok(t < 15, `${id} settles (${t} s)`);
      const f = r.forces(b);
      near(f.B, f.W, 1e-6);
      near(r.depthUnder(b) / b.h, rho / r.RHO_W, 1e-6);
      assert.equal(f.N, 0);
    }
  });

  it('sinks the brick to the floor, where the floor holds up W − B (it seems lighter under water)', () => {
    const b = r.createBody({ m: 2000 * r.VOLUME, y: 0.465 });
    r.settle(b);
    assert.equal(b.y, 0);
    const f = r.forces(b);
    assert.equal(f.W, 19.6);
    assert.equal(f.B, 9.8);
    near(f.N, 9.8);
  });

  it('keeps a body as heavy as its water wherever it is let go under water', () => {
    for (const y of [0.05, r.TIN_DEPTH, 0.25]) {
      const b = r.createBody({ m: 1, y });
      r.settle(b);
      near(b.y, y, 1e-9);
      const f = r.forces(b);
      near(f.W, f.B);
    }
  });

  it('brings a floating body pushed deep back up to the same waterline', () => {
    const b = r.createBody({ m: 0.5, y: 0.05 });
    r.settle(b);
    near(b.y, r.SURFACE - 0.05, 1e-9);
  });

  it('runs the submarine: empty it floats, full it sinks, half full it stays at its depth', () => {
    const sub = r.createBody({ h: r.SUB.height, A: r.SUB.volume / r.SUB.height, m: r.SUB.hull, y: 0.3, k: 12, c: 8 });
    r.settle(sub);
    near(r.forces(sub).W, 7.84);
    near(r.forces(sub).B, 7.84, 1e-6);
    assert.ok(sub.y > r.SURFACE - r.SUB.height, 'part of it is above the water');
    sub.m = r.SUB.hull + r.BALLAST.sink;
    r.settle(sub);
    assert.equal(sub.y, 0);
    near(r.forces(sub).W, 11.76);
    sub.m = r.SUB.hull + r.BALLAST.hover;
    sub.y = 0.15;
    sub.v = 0;
    r.settle(sub);
    near(sub.y, 0.15, 1e-9);
    near(r.subWeight(r.BALLAST.hover), r.buoyancy(r.SUB.volume));
  });
});

describe('float-or-sink: the test’s choices', () => {
  const distinct = (list) => new Set(list.map((c) => c.v)).size === list.length;

  it('per cent under water: the answer and three real mistakes, all different', () => {
    for (const rho of r.QUIZ_RHO) {
      const c = r.percentChoices(rho);
      assert.equal(c[0].v, r.percentUnder(rho));
      assert.ok(distinct(c), `ρ = ${rho}`);
    }
    assert.deepEqual(
      r.percentChoices(900).map((c) => c.v),
      [90, 10, 100, 0.9],
    );
  });

  it('density from the waterline: ρ = (V₁/V)·ρw, all choices different', () => {
    for (const cm of r.QUIZ_UNDER_CM) {
      const c = r.densityChoices(cm / 10);
      assert.equal(c[0].v, cm / 10);
      assert.ok(distinct(c), `${cm} cm`);
    }
  });

  it('how heavy a stone seems under water: W − B, never equal to a wrong choice', () => {
    for (const rho of r.QUIZ_STONES) {
      const c = r.apparentChoices(r.weight(rho), r.buoyancy(r.VOLUME));
      near(c[0].v, r.weight(rho) - 9.8, 1e-9);
      assert.ok(distinct(c.map((x) => ({ v: x.v.toFixed(1) }))), `ρ = ${rho}`);
    }
  });

  it('the three tins: one lighter, one as heavy, one heavier than 9.8 N', () => {
    for (const w of r.QUIZ_TINS.light) assert.equal(r.fate((w / 9.8) * 1000), 'floats');
    assert.equal(r.fate((r.QUIZ_TINS.equal[0] / 9.8) * 1000), 'stays');
    for (const w of r.QUIZ_TINS.heavy) assert.equal(r.fate((w / 9.8) * 1000), 'sinks');
  });
});

describe('float-or-sink: strings', () => {
  it('has every Bangla key in English and back, with the same {vars}', () => {
    const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
    for (const k of Object.keys(STRINGS.bn)) assert.deepEqual(vars(STRINGS.bn[k]), vars(STRINGS.en[k]), k);
  });

  it('uses the book’s words and writes numbers with Bangla digits', () => {
    const t = createI18n('bn');
    assert.match(t('rule_start'), /প্লবতা/);
    assert.match(t('rule_start'), /অপসারিত পানি/);
    assert.match(t('rule_example'), /V<sub>1<\/sub>\/V = ρ\/ρ<sub>w<\/sub>/);
    assert.equal(t('lbl_W', { v: '4.9' }), 'ওজন ৪.৯&nbsp;N');
    assert.equal(t('out_block_floats', { rho: '0.5 × 10<sup>3</sup>', w: '10<sup>3</sup>', p: 50 }).includes('৫০%'), true);
    for (const s of Object.values(STRINGS.bn)) assert.doesNotMatch(s, /[০-৯]/, 'digits come in as {vars}');
  });
});
