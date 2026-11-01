// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): a push
// F₁ on the small piston makes P = F₁/A₁ and F₂ = F₁(A₂/A₁) on the big one; the car rises only when F₂ is more than its
// weight, and then only d₂ = d₁(A₁/A₂); a hundred pushes raise it more; the stepper and the row of words change F₁ and
// A₂/A₁; the camera looks inside; the test runs five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/pascal-law/'));

test('pascal-law: the same pressure, a hundred times the force, a hundredth of the distance', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pascal-law');
  const start = await fig.call('get');
  expect(start).toMatchObject({ F1: 100, ratio: 100, A1: 0.01, A2: 1, P: 10000, F2: 10000, W: 8000, lifts: true, phase: 'ready', rise: 0 });

  // one push: the handle goes down 10 cm, the car rises 1 mm
  const pushed = await fig.call('set', { phase: 'pushed', animate: false });
  expect(pushed).toMatchObject({ phase: 'pushed', d1: 10, d2: 1, rise: 1, pushes: 1, next: 'pump' });

  // a hundred more: 10 cm more
  const pumped = await fig.call('set', { phase: 'pumped', animate: false });
  expect(pumped).toMatchObject({ phase: 'pumped', pushes: 101, rise: 101 });

  // a weaker push: F₂ < W, the car stays down and the handle does not move
  const weak = await fig.call('set', { F1: 50, animate: false });
  expect(weak).toMatchObject({ F1: 50, P: 5000, F2: 5000, lifts: false, phase: 'stuck', rise: 0, d1: 0 });

  // a smaller piston (50 ×) needs 200 N; with it the car rises 2 mm a push
  await fig.call('set', { ratio: 50, F1: 200, animate: false });
  const fifty = await fig.call('set', { phase: 'pushed', animate: false });
  expect(fifty).toMatchObject({ ratio: 50, A2: 0.5, F2: 10000, lifts: true, phase: 'pushed', d2: 2, rise: 2 });

  // 10 × never lifts it, even at 300 N
  await frameOf(page).locator('[data-example="10"]').click();
  await fig.call('set', { F1: 300, animate: false });
  expect(await fig.call('get')).toMatchObject({ ratio: 10, F1: 300, F2: 3000, lifts: false });

  // the stepper: one step down
  await frameOf(page).locator('[data-step="F"][data-dir="-1"]').click();
  expect((await fig.call('get')).F1).toBe(250);

  // the top: the action lowers the car
  await fig.call('set', { ratio: 100, F1: 100, animate: false });
  const top = await fig.call('set', { phase: 'top', animate: false });
  expect(top).toMatchObject({ phase: 'top', rise: 250, next: 'lower' });

  // the camera looks inside and comes back
  expect((await fig.call('set', { look: 'inside', animate: false })).look).toBe('inside');
  await frameOf(page).locator('[data-act="inside"]').click();
  expect((await fig.call('get')).look).toBe('all');

  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ F1: 100, ratio: 100, phase: 'ready', rise: 0, look: 'all', view: 'front' });
  expect(reset.found).toEqual({ push: false, stuck: false, pump: false, ratios: [] });
  expect(log.errors).toEqual([]);
});

test('pascal-law: a tap pushes, the camera looks inside, more taps pump, the test runs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pascal-law');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await fig.advance(500);
  expect((await fig.call('get')).phase).toBe('push');
  await fig.advance(1200);
  const pushed = await fig.call('get');
  expect(pushed).toMatchObject({ phase: 'pushed', rise: 1 });
  // the tour: the oil close up, the scale, then the whole lift
  await fig.advance(1600);
  expect((await fig.call('get')).look).toBe('inside');
  await fig.advance(4000);
  expect((await fig.call('get')).look).toBe('rim');
  await fig.advance(4200);
  expect((await fig.call('get')).look).toBe('all');
  // the next tap pushes a hundred times
  await frame.locator('.pvc-act').click();
  await fig.advance(800);
  expect((await fig.call('get')).phase).toBe('pump');
  await fig.advance(6000);
  const pumped = await fig.call('get');
  expect(pumped).toMatchObject({ phase: 'pumped', pushes: 101, rise: 101 });
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
