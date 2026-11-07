// The optics of lens-types: the two lenses' shapes, the faces as parts of spheres (C₁, C₂), Snell's law at each face, parallel light
// meeting after the convex lens and spreading from a virtual F before the concave one, the slab's shift d = T sin(i − r) / cos r, and the
// ray through a lens's centre: parallel out, shifted, the shift going to nearly zero as the lens thins (চিত্র ৯.১৪–৯.১৭).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  bookCentres,
  centreRay,
  focusFrom,
  LENS,
  leftFace,
  lensOf,
  N_GLASS,
  parallelRays,
  refract,
  rightFace,
  sag,
  SLAB,
  slabRay,
  slabShift,
  TEACH,
  teachLens,
  thicknessAt,
} from '../../assets/lens-types/src/reading.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test('the convex lens is thicker in the middle than at the edge, the concave one thinner (চিত্র ৯.১৪)', () => {
  const v = lensOf('convex');
  const c = lensOf('concave');
  near(thicknessAt(v, LENS.half), LENS.edge, 1e-9);
  assert.ok(v.t > 10 * thicknessAt(v, LENS.half));
  assert.ok(thicknessAt(c, LENS.half) > 5 * c.t);
  // the sister figure's lens: faces of radius 2(n − 1)·15 cm
  near(1 / v.c1, 2 * (1.52 - 1) * 15, 1e-9);
  near(-1 / c.c1, LENS.R, 1e-9);
});

test('each face is part of a sphere: convex spheres overlap, concave ones leave a gap the lens fills (চিত্র ৯.১৫)', () => {
  for (const kind of ['convex', 'concave']) {
    const L = teachLens(kind);
    near(Math.abs(1 / L.c1), TEACH.R, 1e-9);
    const { c1, c2 } = bookCentres(L);
    assert.ok(c1 < 0 && c2 > 0);
    const R = Math.abs(1 / L.c1);
    // every point of the left face is R from its own centre: C₂ for the convex lens (the other side), C₁ for the concave
    const own = kind === 'convex' ? c2 : c1;
    for (const y of [0, 2, 5, L.h]) near(Math.hypot(leftFace(L, y) - own, y), R, 1e-9);
    if (kind === 'convex') assert.ok(c2 - c1 < 2 * R);
    else near(c2 - c1 - 2 * R, L.t, 1e-9);
  }
});

test("Snell's law: n₁ sin θ₁ = n₂ sin θ₂ at a face", () => {
  const i = (40 * Math.PI) / 180;
  const d = refract({ x: Math.cos(i), y: -Math.sin(i) }, { x: -1, y: 0 }, 1, N_GLASS);
  near(Math.sin(i), N_GLASS * Math.abs(d.y), 1e-12);
  // beyond the critical angle there is no ray out
  assert.equal(refract({ x: Math.cos(1.2), y: Math.sin(1.2) }, { x: -1, y: 0 }, N_GLASS, 1), null);
});

test('parallel light meets past the convex lens and spreads from a point before the concave one', () => {
  const conv = parallelRays(lensOf('convex'));
  const fConv = focusFrom(lensOf('convex'));
  assert.ok(fConv > 14 && fConv < 18);
  for (const r of conv.filter((r) => r.h !== 0)) {
    assert.ok(r.cross > 13 && r.cross < fConv + 0.01, `crosses at ${r.cross}`);
    assert.ok(Math.sign(r.out.y) === -Math.sign(r.h)); // toward the axis
  }
  const conc = parallelRays(lensOf('concave'));
  const fConc = focusFrom(lensOf('concave'));
  assert.ok(fConc < -12 && fConc > -18);
  for (const r of conc.filter((r) => r.h !== 0)) {
    assert.ok(Math.sign(r.out.y) === Math.sign(r.h)); // away from the axis
    assert.ok(r.cross < 0); // extended back, it crosses the axis in front of the lens
  }
  // the middle ray goes straight on
  near(conv[2].end.y, 0, 1e-9);
});

test('a slab shifts a ray sideways by T sin(i − r)/cos r and it comes out parallel (চিত্র ৯.১৬)', () => {
  const r = slabRay(6);
  near(r.shift, slabShift(6), 1e-12);
  near(slabShift(SLAB.max) / slabShift(SLAB.max / 2), 2, 1e-12);
  assert.ok(slabShift(SLAB.start) > 2 * slabShift(SLAB.end) - 1e-9);
  // the ray inside obeys Snell's law
  near(Math.sin((SLAB.angle * Math.PI) / 180), N_GLASS * Math.sin((r.r * Math.PI) / 180), 1e-12);
  assert.ok(slabShift(1) < 0.3 && slabShift(6) > 1.5);
});

test('through the centre: parallel out, moved aside; a thin lens moves it almost not at all (চিত্র ৯.১৭)', () => {
  for (const kind of ['convex', 'concave']) {
    const thick = centreRay(teachLens(kind, 1));
    const thin = centreRay(teachLens(kind, 0));
    for (const c of [thick, thin]) {
      near(c.dOut.x, c.dIn.x, 1e-9);
      near(c.dOut.y, c.dIn.y, 1e-9);
      near(c.inAngle, 35, 1e-6);
    }
    assert.ok(thick.shift > 5 * thin.shift, `${kind}: ${thick.shift} vs ${thin.shift}`);
    assert.ok(thin.shift < 0.25, `${kind} thin: ${thin.shift} cm`);
  }
  assert.ok(centreRay(teachLens('convex', 1)).shift > 1);
});

test('the thin teaching lens keeps the radius of its faces: smaller, still plainly convex or concave', () => {
  const thin = teachLens('convex', 0);
  near(1 / thin.c1, TEACH.R, 1e-12);
  assert.ok(thin.t > 2.5 * thicknessAt(thin, thin.h));
  const tc = teachLens('concave', 0);
  assert.ok(thicknessAt(tc, tc.h) > 2.5 * tc.t);
  // the teaching lens's F is nearer than the bench lens's: it is more curved
  assert.ok(focusFrom(teachLens('convex', 0)) < focusFrom(lensOf('convex')));
});

test('a flat face is still a lens: plano-convex thick in the middle, plano-concave thin', () => {
  const pv = lensOf('convex', 1);
  const pc = lensOf('concave', 1);
  near(rightFace(pv, 5), rightFace(pv, 0), 1e-12);
  assert.ok(pv.t > thicknessAt(pv, LENS.half));
  assert.ok(pc.t < thicknessAt(pc, LENS.half));
  near(sag(0, 3), 0, 1e-12);
});
