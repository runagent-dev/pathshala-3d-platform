// The maths of the density figure (book page 131, topic 5.2): ρ = m/V in gm/cc and kg/m³, the three balls from the
// book's table, where a floating ball sits in water, the box of particles, and the test's choices. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/density/src/reading.js';
import { STRINGS, createI18n } from '../../assets/density/src/i18n.js';

describe('density: ρ = m/V', () => {
  it('divides the mass by the volume, in gm/cc, and turns it into kg/m³ (× 1000)', () => {
    assert.equal(r.density(25, 100), 0.25);
    assert.equal(r.density(780, 100), 7.8);
    assert.equal(r.density(100, 50), 2);
    assert.equal(r.toKgM3(0.25), 250);
    assert.equal(r.toKgM3(7.8), 7800);
    assert.equal(r.toKgM3(1), 1000);
  });

  it('works out the book’s example: 1 kg of water with 0.25 kg of salt in 1200 cc is 1.04 × 10³ kg/m³', () => {
    assert.equal(r.round(r.toKgM3(r.density(1250, 1200)), 0), 1042);
  });

  it('gives the three balls the book’s densities (table 5.01) at the same volume', () => {
    assert.equal(r.ballDensity('cork'), 0.25);
    const wood = r.ballDensity('wood');
    assert.ok(wood >= 0.4 && wood <= 0.5, 'wood is in the book’s 0.4 – 0.5');
    assert.equal(r.ballDensity('iron'), 7.8);
    assert.ok(r.ballDensity('cork') < wood && wood < r.ballDensity('iron'));
  });

  it('floats what is less dense than water (1.00 gm/cc) and sinks the rest', () => {
    assert.equal(r.floats(r.ballDensity('cork')), true);
    assert.equal(r.floats(r.ballDensity('wood')), true);
    assert.equal(r.floats(r.ballDensity('iron')), false);
  });
});

describe('density: where a ball sits in water', () => {
  const R = r.radiusOf(r.V_BALL);
  it('makes a 100 cc ball about 5.8 cm across', () => {
    assert.ok(Math.abs((4 / 3) * Math.PI * R ** 3 - 100) < 1e-9);
    assert.ok(Math.abs(2 * R - 5.76) < 0.01);
  });

  it('puts under water the fraction ρ/ρ_water of a floating ball (half for 0.5, all for iron)', () => {
    for (const rho of [0.1, 0.25, 0.45, 0.5, 0.9]) {
      const h = r.floatDepth(R, rho);
      const under = r.capVolume(R, h) / ((4 / 3) * Math.PI * R ** 3);
      assert.ok(Math.abs(under - rho) < 1e-6, `ρ ${rho}: ${under}`);
    }
    assert.ok(Math.abs(r.floatDepth(R, 0.5) - R) < 1e-6);
    assert.equal(r.floatDepth(R, 7.8), 2 * R);
    assert.ok(r.floatDepth(R, 0.25) < r.floatDepth(R, 0.45));
  });
});

describe('density: the box of particles', () => {
  it('keeps the mass and halves the volume at each squeeze, so the density doubles', () => {
    let V = r.BOX_START;
    let rho = r.density(r.BOX_MASS, V);
    assert.equal(rho, 0.25);
    while (r.smaller(V)) {
      const next = r.smaller(V);
      assert.equal(next, V / 2);
      assert.equal(r.density(r.BOX_MASS, next), rho * 2);
      V = next;
      rho = r.density(r.BOX_MASS, V);
    }
    assert.equal(V, 50);
    assert.equal(rho, 2);
    assert.equal(r.smaller(50), null);
  });

  it('snaps a volume to the box’s steps', () => {
    assert.equal(r.fixVolume(190), 200);
    assert.equal(r.fixVolume(1000), 400);
    assert.equal(r.fixVolume(1), 50);
    assert.equal(r.fixVolume('x'), r.BOX_START);
  });

  it('scatters 24 particles that never touch, even in the smallest box', () => {
    const pts = r.particleLayout(24, 0.27, 11);
    assert.equal(pts.length, 24);
    const inner = r.boxSide(50) - 2 * 0.36 - 0.12; // as the scene scales them
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(...pts[i].map((x, k) => (x - pts[j][k]) * inner));
        assert.ok(d >= 2 * 0.36, `particles ${i} and ${j} overlap`);
      }
    assert.deepEqual(r.particleLayout(24, 0.27, 11), pts, 'the same every time');
  });
});

describe('density: the test', () => {
  it('builds four different choices for ρ of the box, the right one first', () => {
    for (const V of r.QUIZ_BOX_VOLUMES) {
      const c = r.boxChoices(r.BOX_MASS, V);
      assert.equal(c[0].v, r.density(r.BOX_MASS, V));
      assert.equal(new Set(c.map((x) => x.v)).size, 4);
    }
  });

  it('has exactly one sinker among the four balls, and the heaviest floats', () => {
    const sinkers = r.SINK_SET.filter((b) => !r.floats(r.density(b.m, b.V)));
    assert.equal(sinkers.length, 1);
    assert.equal(sinkers[0].key, 'right');
    const heaviest = r.SINK_SET.reduce((a, b) => (b.m > a.m ? b : a));
    assert.equal(r.floats(r.density(heaviest.m, heaviest.V)), true);
  });

  it('has one sinker among the three same-size balls', () => {
    assert.equal(r.ORDER_SET.filter((x) => !r.floats(x)).length, 1);
  });

  it('halves the density when heating doubles the volume', () => {
    for (const V of r.QUIZ_HEAT_VOLUMES) {
      const c = r.heatChoices(r.BOX_MASS, V);
      assert.equal(c[0].v, r.density(r.BOX_MASS, V) / 2);
      assert.equal(new Set(c.map((x) => x.v)).size, 4);
    }
  });

  it('turns gm/cc into kg/m³ for the unit question', () => {
    for (const u of r.UNIT_SET) {
      const c = r.unitChoices(u.m, u.V);
      assert.equal(c[0].v, r.density(u.m, u.V) * 1000);
      assert.equal(new Set(c.map((x) => x.v)).size, 4);
    }
  });
});

describe('density: strings', () => {
  it('has every Bangla key in English and the other way round', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes numbers in Bangla digits only through t.num, never inside a string', () => {
    for (const [k, v] of Object.entries(STRINGS.bn)) assert.ok(!/[০-৯]/.test(v), `${k} has a Bangla digit`);
    const t = createI18n('bn');
    assert.equal(t.num('7,800'), '৭,৮০০');
    assert.equal(createI18n('en').num('7,800'), '7,800');
  });

  it('groups digits the Bangladeshi way in Bangla and in threes in English', () => {
    assert.equal(r.groupBD(7800), '7,800');
    assert.equal(r.groupBD(100000), '1,00,000');
    assert.equal(r.groupIntl(100000), '100,000');
    assert.equal(r.groupBD(0.25), '0.25');
  });
});
