// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged).
// Replace with checks of your figure: set something, read it back with get, compare with the book.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('{{id}}: the reading follows the marker', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, '{{id}}');
  await fig.call('set', { value: 47 });
  expect(await fig.call('get')).toMatchObject({ value: 47, cm: 4, mm: 7 });
  expect(log.errors).toEqual([]);
});
