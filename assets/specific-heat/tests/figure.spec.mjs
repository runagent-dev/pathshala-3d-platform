// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's
// example of 10 kg of gold (s = 230) and 10 kg of water (s = 4200) on one stove; every press gives both 42,000 J, the
// water rises 1 K a press and the gold about 18.3 K; the readings give s = Q / m(T₂ − T₁) back; the button works through
// four presses and then starts again; the test runs five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/specific-heat/'));

test('specific-heat: the same heat warms the gold far more than the water', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'specific-heat');
  const start = await fig.call('get');
  expect(start).toMatchObject({ show: 'water', steps: 0, Q: 0, m: 10, T1: 30, next: 'heat', mode: 'explore', view: 'front' });
  expect(start.water).toMatchObject({ s: 4200, C: 42000, T2: 30, rise: 0 });
  expect(start.gold).toMatchObject({ s: 230, C: 2300, T2: 30, rise: 0 });

  const one = await fig.call('set', { steps: 1, animate: false });
  expect(one).toMatchObject({ steps: 1, Q: 42000, next: 'heat' });
  expect(one.water).toMatchObject({ T2: 31, rise: 1 });
  expect(one.gold.rise).toBeCloseTo(18.26, 2);
  expect(one.found).toEqual({ water: true, gold: false });

  const gold = await fig.call('set', { show: 'gold' });
  expect(gold).toMatchObject({ show: 'gold', found: { water: true, gold: true } });

  const four = await fig.call('set', { steps: 4, animate: false });
  expect(four).toMatchObject({ steps: 4, Q: 168000, next: 'again' });
  expect(four.water).toMatchObject({ T2: 34, rise: 4 });
  expect(four.gold.T2).toBeCloseTo(103.04, 2);

  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ show: 'water', steps: 0, Q: 0, view: 'front', next: 'heat' });
  expect(reset.found).toEqual({ water: false, gold: false });
  expect(log.errors).toEqual([]);
});

test('specific-heat: the button heats both, four times, then starts again; the test runs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'specific-heat');
  const frame = frameOf(page);
  for (let n = 1; n <= 4; n++) {
    await frame.locator('.pvc-act').click();
    await fig.advance(600);
    expect((await fig.call('get')).phase).toBe('heating');
    await fig.advance(2600);
    const s = await fig.call('get');
    expect(s).toMatchObject({ steps: n, Q: 42000 * n, phase: 'idle' });
    await fig.advance(600);
  }
  await frame.locator('.pvc-act').click();
  expect(await fig.call('get')).toMatchObject({ steps: 0, Q: 0, next: 'heat' });

  await frame.locator('[data-example="gold"]').click();
  expect((await fig.call('get')).show).toBe('gold');

  await fig.call('practice');
  await fig.advance(1500);
  for (let q = 0; q < 5; q++) {
    await frame.locator('.pvc-opt').first().click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
    await fig.advance(1200);
  }
  await expect(frame.locator('.pvc-q-done')).toBeVisible();
  expect(log.errors).toEqual([]);
});
