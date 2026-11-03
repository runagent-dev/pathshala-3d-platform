// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the one
// guided sequence (mercury 76 cm → water 10.3 m → compared × 13.6 → the 10.5 m straw → watch again) with its one
// button; set and reset; the four-question test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/torricelli-water-barometer/'));

test('torricelli-water-barometer: one button walks the four steps and starts over', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-water-barometer');
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ step: 'mercury', stepNumber: 1, water: 0, mercury: 76, next: 'water' });

  await frame.locator('.pvc-act').click();
  await fig.advance(9000);
  expect(await fig.call('get')).toMatchObject({ step: 'water', water: 10.3, busy: false, next: 'compare' });

  await frame.locator('.pvc-act').click();
  await fig.advance(7000);
  expect(await fig.call('get')).toMatchObject({ step: 'compare', water: 10.3, busy: false, next: 'straw' });

  await frame.locator('.pvc-act').click();
  await fig.advance(5000);
  expect(await fig.call('get')).toMatchObject({ step: 'straw', busy: false, found: 4, next: 'again' });

  await frame.locator('.pvc-act').click();
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ step: 'mercury', water: 0, busy: false });

  expect(await fig.call('set', { step: 'compare', animate: false })).toMatchObject({ step: 'compare', water: 10.3 });
  expect(await fig.call('set', { step: 1, animate: false })).toMatchObject({ step: 'mercury', water: 0 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'mercury', found: 1, mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('torricelli-water-barometer: a second tap mid-step does not skip it', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-water-barometer');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await fig.advance(1500);
  await frame.locator('.pvc-act').click();
  await fig.advance(200);
  expect(await fig.call('get')).toMatchObject({ step: 'water', busy: true });
  await fig.advance(8000);
  expect(await fig.call('get')).toMatchObject({ step: 'water', water: 10.3, busy: false });
  expect(log.errors).toEqual([]);
});

test('torricelli-water-barometer: the test runs four questions', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-water-barometer');
  const frame = frameOf(page);
  await fig.call('practice');
  for (let i = 0; i < 4; i++) {
    await fig.advance(1200);
    await frame.locator('[data-q]').first().click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'mercury', busy: false });
  expect(log.errors).toEqual([]);
});
