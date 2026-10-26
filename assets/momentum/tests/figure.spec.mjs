// The momentum figure through the bridge (runs with `npm run test:figures`; dev only, never packaged): p = m v for
// the truck and the bicycle at the same velocity, the sign to the left, the run and its result, the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('momentum: p = m v for both, 125 times, a vector', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'momentum');
  expect(await fig.call('get')).toMatchObject({
    speed: 5,
    dir: 'right',
    phase: 'start',
    truck: { m: 10000, v: 5, p: 50000 },
    bike: { m: 80, v: 5, p: 400 },
    ratio: 125,
  });
  // twice the velocity, twice the momentum
  await fig.call('set', { speed: 8 });
  expect(await fig.call('get')).toMatchObject({ truck: { p: 80000 }, bike: { p: 640 } });
  // to the left: negative velocity, negative momentum
  await fig.call('set', { speed: 4, dir: 'left' });
  expect(await fig.call('get')).toMatchObject({ dir: 'left', v: -4, truck: { p: -40000 }, bike: { p: -320 } });
  // the panel shows the same numbers, in Bangla digits
  const frame = page.frames().find((f) => f.url().includes('/assets/momentum/'));
  await expect(frame.locator('[data-row="far"] [data-v="p"]')).toHaveText('−৪০,০০০');
  await expect(frame.locator('[data-row="near"] [data-v="v"]')).toHaveText('−৪');
  // after the crash the table says it is the momentum they hit with
  await expect(frame.locator('.mo-cap')).not.toHaveClass(/\bon\b/);
  await fig.call('set', { at: 99 });
  await expect(frame.locator('.mo-cap')).toHaveClass(/\bon\b/);
  expect(log.errors).toEqual([]);
});

test('momentum: the run ends with the truck’s car shoved metres, the bicycle’s about a centimetre', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'momentum');
  await fig.call('set', { play: true });
  await fig.advance(400);
  expect(await fig.call('get')).toMatchObject({ phase: 'moving', playing: true });
  await fig.advance(3000);
  const end = await fig.call('get');
  expect(end).toMatchObject({ phase: 'done', playing: false });
  expect(end.moved.truck).toBeGreaterThan(1.5);
  expect(end.moved.bike).toBeLessThan(0.03);
  expect(end.dent.truck).toBeGreaterThan(3 * end.dent.bike);
  // a jump to a moment shows it paused
  await fig.call('set', { at: 0.8 });
  expect(await fig.call('get')).toMatchObject({ phase: 'moving', playing: false, t: 0.8 });
  expect(log.errors).toEqual([]);
});

test('momentum: the test asks five questions and each can be answered', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'momentum');
  const frame = page.frames().find((f) => f.url().includes('/assets/momentum/'));
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1500);
    await frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(300);
    await expect(frame.locator('.pvc-q-feedback')).not.toHaveAttribute('data-tone', '');
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await expect(frame.locator('.pvc-q-result')).toContainText('৫');
  // leaving the test brings the run back at the student's speed
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', speed: 5, dir: 'right', phase: 'start' });
  expect(log.errors).toEqual([]);
});
