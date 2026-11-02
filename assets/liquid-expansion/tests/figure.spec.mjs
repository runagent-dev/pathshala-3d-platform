// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged):
// the flask's level falls from A to B and then rises to C, V_a = V_L − V_B; the thermometer's column goes up, stays
// when taken out and comes down when shaken; the test runs.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('liquid-expansion: the flask falls to B, rises to C, and the sums agree', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'liquid-expansion', { params: { show: 'flask' } });
  expect(await fig.call('get')).toMatchObject({ show: 'flask', step: 0, VB: null });
  await fig.call('set', { step: 1, animate: false });
  const b = await fig.call('get');
  expect(b.level).toBeLessThan(0);
  expect(b).toMatchObject({ step: 1, VB: 3, VL: null });
  await fig.call('set', { step: 2, animate: false });
  const c = await fig.call('get');
  expect(c.level).toBeGreaterThan(0);
  expect(c).toMatchObject({ step: 2, VB: 3, VL: 6, Va: 3 });
  expect(log.errors).toEqual([]);
});

test('liquid-expansion: the thermometer column goes up, stays, and comes down', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'liquid-expansion', { params: { show: 'thermo' } });
  expect((await fig.call('get')).column).toBe(35);
  await fig.call('set', { step: 1, animate: false });
  expect((await fig.call('get')).column).toBe(39);
  await fig.call('set', { step: 2, animate: false });
  expect((await fig.call('get')).column).toBe(39);
  await fig.call('set', { step: 3, animate: false });
  expect((await fig.call('get')).column).toBe(35);
  await fig.call('set', { show: 'flask', animate: false });
  expect(await fig.call('get')).toMatchObject({ show: 'flask' });
  expect(log.errors).toEqual([]);
});
