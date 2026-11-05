// The optics of reflection-laws: the two laws as the vector formula gives them, the waves of the picture, and the
// magnifier's cross-section of the surface, where every ray still obeys the law about its own normal.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  along,
  angleToNormal,
  deg,
  dot,
  LOUPE,
  LOUPE_FIELDS,
  loupeHeight,
  loupeInto,
  loupeSpread,
  offPlane,
  reflected,
  rmsSlope,
  sheetDir,
  sheetNormal,
  toLight,
  WAVES,
} from '../../assets/reflection-laws/src/reading.js';

const UP = { x: 0, y: 1, z: 0 };
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);
const N = LOUPE.hits.length;
const trace = (strength, time) => loupeInto(new Float32Array(N * LOUPE_FIELDS), strength, time);
const ray = (f, i) => {
  const o = i * LOUPE_FIELDS;
  return { x: f[o], y: f[o + 1], tilt: f[o + 2], nx: f[o + 3], ny: f[o + 4], rx: f[o + 5], ry: f[o + 6], theta: f[o + 7] };
};
/** The start of a ray coming in, in the callout's units. */
const start = (i) => ({
  x: LOUPE.hits[i] - Math.sin((LOUPE.theta * Math.PI) / 180) * LOUPE.in,
  y: Math.cos((LOUPE.theta * Math.PI) / 180) * LOUPE.in,
});
const side = (a, b, p) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
const crosses = (a, b, c, d) => side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;

test('second law: θr = θi at every angle and every swing of the plane', () => {
  for (const th of [20, 30, 50, 75])
    for (const ph of [-60, 0, 25, 34]) near(angleToNormal(reflected(th, ph), UP), angleToNormal(toLight(th, ph), UP));
});

test('first law: the reflected ray stays in the plane of the ray and the normal', () => {
  for (const th of [20, 30, 50, 75])
    for (const ph of [-60, 0, 25, 34]) {
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

test('a direction in the sheet: signed angle from the normal', () => {
  near(sheetDir(0).y, 1);
  near(sheetDir(90).s, 1);
  near(sheetDir(-30).s, -0.5);
});

test('the magnifier: on the wavy line each ray keeps θr = θi about its own normal', () => {
  for (const time of [0, 1.3, 7]) {
    const f = trace(1, time);
    for (let i = 0; i < N; i++) {
      const r = ray(f, i);
      near(Math.hypot(r.rx, r.ry), 1, 1e-5);
      near(Math.hypot(r.nx, r.ny), 1, 1e-5);
      near(deg(Math.acos(r.rx * r.nx + r.ry * r.ny)), r.theta, 1e-3);
      assert.ok(r.ry > 0, `ray ${i} leaves the surface upward`);
      near(r.y, loupeHeight(r.x, 1, time), 1e-3); // it really stops on the surface
    }
  }
});

test('the magnifier: each normal leans its own way', () => {
  const f = trace(1, 0);
  const tilts = [0, 1, 2].map((i) => ray(f, i).tilt);
  near(tilts[0], -32, 3);
  near(tilts[1], -9, 3);
  near(tilts[2], 15, 3);
});

test('the magnifier: on a straight surface the rays stay parallel, θr = θi about upright normals', () => {
  const f = trace(0, 3);
  near(loupeSpread(f), 0, 1e-3);
  for (let i = 0; i < N; i++) {
    const r = ray(f, i);
    near(r.y, 0, 1e-6);
    near(r.tilt, 0, 1e-6);
    near(r.theta, LOUPE.theta, 1e-4);
  }
});

test('the magnifier: on waves the rays fan out, the first clearly back up and to the left', () => {
  const f = trace(1, 0);
  assert.ok(loupeSpread(f) > 70, `spread ${loupeSpread(f)}`);
  assert.ok(ray(f, 0).rx < -0.15, 'the first ray goes back toward the light');
  for (let i = 1; i < N; i++) assert.ok(ray(f, i).rx > ray(f, i - 1).rx, `ray ${i} is further round than ray ${i - 1}`);
});

test('the magnifier: rays never cross into a net, at any strength of the waves', () => {
  for (const strength of [0, 0.3, 0.6, 1])
    for (const time of [0, 2, 5]) {
      const f = trace(strength, time);
      const out = [0, 1, 2].map((i) => {
        const r = ray(f, i);
        return { a: { x: r.x, y: r.y }, b: { x: r.x + r.rx * LOUPE.out, y: r.y + r.ry * LOUPE.out } };
      });
      const inc = [0, 1, 2].map((i) => {
        const r = ray(f, i);
        return { a: start(i), b: { x: r.x, y: r.y } };
      });
      for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          assert.ok(!crosses(out[i].a, out[i].b, inc[j].a, inc[j].b), `out ${i} and in ${j} at ${strength}`);
          if (i < j) assert.ok(!crosses(out[i].a, out[i].b, out[j].a, out[j].b), `out ${i} and out ${j} at ${strength}`);
        }
    }
});

test('the picture’s waves: gentle (about 0.045 rms) and crossing', () => {
  near(rmsSlope(), 0.045, 0.004);
  const dirs = WAVES.map((w) => (Math.atan2(w.kz, w.kx) * 180) / Math.PI);
  assert.ok(Math.max(...dirs) - Math.min(...dirs) > 140, 'they cross');
  for (const w of WAVES) near(Math.hypot(w.kx, w.kz) * w.a, w.slope, 1e-9);
});
