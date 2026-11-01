// The maths of the buoyancy figure (book page 137, topic 5.3.1): P = hρg, F = Ahρg, V = Ah, the draft for a load, the
// steel cylinder of the same mass, numbers grouped the Bangladeshi way, and the test's choices. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/buoyancy-ship/src/reading.js';
import { STRINGS, createI18n } from '../../assets/buoyancy-ship/src/i18n.js';

describe('buoyancy-ship: the hull', () => {
  it('has a waterplane area of 200 m², the same as its outline', () => {
    assert.equal(r.AREA, 200);
    // the parabola drawn with straight pieces is a hair smaller than the exact area
    const drawn = r.polygonArea(r.hullOutline(64));
    assert.ok(Math.abs(drawn - 200) < 0.05, `outline area ${drawn}`);
  });

  it('runs from the stern at +14 m to the bow at −14 m, 8 m wide', () => {
    const pts = r.hullOutline(16);
    const xs = pts.map((p) => p[0]);
    const zs = pts.map((p) => p[1]);
    assert.equal(Math.max(...xs), 14);
    assert.equal(Math.min(...xs), -14);
    assert.equal(Math.max(...zs), 4);
    assert.equal(Math.min(...zs), -4);
  });
});

describe('buoyancy-ship: P = hρg and F = Ahρg', () => {
  it('gives the pressure at a depth with ρ = 1000 kg m⁻³ and g = 9.8 m s⁻²', () => {
    assert.equal(r.pressureAt(1.5), 14700);
    assert.equal(r.pressureAt(2.5), 24500);
    assert.equal(r.pressureAt(0), 0);
    assert.equal(r.pressureAt(1.7), 16660);
  });

  it('makes the force on the bottom the weight of the water pushed aside', () => {
    for (const h of [1.5, 1.8, 2.5]) {
      assert.equal(r.buoyancy(h), r.round(r.pressureAt(h) * r.AREA, 6));
      assert.equal(r.buoyancy(h), r.round(r.displaced(h) * r.RHO * r.G, 6));
    }
    assert.equal(r.buoyancy(1.3), 2548000);
    assert.equal(r.displaced(1.3), 260);
  });

  it('follows the book: F₂ − F₁ = A(h₂ − h₁)ρg depends only on the height, not on how deep', () => {
    assert.equal(r.netUp(2, 1, 3), r.netUp(2, 5, 7));
    assert.equal(r.netUp(2, 1, 3), r.round(2 * 2 * 1000 * 9.8, 6));
    assert.equal(r.netUp(r.AREA, 0, 1.5), r.buoyancy(1.5));
  });
});

describe('buoyancy-ship: the load', () => {
  it('floats 1.3 m deep empty and 0.1 m deeper for each 20 t container', () => {
    assert.equal(r.draft(0), 1.3);
    assert.equal(r.draft(1), 1.4);
    assert.equal(r.draft(4), 1.7);
    assert.equal(r.draft(12), 2.5);
    assert.equal(r.LOAD_LINE, 2.5);
  });

  it('keeps the load to 0 … 12 containers', () => {
    assert.equal(r.fixLoad(-3), 0);
    assert.equal(r.fixLoad(15), 12);
    assert.equal(r.fixLoad('4'), 4);
    assert.equal(r.fixLoad(undefined), 0);
  });

  it('balances its weight with the buoyancy at its draft, for every load', () => {
    for (let n = 0; n <= 12; n++) assert.equal(r.weight(r.shipMass(n)), r.buoyancy(r.draft(n)));
    assert.equal(r.weight(r.shipMass(0)), 2548000);
    assert.equal(r.weight(r.shipMass(12)), 4900000);
  });

  it('has an average density below the water’s even when full', () => {
    assert.ok(r.shipDensity(12) < r.RHO);
    assert.equal(r.shipDensity(0), 325);
  });
});

describe('buoyancy-ship: the steel cylinder of the same mass', () => {
  it('weighs as much as the empty ship but pushes aside only about 33 m³', () => {
    assert.equal(r.steelWeight(), r.weight(r.shipMass(0)));
    assert.ok(Math.abs(r.STEEL.V - 33.121) < 0.001);
    assert.ok(Math.abs(Math.PI * r.STEEL.r ** 2 * r.STEEL.h - r.STEEL.V) < 1e-4);
  });

  it('gets a seventh of its weight as buoyancy, so it sinks', () => {
    assert.ok(r.steelBuoyancy() < r.steelWeight());
    assert.ok(Math.abs(r.steelWeight() / r.steelBuoyancy() - 7.85) < 1e-6);
  });
});

describe('buoyancy-ship: numbers and choices', () => {
  it('groups digits the Bangladeshi way and in threes', () => {
    assert.equal(r.groupBD(2548000), '25,48,000');
    assert.equal(r.groupBD(14700), '14,700');
    assert.equal(r.groupBD(300), '300');
    assert.equal(r.groupIntl(2940000), '2,940,000');
  });

  it('builds four different choices for each question, the right one first', () => {
    for (const n of r.QUIZ_LOADS) {
      const h = r.draft(n);
      const p = r.pressureChoices(h);
      assert.equal(p[0].v, r.pressureAt(h));
      assert.equal(new Set(p.map((c) => c.v)).size, 4);
      const d = r.displacedChoices(r.displaced(h));
      assert.equal(d[0].v, r.buoyancy(h));
      assert.equal(new Set(d.map((c) => c.v)).size, 4);
    }
  });

  it('has every string in both languages, Bangla digits through t.num', () => {
    const bn = Object.keys(STRINGS.bn);
    const en = Object.keys(STRINGS.en);
    assert.deepEqual(
      bn.filter((k) => !en.includes(k)),
      [],
    );
    assert.deepEqual(
      en.filter((k) => !bn.includes(k)),
      [],
    );
    const t = createI18n('bn');
    assert.equal(t.num('29,40,000'), '২৯,৪০,০০০');
    assert.equal(createI18n('en').num(1.5), '1.5');
  });
});
