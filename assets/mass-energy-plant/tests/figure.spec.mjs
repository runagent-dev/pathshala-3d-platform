// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged):
// the fuel and the power plant follow E = mc².
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('mass-energy-plant: the fuel gives E = mc²', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'mass-energy-plant');
  // 1 g split → 7.12 × 10¹⁰ J, about 23 years of a 100 W bulb; all of 1 kg → 9 × 10¹⁶ J
  let st = await fig.call('get');
  expect(st).toMatchObject({ on: false, power: 0, m: 1, part: 'fission' });
  st = await fig.call('set', { run: true, animate: false });
  expect(st).toMatchObject({ on: true, power: 1, m: 1, part: 'fission' });
  expect(st.E).toBeCloseTo(7.118e10, -7);
  expect(Math.round(st.bulbYears)).toBe(23);
  st = await fig.call('set', { m: 1000, part: 'full' });
  expect(st.E).toBe(9e16);
  // the test starts, an answer is marked
  await fig.call('practice');
  await fig.advance(3000);
  expect((await fig.call('get')).mode).toBe('quiz');
  await fig.frame.locator('.pvc-opt[data-q="0"]').click();
  await fig.advance(300);
  expect(['ok', 'bad']).toContain(await fig.frame.locator('.pvc-q-feedback').getAttribute('data-tone'));
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ m: 1, part: 'fission', on: false, mode: 'explore' });
  expect(log.errors).toEqual([]);
});
