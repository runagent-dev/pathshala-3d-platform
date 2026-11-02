// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// same air holds up 10.3 m of water beside 76 cm of mercury; the one button fills the pipe and plays it again; the
// test runs three questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/torricelli-water-barometer/'));

test('torricelli-water-barometer: the water rises to 10.3 m beside 76 cm of mercury', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-water-barometer');
  expect(await fig.call('get')).toMatchObject({ phase: 'ready', height: 0, mercury: 76, next: 'water' });
  expect(await frameOf(page).locator('[data-example]').count()).toBe(0);

  await frameOf(page).locator('.pvc-act').click();
  await fig.advance(6000);
  expect(await fig.call('get')).toMatchObject({ phase: 'done', height: 10.3, found: true, next: 'replay' });

  expect(await fig.call('set', { water: 'ready', animate: false })).toMatchObject({ phase: 'ready', height: 0 });
  expect(await fig.call('set', { water: 'done', animate: false })).toMatchObject({ phase: 'done', height: 10.3 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ phase: 'ready', found: false, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('torricelli-water-barometer: the test runs three questions', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-water-barometer');
  const frame = frameOf(page);
  await fig.call('practice');
  for (let i = 0; i < 3; i++) {
    await fig.advance(1000);
    await frame.locator('[data-q]').first().click();
    await fig.advance(200);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', phase: 'ready' });
  expect(log.errors).toEqual([]);
});
