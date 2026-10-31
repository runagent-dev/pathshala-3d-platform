// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// ship floats 1.3 m deep empty with its weight equal to its buoyancy (P₂ = hρg, F = Ahρg), the steel cylinder of the
// same mass reads less on the balance in the water and sinks when let go, the water pushed aside weighs as much as the
// buoyancy, each container sinks the ship 0.1 m deeper, the buttons step through it, and the test runs five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/buoyancy-ship/'));

test('buoyancy-ship: weight = buoyancy = the weight of the water pushed aside, at every load', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'buoyancy-ship');
  const start = await fig.call('get');
  expect(start).toMatchObject({ step: 'pressure', phase: 0, load: 0, draft: 1.3, W: 2548000, B: 2548000, V: 260, P2: 12740 });

  // চাপ: the arrows, then added up
  const summed = await fig.call('set', { step: 'pressure', phase: 2, animate: false });
  expect(summed).toMatchObject({ step: 'pressure', phase: 2, next: 'again_p' });
  expect(summed.found).toMatchObject({ pressure: true, sum: true });

  // ওজন ও প্লবতা: the cylinder on the balance in air, in the water (lighter by its buoyancy), let go (sunk)
  const air = await fig.call('set', { step: 'weight', phase: 0, animate: false });
  expect(air).toMatchObject({ steel: 'air', reading: 2548000 });
  const water = await fig.call('set', { phase: 1, animate: false });
  expect(water.steel).toBe('water');
  expect(water.reading).toBeGreaterThan(2548000 - 330000);
  expect(water.reading).toBeLessThan(2548000 - 320000);
  const sunk = await fig.call('set', { phase: 2, animate: false });
  expect(sunk).toMatchObject({ steel: 'bottom', reading: 0 });

  // অপসারিত পানি: the balance reads the buoyancy
  const ghost = await fig.call('set', { step: 'displaced', phase: 1, animate: false });
  expect(ghost.reading).toBe(ghost.B);

  // মাল বোঝাই: six containers, 1.9 m deep, the weight still equal to the buoyancy
  const six = await fig.call('set', { step: 'load', load: 6, animate: false });
  expect(six).toMatchObject({ load: 6, draft: 1.9, mass: 380000, W: 3724000, B: 3724000 });
  // the action loads one more; the ship settles
  await frameOf(page).locator('.pvc-act').click();
  await fig.advance(3500);
  expect(await fig.call('get')).toMatchObject({ load: 7, draft: 2, W: 3920000, B: 3920000 });
  // the stepper takes one off
  await frameOf(page).locator('[data-step="load"][data-dir="-1"]').click();
  await fig.advance(3500);
  expect((await fig.call('get')).load).toBe(6);
  const full = await fig.call('set', { load: 12, animate: false });
  expect(full).toMatchObject({ draft: 2.5, next: 'unload' });

  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ step: 'pressure', phase: 0, load: 0, draft: 1.3, view: 'front' });
  expect(reset.found).toEqual({ pressure: false, sum: false, lower: false, drop: false, ghost: false, load: false });
  expect(log.errors).toEqual([]);
});

test('buoyancy-ship: taps step through the pressure, the words change the step, the test has five questions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'buoyancy-ship');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await fig.advance(2200);
  expect((await fig.call('get')).phase).toBe(1);
  await frame.locator('.pvc-act').click();
  await fig.advance(2800);
  expect((await fig.call('get')).phase).toBe(2);
  // the words: ওজন ও প্লবতা, then lower the cylinder with the action
  await frame.locator('[data-example="weight"]').click();
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ step: 'weight', phase: 0, steel: 'air' });
  await frame.locator('.pvc-act').click();
  await fig.advance(3200);
  expect((await fig.call('get')).steel).toBe('water');
  // the test
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1500);
    await frame.locator('[data-q]').first().click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'weight' });
  expect(log.errors).toEqual([]);
});
