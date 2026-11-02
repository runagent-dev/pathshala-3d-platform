// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): up a
// mountain the column falls (76, 67, 60, 53 cm) and the air's pressure with it; the one button climbs and comes back
// to the sea; the test runs three questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/torricelli-barometer-mountain/'));

test('torricelli-barometer-mountain: less air higher up, a lower column', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer-mountain');
  expect(await fig.call('get')).toMatchObject({ alt: 0, H: 76, P: 101293, next: 'up' });
  expect(await frameOf(page).locator('[data-example]').count()).toBe(0);

  expect(await fig.call('set', { alt: 2000, animate: false })).toMatchObject({ alt: 2000, H: 60, column: 60, P: 79968 });

  const act = frameOf(page).locator('.pvc-act');
  await act.click();
  await fig.advance(1600);
  expect(await fig.call('get')).toMatchObject({ alt: 3000, H: 53, next: 'down', found: true });
  await act.click();
  await fig.advance(1600);
  expect(await fig.call('get')).toMatchObject({ alt: 0, H: 76 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ alt: 0, found: false, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('torricelli-barometer-mountain: the test runs three questions', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer-mountain');
  const frame = frameOf(page);
  await fig.call('set', { alt: 1000, animate: false });
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
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', alt: 1000 });
  expect(log.errors).toEqual([]);
});
