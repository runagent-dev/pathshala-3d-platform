// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// share of liquid left in each vessel follows the model for each factor, the changed vessel loses it faster (and in
// the pressure case runs dry), the big button lets time pass and stops, the time can be set, the test runs.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/evaporation/'));

test('evaporation: each factor loses liquid faster in the changed vessel', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'evaporation');
  expect(await fig.call('get')).toMatchObject({ factor: 'wind', time: 0, left: 100, right: 100, mode: 'explore', playing: false });

  // the same water, a fan on the right: 72% left in still air at time 5, 17% on the right
  expect(await fig.call('set', { time: 5 })).toMatchObject({ left: 72, right: 17 });
  // the book's glass and plate: a glass loses little, the wide plate runs dry at 7.5
  expect(await fig.call('set', { factor: 'area', time: 5 })).toMatchObject({ factor: 'area', left: 83, right: 33 });
  expect(await fig.call('set', { time: 8 })).toMatchObject({ right: 0 });
  // under the bell jar the right vessel is dry by 3
  expect(await fig.call('set', { factor: 'pressure', time: 3 })).toMatchObject({ left: 83, right: 0 });
  for (const factor of ['liquid', 'warm', 'dry']) {
    const s = await fig.call('set', { factor, time: 4 });
    expect(s.right).toBeLessThan(s.left);
  }

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ factor: 'wind', time: 0, left: 100, right: 100, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('evaporation: the big button lets time pass and stops at the end', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'evaporation');
  const frame = frameOf(page);
  await frame.locator('.pvc-act-slot button').first().click();
  await fig.advance(2000);
  const mid = await fig.call('get');
  expect(mid.playing).toBe(true);
  expect(mid.time).toBeGreaterThan(1);
  await fig.advance(7000);
  expect(await fig.call('get')).toMatchObject({ time: 10, playing: false, left: 44, right: 0 });
  expect(log.errors).toEqual([]);
});

test('evaporation: the test asks five questions with the picture set up', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'evaporation');
  const frame = frameOf(page);
  await fig.call('practice');
  await expect(frame.locator('.pvc-q-count')).toContainText('১');
  expect((await fig.call('get')).mode).toBe('quiz');
  for (let i = 0; i < 5; i++) {
    await frame.locator('.pvc-opt').first().click();
    await frame.locator('[data-act="q-next"]').click();
  }
  await expect(frame.locator('.pvc-q-result')).toContainText('৫');
  expect(log.errors).toEqual([]);
});
