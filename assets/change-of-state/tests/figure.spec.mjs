// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// temperature follows the book's curve (flat at 0 °C and 100 °C), the phase and the next step follow the time, cooling
// runs the curve the other way, the big button plays one part and stops, the test runs.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/change-of-state/'));

test('change-of-state: the thermometer follows the book’s heating curve, both ways', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'change-of-state');
  expect(await fig.call('get')).toMatchObject({ time: 0, flow: 'heat', temperature: -20, phase: 'ice', step: 0, mode: 'explore' });

  // ice warms, melts (flat at 0), the water warms, boils (flat at 100), the steam warms
  const at = async (time) => fig.call('set', { time });
  expect(await at(0.5)).toMatchObject({ temperature: -10, phase: 'ice', step: 0 });
  expect(await at(2)).toMatchObject({ temperature: 0, phase: 'melt', step: 1 });
  expect(await at(3)).toMatchObject({ temperature: 0, phase: 'water', step: 2 });
  expect(await at(4)).toMatchObject({ temperature: 50, phase: 'water' });
  expect(await at(6)).toMatchObject({ temperature: 100, phase: 'boil', step: 3 });
  expect(await at(7.5)).toMatchObject({ temperature: 110, phase: 'steam', step: 4 });
  expect(await at(8)).toMatchObject({ temperature: 120, phase: 'steam', step: 5 });

  // taking heat away runs it the other way: steam, condensing at 100, water, freezing at 0, ice
  expect(await fig.call('set', { flow: 'cool' })).toMatchObject({ flow: 'cool', time: 0, temperature: 120, phase: 'steam' });
  expect(await at(2)).toMatchObject({ temperature: 100, phase: 'boil' });
  expect(await at(4)).toMatchObject({ temperature: 50, phase: 'water' });
  expect(await at(6)).toMatchObject({ temperature: 0, phase: 'melt' });
  expect(await at(8)).toMatchObject({ temperature: -20, phase: 'ice' });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ flow: 'heat', time: 0, temperature: -20, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('change-of-state: the big button plays one part of the curve and stops', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'change-of-state');
  const frame = frameOf(page);
  const button = frame.locator('.pvc-act-slot button').first();
  await button.click();
  await fig.advance(1500 + 500); // the first part takes 1.5 s
  expect(await fig.call('get')).toMatchObject({ time: 1, phase: 'ice', step: 1, playing: false });
  await button.click();
  await fig.advance(3000 + 500); // melting takes 3 s
  expect(await fig.call('get')).toMatchObject({ time: 3, temperature: 0, phase: 'water', step: 2 });
  expect(log.errors).toEqual([]);
});

test('change-of-state: the test asks five questions with the picture set up', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'change-of-state');
  const frame = frameOf(page);
  await fig.call('practice');
  await expect(frame.locator('.pvc-q-count')).toContainText('১');
  expect((await fig.call('get')).mode).toBe('quiz');
  for (let i = 0; i < 5; i++) {
    await frame.locator('.pvc-opt').first().click();
    await frame.locator('[data-act="q-next"]').click();
  }
  await expect(frame.locator('.pvc-q-result')).toContainText('৫');
  expect(log.errors).toEqual([]);
});
