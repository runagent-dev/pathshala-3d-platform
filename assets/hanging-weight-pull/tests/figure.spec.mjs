// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged):
// each experiment gives the book's numbers, a run covers the same distance for the block and the weight, the big
// button's next step follows the row of words, and the reset puts everything back.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('hanging-weight-pull: each experiment gives a = Mg/(M + m) and the one tension T', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hanging-weight-pull');
  const start = await fig.call('get');
  expect(start).toMatchObject({ id: 'w2', phase: 'ready', progress: 0, M: 2, m: 5, W: 19.6 });
  expect(start.results).toEqual({ w2: null, w5: null, heavy: null, two: null });

  await fig.call('set', { id: 'w2', release: true, animate: false });
  expect(await fig.call('get')).toMatchObject({ phase: 'done', progress: 1, a: 2.8, T: 14, distance: 0.34 });
  await fig.call('set', { id: 'w5', release: true, animate: false });
  expect(await fig.call('get')).toMatchObject({ id: 'w5', M: 5, m: 5, a: 4.9, T: 24.5 });
  await fig.call('set', { id: 'heavy', release: true, animate: false });
  const heavy = await fig.call('get');
  expect(heavy).toMatchObject({ m: 10, M: 5 });
  expect(heavy.a).toBeCloseTo(3.267, 2);
  expect(heavy.T).toBeCloseTo(32.667, 2);
  expect(heavy.T).toBeLessThan(heavy.W); // the string's tension is less than the weight
  // two strings, two tensions, the block towards the heavier mass (the book's 10 kg and 5 kg)
  await fig.call('set', { id: 'two', release: true, animate: false });
  const two = await fig.call('get');
  expect(two).toMatchObject({ kind: 'two', m2: 10, m1: 5, m: 5, towards: 'left', distance: 0.26 });
  expect(two.a).toBeCloseTo(2.45, 3);
  expect(two.T2).toBeCloseTo(73.5, 2);
  expect(two.T1).toBeCloseTo(61.25, 2);
  expect(two.results).toMatchObject({ w2: 2.8, w5: 4.9, heavy: 3.27, two: 2.45 });
  expect(log.errors).toEqual([]);
});

test('hanging-weight-pull: a frozen run, the next step and the reset', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hanging-weight-pull');
  const mid = await fig.call('set', { id: 'w5', at: 0.5 });
  expect(mid).toMatchObject({ phase: 'run', progress: 0.5 });
  expect(mid.distance).toBeCloseTo(0.17, 3);
  // after a run the big button offers the next experiment in the row (the first one not run yet)
  await fig.call('set', { id: 'w5', release: true, animate: false });
  expect((await fig.call('get')).next).toEqual({ id: 'w2', step: 2 });
  await fig.call('set', { id: 'w2', release: true, animate: false });
  expect((await fig.call('get')).next).toEqual({ id: 'heavy', step: 3 });
  // the block is held again
  const home = await fig.call('set', { home: true });
  expect(home).toMatchObject({ phase: 'ready', progress: 0, distance: 0 });
  const reset = await (async () => {
    await fig.call('reset');
    return fig.call('get');
  })();
  expect(reset).toMatchObject({ id: 'w2', phase: 'ready', view: 'front' });
  expect(reset.results).toEqual({ w2: null, w5: null, heavy: null, two: null });
  expect(log.errors).toEqual([]);
});

test('hanging-weight-pull: other masses, equal masses hold still, a mirrored example goes the other way', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hanging-weight-pull');
  // two equal masses hold each other: it stays held, a = 0
  await fig.call('set', { masses: { m2: 5, m1: 5, m: 5 } });
  const held = await fig.call('set', { release: true });
  expect(held).toMatchObject({ kind: 'two', phase: 'ready' });
  expect(held.a).toBeCloseTo(0, 6);
  // the heavier mass on the right: the block goes right, with the same size of a as the book's example
  await fig.call('set', { masses: { m2: 5, m1: 10, m: 5 } });
  const mirrored = await fig.call('set', { release: true, animate: false });
  expect(mirrored).toMatchObject({ phase: 'done', towards: 'right' });
  expect(mirrored.a).toBeCloseTo(2.45, 3);
  // a big mass runs like any other, and its run is not kept in the row of words
  const big = await fig.call('set', { masses: { M: 20, m: 0.5 }, release: true, animate: false });
  expect(big).toMatchObject({ phase: 'done', M: 20, m: 0.5 });
  expect(big.a).toBeCloseTo((20 * 9.8) / 20.5, 3);
  expect(big.results).toEqual({ w2: null, w5: null, heavy: null, two: null });
  expect(log.errors).toEqual([]);
});
