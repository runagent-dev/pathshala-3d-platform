// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// first screen is calm; one tap shows the equal pressures, nothing rises; sucking lifts the drink to the mouth; the
// last step shows the book's limit, 10.3 m; the test runs four questions. Steps are jumped with animate: false so
// each test stays short under software rendering.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/torricelli-barometer-straw/'));

test('torricelli-barometer-straw: equal pressures, nothing rises; sucking lifts the drink; at most 10.3 m', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer-straw');
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ step: 'intro', suck: false, rise: 0, mouth: 1, next: 'look' });
  expect(await frame.locator('[data-example]').count()).toBe(3);
  expect(await frame.locator('.tb-lead.pvc-note').count()).toBe(1);

  // one tap: the arrows come in, the pressures are equal, nothing rises
  await frame.locator('.pvc-act').click();
  await fig.advance(2400);
  expect(await fig.call('get')).toMatchObject({ step: 'rest', busy: false, suck: false, rise: 0, mouth: 1, next: 'suck' });
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('কার্যকর বল');

  // sucking: the mouth's air thins out and the drink rises to the mouth
  const suck = await fig.call('set', { step: 'suck', animate: false });
  expect(suck).toMatchObject({ step: 'suck', suck: true, next: 'max' });
  expect(suck.rise).toBe(10); // cm, up to the mouth
  expect(suck.mouth).toBeLessThan(0.5);

  // the book's limit
  expect(await fig.call('set', { step: 'max', animate: false })).toMatchObject({ step: 'max', rise: 10.3, riseUnit: 'm', next: 'quiz' });
  expect(await fig.call('set', { suck: false, animate: false })).toMatchObject({ step: 'rest', rise: 0 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', rise: 0, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('torricelli-barometer-straw: the test runs four questions', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'torricelli-barometer-straw');
  const frame = frameOf(page);
  await fig.call('practice');
  for (let i = 0; i < 4; i++) {
    await fig.advance(800);
    await frame.locator('[data-q]').first().click();
    await fig.advance(200);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'intro' });
  expect(log.errors).toEqual([]);
});
