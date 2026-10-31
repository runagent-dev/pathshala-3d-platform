// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// same force on a high heel (50 cm²) and a sneaker (200 cm²) gives P = F/A four times bigger under the heel, the heel
// sinks four times as deep, the stepper changes F, lifting leaves the prints, the camera looks close to each shoe,
// and the test runs five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/pressure/'));

test('pressure: the same force, four times the pressure under the heel', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pressure');
  const start = await fig.call('get');
  expect(start).toMatchObject({ F: 500, A: { heel: 50, sneaker: 200 }, P: { heel: 100000, sneaker: 25000 }, ratio: 4, phase: 'ready', look: 'both' });
  expect(start.depth).toEqual({ heel: 0, sneaker: 0 });

  // standing: the heel goes four times as deep
  const stood = await fig.call('set', { phase: 'stand', animate: false });
  expect(stood.phase).toBe('stand');
  expect(stood.depth.heel).toBeGreaterThan(3);
  expect(stood.depth.heel / stood.depth.sneaker).toBeCloseTo(4, 1);
  expect(stood.next).toBe('lift');

  // more force: more pressure, the same ratio; they stand again on smooth sand
  const more = await fig.call('set', { F: 800, animate: false });
  expect(more).toMatchObject({ F: 800, P: { heel: 160000, sneaker: 40000 }, phase: 'stand' });
  expect(more.depth.heel).toBeGreaterThan(stood.depth.heel);

  // lifted: the prints stay
  const lifted = await fig.call('set', { phase: 'lift', animate: false });
  expect(lifted.phase).toBe('lift');
  expect(lifted.depth).toEqual(more.depth);
  expect(lifted.found).toMatchObject({ stand: true, lift: true, force: true });

  // the stepper: one step down, back in the sand at 700 N
  await frameOf(page).locator('[data-step="F"][data-dir="-1"]').click();
  await fig.advance(4000);
  const less = await fig.call('get');
  expect(less).toMatchObject({ F: 700, P: { heel: 140000, sneaker: 35000 }, phase: 'stand' });

  // the row of words moves the camera
  expect((await fig.call('set', { look: 'heel', animate: false })).look).toBe('heel');
  await frameOf(page).locator('[data-example="sneaker"]').click();
  expect((await fig.call('get')).look).toBe('sneaker');

  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ F: 500, phase: 'ready', look: 'both', view: 'front', depth: { heel: 0, sneaker: 0 } });
  expect(reset.found).toEqual({ stand: false, lift: false, force: false });
  expect(log.errors).toEqual([]);
});

test('pressure: one tap stands them on the sand, the next lifts them; the camera visits each shoe', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pressure');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await fig.advance(600);
  expect((await fig.call('get')).phase).toBe('press');
  await fig.advance(1600);
  const stood = await fig.call('get');
  expect(stood.phase).toBe('stand');
  // the tour: close to the heel, then the sneaker, then both again
  await fig.advance(1200);
  expect((await fig.call('get')).look).toBe('heel');
  await fig.advance(3400);
  expect((await fig.call('get')).look).toBe('sneaker');
  await fig.advance(3400);
  expect((await fig.call('get')).look).toBe('both');
  // the second tap lifts the feet
  await frame.locator('.pvc-act').click();
  await fig.advance(1500);
  const lifted = await fig.call('get');
  expect(lifted.phase).toBe('lift');
  expect(lifted.depth.heel).toBeGreaterThan(lifted.depth.sneaker * 3.5);
  // the test: five questions, each answered
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
  expect((await fig.call('get')).mode).toBe('explore');
  expect(log.errors).toEqual([]);
});
