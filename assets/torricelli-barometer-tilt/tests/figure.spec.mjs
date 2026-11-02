// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): a
// tilted tube keeps the vertical height at 76 cm while the mercury takes more of the tube; the one button steps the
// tilt and stands it upright again; the test runs three questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/torricelli-barometer-tilt/'));

test('torricelli-barometer-tilt: the vertical height stays 76 cm, the mercury takes more of the tube', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer-tilt');
  expect(await fig.call('get')).toMatchObject({ tilt: 0, column: 76, along: 76, next: 'tilt' });
  expect(await frameOf(page).locator('[data-example]').count()).toBe(0);

  const tilted = await fig.call('set', { tilt: 30, animate: false });
  expect(tilted).toMatchObject({ tilt: 30, column: 76, along: 88 });
  expect(tilted.vacuum).toBeGreaterThan(0);
  expect((await fig.call('set', { tilt: 40, animate: false })).vacuum).toBeGreaterThan(0);

  // the one button: at 40° it stands the tube upright, then tilts it 10°
  const act = frameOf(page).locator('.pvc-act');
  await act.click();
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ tilt: 0, column: 76 });
  await act.click();
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ tilt: 10, column: 76, found: true });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ tilt: 0, found: false, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('torricelli-barometer-tilt: the test runs three questions', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer-tilt');
  const frame = frameOf(page);
  await fig.call('set', { tilt: 10, animate: false });
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
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', tilt: 10 });
  expect(log.errors).toEqual([]);
});
