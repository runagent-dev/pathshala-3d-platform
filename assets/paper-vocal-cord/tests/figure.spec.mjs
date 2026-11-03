// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// one action (blow, stop, the next cut), the row of words, the flaps really opening and shutting, set and reset, and
// the five-question test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/paper-vocal-cord/'));

test('paper-vocal-cord: blowing makes the flaps vibrate; one button walks the three cuts', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'paper-vocal-cord');
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ cut: 'mid', frequency: 310, wavelength: 1.06, blowing: false, tried: [], next: 'blow' });

  await frame.locator('.pvc-act').click();
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ cut: 'mid', blowing: true, tried: ['mid'], next: 'stop' });
  // the flaps open and shut: sample a period (about 0.32 s slowed) and see both
  const openings = [];
  for (let i = 0; i < 8; i++) {
    openings.push((await fig.call('get')).opening);
    await fig.advance(40);
  }
  expect(Math.max(...openings)).toBeGreaterThan(2.5);
  expect(Math.min(...openings)).toBeLessThan(1);
  await expect(frame.locator('.pvc-outcome')).toContainText('৩১০');

  // one breath, then it stops by itself
  await fig.advance(8000);
  expect(await fig.call('get')).toMatchObject({ blowing: false, next: 'blow_cut' });

  // the action now cuts the short flaps and blows
  await frame.locator('.pvc-act').click();
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ cut: 'short', frequency: 640, wavelength: 0.52, voice: 'shrill', blowing: true });
  await frame.locator('.pvc-act').click(); // stop
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ blowing: false });

  // the row of words: the long flaps
  await frame.locator('[data-example="long"]').click();
  await fig.advance(600);
  await frame.locator('.pvc-act').click();
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ cut: 'long', frequency: 160, voice: 'deep', blowing: true, tried: ['long', 'mid', 'short'] });
  await expect(frame.locator('.pvc-rule')).toContainText('পুরুষের গলার স্বর মোটা');

  expect(await fig.call('set', { cut: 'short', blow: true, animate: false })).toMatchObject({ cut: 'short', blowing: true });
  expect(await fig.call('set', { blow: false })).toMatchObject({ blowing: false });
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ cut: 'mid', blowing: false, tried: [], mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('paper-vocal-cord: a second tap right after the first does not stop the blowing', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'paper-vocal-cord');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await frame.locator('.pvc-act').click();
  await fig.advance(300);
  expect(await fig.call('get')).toMatchObject({ blowing: true });
  expect(log.errors).toEqual([]);
});

test('paper-vocal-cord: the test runs five questions and gives the learn view back', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'paper-vocal-cord');
  const frame = frameOf(page);
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1200);
    await frame.locator('[data-q]').first().click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', cut: 'mid', blowing: false });
  expect(log.errors).toEqual([]);
});
