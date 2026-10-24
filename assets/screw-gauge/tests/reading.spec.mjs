// Screw-gauge behaviour through the bridge (book p21): the reading follows the gap as L + C × 0.01 mm, and an
// object stops the spindle at its size. Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('screw-gauge: reading = L + C × LC', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'screw-gauge');

  await fig.call('set', { value: 7.05 });
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ value: 7.05, L: 7, C: 5, lc: 0.01, pitch: 1 });

  await fig.call('set', { object: 'ball', size: 6.35 });
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ value: 6.35, L: 6, C: 35, contact: true, object: { kind: 'ball', size: 6.35 } });

  expect(log.errors).toEqual([]);
});
