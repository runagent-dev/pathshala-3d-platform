// Circular motion: the clock hand through the bridge (book p36, topic 2.2): wherever the moving point is measured, its distance from the
// fixed point is the same (12 cm from the pin); it turns by itself at the figure's speed and traces its circular path; the test
// runs. Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('circular-motion-clock: the distance from the fixed point never changes', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'circular-motion-clock');

  expect(await fig.call('get')).toMatchObject({ playing: true, distance: 12, unit: 'cm', marks: [] });

  // measured at four places round the circle: four times the same distance
  await fig.call('set', { playing: false, angle: 0 });
  for (const angle of [0, 90, 200, 300]) {
    await fig.call('set', { angle, measure: true });
  }
  const got = await fig.call('get');
  expect(got.marks.map((m) => m.distance)).toEqual([12, 12, 12, 12]);
  expect(got.marks.map((m) => m.angle)).toEqual([0, 90, 200, 300]);
  expect(got.same).toBe(true);

  // it goes round in 10 s here: after a quarter of that it has turned a quarter and traced a quarter
  await fig.call('set', { angle: 0, marks: [], playing: true });
  await fig.advance(2500);
  await fig.call('set', { playing: false });
  const turned = await fig.call('get');
  expect(turned.angle).toBeGreaterThan(85);
  expect(turned.angle).toBeLessThan(110);
  expect(turned.traced).toBeGreaterThan(0.23);
  expect(turned.distance).toBe(12);

  // a full turn traces the whole circle
  await fig.call('set', { trail: 1 });
  expect((await fig.call('get')).traced).toBe(1);

  // the keyboard: the arrows turn it step by step (and stop it), M measures, the space bar plays and pauses
  await fig.call('set', { playing: true, angle: 0 });
  await fig.frame.locator('#app').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  expect(await fig.call('get')).toMatchObject({ playing: false, angle: 20 });
  await page.keyboard.press('m');
  expect((await fig.call('get')).marks.at(-1)).toEqual({ angle: 20, distance: 12 });
  await page.keyboard.press(' ');
  expect((await fig.call('get')).playing).toBe(true);

  // the test: four questions, each answered by a tap
  await fig.call('practice');
  const frame = fig.frame;
  for (let i = 0; i < 4; i++) {
    await fig.advance(1200);
    await frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(2200);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  await expect(frame.locator('.pvc-q-result')).toContainText('৪');

  await fig.call('reset');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ marks: [], view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});
