// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// surface A gives P = hρg at its depth, the holes open one by one (the action, a tap on a spout), each open hole's
// pressure is in the state, the rule grows, the camera goes close the first time, A moves with the arrow keys, and
// the test runs five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/liquid-pressure/'));

test('liquid-pressure: P = hρg at the surface A, deeper holes, more pressure', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'liquid-pressure');
  const start = await fig.call('get');
  expect(start).toMatchObject({ h: 0.2, P: 1960, F: 19.6, A: 100, rho: 1000, g: 9.8, open: [], look: 'all', next: 'open', nextHole: 'top' });
  expect(start.holes).toMatchObject({ top: { h: 0.2, P: 1960 }, mid: { h: 0.4, P: 3920 }, bot: { h: 0.6, P: 5880 } });
  expect(start.holes.bot.reach).toBeGreaterThan(start.holes.mid.reach);
  expect(start.holes.mid.reach).toBeGreaterThan(start.holes.top.reach);

  // A at any depth on the grid
  expect(await fig.call('set', { h: 0.55, animate: false })).toMatchObject({ h: 0.55, P: 5390, F: 53.9 });

  // opening holes: A goes to each hole's depth; two open → the rule says pressure grows with depth
  const one = await fig.call('set', { open: 'top', animate: false });
  expect(one).toMatchObject({ open: ['top'], h: 0.2, P: 1960, found: { open: true, compare: false } });
  const two = await fig.call('set', { open: 'top,bot', animate: false });
  expect(two.open).toEqual(['top', 'bot']);
  expect(two.found).toMatchObject({ compare: true, all: false });
  const all = await fig.call('set', { open: 'all', animate: false });
  expect(all).toMatchObject({ found: { all: true }, next: 'close' });

  // the action closes them all again
  await frameOf(page).locator('.pvc-act').click();
  await fig.advance(300);
  expect((await fig.call('get')).open).toEqual([]);

  // a word of the row moves A to that hole's depth; the arrow keys move it by 5 cm
  await frameOf(page).locator('[data-example="mid"]').click();
  await fig.advance(800);
  expect((await fig.call('get')).h).toBe(0.4);
  await frameOf(page).locator('.pvc').first().focus();
  await page.keyboard.press('ArrowDown');
  await fig.advance(300);
  expect((await fig.call('get')).h).toBe(0.45);

  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ h: 0.2, open: [], look: 'all', view: 'front' });
  expect(reset.found).toEqual({ open: false, compare: false, all: false, drag: false });
  expect(log.errors).toEqual([]);
});

test('liquid-pressure: one tap opens a hole, the camera goes close and back, then the test', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'liquid-pressure');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await fig.advance(2200);
  const opened = await fig.call('get');
  expect(opened.open).toEqual(['top']);
  expect(opened.next).toBe('next');
  expect(opened.nextHole).toBe('mid');
  expect(opened.look).toBe('close');
  await fig.advance(4000);
  expect((await fig.call('get')).look).toBe('all');
  // the next tap opens the middle hole and moves A there
  await frame.locator('.pvc-act').click();
  await fig.advance(1800);
  const second = await fig.call('get');
  expect(second.open).toEqual(['top', 'mid']);
  expect(second).toMatchObject({ h: 0.4, P: 3920, found: { compare: true } });
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
  const back = await fig.call('get');
  expect(back.mode).toBe('explore');
  expect(back.open).toEqual(['top', 'mid']);
  expect(log.errors).toEqual([]);
});
