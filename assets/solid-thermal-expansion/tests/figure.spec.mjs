// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('solid-thermal-expansion: the book copper rod, 10 m at 20° C, is 10.0167 m at 120° C', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'solid-thermal-expansion');
  expect(await fig.call('get')).toMatchObject({ quantity: 'length', T2: 20, dT: 0, L2: 10 });
  await fig.call('set', { T2: 120, animate: false });
  const hot = await fig.call('get');
  expect(hot.T2).toBe(120);
  expect(hot.L2).toBeCloseTo(10.0167, 4);
  expect(hot.A2).toBeCloseTo(100.334, 3); // β = 2α
  expect(hot.V2).toBeCloseTo(1005.01, 2); // γ = 3α
  await fig.call('set', { quantity: 'volume' });
  expect((await fig.call('get')).quantity).toBe('volume');
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ quantity: 'length', T2: 20 });
  expect(log.errors).toEqual([]);
});

test('solid-thermal-expansion: the button heats to 120° C and cools again, a chip chooses, the test has five questions', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'solid-thermal-expansion');
  const f = fig.frame;
  await f.locator('.pvc-act-slot button').first().click();
  await fig.advance(4000);
  expect((await fig.call('get')).T2).toBe(120);
  await f.locator('[data-example="area"]').click();
  await fig.advance(300);
  expect((await fig.call('get')).quantity).toBe('area');
  await f.locator('.pvc-act-slot button').first().click(); // at 120° C the button cools it again
  await fig.advance(4000);
  expect((await fig.call('get')).T2).toBe(20);
  await f.locator('[data-mode="quiz"]').click();
  await fig.advance(500);
  await expect(f.locator('.pvc-q-count')).toContainText('৫');
  expect(log.errors).toEqual([]);
});
