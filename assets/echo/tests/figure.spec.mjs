// This figure's own behaviour, through the bridge (dev only, never packaged): the book's numbers (t = 2d ÷ 330,
// 0.1 s ↔ 16.5 m), a call that ends with the echo back, the older `clap` name, what the student has found, reset.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('echo: the time to come back and the 16.5 m rule', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'echo');
  expect(await fig.call('get')).toMatchObject({ d: 10, called: false, separate: false });
  expect(await fig.call('set', { d: 16.5, call: true, animate: false })).toMatchObject({
    d: 16.5,
    echoTime: 0.1,
    separate: true,
    echoBack: true,
    found: { near: false, far: true },
  });
  expect(await fig.call('set', { d: 10.2, animate: false })).toMatchObject({ d: 10, called: false });
  expect(await fig.call('set', { d: 99, animate: false })).toMatchObject({ d: 40 });
  // a call played through: the hands come up (0.5 s), then the echo comes back after 2 × 40 ÷ 330 s (slowed 20 times)
  const done = fig.call('set', { call: true });
  await fig.advance(300);
  expect(await fig.call('get')).toMatchObject({ playing: true, called: false });
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ playing: true, called: true, echoBack: false });
  await fig.advance(4200);
  expect(await done).toMatchObject({ playing: false, echoBack: true, echoTime: 0.2424, found: { near: false, far: true } });
  // the older name still works, and reports under both names
  await fig.call('set', { d: 5, clap: true, animate: false });
  expect(await fig.call('get')).toMatchObject({ called: true, clapped: true, found: { near: true, far: true } });
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ d: 10, called: false, found: { near: false, far: false } });
  expect(log.errors).toEqual([]);
});
