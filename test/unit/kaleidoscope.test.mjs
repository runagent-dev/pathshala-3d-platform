// The optics of the kaleidoscope: the lattice of reflected cells, the rays through the tube, the Fresnel numbers, চিত্র ৮.১৩.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBeads, PIECES } from '../../assets/kaleidoscope/src/beads.js';
import {
  aboveA,
  atB,
  brightness,
  cellAt,
  coords,
  CORNERS,
  crossings,
  dot,
  fold,
  fresnel,
  imageIn,
  incidence,
  lattice,
  path,
  percent,
  reflect,
  reflectionsAt,
  sixtyChoices,
  stripAngle,
  stripShare,
  stripView,
  STRIP,
  traceWedge,
  TUBE,
  WALLS,
  WEDGE,
  wedgeAngle,
  wedgeSource,
  WINDOW,
} from '../../assets/kaleidoscope/src/reading.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const cells = lattice();

test('the tube: the eye sees the open end blown up exactly WINDOW times', () => {
  near((TUBE.L + TUBE.e) / TUBE.e, WINDOW);
  near(TUBE.h, 3 * TUBE.r);
  near(CORNERS[0][1] - CORNERS[1][1], TUBE.h);
});

test('the three coordinates add up to 1, and the real cell is where all lie in 0…1', () => {
  for (const p of [
    [0, 0],
    [1, 0.3],
    [-5, 2],
  ])
    near(
      coords(p).reduce((a, b) => a + b, 0),
      1,
    );
  assert.equal(reflectionsAt([0, 0]), 0);
  for (const j of [0, 1, 2]) assert.equal(reflectionsAt(reflect([0.2, 0.1], j)), 1);
});

test('reflecting twice in a wall gives the point back, and an image is as far behind the wall as the point is in front', () => {
  const p = [0.4, -0.3];
  for (const j of [0, 1, 2]) {
    const q = reflect(p, j);
    near(dot(q, WALLS[j].n) - TUBE.r, TUBE.r - dot(p, WALLS[j].n));
    const b = reflect(q, j);
    near(b[0], p[0]);
    near(b[1], p[1]);
  }
});

test('the lattice: WINDOW² cells, and 3n cells for n reflections', () => {
  assert.equal(cells.length, WINDOW * WINDOW);
  assert.equal(cells[0].n, 0);
  for (const n of [1, 2, 3, 4]) assert.equal(cells.filter((c) => c.n === n).length, 3 * n, `n = ${n}`);
  for (const c of cells) {
    // the word's length, the lines crossed and the count from the coordinates all agree
    assert.equal(c.word.length, c.n);
    assert.equal(
      crossings(c.centre).reduce((a, b) => a + b, 0),
      c.n,
    );
    assert.equal(reflectionsAt(c.centre), c.n);
    assert.equal(new Set(c.corners).size, 3, 'each corner of the real cell once');
    near(Math.hypot(c.verts[0][0] - c.verts[1][0], c.verts[0][1] - c.verts[1][1]), TUBE.s, 1e-6);
  }
});

test('neighbouring cells are mirror pictures: a shared edge has the same corners on both sides', () => {
  const key = (v) => `${Math.round(v[0] * 1000)},${Math.round(v[1] * 1000)}`;
  const seen = new Map();
  for (const c of cells)
    c.verts.forEach((v, i) => {
      const k = key(v);
      if (seen.has(k)) assert.equal(seen.get(k), c.corners[i], `corner at ${k}`);
      else seen.set(k, c.corners[i]);
    });
});

test('a point in any cell folds back to the same real point its cell maps it from', () => {
  const p = [0.3, 0.2];
  for (const c of cells) {
    const im = imageIn(p, c.word);
    const back = fold(im);
    near(back.point[0], p[0], 1e-6);
    near(back.point[1], p[1], 1e-6);
    assert.equal(cellAt(cells, im), c);
  }
});

test('six cells meet at each corner, as 360° ÷ 60° says', () => {
  const key = (v) => `${Math.round(v[0] * 1000)},${Math.round(v[1] * 1000)}`;
  for (const k of CORNERS) assert.equal(cells.filter((c) => c.verts.some((v) => key(v) === key(k))).length, 6);
});

test('the rays: straight unfolded, right number of hits, on the glass, θi = θr at each', () => {
  const p = [0.5, -0.4];
  for (const c of cells.filter((x) => x.n >= 1 && x.n <= 5)) {
    const r = path(p, c.word);
    assert.equal(r.hits.length, c.n);
    // the light runs from the far end to the eye, x always falling
    for (let i = 1; i < r.points.length; i++) assert.ok(r.points[i][0] < r.points[i - 1][0]);
    for (let i = 0; i < r.hits.length; i++) {
      const h = r.hits[i];
      assert.ok(h.wall >= 0, 'lies on a wall');
      assert.ok(h.x >= 0 && h.x <= TUBE.L, `hit inside the tube, x = ${h.x}`);
      const n = WALLS[h.wall].n;
      const a = r.points[i];
      const b = r.points[i + 1];
      const d = r.points[i + 2];
      const len = (u) => Math.hypot(...u);
      const inc = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const out = [d[0] - b[0], d[1] - b[1], d[2] - b[2]];
      const iu = inc.map((x) => x / len(inc));
      const ou = out.map((x) => x / len(out));
      const k = 2 * (iu[1] * n[0] + iu[2] * n[1]);
      near(iu[0], ou[0]);
      near(iu[1] - k * n[0], ou[1]);
      near(iu[2] - k * n[1], ou[2]);
      assert.ok(h.theta > 50 && h.theta < 90, `grazing: ${h.theta}`);
    }
  }
});

test('the eye looks at a grazing angle, and brightness falls with each reflection', () => {
  const near1 = cells.find((c) => c.n === 1);
  const b1 = brightness(near1.centre, near1.crossings);
  assert.ok(b1 > 0.5 && b1 < 0.8, `one reflection ${b1}`);
  assert.equal(brightness([0, 0], [0, 0, 0]), 1);
  const mean = (n) => {
    const l = cells.filter((c) => c.n === n);
    return l.reduce((a, c) => a + brightness(c.centre, c.crossings), 0) / l.length;
  };
  for (const n of [1, 2, 3, 4]) assert.ok(mean(n + 1) < mean(n));
  assert.ok(incidence([2 * TUBE.r, 0], 1) > 75);
});

test('Fresnel: 4 % straight on, the same table as reflection-amount, a strip twice as much for small R', () => {
  near(fresnel(0), 0.04, 1e-9);
  assert.equal(percent(0), 4);
  assert.equal(percent(30), 4);
  assert.equal(percent(60), 9);
  assert.equal(percent(80), 39);
  assert.equal(percent(85), 61);
  assert.equal(fresnel(90), 1);
  near(stripShare(0), (2 * 0.04) / 1.04);
  let last = 0;
  for (let t = 0; t <= 89; t++) {
    assert.ok(fresnel(t) >= last);
    last = fresnel(t);
  }
});

test('one strip: the eye looks along the line from the image through the glass', () => {
  for (const th of [STRIP.min, 30, 60, 83, STRIP.max]) {
    const q = stripView(th);
    near((q.hit[0] - q.bead[0]) / q.bead[1], Math.tan((th * Math.PI) / 180));
    near((q.eye[0] - q.hit[0]) / q.eye[1], Math.tan((th * Math.PI) / 180));
    near((q.hit[0] - q.image[0]) / (0 - q.image[1]), Math.tan((th * Math.PI) / 180));
    assert.ok(q.eye[1] > 0, 'in front of the glass');
    assert.ok(Math.abs(q.hit[0]) <= STRIP.half, 'the light meets the strip');
    assert.equal(stripAngle(q.eye[0], q.eye[1]), Math.round(th));
  }
  assert.equal(stripAngle(100, 0.01), STRIP.max);
  assert.equal(stripAngle(STRIP.a0, 10), STRIP.min);
});

test('চিত্র ৮.১৩: a ray at 60° meets B square on and comes exactly back', () => {
  const r = traceWedge(60);
  assert.ok(r.back);
  assert.deepEqual(
    r.hits.map((h) => h.mirror),
    ['A', 'B', 'A'],
  );
  near(r.hits[0].theta, 60);
  near(r.hits[1].theta, 0);
  near(r.hits[2].theta, 60);
  near(aboveA(60), 30);
  const end = r.points[r.points.length - 1];
  const s = wedgeSource(60);
  near(end[0], s[0]);
  near(end[1], s[1]);
  // the triangle: 8.5-long side etc. are not needed; the angle at B is 90°
  const a = r.points[1];
  const b = r.points[2];
  const d = [b[0] - a[0], b[1] - a[1]];
  near((d[0] * -0.5 + d[1] * Math.sqrt(3) * 0.5) / Math.hypot(...d), 0, 1e-9);
});

test('চিত্র ৮.১৩ at other angles: |60° − θ| at B, and never back along itself', () => {
  for (let th = WEDGE.min; th <= WEDGE.max; th++) {
    const r = traceWedge(th);
    assert.equal(r.hits[0].mirror, 'A');
    near(r.hits[0].theta, th);
    assert.equal(r.hits[1].mirror, 'B', `at ${th}`);
    near(r.hits[1].theta, atB(th));
    if (th !== 60) assert.ok(!r.back);
    assert.equal(wedgeAngle(...wedgeSource(th)), th);
  }
});

test('the test of চিত্র ৮.১৩ has four different choices', () => {
  for (const th of [20, 40, 50, 70]) {
    const c = sixtyChoices(th);
    assert.equal(new Set([c.answer, c.copied, c.above, c.corner]).size, 4, `at ${th}`);
  }
});

test('the pieces stay in the triangle, never overlap, and come to rest, the same way every time', () => {
  const run = () => {
    const b = createBeads();
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * 2 * Math.PI;
      b.pull(Math.sin(a), -Math.cos(a));
      b.run(0.05);
    }
    for (let i = 0; i < 400 && !b.settled; i++) b.run(0.05);
    return b;
  };
  const b = run();
  assert.ok(b.settled, 'comes to rest');
  for (let i = 0; i < b.count; i++) {
    for (const w of WALLS) assert.ok(b.px[i] * w.n[0] + b.py[i] * w.n[1] <= TUBE.r - b.radius[i] + 0.02);
    for (let j = i + 1; j < b.count; j++) assert.ok(Math.hypot(b.px[i] - b.px[j], b.py[i] - b.py[j]) >= b.radius[i] + b.radius[j] - 0.03);
  }
  const c = run();
  assert.deepEqual([...c.px], [...b.px]);
  assert.equal(b.count, PIECES.length);
});

test('a third of a turn of the frame leaves every piece inside: the tube looks the same', () => {
  const b = createBeads();
  b.spin((2 * Math.PI) / 3);
  for (let i = 0; i < b.count; i++) for (const w of WALLS) assert.ok(b.px[i] * w.n[0] + b.py[i] * w.n[1] <= TUBE.r - b.radius[i] + 0.03);
});
