// Circular motion through the bridge (book p36, topic 2.2): wherever the moving point is measured, its distance
// from the fixed point is the same (70 cm on the fan, 12 cm on the clock, 3.84 lakh km for the Moon); it turns by
// itself at the figure's speed and traces its circular path; the test runs. Runs with `npm run test:figures`
// (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('circular-motion: the distance from the fixed point never changes', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'circular-motion');

  expect(await fig.call('get')).toMatchObject({ example: 'fan', playing: true, distance: 70, unit: 'cm', marks: [] });

  // measured at four places round the circle: four times the same distance
  await fig.call('set', { playing: false, angle: 0 });
  for (const angle of [0, 90, 200, 300]) {
    await fig.call('set', { angle, measure: true });
  }
  const fan = await fig.call('get');
  expect(fan.marks.map((m) => m.distance)).toEqual([70, 70, 70, 70]);
  expect(fan.marks.map((m) => m.angle)).toEqual([0, 90, 200, 300]);
  expect(fan.same).toBe(true);

  // the clock's second hand goes round in 10 s here: after 2.5 s it has turned a quarter and traced a quarter
  await fig.call('set', { example: 'clock', angle: 0, playing: false, animate: false });
  expect(await fig.call('get')).toMatchObject({ example: 'clock', distance: 12, marks: [], traced: 0 });
  await fig.call('set', { playing: true });
  await fig.advance(2500);
  await fig.call('set', { playing: false });
  const clock = await fig.call('get');
  expect(clock.angle).toBeGreaterThan(85);
  expect(clock.angle).toBeLessThan(110);
  expect(clock.traced).toBeGreaterThan(0.23);
  expect(clock.distance).toBe(12);

  // the Moon: about 3.84 lakh km from the Earth's centre, wherever it is
  await fig.call('set', { example: 'moon', animate: false, playing: false, marks: [10, 130, 250] });
  const moon = await fig.call('get');
  expect(moon).toMatchObject({ example: 'moon', unit: 'lakh km', distance: 3.84, same: true });
  expect(moon.marks.map((m) => m.distance)).toEqual([3.84, 3.84, 3.84]);

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
  expect((await fig.call('get')).marks.at(-1)).toEqual({ angle: 20, distance: 3.84 });
  await page.keyboard.press(' ');
  expect((await fig.call('get')).playing).toBe(true);

  // the test: five questions, each answered by a tap
  await fig.call('practice');
  const frame = fig.frame;
  for (let i = 0; i < 5; i++) {
    await fig.advance(1200);
    await frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(2200);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  await expect(frame.locator('.pvc-q-result')).toContainText('৫');

  await fig.call('reset');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ example: 'fan', marks: [], view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});
