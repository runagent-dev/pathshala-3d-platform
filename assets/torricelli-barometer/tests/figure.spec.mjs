// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// mercury stops at 76 cm with a vacuum above (P = hρg ≈ 10⁵ Pa), a tilted tube keeps the vertical height, the column
// falls up a mountain, sucking lifts the drink in the straw, water needs 10.3 m, the tank's jet comes only with the lid
// off, the numbered steps fill, turn, release and pierce the tube, and the test runs five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/torricelli-barometer/'));

test('torricelli-barometer: 76 cm of mercury, a vacuum above, the same height tilted, lower up a mountain', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer');
  const start = await fig.call('get');
  expect(start).toMatchObject({ example: 'torricelli', phase: 'ready', H: 76, P: 101293, next: 'fill' });

  const settled = await fig.call('set', { phase: 'settled', animate: false });
  expect(settled).toMatchObject({ phase: 'settled', column: 76, along: 76, P: 101293, next: 'pierce' });
  expect(settled.vacuum).toBeGreaterThan(20);

  const pierced = await fig.call('set', { phase: 'pierced', animate: false });
  expect(pierced).toMatchObject({ phase: 'pierced', column: 0, vacuum: 0 });

  // tilted: the vertical height stays 76 cm, the mercury takes more of the tube
  const tilted = await fig.call('set', { tilt: 30, animate: false });
  expect(tilted).toMatchObject({ example: 'tilt', tilt: 30, column: 76, along: 88 });
  expect(tilted.vacuum).toBeGreaterThan(0);

  // up a mountain: less air, a lower column, less pressure
  const high = await fig.call('set', { alt: 2000, animate: false });
  expect(high).toMatchObject({ example: 'mountain', alt: 2000, H: 60, column: 60, P: 79968 });

  // the straw: equal pressures, nothing rises; sucking lifts the drink to the mouth
  const straw = await fig.call('set', { example: 'straw', animate: false });
  expect(straw).toMatchObject({ example: 'straw', suck: false, rise: 0, H: 76 });
  expect((await fig.call('set', { suck: true, animate: false })).rise).toBe(20);

  // water instead of mercury: 10.3 m
  expect((await fig.call('set', { water: 'done', animate: false })).water).toEqual({ phase: 'done', height: 10.3 });

  // the tank: lid on, no jet; lid off, a jet
  expect((await fig.call('set', { tank: 'stopped', animate: false })).tank).toMatchObject({ phase: 'stopped', jet: false });
  expect((await fig.call('set', { tank: 'open', animate: false })).tank).toMatchObject({ phase: 'open', depth: 0.22, jet: true });

  // the row of words
  await frameOf(page).locator('[data-example="torricelli"]').click();
  await fig.advance(1200);
  expect((await fig.call('get')).example).toBe('torricelli');

  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ example: 'torricelli', phase: 'ready', H: 76, view: 'front', mode: 'explore' });
  expect(Object.values(reset.found).every((v) => v === false)).toBe(true);
  expect(log.errors).toEqual([]);
});

test('torricelli-barometer: the numbered steps fill, turn over, release and pierce the tube', async ({ page }) => {
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
  expect(await fig.call('get')).toMatchObject({ phase: 'settled', column: 76, found: { torricelli: true } });
  // the camera's tour starts close to the vacuum
  await fig.advance(1000);
  expect((await fig.call('get')).look).toBe('vacuum');

  // the fourth step: air in at the top, the column falls into the dish (and the tour stops)
  await act.click();
  await fig.advance(2200);
  expect(await fig.call('get')).toMatchObject({ phase: 'pierced', column: 0, look: 'all', found: { pierced: true } });
  expect(log.errors).toEqual([]);
});

test('torricelli-barometer: sucking lifts the drink; the test runs five questions', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer');
  const frame = frameOf(page);
  await frame.locator('[data-example="straw"]').click();
  await fig.advance(1000);
  await frame.locator('.pvc-act').click();
  await fig.advance(1600);
  expect(await fig.call('get')).toMatchObject({ example: 'straw', suck: true, rise: 20 });

  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1000);
    await frame.locator('[data-q]').first().click();
    await fig.advance(200);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', example: 'straw' });
  expect(log.errors).toEqual([]);
});
