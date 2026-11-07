// The optics of prism-dispersion: the glass's index (n = 1.52 for yellow, as the book's table), Snell's law at both faces of
// trace(), the bend always toward the base, δ = i + e − A, the least bending at the symmetric path, the colours in the
// right order (violet bent most), the drawn spread only widening the real one, and the lamp on its rail.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  COLOURS,
  deviation,
  drawnIndex,
  ENTRY,
  FAN_NM,
  I_RANGE,
  indexAt,
  lampAt,
  PRISM,
  RED_NM,
  SCREEN,
  SPREAD,
  trace,
  turnCorner,
} from '../../assets/prism-dispersion/src/reading.js';

const rad = (d) => (d * Math.PI) / 180;
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} ≉ ${b}`);

test('the glass: n = 1.52 for yellow light (the book), higher for violet, lower for red', () => {
  near(indexAt(589.3), 1.52, 1e-9);
  assert.ok(indexAt(400) > indexAt(500) && indexAt(500) > indexAt(600) && indexAt(600) > indexAt(700));
  near(indexAt(400), 1.534, 0.001);
  near(indexAt(700), 1.516, 0.001);
  for (let k = 1; k < COLOURS.length; k++) assert.ok(indexAt(COLOURS[k - 1].nm) > indexAt(COLOURS[k].nm), COLOURS[k].id);
});

test('the drawn spread: red at 650 nm is the real index, the rest SPREAD times further from it', () => {
  near(drawnIndex(RED_NM), indexAt(RED_NM), 1e-12);
  near(drawnIndex(450) - drawnIndex(RED_NM), SPREAD * (indexAt(450) - indexAt(RED_NM)), 1e-12);
});

test('the prism: 60°, base level, the entry point on the first face', () => {
  near(Math.hypot(PRISM.apex.x - PRISM.left.x, PRISM.apex.y - PRISM.left.y), PRISM.side, 1e-9);
  near(PRISM.left.y, PRISM.right.y, 1e-12);
  const cross = (PRISM.apex.x - PRISM.left.x) * (ENTRY.y - PRISM.left.y) - (PRISM.apex.y - PRISM.left.y) * (ENTRY.x - PRISM.left.x);
  near(cross, 0, 1e-9, 'entry on the face');
});

test("Snell's law at both faces, for every angle on the rail and every colour", () => {
  for (let i = I_RANGE[0]; i <= I_RANGE[1]; i += 1)
    for (const nm of [RED_NM, ...FAN_NM]) {
      const n = drawnIndex(nm);
      const tr = trace(i, n);
      assert.ok(tr.ok, `light leaves at i = ${i}, ${nm} nm`);
      near(Math.sin(rad(tr.i1)), n * Math.sin(rad(tr.r1)), 1e-9, 'first face');
      near(n * Math.sin(rad(tr.r2)), Math.sin(rad(tr.e)), 1e-9, 'second face');
      near(tr.r1 + tr.r2, PRISM.angle, 1e-9, 'r₁ + r₂ = A');
      near(tr.delta, deviation(tr.i1, tr.e), 1e-9, 'δ = i + e − A');
      assert.ok(tr.delta > 0, 'toward the base');
      assert.ok(tr.hit.onCard, `on the screen at i = ${i}, ${nm} nm`);
      // the corner of the turning angle lies on the outgoing ray drawn back
      const c = turnCorner(tr);
      const back = (c.x - tr.exit.x) * tr.out.y - (c.y - tr.exit.y) * tr.out.x;
      near(back, 0, 1e-9);
    }
});

test('the red light bends least on the symmetric path (r₁ = r₂ = 30°), about 38.7°', () => {
  const n = indexAt(RED_NM);
  const iMin = (Math.asin(n * Math.sin(rad(30))) * 180) / Math.PI;
  const at = trace(iMin, n);
  near(at.r1, 30, 1e-9);
  near(at.delta, 2 * iMin - 60, 1e-9);
  near(at.delta, 38.7, 0.1);
  for (const d of [-4, 4]) assert.ok(trace(iMin + d, n).delta > at.delta);
  // the inside ray runs parallel to the base, as in চিত্র ৯.১২
  near(at.inside.y, 0, 1e-9);
});

test('white light: violet is bent most and lands lowest on the screen, red least', () => {
  for (const i of [45, 50, 60, 66]) {
    const ys = COLOURS.map((c) => trace(i, drawnIndex(c.nm)));
    for (let k = 1; k < ys.length; k++) {
      assert.ok(ys[k - 1].delta > ys[k].delta, `${COLOURS[k].id} at i = ${i}`);
      assert.ok(ys[k - 1].hit.y < ys[k].hit.y);
    }
    assert.ok(ys[0].hit.y >= SCREEN.bottom && ys.at(-1).hit.y <= SCREEN.top);
  }
});

test('the lamp: on its rail round the entry point, its beam aimed at it', () => {
  for (const i of [45, 55, 66]) {
    const p = lampAt(i);
    const tr = trace(i, 1.5);
    near(Math.hypot(ENTRY.x - p.x, ENTRY.y - p.y), 8.2, 1e-9);
    near((ENTRY.x - p.x) * tr.din.y - (ENTRY.y - p.y) * tr.din.x, 0, 1e-9);
  }
});
