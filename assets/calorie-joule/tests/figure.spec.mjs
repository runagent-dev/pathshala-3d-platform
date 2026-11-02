// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): one
// calorie of heat raises 1 gm of water 1°C and is 4.2 J; the button gives one calorie at a time up to five and then
// starts again; the thermometer's column follows; and the test runs five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/calorie-joule/'));

test('calorie-joule: n calories are n × 4.2 J and raise 1 gm of water n °C', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'calorie-joule');
  expect(await fig.call('get')).toMatchObject({ cal: 0, joules: 0, rise: 0, grams: 1, view: 'front', mode: 'explore' });
  for (const [n, j] of [
    [1, 4.2],
    [2, 8.4],
    [3, 12.6],
    [4, 16.8],
    [5, 21],
  ]) {
    expect(await fig.call('set', { cal: n, animate: false })).toMatchObject({ cal: n, joules: j, rise: n, maxSeen: n });
  }
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ cal: 0, joules: 0, maxSeen: 0 });
  expect(log.errors).toEqual([]);
});

test('calorie-joule: the button gives a calorie at a time and starts again after the fifth; the column rises', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'calorie-joule');
  const frame = frameOf(page);
  for (let n = 1; n <= 5; n++) {
    await frame.locator('.pvc-act').click();
    await fig.advance(2800);
    expect(await fig.call('get')).toMatchObject({ cal: n, joules: [0, 4.2, 8.4, 12.6, 16.8, 21][n], rise: n });
    await fig.advance(600); // clear of the double-tap guard
  }
  await frame.locator('.pvc-act').click(); // after the last: start again
  await fig.advance(3200);
  expect(await fig.call('get')).toMatchObject({ cal: 0, joules: 0 });
  expect(log.errors).toEqual([]);
});

test('calorie-joule: the test runs five questions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'calorie-joule');
  const frame = frameOf(page);
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1500);
    await frame.locator('[data-q]').first().click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', cal: 0 });
  expect(log.errors).toEqual([]);
});
