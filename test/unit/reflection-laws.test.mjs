// The optics of reflection-laws: the two laws as the vector formula gives them, Snell, the Fresnel numbers the panel
// shows, and that every ray on wavy water still obeys the law at its own facet.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  along,
  angleToNormal,
  dot,
  facetNormal,
  facetReflect,
  fresnel,
  N_GLASS,
  N_WATER,
  normalize,
  offPlane,
  percent,
  reflect,
  reflected,
  refracted,
  sheetNormal,
  slopeAt,
  heightAt,
  snell,
  toLight,
} from '../../assets/reflection-laws/src/reading.js';

const UP = { x: 0, y: 1, z: 0 };
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

test('second law: θr = θi at every angle and every swing of the plane', () => {
  for (const th of [0, 5, 30, 50, 75, 89])
    for (const ph of [-40, 0, 25, 60]) near(angleToNormal(reflected(th, ph), UP), angleToNormal(toLight(th, ph), UP));
});

test('first law: the reflected ray stays in the plane of the ray and the normal', () => {
  for (const th of [5, 30, 50, 75, 89])
    for (const ph of [-40, 0, 25, 60]) {
      const m = sheetNormal(ph);
      near(offPlane(toLight(th, ph), m), 0);
      near(offPlane(reflected(th, ph), m), 0);
      near(offPlane(UP, m), 0);
    }
});

test('the reflected ray goes to the far side of the normal, going up', () => {
  const r = reflected(50, 20);
  const u = along(20);
  near(dot(r, u), Math.sin((50 * Math.PI) / 180));
  near(r.y, Math.cos((50 * Math.PI) / 180));
  assert.ok(dot(toLight(50, 20), u) < 0);
});

test('Snell: into water at 50° is about 35.2°, bent toward the normal, in the plane', () => {
  near(snell(50), 35.17, 0.01);
  near(snell(0), 0);
  near(offPlane(refracted(50, 30), sheetNormal(30)), 0);
  assert.ok(refracted(50, 30).y < 0);
  near(Math.sin((50 * Math.PI) / 180), N_WATER * Math.sin((snell(50) * Math.PI) / 180));
});

test('Fresnel: the numbers the page and the panel give', () => {
  near(fresnel(0, N_WATER), ((N_WATER - 1) / (N_WATER + 1)) ** 2); // about 2 %
  assert.equal(percent(0), 2);
  near(fresnel(0, N_GLASS), 0.04); // the book's glass: 4 %
  near(fresnel(60, N_GLASS), 0.089, 0.001); // about 9 %
  near(fresnel(80, N_GLASS), 0.388, 0.002); // about 39 %
  assert.equal(fresnel(90), 1);
  for (let th = 0; th < 89; th += 1) assert.ok(fresnel(th + 1) > fresnel(th) - 1e-12, `grows at ${th}`);
});

test('wavy water: every ray still obeys the law at its own facet, but they spread', () => {
  const d = normalize({ x: 0.7, y: -0.7, z: 0.1 });
  const dirs = [];
  for (let i = -3; i <= 3; i++) {
    const x = i * 13;
    const f = facetReflect(d, x, 2, 1.7, 1);
    near(angleToNormal(f.r, f.n), f.i, 1e-9); // θr = θi at the facet
    near(Math.hypot(f.r.x, f.r.y, f.r.z), 1);
    near(offPlane(f.r, normalize({ x: d.y * f.n.z - d.z * f.n.y, y: d.z * f.n.x - d.x * f.n.z, z: d.x * f.n.y - d.y * f.n.x })), 0, 1e-9); // in its own plane
    assert.ok(f.r.y > 0);
    dirs.push(f.r);
  }
  const spread = Math.max(
    ...dirs.map((a) => Math.max(...dirs.map((b) => angleToNormal(a, normalize(b)) && (Math.acos(Math.min(1, dot(a, b))) * 180) / Math.PI))),
  );
  assert.ok(spread > 8, `spread ${spread}`);
});

test('smooth water: the facets are flat, so parallel rays stay parallel', () => {
  const d = normalize({ x: 0.7, y: -0.7, z: 0.1 });
  const r0 = reflect(d, UP);
  for (const x of [-30, 0, 11, 40]) {
    const f = facetReflect(d, x, -5, 3, 0);
    near(f.r.x, r0.x);
    near(f.r.y, r0.y);
    near(f.r.z, r0.z);
  }
  near(facetNormal(3, 4, 1, 0).y, 1);
});

test('the slope is the derivative of the height (the shader uses the same waves)', () => {
  const e = 1e-4;
  const s = slopeAt(7, -3, 2, 0.8);
  near(s.x, (heightAt(7 + e, -3, 2, 0.8) - heightAt(7 - e, -3, 2, 0.8)) / (2 * e), 1e-6);
  near(s.z, (heightAt(7, -3 + e, 2, 0.8) - heightAt(7, -3 - e, 2, 0.8)) / (2 * e), 1e-6);
});
