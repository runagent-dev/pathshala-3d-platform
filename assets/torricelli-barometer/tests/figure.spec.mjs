// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// mercury stops at 76 cm with a vacuum above (P = hρg ≈ 10⁵ Pa), the one button fills, turns over and releases the
// tube, and the test runs three questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/torricelli-barometer/'));

test('torricelli-barometer: 76 cm of mercury, a vacuum above', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer');
  const start = await fig.call('get');
  expect(start).toMatchObject({ phase: 'ready', H: 76, P: 101293, next: 'fill' });
  expect(await frameOf(page).locator('[data-example]').count()).toBe(0);

  const settled = await fig.call('set', { phase: 'settled', animate: false });
  expect(settled).toMatchObject({ phase: 'settled', column: 76, P: 101293, next: 'again', found: true });
  expect(settled.vacuum).toBeGreaterThan(20);

  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ phase: 'ready', H: 76, view: 'front', mode: 'explore' });
  expect(reset.found).toBe(false);
  expect(log.errors).toEqual([]);
});

test('torricelli-barometer: the one button fills, turns over and releases the tube, then starts again', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer');
  const act = frameOf(page).locator('.pvc-act');

  await act.click();
  await fig.advance(600);
  expect((await fig.call('get')).phase).toBe('filling');
  await fig.advance(1500);
  expect((await fig.call('get')).phase).toBe('full');

  await act.click();
  await fig.advance(3200);
  expect((await fig.call('get')).phase).toBe('dipped');

  await act.click();
  await fig.advance(2800);
  expect(await fig.call('get')).toMatchObject({ phase: 'settled', column: 76, found: true, next: 'again' });

  await act.click();
  await fig.advance(800);
  expect((await fig.call('get')).phase).toBe('ready');
  expect(log.errors).toEqual([]);
});

test('torricelli-barometer: the test runs three questions and goes back to the tube', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer');
  const frame = frameOf(page);
  await fig.call('set', { phase: 'full', animate: false });

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
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', phase: 'full' });
  expect(log.errors).toEqual([]);
});
