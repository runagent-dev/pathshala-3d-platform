// The calorimetry figure's maths (assets/calorimetry/src/reading.js): the book's three worked examples on pages
// 179-181 (ice in water 20 °C, 2 L at 75 °C with 1 L at 20 °C, a hot piece of iron in water 30.1 °C), the heat the hot
// body gives always equals what the cold body takes, and the mixing curves end where the final answer is.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EXAMPLES,
  EXAMPLE_IDS,
  ICE_L,
  WATER_S,
  litresAt,
  mixMistakes,
  pieceTempAt,
  round3,
  solve,
  tempAt,
  tempText,
} from '../../assets/calorimetry/src/reading.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test("calorimetry: the book's ice example gives about 20 °C (p180)", () => {
  const r = solve(EXAMPLES.ice);
  close(r.T, 92600 / 4620, 1e-9); // (30×1×4200 − 0.1×334000) / ((1 + 0.1)×4200)
  assert.equal(tempText(r.T), '20');
  assert.ok(r.melts);
  close(ICE_L, 334e3);
});

test("calorimetry: the book's two-waters example gives 56.67 °C (the book prints 56.6, p181)", () => {
  const r = solve(EXAMPLES.water);
  close(r.T, (75 * 2 + 20) / 3, 1e-9);
  assert.equal(tempText(r.T), '56.6');
});

test("calorimetry: the book's iron example gives 30.1 °C (p181)", () => {
  const r = solve(EXAMPLES.iron);
  close(r.T, (120 * 0.01 * 450 + 30 * 1 * WATER_S) / (0.01 * 450 + 1 * WATER_S), 1e-9);
  assert.equal(tempText(r.T), '30.1');
});

test('calorimetry: the heat the hot body gives is exactly the heat the cold body takes', () => {
  for (const id of EXAMPLE_IDS) {
    const r = solve(EXAMPLES[id]);
    close(r.given, r.taken, 1e-6);
    assert.ok(r.given > 0);
  }
  assert.equal(round3(solve(EXAMPLES.ice).given), 41800);
  assert.equal(round3(solve(EXAMPLES.water).given), 154000);
  assert.equal(round3(solve(EXAMPLES.iron).given), 405);
});

test("calorimetry: the mixing curves start at the beaker's temperature and end at T", () => {
  for (const id of EXAMPLE_IDS) {
    const ex = EXAMPLES[id];
    close(tempAt(ex, 1), solve(ex).T, 1e-9);
    close(tempAt(ex, 0), ex.holds === 'hot' ? ex.hot.T0 : ex.cold.T0, 1e-9);
    let last = tempAt(ex, 0);
    for (let k = 0.1; k <= 1.0001; k += 0.1) {
      const v = tempAt(ex, k);
      assert.ok(ex.holds === 'hot' ? v <= last + 1e-9 : v >= last - 1e-9, `${id} is monotonic`);
      last = v;
    }
  }
  close(pieceTempAt(EXAMPLES.iron, 0), 120);
  close(pieceTempAt(EXAMPLES.iron, 1), solve(EXAMPLES.iron).T, 1e-9);
  assert.equal(pieceTempAt(EXAMPLES.ice, 0.5), null);
});

test('calorimetry: litres in the beaker', () => {
  close(litresAt(EXAMPLES.ice, 0), 1);
  close(litresAt(EXAMPLES.ice, 1), 1.1);
  close(litresAt(EXAMPLES.water, 1), 3);
  close(litresAt(EXAMPLES.iron, 0.5), 1);
});

test('calorimetry: the usual wrong answers differ from the right one', () => {
  const m = mixMistakes(EXAMPLES.water);
  close(m.right, 56.6667, 1e-3);
  close(m.average, 47.5);
  close(m.swapped, 38.3333, 1e-3);
  close(m.difference, 55);
});

test('calorimetry: round3 and tempText', () => {
  assert.equal(round3(41818.2), 41800);
  assert.equal(round3(404.6), 405);
  assert.equal(round3(0), 0);
  assert.equal(tempText(30.0963), '30.1');
  assert.equal(tempText(20.04), '20');
});
