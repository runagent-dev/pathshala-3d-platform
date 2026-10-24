// Digital balance behaviour through the bridge (book p23, topic 1.6.2): the display shows the mass of what is on
// the pan, the tare button takes the bowl away from the reading, kg is the same mass, and the weight W = m × g.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('digital-balance: reading, tare, unit and weight', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'digital-balance');

  expect(await fig.call('get')).toMatchObject({ reading: 0, tare: 0, things: [] });

  await fig.call('set', { things: ['egg'], masses: { egg: 56.3 }, animate: false });
  await fig.advance(2000);
  expect(await fig.call('get')).toMatchObject({ reading: 56.3, text: '56.3', unit: 'g', net: false, stable: true, weight: 0.552 });

  await fig.call('set', { things: ['bowl'], masses: { bowl: 124.6 }, animate: false });
  await fig.advance(2000);
  await fig.call('set', { tare: true });
  expect(await fig.call('get')).toMatchObject({ reading: 0, tare: 124.6, net: true });

  await fig.call('set', { things: ['bowl', 'mango'], masses: { mango: 212.4 }, animate: false });
  await fig.advance(2000);
  expect(await fig.call('get')).toMatchObject({ reading: 212.4, load: 337, net: true });

  await fig.call('set', { unit: 'kg' });
  expect(await fig.call('get')).toMatchObject({ reading: 212.4, text: '0.2124', unit: 'kg' });

  await fig.call('reset');
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ reading: 0, tare: 0, unit: 'g', things: [] });
  expect(log.errors).toEqual([]);
});
