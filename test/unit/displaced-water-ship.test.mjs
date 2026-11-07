// Displaced water with a model ship (book page 137, topic 5.3.1; page 138, 5.3.2): the hull's waterplane is 100 cm²,
// so the draft is m/(ρA); while the ship hangs, the scale reads its mass less the water it pushes aside, and exactly
// that much runs out of the full tank into the beaker; once it floats it has pushed aside its own mass; every container
// pushes aside exactly 50 g more; lifting the ship lowers the water and the spilled water stays spilled; F = Vρg; the
// test's choices are distinct; every string has both languages. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createI18n, STRINGS } from '../../assets/displaced-water-ship/src/i18n.js';
import * as r from '../../assets/displaced-water-ship/src/reading.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

describe('displaced-water-ship: the hull', () => {
  it('has a waterplane of 100 cm², the shoelace area of its outline', () => {
    near(r.AREA, 100);
    near(r.polygonArea(r.hullOutline(600)), 100, 1e-3);
  });
  it('floats 2 cm deep empty, 0.5 cm deeper per container, at the load line with six', () => {
    near(r.draftFor(r.shipMass(0)), 2);
    for (let n = 1; n <= r.MAX_BOXES; n++) near(r.draftFor(r.shipMass(n)) - r.draftFor(r.shipMass(n - 1)), 0.5);
    near(r.LOAD_LINE, 5);
    assert.ok(r.LOAD_LINE < r.HULL.depth, 'the deck stays above the water');
  });
  it('has its waterplane centre where the bridle and the cargo are centred', () => {
    near(r.CENTRE_X, 0.95);
  });
});

describe('displaced-water-ship: the overflow can', () => {
  it('starts full to the spout, the beaker empty', () => {
    const t = r.startTank();
    near(t.water, r.TANK_AREA * (r.TANK.spout - r.TANK.floor));
    assert.equal(t.spilled, 0);
  });
  it('while lowered: the scale reads the mass less the water pushed aside, and exactly that water spills', () => {
    let s = r.startTank();
    for (let k = 0; k <= 1.0001; k += 0.05) {
      s = r.settle(s, { keelHang: r.keelAt(k), mass: r.SHIP_G });
      near(s.level, r.TANK.spout);
      near(s.spilled, s.sub);
      near(s.reading + s.spilled * r.RHO, r.SHIP_G, 1e-6);
      assert.ok(s.reading >= 0);
    }
    near(s.reading, 0);
    near(s.spilled, r.SHIP_G);
    near(s.draft, 2);
  });
  it('lifting the ship lowers the water; the spilled water stays; lowering again spills nothing more', () => {
    let s = r.startTank();
    s = r.settle(s, { keelHang: r.keelAt(1), mass: r.SHIP_G });
    s = r.settle(s, { keelHang: r.keelAt(0), mass: r.SHIP_G });
    assert.ok(s.level < r.TANK.spout - 0.4, `the level dropped (${s.level})`);
    near(s.level, r.TANK.spout - r.SHIP_G / r.TANK_AREA);
    near(s.spilled, r.SHIP_G);
    near(s.reading, r.SHIP_G);
    s = r.settle(s, { keelHang: r.keelAt(1), mass: r.SHIP_G });
    near(s.level, r.TANK.spout);
    near(s.spilled, r.SHIP_G);
    near(s.reading, 0);
  });
  it('a floating ship pushes aside its own mass of water: each container 50 g more', () => {
    let s = r.settle(r.startTank(), { keelHang: r.keelAt(1), mass: r.SHIP_G });
    for (let n = 0; n <= r.MAX_BOXES; n++) {
      s = r.settle(s, { keelHang: null, mass: r.shipMass(n) });
      assert.equal(s.floating, true);
      assert.equal(s.reading, null);
      near(s.spilled, r.shipMass(n));
      near(s.sub, r.shipMass(n));
      near(s.draft, r.draftFor(r.shipMass(n)));
      near(s.level, r.TANK.spout);
      near(s.sub, r.AREA * s.draft); // V = Ah
    }
    near(s.spilled, 500);
  });
  it('the cord goes slack when held lower than where it floats', () => {
    const s = r.settle(r.startTank(), { keelHang: r.HANG.end - 1, mass: r.SHIP_G });
    assert.equal(s.floating, true);
    assert.equal(s.reading, 0);
    near(s.spilled, r.SHIP_G);
  });
  it('keeps the beaker’s marks 1 cm per 100 cm³ and the keel off the tank floor', () => {
    near(r.BEAKER_AREA, 100);
    near(r.beakerLevel(500), 5);
    assert.ok(r.beakerLevel(500) < r.BEAKER.height - r.BEAKER.base);
    assert.ok(r.TANK.spout - r.LOAD_LINE > r.TANK.floor + 1);
  });
});

describe('displaced-water-ship: F = Vρg and the test', () => {
  it('weighs the water in newtons with g = 9.8', () => {
    near(r.weightN(200), 1.96);
    near(r.weightN(500), 4.9);
  });
  it('gives four different choices with the right one first', () => {
    for (const w of [60, 80, 120, 140]) {
      const c = r.readingChoices(w);
      assert.equal(new Set(c.map((x) => x.v)).size, 4);
      assert.equal(c[0].v, r.SHIP_G - w);
    }
    for (const now of [300, 350]) {
      const c = r.moreChoices(now);
      assert.equal(new Set(c.map((x) => x.v)).size, 4);
      assert.equal(c[0].v, now + r.BOX_G);
    }
    for (const v of [250, 300, 400]) {
      const c = r.forceChoices(v);
      assert.equal(new Set(c.map((x) => x.v)).size, 4);
      near(c[0].v, r.weightN(v), 1e-9);
    }
  });
});

describe('displaced-water-ship: strings', () => {
  it('has every Bangla string in English too, and the other way round', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });
  it('writes numbers with Bangla digits', () => {
    const t = createI18n('bn');
    assert.equal(t('lbl_reading', { x: 200 }), '২০০&nbsp;g');
    assert.ok(t('lead_lower', { r: 0 }).includes('০'));
  });
});
