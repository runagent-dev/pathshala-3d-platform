// Speed and velocity through the bridge (book pages 40–41, topic 2.5): the book's ride from A to B along the winding
// road (4 km, a সরণ of 2 km) in 20 minutes, step by step: ride, the সরণ, the two sums; then the straight road.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('speed-velocity: one ride, both দ্রুতি and বেগ', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'speed-velocity');
  const frame = page.frames().find((f) => f.url().includes('/assets/speed-velocity/'));

  let s = await fig.call('get');
  expect(s).toMatchObject({ path: 'winding', step: 'start', time: 0, distance: 0, running: false, speed: null, direction: null });

  // ১ ride: half way (4 s of the 8 s on screen) the cycle is 2 km along, moving, with a direction
  s = await fig.call('set', { playing: true });
  expect(s).toMatchObject({ step: 'ride', running: true });
  await fig.advance(4000);
  s = await fig.call('get');
  expect(s.time).toBeGreaterThan(9);
  expect(s.time).toBeLessThan(11);
  expect(s.distance).toBeGreaterThan(1.8);
  expect(s.distance).toBeLessThan(2.2);
  expect(s.direction).not.toBeNull();
  await fig.advance(4500);
  s = await fig.call('get');
  expect(s).toMatchObject({ step: 'end', time: 20, distance: 4, running: false, speed: 12, velocityDirection: 'NE', direction: null });
  expect(s.velocity).toBeCloseTo(6, 2);
  expect(s.displacement).toBeCloseTo(2, 2);

  // ২ and ৩ with the big button
  const act = frame.locator('.pvc-act');
  await act.click();
  expect((await fig.call('get')).step).toBe('displacement');
  await fig.advance(1500);
  await act.click();
  expect((await fig.call('get')).step).toBe('compare');
  await expect(frame.locator('.pvc-outcome')).toContainText('১২ km/h');

  // the straight road: back to A; at B the speed is the size of the velocity
  s = await fig.call('set', { path: 'straight' });
  expect(s).toMatchObject({ path: 'straight', step: 'start', time: 0 });
  s = await fig.call('set', { time: 20 });
  expect(s.speed).toBeCloseTo(s.velocity, 6);
  expect(s.speed).toBeCloseTo(6, 2);

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ path: 'winding', step: 'start', time: 0 });
  expect(log.errors).toEqual([]);
});
