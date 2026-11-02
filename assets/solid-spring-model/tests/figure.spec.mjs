// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('solid-spring-model: the temperature steps through cold, heated and heated more', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'solid-spring-model');
  expect(await fig.call('get')).toMatchObject({ level: 'cold', tau: 0, growth: 0 });
  await fig.call('set', { level: 'warm', animate: false });
  const warm = await fig.call('get');
  expect(warm).toMatchObject({ level: 'warm', tau: 0.5 });
  await fig.call('set', { level: 'hot', animate: false });
  const hot = await fig.call('get');
  expect(hot.growth).toBeGreaterThan(warm.growth);
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ level: 'cold' });
  expect(log.errors).toEqual([]);
});

test('solid-spring-model: the action heats one step, a chip jumps, the test has four questions', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'solid-spring-model');
  const f = fig.frame;
  await f.locator('.pvc-act-slot button').first().click();
  await fig.advance(1500);
  expect((await fig.call('get')).level).toBe('warm');
  await f.locator('[data-example="hot"]').click();
  await fig.advance(1500);
  expect((await fig.call('get')).level).toBe('hot');
  await f.locator('.pvc-act-slot button').first().click(); // hottest: the button cools it again
  await fig.advance(1500);
  expect((await fig.call('get')).level).toBe('cold');
  await f.locator('[data-mode="quiz"]').click();
  await fig.advance(500);
  await expect(f.locator('.pvc-q-count')).toContainText('৪');
  expect(log.errors).toEqual([]);
});
