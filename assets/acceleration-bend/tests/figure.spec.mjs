// Acceleration on a bend through the bridge (book page 43, topic 2.6): the CNG's speed stays 2.5 m/s while it
// turns, with an acceleration (v²/r, towards the middle of the turn) only while turning; then the test. Runs with
// `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('acceleration-bend: same speed, turning is acceleration', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'acceleration-bend');

  let s = await fig.call('get');
  expect(s).toMatchObject({ pedal: 'none', speed: 2.5, direction: 'E', turning: 'none', acceleration: 0 });
  await fig.call('set', { pedal: 'left' });
  await fig.advance(1900); // 0.83 rad/s for about 2 s: about 95°, now heading north
  s = await fig.call('get');
  expect(s).toMatchObject({ speed: 2.5, turning: 'left', direction: 'N' });
  expect(s.acceleration).toBeCloseTo(6.25 / 3, 3);
  await fig.call('set', { pedal: 'none' });
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ speed: 2.5, turning: 'none', acceleration: 0, direction: 'N' });

  // keys: hold → to turn right
  await fig.frame.locator('.pvc').focus();
  await page.keyboard.down('ArrowRight');
  await fig.advance(600);
  expect((await fig.call('get')).turning).toBe('right');
  await page.keyboard.up('ArrowRight');

  // turned at once (the poster): the last steer is held
  s = await fig.call('set', { drive: [['left', 1.9]] });
  expect(s).toMatchObject({ pedal: 'left', direction: 'N' });

  await fig.call('reset');
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ view: 'front', mode: 'explore', turning: 'none', direction: 'E' });
  expect(log.errors).toEqual([]);
});

test('acceleration-bend: the test runs through three questions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'acceleration-bend');
  await fig.frame.evaluate(() => {
    const w = /** @type {any} */ (window);
    w.__results = [];
    w.figure.on('practice-result', (p) => w.__results.push(p));
  });
  await fig.call('practice');
  for (let i = 0; i < 3; i++) {
    await fig.advance(800);
    await fig.frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(300);
    await expect(fig.frame.locator('.pvc-q-feedback')).not.toHaveAttribute('data-tone', '');
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await expect(fig.frame.locator('.pvc-quiz')).toHaveClass(/is-done/);
  const results = await fig.frame.evaluate(() => /** @type {any} */ (window).__results);
  expect(results.map((r) => r.kind)).toEqual(expect.arrayContaining(['bend', 'dir', 'straight']));
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', turning: 'none' });
  expect(log.errors).toEqual([]);
});
