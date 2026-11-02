// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// three steps (hang the wire and weights, let it cut through, take them away) with the block whole at the end, each
// tap doing the next step, and the test running five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/pressure-melting-point/'));

test('pressure-melting-point: hang, cut through, take away: the ice is whole', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pressure-melting-point');
  const start = await fig.call('get');
  expect(start).toMatchObject({ step: 0, phase: 'start', pressing: false, whole: false, next: 'hang', view: 'front' });

  const hung = await fig.call('set', { step: 1, animate: false });
  expect(hung).toMatchObject({ step: 1, phase: 'hung', pressing: true, next: 'cut' });

  const mid = await fig.call('set', { step: 2, progress: 0.5, animate: false });
  expect(mid).toMatchObject({ step: 2, phase: 'cutting', pressing: true, progress: 0.5 });
  expect(mid.wireY).toBeLessThan(hung.wireY);

  const through = await fig.call('set', { step: 2, animate: false });
  expect(through).toMatchObject({ phase: 'out', pressing: false, progress: 1, next: 'remove' });
  expect(through.wireY).toBeLessThan(0);

  const whole = await fig.call('set', { step: 3, animate: false });
  expect(whole).toMatchObject({ step: 3, phase: 'whole', whole: true, next: 'again' });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 0, phase: 'start', view: 'front' });
  expect(log.errors).toEqual([]);
});

test('pressure-melting-point: each tap does the next step; the test', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pressure-melting-point');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await fig.advance(600);
  expect((await fig.call('get')).busy).toBe('hang');
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ step: 1, phase: 'hung', busy: '', next: 'cut' });
  await frame.locator('.pvc-act').click();
  await fig.advance(3000);
  const mid = await fig.call('get');
  expect(mid).toMatchObject({ step: 2, busy: 'cut' });
  expect(mid.progress).toBeGreaterThan(0.2);
  await fig.advance(6000);
  expect(await fig.call('get')).toMatchObject({ step: 2, phase: 'out', busy: '', next: 'remove' });
  await frame.locator('.pvc-act').click();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ step: 3, phase: 'whole', whole: true });
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
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 3 });
  expect(log.errors).toEqual([]);
});
