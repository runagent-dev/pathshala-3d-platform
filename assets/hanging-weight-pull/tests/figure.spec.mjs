// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// row of words gives the book's law for the bucket (T − Mg = Ma, up positive), a run goes up, down or nowhere, the
// steppers change the numbers, the big button's next step follows the row, and the book's examples window solves
// চিত্র ৩.০৯ and ৩.১০.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('hanging-weight-pull: the bucket on the rope follows T − Mg = Ma', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hanging-weight-pull');
  const start = await fig.call('get');
  expect(start).toMatchObject({ id: 'hold', phase: 'ready', T: 98, M: 10, W: 98, a: 0, speed: 0 });
  expect(start.results).toEqual({ hold: null, pull: null, ease: null, full: null });

  // held: it stays where it is
  const held = await fig.call('set', { release: true, animate: false });
  expect(held).toMatchObject({ phase: 'done', end: 'held', a: 0 });
  expect(held.height).toBeCloseTo(start.height, 6);
  // pulled hard: up to the top, a = +3.2
  const up = await fig.call('set', { id: 'pull', release: true, animate: false });
  expect(up).toMatchObject({ id: 'pull', T: 130, M: 10, phase: 'done', end: 'top' });
  expect(up.a).toBeCloseTo(3.2, 3);
  expect(up.height).toBeGreaterThan(start.height);
  // eased off: down to the water, a = −2.8
  const down = await fig.call('set', { id: 'ease', release: true, animate: false });
  expect(down).toMatchObject({ end: 'water' });
  expect(down.a).toBeCloseTo(-2.8, 3);
  expect(down.height).toBeLessThan(start.height);
  // more water with the same pull: smaller a
  const full = await fig.call('set', { id: 'full', release: true, animate: false });
  expect(full).toMatchObject({ T: 130, M: 12, end: 'top' });
  expect(full.a).toBeCloseTo(1.033, 2);
  expect(full.results).toEqual({ hold: 0, pull: 3.2, ease: -2.8, full: 1.03 });
  expect(log.errors).toEqual([]);
});

test('hanging-weight-pull: a run in time, the steppers, the next step and the reset', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hanging-weight-pull');
  // a real run on the virtual clock: v = at (time slowed 3 times on the screen)
  await fig.call('set', { id: 'pull', release: true });
  await fig.advance(1500);
  const mid = await fig.call('get');
  expect(mid.phase).toBe('run');
  expect(mid.time).toBeCloseTo(0.5, 1);
  expect(mid.speed).toBeCloseTo(3.2 * mid.time, 2);
  await fig.advance(4000);
  expect((await fig.call('get')).phase).toBe('done');
  // the big button then offers the first experiment not run yet
  expect((await fig.call('get')).next).toEqual({ id: 'hold', step: 2 });
  // the steppers' numbers: other numbers than the row's, held at the start, not kept in the row
  const custom = await fig.call('set', { T: 150, M: 8 });
  expect(custom).toMatchObject({ id: null, T: 150, M: 8, phase: 'ready' });
  expect(custom.a).toBeCloseTo((150 - 8 * 9.8) / 8, 3);
  await page
    .frames()
    .find((f) => f.url().includes('/assets/hanging-weight-pull/'))
    .locator('[data-step="T"][data-dir="-1"]')
    .click();
  expect((await fig.call('get')).T).toBe(148);
  const ran = await fig.call('set', { release: true, animate: false });
  expect(ran.results).toEqual({ hold: null, pull: 3.2, ease: null, full: null });
  // frozen part way, then home, then reset
  const frozen = await fig.call('set', { id: 'pull', at: 0.5 });
  expect(frozen.phase).toBe('run');
  expect(frozen.height).toBeGreaterThan(-0.45);
  expect((await fig.call('set', { home: true })).phase).toBe('ready');
  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ id: 'hold', phase: 'ready', view: 'front' });
  expect(reset.results).toEqual({ hold: null, pull: null, ease: null, full: null });
  expect(log.errors).toEqual([]);
});

test("hanging-weight-pull: the book's examples window solves চিত্র ৩.০৯ and ৩.১০", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hanging-weight-pull');
  const frame = page.frames().find((f) => f.url().includes('/assets/hanging-weight-pull/'));
  await frame.locator('[data-act="example"]').click();
  let ex = (await fig.call('get')).example;
  expect(ex).toMatchObject({ open: true, kind: 'single', M: 2, m: 5, part: 0, phase: 'ready' });
  expect(ex.a).toBeCloseTo(2.8, 3);
  expect(ex.T).toBeCloseTo(14, 3);
  // the lines one at a time
  for (let i = 0; i < 5; i++) await frame.locator('[data-ex="next"]').click();
  await expect(frame.locator('.wl-ex-line.in')).toHaveCount(5);
  // a heavier hanging mass: a = 4 × 9.8 / 9
  await frame.locator('[data-ex-step="M"][data-dir="1"]').click();
  await frame.locator('[data-ex-step="M"][data-dir="1"]').click();
  ex = (await fig.call('get')).example;
  expect(ex.M).toBe(4);
  expect(ex.a).toBeCloseTo((4 * 9.8) / 9, 3);
  // it runs
  await frame.locator('[data-ex="run"]').click();
  await fig.advance(6000);
  expect((await fig.call('get')).example.phase).toBe('done');
  // চিত্র ৩.১০: 10 kg and 5 kg, a = 5g/(m + 15)
  await frame.locator('[data-ex-kind="two"]').click();
  ex = (await fig.call('get')).example;
  expect(ex).toMatchObject({ kind: 'two', m2: 10, m1: 5, m: 5, part: 0 });
  expect(ex.a).toBeCloseTo(2.45, 3);
  ex = (await fig.call('set', { example: { m: 15 } })).example;
  expect(ex.a).toBeCloseTo((5 * 9.8) / 30, 3);
  expect(ex.T1 - ex.T2).toBeCloseTo(15 * ex.a - 5 * 9.8, 1); // the state rounds a to 3 decimals
  // closed by Escape
  await page.keyboard.press('Escape');
  expect((await fig.call('get')).example.open).toBe(false);
  expect(log.errors).toEqual([]);
});
