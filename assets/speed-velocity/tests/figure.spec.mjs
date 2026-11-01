// Speed and velocity through the bridge (book page 40, topic 2.5): boy 1 runs 100 m on a zig-zag path in 20 s
// (5 m/s, no direction), boy 2 runs 50 m straight in the direction the student picks (2.5 m/s, with a direction).
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('speed-velocity: run, turn boy 2, read speed and velocity', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'speed-velocity');

  let s = await fig.call('get');
  expect(s).toMatchObject({ time: 0, angle: 40, direction: 'NE', running: false, speed: null, velocity: null });

  s = await fig.call('set', { playing: true });
  expect(s.running).toBe(true);
  await fig.advance(3000); // half of the 6 s on screen: 10 s of the run
  s = await fig.call('get');
  expect(s.time).toBeGreaterThan(9);
  expect(s.time).toBeLessThan(11);
  expect(s.speed).toBeCloseTo(5, 6);
  expect(s.velocity).toBeCloseTo(2.5, 6);
  await fig.advance(3500);
  expect(await fig.call('get')).toMatchObject({ time: 20, distance: 100, displacement: 50, speed: 5, velocity: 2.5, running: false });

  // a new direction: back on the start line, the same 2.5 m/s, a different direction
  s = await fig.call('set', { angle: 135 });
  expect(s).toMatchObject({ time: 0, angle: 135, direction: 'NW' });
  expect((await fig.call('set', { angle: 120 })).angle).toBe(120);
  s = await fig.call('set', { time: 20 });
  expect(s).toMatchObject({ velocity: 2.5, speed: 5, angle: 120 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ time: 0, angle: 40, view: 'front' });
  expect(log.errors).toEqual([]);
});
