// Stopwatch behaviour through the bridge (book p23, topic 1.6.3): it counts from start to stop, the reading in
// seconds is minutes × 60 + seconds, it does not reset while running, and the lamp game compares a hand-timed
// reading with the lamp's real time. Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('stopwatch: start, stop, read in seconds, time the lamp', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'stopwatch');

  expect(await fig.call('get')).toMatchObject({ time: 0, running: false, lamp: null });

  await fig.call('set', { running: true });
  await fig.advance(3200);
  expect(await fig.call('get')).toMatchObject({ running: true });
  await fig.call('set', { running: false });
  const timed = await fig.call('get');
  expect(timed.running).toBe(false);
  expect(timed.time).toBeGreaterThanOrEqual(3.15);
  expect(timed.time).toBeLessThanOrEqual(3.3);

  await fig.call('set', { time: 191.12 });
  expect(await fig.call('get')).toMatchObject({ time: 191.12, text: '3:11.12', min: 3, sec: 11.12, running: false });

  // the lamp is on for 2 s from 0.5 s; started 0.3 s late and stopped 0.3 s late, the hand-timed reading is ~2 s
  await fig.call('set', { round: { delay: 0.5, on: 2 } });
  expect(await fig.call('get')).toMatchObject({ time: 0, lamp: { phase: 'wait', on: false } });
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ lamp: { phase: 'on', on: true } });
  await fig.call('set', { running: true });
  await fig.advance(2000);
  await fig.call('set', { running: false });
  await fig.advance(300);
  const round = await fig.call('get');
  expect(round.lamp).toMatchObject({ phase: 'done', on: false, real: 2 });
  expect(Math.abs(round.lamp.measured - 2)).toBeLessThan(0.06);
  expect(round.lamp.diff).toBeCloseTo(Math.abs(round.lamp.measured - 2), 2);

  await fig.call('reset');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ time: 0, running: false, lamp: null, view: 'front' });
  expect(log.errors).toEqual([]);
});
