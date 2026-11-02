// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): lid
// on, no jet; lid off, a jet that weakens as the tank drains; the one button pulls the cork, opens the lid and refills;
// the test runs three questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/torricelli-barometer-tank/'));

test('torricelli-barometer-tank: lid on, no jet; lid off, a jet', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer-tank');
  expect(await fig.call('get')).toMatchObject({ phase: 'corked', depth: 0.22, jet: false, next: 'cork' });
  expect(await frameOf(page).locator('[data-example]').count()).toBe(0);

  const act = frameOf(page).locator('.pvc-act');
  await act.click();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ phase: 'stopped', jet: false, next: 'lid' });
  await act.click();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ phase: 'open', jet: true, found: true, next: 'refill' });
  await fig.advance(4000);
  expect((await fig.call('get')).depth).toBeLessThan(0.22);
  await act.click();
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ phase: 'corked', depth: 0.22 });

  expect(await fig.call('set', { tank: 'open' })).toMatchObject({ phase: 'open', depth: 0.22, jet: true });
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ phase: 'corked', found: false, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('torricelli-barometer-tank: the test runs three questions', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer-tank');
  const frame = frameOf(page);
  await fig.call('set', { tank: 'stopped' });
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
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', phase: 'stopped' });
  expect(log.errors).toEqual([]);
});
