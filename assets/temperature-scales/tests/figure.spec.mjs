// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// three thermometers read the same temperature on the book's three scales (figure 6.02: 0 °C = 273.15 K = 32 °F,
// 100 °C = 373.15 K = 212 °F); the big button walks the book's temperatures in order; absolute zero is −273.15 °C =
// 0 K; a change of 10 °C is a change of 10 K; and the test runs five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/temperature-scales/'));

test('temperature-scales: one temperature on three scales, the fixed points and absolute zero', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'temperature-scales');
  const start = await fig.call('get');
  expect(start).toMatchObject({ T: 30, C: 30, K: 303.15, F: 86, step: '', next: 'ice', zoomed: false, view: 'front' });

  expect(await fig.call('set', { step: 'ice', animate: false })).toMatchObject({ C: 0, K: 273.15, F: 32, step: 'ice', next: 'boil' });
  expect(await fig.call('set', { step: 'boil', animate: false })).toMatchObject({ C: 100, K: 373.15, F: 212, step: 'boil', next: 'room' });
  expect(await fig.call('set', { step: 'room', animate: false })).toMatchObject({ C: 30, K: 303.15, F: 86 });
  expect(await fig.call('set', { step: 'abs', animate: false })).toMatchObject({ C: -273.15, K: 0, F: -459.67, zoomed: true, next: 'triple' });
  expect(await fig.call('set', { step: 'triple', animate: false })).toMatchObject({ C: 0.01, K: 273.16, zoomed: false, next: 'ice' });

  // a change of 10 °C is a change of 10 K
  await fig.call('set', { step: 'room', animate: false });
  const up = await fig.call('set', { T: 40, animate: false });
  expect(up).toMatchObject({ C: 40, K: 313.15, F: 104 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ C: 30, K: 303.15, step: '', zoomed: false, view: 'front' });
  expect(log.errors).toEqual([]);
});

test('temperature-scales: the button goes through the steps; the arrow keys move the mercury; the test runs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'temperature-scales');
  const frame = frameOf(page);
  for (const [id, c] of [
    ['ice', 0],
    ['boil', 100],
    ['room', 30],
  ]) {
    await frame.locator('.pvc-act').click();
    await fig.advance(1800);
    expect(await fig.call('get')).toMatchObject({ step: id, C: c });
    await fig.advance(500); // past the double-tap guard
  }
  await frame.locator('.pvc-act').click();
  await fig.advance(2600);
  expect(await fig.call('get')).toMatchObject({ step: 'abs', C: -273.15, K: 0, zoomed: true });

  // a row-of-words tap, then the keys: whole degrees, one at a time
  await frame.locator('[data-example="room"]').click();
  await fig.advance(2600);
  await frame.locator('.pvc').focus(); // not a chip: the arrow keys in the row of words choose another word
  await page.keyboard.press('ArrowUp');
  await fig.advance(300);
  expect(await fig.call('get')).toMatchObject({ C: 31, K: 304.15, change: 1 });

  // the test: five questions, each answered
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(2500);
    await frame.locator('[data-q]').first().click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(2000);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'room', C: 30 });
  expect(log.errors).toEqual([]);
});
