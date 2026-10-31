// The maths of the pressure figure (book page 129, topic 5.1): P = F/A with A in m², F = PA, the two shoes' areas,
// numbers grouped the Bangladeshi way, and the test's choices. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/pressure/src/reading.js';
import { HEEL_FOOTPRINT, SNEAKER_FOOTPRINT, footprintArea } from '../../assets/pressure/src/shoes.js';
import { STRINGS, createI18n } from '../../assets/pressure/src/i18n.js';

describe('pressure: P = F/A', () => {
  it('turns cm² into m² (1 m² = 10,000 cm²) and divides', () => {
    assert.equal(r.toM2(50), 0.005);
    assert.equal(r.toM2(200), 0.02);
    assert.equal(r.pressure(500, 50), 100000);
    assert.equal(r.pressure(500, 200), 25000);
    assert.equal(r.pressure(100, 200), 5000);
    assert.equal(r.pressure(800, 50), 160000);
  });

  it('gives back the force with F = PA, as the book writes it', () => {
    for (const F of [100, 300, 500, 800]) for (const A of [50, 200]) assert.equal(r.force(r.pressure(F, A), A), F);
  });

  it('makes the heel four times the sneaker for every force (the areas 50 and 200 cm²)', () => {
    assert.equal(r.ratio(), 4);
    for (let F = 100; F <= 800; F += 100) assert.equal(r.pressure(F, r.SHOES.heel.area) / r.pressure(F, r.SHOES.sneaker.area), 4);
  });

  it('halves the pressure when the area doubles and doubles it when the force doubles', () => {
    assert.equal(r.pressure(400, 100), r.pressure(400, 50) / 2);
    assert.equal(r.pressure(800, 50), r.pressure(400, 50) * 2);
  });

  it('keeps the force on the stepper’s grid', () => {
    assert.equal(r.fixForce(450), 500);
    assert.equal(r.fixForce(20), 100);
    assert.equal(r.fixForce(5000), 800);
    assert.equal(r.fixForce('x'), r.F_START);
  });

  it('sinks deeper and draws longer arrows for more pressure, in proportion', () => {
    assert.ok(Math.abs(r.sinkDepth(160000) - 0.055) < 1e-12);
    assert.ok(Math.abs(r.sinkDepth(100000) / r.sinkDepth(25000) - 4) < 1e-9);
    assert.ok(Math.abs(r.arrowLength(100000) - 0.1) < 1e-12);
    assert.equal(r.sinkDepth(-5), 0);
  });

  it('draws footprints with the areas the panel uses', () => {
    assert.ok(Math.abs(footprintArea(HEEL_FOOTPRINT) - r.SHOES.heel.area) < 1.5, `heel ${footprintArea(HEEL_FOOTPRINT)}`);
    assert.ok(Math.abs(footprintArea(SNEAKER_FOOTPRINT) - r.SHOES.sneaker.area) < 3, `sneaker ${footprintArea(SNEAKER_FOOTPRINT)}`);
  });
});

describe('pressure: numbers on the screen', () => {
  it('groups digits the Bangladeshi way', () => {
    assert.equal(r.groupBD(100000), '1,00,000');
    assert.equal(r.groupBD(160000), '1,60,000');
    assert.equal(r.groupBD(25000), '25,000');
    assert.equal(r.groupBD(5000), '5,000');
    assert.equal(r.groupBD(750000), '7,50,000');
    assert.equal(r.groupBD(3000000), '30,00,000');
    assert.equal(r.groupBD(500), '500');
    assert.equal(r.groupBD(0.005), '0.005');
    assert.equal(r.groupIntl(100000), '100,000');
    assert.equal(r.groupIntl(3000000), '3,000,000');
  });

  it('shows Bangla digits through t.num', () => {
    const t = createI18n('bn');
    assert.equal(t.num(r.groupBD(100000)), '১,০০,০০০');
    assert.match(t('sum', { F: t.num(500), A: t.num(0.005), P: t.num('1,00,000') }), /৫০০.*০\.০০৫.*১,০০,০০০/);
  });
});

describe('pressure: the test', () => {
  it('has four different choices with the right one first, for every force and pressure it asks about', () => {
    for (const F of r.QUIZ_FORCES) {
      const c = r.heelChoices(F);
      assert.equal(c[0].v, r.pressure(F, 50));
      assert.equal(new Set(c.map((x) => x.v)).size, 4);
    }
    for (const P of r.QUIZ_PRESSURES) {
      const c = r.forceChoices(P);
      assert.equal(c[0].v, r.force(P, 200));
      assert.equal(new Set(c.map((x) => x.v)).size, 4);
      assert.equal(r.fixForce(c[0].v), c[0].v, 'the force is on the stepper’s grid');
    }
  });
});

describe('pressure: strings', () => {
  it('has every key in both languages and no Bangla digits typed in', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
    for (const [k, v] of Object.entries(STRINGS.bn)) assert.doesNotMatch(v, /[০-৯]/, k);
  });
});
