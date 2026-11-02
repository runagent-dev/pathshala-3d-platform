// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// three cases (open pot, high on a mountain, pressure cooker) with their boiling points, lighting the fire heats the
// water until it boils and stops, the next case, and the test running five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/pressure-boiling-point/'));

test('pressure-boiling-point: less pressure, lower boiling point; more pressure, higher', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pressure-boiling-point');
  expect(await fig.call('get')).toMatchObject({ case: 'plain', pressure: 'normal', boilingPoint: 100, phase: 'idle', next: 'heat', view: 'front' });

  const mountain = await fig.call('set', { case: 'mountain', boil: true, animate: false });
  expect(mountain).toMatchObject({
    case: 'mountain',
    pressure: 'low',
    boilingPoint: 90,
    boiling: true,
    temperature: 90,
    cooking: 'slow',
    next: 'next',
  });

  const cooker = await fig.call('set', { case: 'cooker', boil: true, animate: false });
  expect(cooker).toMatchObject({ case: 'cooker', pressure: 'high', boilingPoint: 120, boiling: true, temperature: 120, cooking: 'fast' });
  expect(cooker.boilingPoint).toBeGreaterThan(mountain.boilingPoint);

  const cold = await fig.call('set', { case: 'plain', animate: false });
  expect(cold).toMatchObject({ case: 'plain', phase: 'idle', boiling: false, temperature: 25 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ case: 'plain', phase: 'idle', view: 'front' });
  expect(log.errors).toEqual([]);
});

test('pressure-boiling-point: the fire heats the water to its boiling point; the next place; the test', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pressure-boiling-point');
  const frame = frameOf(page);
  await frame.locator('[data-example="mountain"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ case: 'mountain', phase: 'idle' });
  await frame.locator('.pvc-act').click();
  await fig.advance(3000);
  const mid = await fig.call('get');
  expect(mid).toMatchObject({ phase: 'heating', busy: 'heat' });
  expect(mid.temperature).toBeGreaterThan(30);
  expect(mid.temperature).toBeLessThan(90);
  await fig.advance(4000);
  expect(await fig.call('get')).toMatchObject({ phase: 'boiling', boiling: true, temperature: 90, busy: '', next: 'next' });
  // the same button now shows the next place
  await frame.locator('.pvc-act').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ case: 'cooker', phase: 'idle', tried: { mountain: true } });
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
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', case: 'cooker' });
  expect(log.errors).toEqual([]);
});
