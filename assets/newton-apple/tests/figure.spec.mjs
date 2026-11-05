// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const near = (a, b, tol = 0.01) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);

async function open(page) {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'newton-apple');
  const frame = page.frames().find((f) => f.url().includes('/assets/newton-apple/'));
  return { log, fig, frame };
}

test('newton-apple: F follows the formula, g does not move with m', async ({ page }) => {
  const { log, fig } = await open(page);
  let st = await fig.call('get');
  expect(st).toMatchObject({ m: 0.2, h: 3, phase: 'hang', place: 'meadow' });
  near(st.F, 1.966, 0.002);
  near(st.g, 9.83);
  st = await fig.call('set', { m: 400, animate: false });
  expect(st.m).toBe(0.4);
  near(st.F, 3.932, 0.002);
  near(st.g, 9.83);
  near(st.arrow, st.F * 0.25, 0.002);
  expect(log.errors).toEqual([]);
});

test('newton-apple: a fall takes √(2h/g), leaves a picture every 0.1 s, and the trail stays', async ({ page }) => {
  const { log, fig } = await open(page);
  let st = await fig.call('set', { h: 5, drop: true, animate: false });
  expect(st.phase).toBe('landed');
  near(st.t, 1.009, 0.002);
  near(st.v, 9.91, 0.02);
  expect(st.y).toBe(0);
  expect(st.pictures).toBe(11);
  expect(st.runs).toBe(1);
  st = await fig.call('set', { h: 3, t: 0.5 });
  expect(st).toMatchObject({ phase: 'fall', h: 3 });
  near(st.y, 3 - 0.5 * 9.83 * 0.25, 0.005);
  near(st.v, 4.915, 0.01);
  expect(st.pictures).toBe(6);
  expect(log.errors).toEqual([]);
});

test('newton-apple: the fall really runs on the clock, and heavier apples take the same time', async ({ page }) => {
  const { log, fig } = await open(page);
  await fig.call('set', { drop: true });
  await fig.advance(1500);
  let st = await fig.call('get');
  expect(st.phase).toBe('fall');
  near(st.t, 0.3, 0.02);
  await fig.advance(3000);
  st = await fig.call('get');
  expect(st.phase).toBe('landed');
  const t1 = st.t;
  await fig.call('set', { m: 500, animate: false });
  await fig.advance(600);
  st = await fig.call('set', { drop: true, animate: false });
  expect(st.t).toBe(t1);
  expect(st.runs).toBe(2);
  expect(log.errors).toEqual([]);
});

test('newton-apple: a symbol shows what it stands for; R goes to the Earth and back', async ({ page }) => {
  const { log, fig, frame } = await open(page);
  await frame.locator('[data-sym="R"]').click();
  await fig.advance(1800);
  let st = await fig.call('get');
  expect(st).toMatchObject({ sym: 'R', place: 'globe', shot: 'globe' });
  await expect(frame.locator('.pvc-rule')).toContainText('কেন্দ্র');
  await frame.locator('[data-sym="m"]').click();
  await fig.advance(1800);
  st = await fig.call('get');
  expect(st).toMatchObject({ sym: 'm', place: 'meadow', shot: 'close' });
  await frame.locator('.na-gbtn').click();
  await fig.advance(1200);
  expect((await fig.call('get')).sym).toBe('g');
  await expect(frame.locator('.na-fml .k-m')).toBeHidden();
  expect(log.errors).toEqual([]);
});

test('newton-apple: sliders and keys change m and h; a change mid-fall starts again', async ({ page }) => {
  const { log, fig, frame } = await open(page);
  await fig.call('set', { drop: true });
  await fig.advance(500);
  expect((await fig.call('get')).phase).toBe('fall');
  await frame.locator('[data-sl="m"]').fill('350');
  let st = await fig.call('get');
  expect(st).toMatchObject({ m: 0.35, phase: 'hang', pictures: 0 });
  await frame.locator('[data-sl="h"]').fill('5');
  st = await fig.call('get');
  expect(st.h).toBe(5);
  await frame.locator('.pvc').first().focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowLeft');
  st = await fig.call('get');
  expect(st).toMatchObject({ h: 4, m: 0.3 });
  await page.keyboard.press('r');
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ h: 3, m: 0.2, runs: 0, phase: 'hang' });
  expect(log.errors).toEqual([]);
});

test('newton-apple: the test runs five questions and leaves the learn state as it was', async ({ page }) => {
  const { log, fig, frame } = await open(page);
  await fig.call('set', { m: 300, h: 4, animate: false });
  await fig.call('practice');
  await fig.advance(800);
  for (let i = 0; i < 5; i++) {
    await frame.locator('[data-q="0"]').first().click();
    await fig.advance(600);
    await frame.locator('[data-act="q-next"]').first().click();
    await fig.advance(600);
  }
  await expect(frame.locator('[data-act="q-again"]').first()).toBeVisible();
  await frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ m: 0.3, h: 4, mode: 'explore', place: 'meadow', phase: 'hang', locked: false });
  expect(log.errors).toEqual([]);
});
