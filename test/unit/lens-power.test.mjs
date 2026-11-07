// The optics of lens-power: each lens's traced focus lies exactly f from its centre (P = ±1/f with f in metres: the book's glasses,
// 0.4 m, have +2.5 ডায়াপটার); a more curved lens has the shorter f; the ray box's beams meet near F′ (convex) or spread as if from F
// (concave); the pencil's two rays pass through X′; at the same distance the lens with the shorter f shows the pencil bigger (চিত্র
// ৯.২৭); the test's wrong answers are real mistakes and differ from the right one.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  beamsOf,
  focusFrom,
  focusX,
  formulaError,
  imageOf,
  LENSES,
  lensOf,
  metres,
  missOf,
  PENCIL_U,
  pencilRays,
  powerChoices,
  powerOf,
  signed,
  signedF,
  focalChoices,
  curve,
  thickness,
} from '../../assets/lens-power/src/reading.js';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

test('each lens is ground so that its traced focus is f from its centre', () => {
  for (const [id, L] of Object.entries(LENSES)) {
    const x = focusFrom(lensOf(id));
    assert.ok(near(x, L.kind === 'convex' ? L.f : -L.f, 1e-3), `${id}: ${x}`);
    assert.equal(focusX(id), L.kind === 'convex' ? L.f : -L.f);
  }
});

test('P = 1/f with f in metres: the book’s glasses (0.4 m) are +2.5; convex +, concave −', () => {
  assert.equal(powerOf('plus40'), 2.5);
  assert.equal(metres(40), 0.4);
  assert.equal(powerOf('plus20'), 5);
  assert.equal(powerOf('plus10'), 10);
  assert.equal(powerOf('minus40'), -2.5);
  assert.equal(powerOf('minus20'), -5);
  assert.equal(powerOf('plus25'), 4);
  assert.equal(powerOf('minus25'), -4);
  assert.equal(signed(2.5), '+2.5');
  assert.equal(signed(-5), '−5');
});

test('a stronger lens is more curved: smaller face radius; a convex lens is thick in the middle, a concave one at the edge', () => {
  const R = (id) => 1 / Math.abs(lensOf(id).c1);
  assert.ok(R('plus10') < R('plus20') && R('plus20') < R('plus40'));
  assert.ok(R('minus20') < R('minus40'));
  assert.ok(thickness('plus20').middle > thickness('plus40').middle);
  assert.ok(thickness('minus20').edge > thickness('minus40').edge);
  for (const id of ['plus40', 'plus20', 'plus10']) assert.ok(thickness(id).middle > thickness(id).edge);
  for (const id of ['minus40', 'minus20']) assert.ok(thickness(id).middle < thickness(id).edge);
});

test('the beams of the ray box: through a convex lens they cross the axis near F′; through a concave one they seem to come from near F', () => {
  for (const id of ['plus40', 'plus20', 'plus10', 'plus25']) {
    const beams = beamsOf(id, -30, 60);
    assert.equal(beams.length, 5);
    for (const b of beams) {
      if (b.h === 0) continue;
      // the outer beams cross a little nearer than F′ (spherical aberration), never more than 10 % of f
      assert.ok(b.cross > 0 && b.cross <= LENSES[id].f + 1e-6 && b.cross > LENSES[id].f * 0.9, `${id} ${b.h}: ${b.cross}`);
    }
  }
  for (const id of ['minus40', 'minus20', 'minus25']) {
    for (const b of beamsOf(id, -56, 30)) {
      if (b.h === 0) continue;
      assert.ok(b.cross < 0 && b.cross > -LENSES[id].f * 1.0001 && b.cross < -LENSES[id].f * 0.9, `${id} ${b.h}: ${b.cross}`);
      assert.ok(b.dir.y * b.h > 0, 'it spreads away from the axis');
      assert.deepEqual(b.back, { x: b.cross, y: 0 });
    }
  }
});

test('চিত্র ৯.২৭: at the same distance the lens with the shorter f shows the pencil bigger; both images upright and virtual', () => {
  const a = imageOf('plus40', PENCIL_U);
  const b = imageOf('plus20', PENCIL_U);
  assert.equal(a.kind, 'virtual');
  assert.equal(b.kind, 'virtual');
  assert.ok(near(a.m, 40 / 28));
  assert.ok(near(b.m, 2.5));
  assert.ok(b.m > a.m);
  // the thin-lens rule: 1/u + 1/v = 1/f with v negative for a virtual image
  assert.ok(near(formulaError(PENCIL_U, a.x, 40), 0));
  // a concave lens shows it smaller, the more curved one smaller still (the book's sentence)
  assert.ok(imageOf('minus20', PENCIL_U).m < imageOf('minus40', PENCIL_U).m);
  assert.ok(imageOf('minus40', PENCIL_U).m < 1);
});

test('the book’s two rays from X pass exactly through X′, for the learn scenes and the নিজে করো questions', () => {
  for (const [id, u] of [
    ['plus40', 12],
    ['plus20', 12],
    ['plus20', 45],
    ['minus20', 25],
  ]) {
    const img = imageOf(id, u);
    for (const r of pencilRays(id, u)) assert.ok(missOf(r, img) < 1e-9, `${id} u=${u} ${r.name}`);
  }
  // the নিজে করো answers: (a) upright, virtual, bigger; (b) inverted, real, smaller; ৯.২৮ upright, virtual, smaller
  assert.ok(imageOf('plus40', 12).kind === 'virtual' && imageOf('plus40', 12).m > 1);
  assert.ok(imageOf('plus20', 45).kind === 'real' && imageOf('plus20', 45).m < 1 && imageOf('plus20', 45).tip < 0);
  assert.ok(imageOf('minus20', 25).kind === 'virtual' && imageOf('minus20', 25).m < 1 && imageOf('minus20', 25).x > -20);
});

test('the answers to "what is its power?": the right one first, each mistake different from it and from each other', () => {
  for (const id of ['plus25', 'minus25']) {
    const c = powerChoices(id);
    assert.equal(c[0].p, powerOf(id));
    assert.equal(new Set(c.map((x) => x.p)).size, 4);
    assert.deepEqual(
      c.map((x) => x.key),
      ['right', 'cm', 'f', 'sign'],
    );
  }
  assert.deepEqual(
    powerChoices('plus25').map((x) => x.p),
    [4, 0.04, 25, -4],
  );
});

test('the concave lens’s f is negative, so P = 1/f for every lens; the graph’s two branches follow P = 1/f', () => {
  for (const id of Object.keys(LENSES)) assert.ok(near(1 / signedF(id), powerOf(id), 1e-9), id);
  assert.equal(signedF('minus40'), -0.4);
  for (const q of curve(1)) assert.ok(q.f > 0 && near(q.p, 1 / q.f));
  for (const q of curve(-1)) assert.ok(q.f < 0 && near(q.p, 1 / q.f));
});

test('the answers to "what is the focal length?": the right f first, three different real mistakes', () => {
  assert.deepEqual(
    focalChoices('plus40').map((c) => [c.key, c.f, c.unit]),
    [
      ['right', 0.4, 'm'],
      ['p', 2.5, 'm'],
      ['cm', 0.4, 'cm'],
      ['ten', 4, 'm'],
    ],
  );
  assert.deepEqual(
    focalChoices('minus50').map((c) => [c.key, c.f, c.unit]),
    [
      ['right', -0.5, 'm'],
      ['p', -2, 'm'],
      ['cm', -0.5, 'cm'],
      ['sign', 0.5, 'm'],
    ],
  );
  for (const id of ['plus40', 'plus50', 'minus50']) assert.equal(new Set(focalChoices(id).map((c) => `${c.f}${c.unit}`)).size, 4);
});
