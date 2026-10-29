// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged):
// T = ½mv² with the student's numbers, twice the speed gives four times the energy, the bow's limit for heavy arrows.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('kinetic-energy: a shot lands with T = ½mv², and twice the speed gives four times T', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'kinetic-energy');
  expect(await fig.call('get')).toMatchObject({ m: 0.02, v: 30, T: 9, phase: 'ready' });
  let st = await fig.call('set', { m: 0.02, v: 30, shoot: true, animate: false });
  expect(st.shots).toHaveLength(1);
  expect(st.shots[0]).toMatchObject({ m: 0.02, v: 30, T: 9 });
  st = await fig.call('set', { v: 60, shoot: true, animate: false });
  expect(st.shots).toHaveLength(2);
  expect(st.ratio).toMatchObject({ m: 1, v: 2, T: 4 });
  expect(st.shots[1].depth / st.shots[0].depth).toBeCloseTo(4, 2); // depths are reported to 0.1 mm
  // the bow cannot give a 0.04 kg arrow 60 m/s: the speed is clamped to 50
  st = await fig.call('set', { m: 0.04, v: 60 });
  expect(st).toMatchObject({ m: 0.04, v: 50, T: 50 });
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ m: 0.02, v: 30, shots: [] });
  expect(log.errors).toEqual([]);
});
