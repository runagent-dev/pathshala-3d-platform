// The optics of reflection-laws: the two laws as the vector formula gives them, the waves of the picture, and the
// magnified rough strip, where every ray still obeys the law at its own facet.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  along,
  angleToNormal,
  deg,
  dot,
  offPlane,
  reflected,
  rmsSlope,
  sheetDir,
  sheetNormal,
  STRIP,
  stripInto,
  stripSpread,
  toLight,
  WAVES,
} from '../../assets/reflection-laws/src/reading.js';

const UP = { x: 0, y: 1, z: 0 };
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);
const strip = (theta, strength, time) => stripInto(new Float32Array(STRIP.n * 6), theta, strength, time);

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

test('the rough strip: at every facet θr = θi about that facet’s own normal', () => {
  for (const time of [0, 1.3, 7]) {
    const f = strip(50, 1, time);
    for (let i = 0; i < STRIP.n; i++) {
      const o = i * 6;
      const [ns, ny, rs, ry] = [f[o + 1], f[o + 2], f[o + 3], f[o + 4]];
      near(Math.hypot(rs, ry), 1, 1e-5);
      // the angle of the reflected ray to the facet's normal, and of the ray coming in
      const out = deg(Math.acos(rs * ns + ry * ny));
      near(out, f[o + 5], 1e-3);
      assert.ok(ry > 0, `facet ${i} sends the light up`);
    }
  }
});

test('flat water: the strip’s rays stay parallel, θr = θi about the one normal', () => {
  const f = strip(50, 0, 3);
  near(stripSpread(f), 0, 1e-3);
  for (let i = 0; i < STRIP.n; i++) {
    near(f[i * 6 + 3], Math.sin((50 * Math.PI) / 180), 1e-6);
    near(f[i * 6 + 5], 50, 1e-4);
  }
});

test('rough water: the rays fan out, some nearly straight back, none crossing the fan’s order', () => {
  const f = strip(50, 1, 0);
  assert.ok(stripSpread(f) > 70, `spread ${stripSpread(f)}`);
  assert.ok(f[3] < 0, 'the first ray leans back toward the light');
  for (let i = 1; i < STRIP.n; i++) assert.ok(f[i * 6 + 3] > f[(i - 1) * 6 + 3], `ray ${i} is further round than ray ${i - 1}`);
});

test('the picture’s waves: gentle (about 0.045 rms) and crossing', () => {
  near(rmsSlope(), 0.045, 0.004);
  const dirs = WAVES.map((w) => (Math.atan2(w.kz, w.kx) * 180) / Math.PI);
  assert.ok(Math.max(...dirs) - Math.min(...dirs) > 140, 'they cross');
  for (const w of WAVES) near(Math.hypot(w.kx, w.kz) * w.a, w.slope, 1e-9);
});
