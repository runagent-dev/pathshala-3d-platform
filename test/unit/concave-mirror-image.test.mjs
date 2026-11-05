// The optics of concave-mirror-image: the book's formula, its table, the rays that land on the mirror, and how far they are from the law.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  beamOf,
  CASES,
  F0,
  formulaError,
  hitMirror,
  imageOf,
  lands,
  lawError,
  MIRROR,
  normalAtPoint,
  onScreen,
  PENCIL,
  R0,
  rayOf,
  reflect,
  sag,
  secondRay,
  twoRays,
  U,
  zoneOf,
} from '../../assets/concave-mirror-image/src/reading.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} is not ${b}`);
const positions = () => {
  const out = [];
  for (let u = U.min; u <= U.max; u += U.step) out.push(u);
  return out;
};

test('the book’s cases: 1/u + 1/v = 1/f and m = l′/l', () => {
  near(imageOf(40).v, 24);
  near(imageOf(40).m, 0.6);
  near(imageOf(30).v, 30);
  near(imageOf(30).m, 1);
  near(imageOf(22.5).v, 45);
  near(imageOf(22.5).m, 2);
  near(imageOf(10).v, -30);
  near(imageOf(10).m, 3);
  assert.equal(imageOf(10).kind, 'virtual');
  assert.equal(imageOf(15).kind, 'none');
  for (const u of positions()) if (u !== F0) near(formulaError(u, imageOf(u).v), 0, 1e-12);
});

test('the book’s table: every row', () => {
  for (const u of [60, 40, 31]) {
    const i = imageOf(u);
    assert.equal(zoneOf(u), 'far');
    assert.ok(i.kind === 'real' && i.v > F0 && i.v < R0 && i.m < 1 && i.tip < 0);
  }
  assert.equal(zoneOf(30), 'o');
  for (const u of [29, 22.5, 16]) {
    const i = imageOf(u);
    assert.equal(zoneOf(u), 'between');
    assert.ok(i.kind === 'real' && i.v > R0 && i.m > 1 && i.tip < 0);
  }
  assert.equal(zoneOf(15), 'focus');
  for (const u of [14, 10, 4]) {
    const i = imageOf(u);
    assert.equal(zoneOf(u), 'inside');
    assert.ok(i.kind === 'virtual' && i.v < 0 && i.m > 1 && i.tip > 0);
  }
  // the nearer F, the bigger and the farther
  assert.ok(imageOf(16).v > imageOf(20).v && imageOf(16).m > imageOf(20).m);
  assert.ok(imageOf(14).behind > imageOf(10).behind && imageOf(14).m > imageOf(10).m);
});

test('the mirror is the exact sphere', () => {
  const p = hitMirror({ x: 40, y: 6 }, { x: -1, y: 0 });
  near(p.y, 6);
  near(p.x, sag(R0, 6));
  near(Math.hypot(p.x - R0, p.y), R0);
  const n = normalAtPoint(p);
  // a ray along a radius comes straight back
  const o = reflect({ x: -n.x, y: -n.y }, n);
  near(o.x, n.x);
  near(o.y, n.y);
});

test('every drawn ray lands on the silver, and there are always two', () => {
  for (const u of positions()) {
    const rays = twoRays(u);
    assert.equal(rays.length, 2);
    for (const r of rays) {
      assert.ok(r, `no ray at u = ${u}`);
      assert.ok(lands(r.hit) && Math.abs(r.hit.y) <= MIRROR.half, `off the mirror at u = ${u}`);
    }
    assert.equal(rays[0].name, 'parallel');
  }
});

test('the rays are the book’s for the case: through F outside, along the radius inside, P where neither lands', () => {
  assert.equal(secondRay(40), 'focus');
  assert.equal(secondRay(30), 'focus');
  assert.equal(secondRay(22.5), 'pole');
  assert.equal(secondRay(15), 'pole');
  assert.equal(secondRay(10), 'radial');
});

test('real: both rays pass exactly through X′. Virtual: both come straight from it', () => {
  for (const u of positions()) {
    if (u === F0) continue;
    const img = imageOf(u);
    for (const r of twoRays(u)) {
      if (img.kind === 'real') {
        const dx = img.v - r.hit.x;
        const dy = img.tip - r.hit.y;
        near(Math.abs(dx * r.dir.y - dy * r.dir.x) / Math.hypot(dx, dy), 0, 1e-9);
      } else {
        const dx = r.hit.x + img.behind;
        const dy = r.hit.y - img.tip;
        near(Math.abs(dx * r.dir.y - dy * r.dir.x) / Math.hypot(dx, dy), 0, 1e-9);
        assert.ok(r.dir.x > 0, 'it goes away from the mirror');
      }
    }
  }
});

test('the parallel ray goes through F, and leaves X almost level', () => {
  for (const u of positions()) {
    const r = rayOf('parallel', u);
    const crossing = r.hit.x - (r.hit.y / r.dir.y) * r.dir.x;
    near(crossing, F0, 1e-9);
    near(r.hit.y, PENCIL, 0.3); // lands within 3 mm of the level of X
  }
});

test('at F the rays leave parallel: they can never meet', () => {
  const [a, b] = twoRays(15);
  near(a.dir.x, b.dir.x, 1e-9);
  near(a.dir.y, b.dir.y, 1e-9);
  const [c, d] = beamOf(15);
  near(c.dir.y, d.dir.y, 1e-9);
});

test('how far the book’s drawn rays are from the bare law of reflection', () => {
  // the numbers of NOTES.md: within 2° in the book's cases, and the pole and radius rays exact
  for (const u of CASES) for (const r of twoRays(u)) assert.ok(lawError(r) <= 2, `${r.name} at ${u}: ${lawError(r)}°`);
  for (const r of twoRays(22.5)) assert.ok(lawError(r) < 1);
  assert.ok(Math.max(...positions().flatMap((u) => twoRays(u).map((r) => lawError(r)))) < 4.2);
  near(lawError(rayOf('pole', 22.5)), 0);
  near(lawError(rayOf('radial', 10)), 0, 1e-9);
});

test('a screen: sharp only at the image, a blur elsewhere, nothing for a virtual image', () => {
  assert.equal(onScreen(24, 40).sharp, true);
  near(onScreen(24, 40).blur, 0);
  near(onScreen(24, 40).length, 3.6);
  assert.equal(onScreen(24.5, 40).sharp, false); // half a centimetre off is already a blur on so strong a mirror
  assert.equal(onScreen(32, 40).sharp, false);
  assert.ok(onScreen(32, 40).blur > onScreen(26, 40).blur);
  assert.ok(onScreen(32, 40).gain < onScreen(25, 40).gain);
  assert.equal(onScreen(24, 10).sharp, false);
  assert.equal(onScreen(24, 15).sharp, false);
});
