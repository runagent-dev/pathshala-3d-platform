// The maths of the states-of-matter animation (book page 150, topic 5.6): the ice's regular pattern, the liquid that
// slides, the gas that flies apart, the story's timing, where the lenses and arrows go, and the strings. Pure code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CAPTIONS, PROPS, STEPS, STRINGS, createI18n } from '../../assets/states-of-matter/src/i18n.js';
import { arcArrow, cycleLayout, isTall, placeBeside, singleLayout } from '../../assets/states-of-matter/src/layout.js';
import {
  SPACING,
  WALL,
  atoms,
  createSolid,
  lattice,
  nearest,
  sample,
  simulateGas,
  simulateLiquid,
} from '../../assets/states-of-matter/src/molecules.js';
import {
  ARROWS,
  DURATION,
  GAS_SWAP,
  T,
  cycleShare,
  flame,
  iceLeft,
  lensMode,
  litArrow,
  temperature,
  tether,
  waterLevel,
} from '../../assets/states-of-matter/src/story.js';

const sites = lattice();
const liquid = simulateLiquid({ sites, t0: T.melt, t1: DURATION, tether, temp: temperature });
const gas = simulateGas({ t0: GAS_SWAP - 0.5, t1: DURATION });
const inside = (ms) => ms.every((m) => Math.hypot(m.x, m.y) <= WALL + 0.02);

describe('states-of-matter: the molecules', () => {
  it('packs the solid close in a regular pattern inside the lens', () => {
    assert.ok(sites.length > 35 && sites.length < 60);
    assert.ok(Math.abs(nearest(sites) - SPACING) < 1e-9);
    assert.ok(inside(sites));
    assert.ok(
      sites.every((s) => s.a === sites[0].a),
      'every molecule turned the same way',
    );
  });

  it('lets the solid only vibrate about its places', () => {
    const solid = createSolid(sites);
    for (const t of [T.solid, T.solid + 3.3, 17.9]) {
      const ms = solid(t);
      const far = Math.max(...ms.map((m, i) => Math.hypot(m.x - sites[i].x, m.y - sites[i].y)));
      assert.ok(far < 0.04, `no molecule leaves its place (${far})`);
    }
  });

  it('draws a molecule as one oxygen and two hydrogens at 104.5°', () => {
    const [o, h1, h2] = atoms({ x: 0, y: 0, a: Math.PI / 2 });
    assert.ok(o.r > h1.r && h1.r === h2.r);
    const ang = Math.acos(
      ((h1.x - o.x) * (h2.x - o.x) + (h1.y - o.y) * (h2.y - o.y)) / (Math.hypot(h1.x - o.x, h1.y - o.y) * Math.hypot(h2.x - o.x, h2.y - o.y)),
    );
    assert.ok(Math.abs((ang * 180) / Math.PI - 104.5) < 1e-6);
  });

  it('melts: the liquid starts on the lattice and then slides past, staying close and inside', () => {
    const start = sample(liquid, T.melt);
    assert.ok(start.every((m, i) => Math.hypot(m.x - sites[i].x, m.y - sites[i].y) < 1e-6));
    const later = sample(liquid, T.boil - 1);
    const moved = later.reduce((s, m, i) => s + Math.hypot(m.x - sites[i].x, m.y - sites[i].y), 0) / sites.length;
    assert.ok(moved > SPACING, `molecules wander more than one spacing on average (${moved})`);
    assert.ok(inside(later));
    assert.ok(nearest(later) > 0.12, 'they press but do not pass through each other');
    // close: every molecule has a neighbour within about one and a half spacings
    for (const m of later) {
      const n = Math.min(...later.filter((q) => q !== m).map((q) => Math.hypot(q.x - m.x, q.y - m.y)));
      assert.ok(n < SPACING * 1.6);
    }
  });

  it('is the same every time (seek and video frames need it)', () => {
    const again = simulateLiquid({ sites, t0: T.melt, t1: T.melt + 3, tether, temp: temperature });
    assert.deepEqual(Array.from(again.data), Array.from(liquid.data.slice(0, again.data.length)));
  });

  it('lets the gas fly apart fast without slowing, inside the lens', () => {
    const speed = (t) => {
      const a = sample(gas, t);
      const b = sample(gas, t + 1 / 60);
      return a.reduce((s, m, i) => s + Math.hypot(b[i].x - m.x, b[i].y - m.y) ** 2, 0);
    };
    assert.ok(gas.n <= 12);
    // kinetic energy stays the same (elastic bounces), give or take sampling across a bounce
    const e0 = speed(GAS_SWAP + 1);
    const e1 = speed(DURATION - 2);
    assert.ok(Math.abs(e1 - e0) / e0 < 0.35);
    const ms = sample(gas, T.gas + 2);
    assert.ok(inside(ms));
    const mean = (xs) => xs.reduce((s, m) => s + Math.min(...xs.filter((q) => q !== m).map((q) => Math.hypot(q.x - m.x, q.y - m.y))), 0) / xs.length;
    // in the same lens: under a third as many molecules, and further from their nearest neighbour
    assert.ok(gas.n * 3 < liquid.n);
    assert.ok(mean(ms) > 1.2 * mean(sample(liquid, T.gas + 2)), 'gas molecules are further apart than the liquid’s');
  });
});

describe('states-of-matter: the story', () => {
  it('melts, then boils, in order', () => {
    assert.equal(iceLeft(T.solid), 1);
    assert.equal(iceLeft(T.liquid), 0);
    assert.equal(waterLevel(T.solid), 0);
    assert.ok(waterLevel(T.liquid) > 0.95);
    assert.equal(flame(T.solid), 0);
    assert.ok(flame(T.liquid) > 0.4 && flame(T.liquid) < 0.7);
    assert.ok(flame(T.gas) > 0.99);
    assert.deepEqual([2, T.solid + 1, T.liquid + 1, T.gas + 1].map(lensMode), ['one', 'solid', 'liquid', 'gas']);
    assert.equal(cycleShare(T.cycle - 0.1), 0);
    assert.equal(cycleShare(T.cycleIn + 0.1), 1);
  });

  it('lights the four arrows of the cycle in turn, heat first, all by the end', () => {
    assert.deepEqual(
      ARROWS.map((a) => a.kind),
      ['heat', 'heat', 'cool', 'cool'],
    );
    assert.equal(litArrow(T.cycleIn - 0.1), -1);
    assert.equal(litArrow(T.cycleIn + 0.1), 0);
    assert.equal(litArrow(DURATION), ARROWS.length);
  });

  it('has parts and captions in time order, each with its words in both languages', () => {
    for (const list of [STEPS, CAPTIONS]) for (let i = 1; i < list.length; i++) assert.ok(list[i].at > list[i - 1].at);
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
    for (const s of STEPS) assert.ok(STRINGS.bn[`step_${s.key}`]);
    for (const c of CAPTIONS) assert.ok(STRINGS.bn[c.key]);
  });

  it('says shape and volume as the book does: solid both, liquid volume only, gas neither', () => {
    assert.deepEqual(PROPS, {
      solid: { shape: true, volume: true },
      liquid: { shape: false, volume: true },
      gas: { shape: false, volume: false },
    });
    const t = createI18n('bn');
    assert.equal(t('formula', { o: 1, h: 2 }).includes('১টি অক্সিজেন'), true);
    assert.equal(createI18n('en')('formula', { o: 1, h: 2 }).includes('1 oxygen'), true);
  });
});

describe('states-of-matter: the layout', () => {
  const SIZES = [
    [390, 480],
    [390, 330],
    [544, 390],
    [380, 400],
    [530, 500],
    [1280, 620],
  ];
  it('keeps the big lens on the stage and out of the room left for the stove', () => {
    for (const [W, H] of SIZES) {
      const { lens, region } = singleLayout(W, H);
      assert.ok(lens.cx - lens.r >= 0 && lens.cx + lens.r <= W && lens.cy - lens.r >= 0 && lens.cy + lens.r <= H, `${W}×${H}`);
      assert.ok(region.x1 > region.x0 + 100 && region.y1 > region.y0 + 80, `${W}×${H}: room for the stove`);
      if (isTall(W, H)) assert.ok(region.y0 >= lens.cy + lens.r);
      else assert.ok(region.x1 <= lens.cx - lens.r);
    }
  });

  it('puts the three lenses apart, on the stage, with room for the arrows', () => {
    for (const [W, H] of SIZES) {
      const ls = cycleLayout(W, H);
      for (const l of ls) assert.ok(l.cx - l.r >= 0 && l.cx + l.r <= W && l.cy - l.r >= 0 && l.cy + l.r <= H, `${W}×${H}`);
      for (const [a, b] of [
        [0, 1],
        [1, 2],
      ]) {
        const gap = Math.hypot(ls[b].cx - ls[a].cx, ls[b].cy - ls[a].cy) - ls[a].r - ls[b].r;
        assert.ok(gap > 40, `${W}×${H}: gap ${gap}`);
      }
    }
  });

  it('bends the heat and cool arrows to opposite sides', () => {
    const [a, b] = cycleLayout(544, 390);
    const heat = arcArrow(a, b, 1);
    const cool = arcArrow(b, a, 1);
    assert.ok(heat.c.y * cool.c.y !== 0 && Math.sign(heat.c.y - a.cy) !== Math.sign(cool.c.y - a.cy));
  });

  it('puts a lens’s name where nothing else is', () => {
    const lens = { cx: 100, cy: 100, r: 50 };
    const free = placeBeside(lens, 80, 20, 400, 400);
    assert.ok(free.y0 > lens.cy + lens.r - 4, 'below by default');
    const blocked = placeBeside(lens, 80, 20, 400, 400, { points: [{ x: 100, y: 165 }] });
    assert.ok(blocked.y1 < lens.cy - lens.r + 4, 'above when an arrow runs below');
  });
});
