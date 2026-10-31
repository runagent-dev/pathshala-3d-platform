// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): one
// weight stretches the spring x = 2 cm and two 4 cm, stress ÷ strain stays the same within the limit, with the weights
// off it comes back to L₀; past the elastic limit (4 N) it keeps a permanent set; a new spring is fresh again; the
// big button hangs a weight and takes them off; the test runs five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/elasticity/'));

test('elasticity: Hooke’s law within the limit, a permanent set past it', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'elasticity');
  expect(await fig.call('get')).toMatchObject({ n: 0, L0: 20, L: 20, x: 0, strain: 0, stress: 0, set: 0, next: 'hang' });

  const one = await fig.call('set', { n: 1, animate: false });
  expect(one).toMatchObject({ n: 1, F: 1, L: 22, x: 2, strain: 0.1, stress: 100000, ratio: 1000000 });
  const two = await fig.call('set', { n: 2, animate: false });
  expect(two).toMatchObject({ n: 2, L: 24, x: 4, strain: 0.2, stress: 200000, ratio: 1000000, points: 2 });

  // off: back to L₀
  const back = await fig.call('set', { n: 0, animate: false });
  expect(back).toMatchObject({ L: 20, set: 0, beyondLimit: false });
  expect(back.found).toMatchObject({ hang: true, double: true, back: true });

  // past the limit: much more stretch, and a set that stays
  const five = await fig.call('set', { n: 5, animate: false });
  expect(five).toMatchObject({ L: 33, x: 13, beyondLimit: true });
  expect(five.ratio).toBeLessThan(1000000);
  const off = await fig.call('set', { n: 0, animate: false });
  expect(off).toMatchObject({ L: 23, set: 3, next: 'new' });
  expect(off.found.set).toBe(true);

  // the stepper hangs one again
  await frameOf(page).locator('[data-step="1"]').click();
  await fig.advance(2500);
  expect(await fig.call('get')).toMatchObject({ n: 1, L: 25, settled: true });

  // a new spring
  const fresh = await fig.call('set', { spring: 'fresh' });
  expect(fresh).toMatchObject({ n: 0, L: 20, set: 0, points: 0 });

  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ n: 0, L: 20, look: 'all', view: 'front' });
  expect(reset.found).toEqual({ hang: false, double: false, back: false, limit: false, beyond: false, set: false });
  expect(log.errors).toEqual([]);
});

test('elasticity: the big button hangs a weight, then takes them off; the test runs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'elasticity');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await fig.advance(400);
  expect((await fig.call('get')).settled).toBe(false);
  await fig.advance(2200);
  expect(await fig.call('get')).toMatchObject({ n: 1, x: 2, settled: true, next: 'hang' });
  await fig.advance(4000); // the camera's short visit close to x and back
  await frame.locator('.pvc-act').click();
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ n: 2, x: 4, next: 'off' });
  await fig.advance(4000);
  await frame.locator('.pvc-act').click();
  await fig.advance(3000);
  const back = await fig.call('get');
  expect(back).toMatchObject({ n: 0, L: 20 });
  expect(back.found.back).toBe(true);

  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1200);
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
