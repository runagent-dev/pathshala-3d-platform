// Falling bodies through the bridge (book pp. 48–49, topic 2.8): without air the stone and the paper fall together
// (0.3 s down the tube), in air the stone lands first and the paper far later; the pictures every 0.1 s give
// v = gt and h = ½gt²; a crumpled paper (the same mass) falls almost with the stone even in air. Runs with
// `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('falling bodies: together without air, the paper behind in air, v ∝ t and h ∝ t²', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'falling-bodies');

  expect(await fig.call('get')).toMatchObject({ phase: 'ready', t: 0, paper: 'flat', steps: [] });

  // 0.2 s after the release, paused: without air both at ½·9.8·0.2² = 0.196 m; in air the paper lags
  const mid = await fig.call('set', { t: 0.2 });
  expect(mid).toMatchObject({ phase: 'paused', t: 0.2, vacuum: { stone: 0.196, paper: 0.196, down: false } });
  expect(mid.air.paper).toBeLessThan(mid.air.stone - 0.05);
  expect(mid.steps).toEqual([
    { t: 0.1, v: 0.98, h: 0.049 },
    { t: 0.2, v: 1.96, h: 0.196 },
  ]);

  // let go and play (8 times slower): after 0.3 s of fall (2.4 s) both are down without air, the paper not in air
  await fig.call('set', { release: true });
  expect((await fig.call('get')).phase).toBe('falling');
  await fig.advance(2600);
  const down = await fig.call('get');
  expect(down.vacuum.down).toBe(true);
  expect(down.air.stoneDown).toBe(true);
  expect(down.air.paperDown).toBe(false);
  expect(down.steps.map((s) => s.h)).toEqual([0.049, 0.196, 0.441]);
  await fig.advance(2000);
  const done = await fig.call('get');
  expect(done).toMatchObject({ phase: 'done', air: { paperDown: true } });
  expect(done.times.vacuum).toBeCloseTo(0.3, 3);
  expect(done.times.airPaper).toBeGreaterThan(0.45);

  // one step of 0.1 s from the start, played and then paused there
  await fig.call('set', { t: 0 });
  await fig.call('set', { step: 1 });
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ phase: 'paused', t: 0.1 });

  // the same paper crumpled: back to the start; in air it now lands only a little after the stone
  expect(await fig.call('set', { paper: 'crumpled' })).toMatchObject({ phase: 'ready', paper: 'crumpled' });
  const crumpled = await fig.call('set', { release: true, animate: false });
  expect(crumpled.phase).toBe('done');
  expect(crumpled.times.airPaper - crumpled.times.airStone).toBeLessThan(0.03);

  await fig.call('reset');
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ phase: 'ready', paper: 'flat', view: 'front' });
  expect(log.errors).toEqual([]);
});

// The tests above run without shadows (TEST_PARAMS); a reader gets them by default, and the shadow code once used a
// name it never imported (BASE): the figure then never got ready.
test('falling bodies: with shadows (the default for a reader) it gets ready without errors', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'falling-bodies', { params: { shadow: '1' } });
  expect((await fig.call('get')).phase).toBe('ready');
  expect(log.errors).toEqual([]);
});
