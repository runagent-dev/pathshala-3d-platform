// The optics of convex-lens-image: the image of each of the book's cases, the three ray rules meeting exactly at X′, the bundles of
// চিত্র ৯.২১ and ৯.২২, the lens's shape and what falls on the screen.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  beamOf,
  CASES,
  F0,
  focalHeight,
  formulaError,
  imageOf,
  LENS,
  lands,
  missOf,
  onScreen,
  PENCIL,
  parallelBundle,
  pointBundle,
  R_FACE,
  SWAP,
  rayOf,
  THICK,
  threeRays,
  twoRays,
  U,
  zoneOf,
} from '../../assets/convex-lens-image/src/reading.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} is not ${b}`);
const positions = () => {
  const out = [];
  for (let u = U.min; u <= U.max; u += U.step) out.push(u);
  return out;
};

test('the lens: f = 15 cm from glass of n = 1.52 with two equal faces', () => {
  near(1 / F0, (LENS.n - 1) * (2 / R_FACE));
  assert.ok(THICK > 3 && THICK < 4.5, `a real lens about 4 cm thick at the middle, not ${THICK}`);
  assert.ok(LENS.half > PENCIL, 'the parallel ray from the pencil’s tip lands on the glass');
});

test("the book's four cases (pp 261–264)", () => {
  const [inside, between, two, far] = CASES.map((u) => imageOf(u));
  // inside F: on the object's side, virtual, upright, bigger
  assert.equal(inside.kind, 'virtual');
  near(inside.v, -22.5);
  near(inside.m, 2.5);
  assert.notEqual(Math.abs(inside.v), 2 * F0, 'the virtual image does not sit on 2F');
  assert.ok(inside.tip > 0);
  // between F and 2F: beyond 2F, real, inverted, bigger
  assert.equal(zoneOf(CASES[1]), 'between');
  assert.equal(between.kind, 'real');
  near(between.v, 45);
  assert.ok(between.v > 2 * F0 && between.m > 1 && between.tip < 0);
  // at 2F: at 2F′, real, inverted, the same size
  assert.equal(zoneOf(CASES[2]), 'two');
  near(two.v, 30);
  near(two.m, 1);
  // beyond 2F: between F′ and 2F′, real, inverted, smaller
  assert.equal(zoneOf(CASES[3]), 'far');
  assert.ok(far.v > F0 && far.v < 2 * F0 && far.m < 1 && far.tip < 0);
  // at F: no image (infinitely far, infinitely large)
  assert.equal(imageOf(F0).kind, 'none');
  assert.equal(zoneOf(F0), 'focus');
});

test('the formula holds and the image moves as the book says', () => {
  for (const u of positions()) {
    const img = imageOf(u);
    if (img.kind === 'none') continue;
    near(formulaError(u, img.v), 0, 1e-12);
  }
  // nearer the lens (inside F) the image shrinks; nearer F it grows (p261)
  assert.ok(imageOf(5).m < imageOf(10).m && imageOf(10).m < imageOf(14).m);
  // farther away (beyond 2F) the image comes toward F′ and shrinks (p264)
  assert.ok(imageOf(60).v < imageOf(45).v && imageOf(60).m < imageOf(45).m);
  assert.ok(imageOf(1e6).v - F0 < 1e-3);
});

test('object and image change places (the উদাহরণ, p264)', () => {
  near(imageOf(SWAP.a).v, SWAP.b);
  near(imageOf(SWAP.b).v, SWAP.a);
  for (const u of [22.5, 30, 40, 45, 60]) {
    const { v } = imageOf(u);
    near(imageOf(v).v, u, 1e-9);
  }
});

test("every ray drawn obeys the book's rule and passes exactly through X′", () => {
  for (const u of positions()) {
    const rays = threeRays(u).filter(Boolean);
    assert.ok(rays.length >= 2, `two rays at least at u = ${u}`);
    for (const r of rays) {
      assert.ok(lands(r.hit.y), `${r.name} lands on the glass at u = ${u}`);
      if (u !== F0) near(missOf(r, u), 0, 1e-9);
    }
    const [par, cen] = twoRays(u);
    // rule (ii): parallel in, through F′ out
    near(par.start.y, par.hit.y);
    near(par.hit.y + (par.dir.y / par.dir.x) * (F0 - par.hit.x), 0, 1e-9);
    // rule (i): toward O, straight on
    near(cen.dir.y / cen.dir.x, (cen.hit.y - cen.start.y) / (cen.hit.x - cen.start.x), 1e-12);
  }
  // rule (iii): through F, then parallel; drawn only where it meets the glass
  const f = rayOf('focal', 30);
  near(f.hit.y, -PENCIL);
  near(f.dir.y, 0);
  assert.equal(rayOf('focal', 10), null);
  assert.equal(rayOf('focal', 22.5), null);
  near(focalHeight(45), -3);
});

test('a virtual image: the rays spread and their backward lines meet at X′', () => {
  for (const r of twoRays(10)) {
    assert.ok(r.back);
    near(r.back.x, -30);
    near(r.back.y, 18);
  }
  // the light spreads after the lens: the rim rays go apart
  const [a, b] = beamOf(10);
  assert.ok(a.dir.y / a.dir.x > b.dir.y / b.dir.x, 'the top rim ray leaves steeper upward than the bottom one');
});

test('চিত্র ৯.২১ and ৯.২২: parallel rays meet at F′; rays from F leave parallel', () => {
  for (const r of parallelBundle()) near(r.hit.y + (r.dir.y / r.dir.x) * (F0 - r.hit.x), 0, 1e-9);
  for (const r of pointBundle()) {
    near(r.start.x, -F0);
    near(r.end.y, r.hit.y);
  }
});

test('the screen: sharp only at the image, blurred elsewhere, nothing sharp for a virtual image', () => {
  const v = imageOf(30).v;
  assert.ok(onScreen(v, 30).sharp);
  near(onScreen(v, 30).blur, 0);
  assert.ok(!onScreen(v + 5, 30).sharp && onScreen(v + 5, 30).blur > 1);
  assert.ok(onScreen(v + 10, 30).gain < onScreen(v + 2, 30).gain);
  for (const s of [10, 20, 30, 60]) assert.ok(!onScreen(s, 10).sharp);
});
