// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the one
// button pumps the air out (the sound fades, the hammer keeps striking), stops at no air, then lets the air back in;
// a second tap stops the pump half way; set and reset; the five-question test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/bell-jar-sound/'));

test('bell-jar-sound: pump the air out, the sound fades; let it in, the sound returns', async ({ page }) => {
  // a small window: this test only reads state, and ~280 software-rendered frames at 800×500 can pass CI's 3 minutes
  await page.setViewportSize({ width: 480, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'bell-jar-sound');
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ air: 1, sound: 'loud', pump: 'off', next: 'out', hammer: 'striking', strikesPerSecond: 8 });

  await frame.locator('.pvc-act').click();
  await fig.advance(1200);
  const mid = await fig.call('get');
  expect(mid.pump).toBe('out');
  expect(mid.air).toBeLessThan(0.8);
  expect(mid.air).toBeGreaterThan(0.2);

  await fig.advance(9000);
  expect(await fig.call('get')).toMatchObject({
    air: 0,
    pressure: 0,
    sound: 'none',
    pump: 'off',
    rings: 0,
    particles: 0,
    next: 'in',
    hammer: 'striking',
  });
  expect((await fig.call('get')).found).toMatchObject({ pumped: true, vacuum: true, back: false });

  await frame.locator('.pvc-act').click();
  await fig.advance(4000);
  expect(await fig.call('get')).toMatchObject({ air: 1, sound: 'loud', pump: 'off', next: 'again', found: { back: true } });

  expect(await fig.call('set', { air: 'half', animate: false })).toMatchObject({ air: 0.5, airPercent: 50, sound: 'soft' });
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ air: 1, mode: 'explore', next: 'out', found: { vacuum: false } });
  expect(log.errors).toEqual([]);
});

test('bell-jar-sound: a second tap stops the pump, a quick double tap does not', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'bell-jar-sound');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await fig.advance(150);
  await frame.locator('.pvc-act').click(); // within the double-tap guard: ignored
  await fig.advance(1500);
  expect((await fig.call('get')).pump).toBe('out');
  await frame.locator('.pvc-act').click();
  await fig.advance(1000);
  const s = await fig.call('get');
  expect(s.pump).toBe('off');
  expect(s.air).toBeGreaterThan(0.1);
  expect(s.air).toBeLessThan(0.9);
  expect(s.next).toBe('more');
  expect(log.errors).toEqual([]);
});

test('bell-jar-sound: the test runs five questions and leaves a sensible learn state', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'bell-jar-sound');
  const frame = frameOf(page);
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(800);
    await frame.locator('[data-q]').first().click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', air: 1, pump: 'off' });
  expect(log.errors).toEqual([]);
});
