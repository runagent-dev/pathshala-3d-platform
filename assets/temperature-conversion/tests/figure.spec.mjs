// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged):
// one level of the liquid, three readings, the book's four examples, and the test locking the level.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('temperature-conversion: the three readings move together and follow the book', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'temperature-conversion', { harness: true });

  await fig.call('set', { value: 100 });
  expect(await fig.call('get')).toMatchObject({ c: 100, k: 373.15, f: 212, example: null });
  await fig.call('set', { value: 0 });
  expect(await fig.call('get')).toMatchObject({ c: 0, k: 273.15, f: 32 });

  // −40° C is −40° F
  await fig.call('set', { example: 'cf' });
  const cf = await fig.call('get');
  expect(cf).toMatchObject({ example: 'cf', c: -40, f: -40 });
  // Kelvin and Fahrenheit are equal at 574.59
  await fig.call('set', { example: 'kf' });
  const kf = await fig.call('get');
  expect(kf.k.toFixed(2)).toBe('574.59');
  expect(kf.f.toFixed(2)).toBe('574.59');
  // 98.4° F is 36.89° C
  await fig.call('set', { example: 'body' });
  const body = await fig.call('get');
  expect(body.f.toFixed(1)).toBe('98.4');
  expect(body.c.toFixed(2)).toBe('36.89');
  // Celsius and Kelvin are never equal
  await fig.call('set', { example: 'ck' });
  const ck = await fig.call('get');
  expect(ck.k - ck.c).toBeCloseTo(273.15, 6);

  // the chips above the plates show the three numbers
  const chips = await fig.frame.evaluate(() => [...document.querySelectorAll('.ts-chip')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
  expect(chips).toHaveLength(3);
  expect(chips.every((c) => c && c !== '?')).toBe(true);

  // a drag on the liquid is free: the example is let go and the level stays on a whole degree
  await fig.call('set', { value: 41.4 });
  const free = await fig.call('get');
  expect(free.example).toBeNull();
  expect(free.c).toBeCloseTo(41.4, 6);

  // the level never leaves the drawn scales
  await fig.call('set', { value: 9999, animate: false });
  expect((await fig.call('get')).c).toBe(310);
  await fig.call('set', { value: -9999, animate: false });
  expect((await fig.call('get')).c).toBe(-50);

  expect(log.errors).toEqual([]);
});

test('temperature-conversion: the test asks five questions and keeps the level still', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'temperature-conversion', { harness: true });
  await fig.frame.locator('[data-mode="quiz"]').click();
  for (let q = 0; q < 5; q++) {
    await fig.advance(1800); // the level moves to the question's temperature, then the choices open
    expect((await fig.call('get')).locked).toBe(true);
    await fig.frame.locator('[data-q]').first().click();
    await fig.advance(300);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  expect(await fig.frame.locator('.pvc-q-result').textContent()).toMatch(/৫টির মধ্যে/);
  expect(log.errors).toEqual([]);
});
