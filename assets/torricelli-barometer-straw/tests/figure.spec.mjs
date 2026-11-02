// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): no
// sucking, equal pressures, nothing rises; the one button lifts the drink to the mouth and lets it fall back; the test
// runs three questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/torricelli-barometer-straw/'));

test('torricelli-barometer-straw: equal pressures, nothing rises; sucking lifts the drink to the mouth', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer-straw');
  expect(await fig.call('get')).toMatchObject({ suck: false, rise: 0, mouth: 1, next: 'suck' });
  expect(await frameOf(page).locator('[data-example]').count()).toBe(0);

  const act = frameOf(page).locator('.pvc-act');
  await act.click();
  await fig.advance(1600);
  expect(await fig.call('get')).toMatchObject({ suck: true, rise: 20, found: true, next: 'stop' });
  expect((await fig.call('get')).mouth).toBeLessThan(1);

  await act.click();
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ suck: false, rise: 0, mouth: 1 });

  expect((await fig.call('set', { suck: true, animate: false })).rise).toBe(20);
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ suck: false, rise: 0, found: false, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('torricelli-barometer-straw: the test runs three questions', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer-straw');
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
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', suck: false });
  expect(log.errors).toEqual([]);
});
