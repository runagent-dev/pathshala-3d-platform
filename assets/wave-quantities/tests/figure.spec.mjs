// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): one
// period moves the first crest exactly one λ; the examples keep v for the same rope and change it for the heavy one;
// a second tap mid-period does not skip it; the five-question test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/wave-quantities/'));

test('wave-quantities: one period moves the crest exactly one wavelength (v = fλ)', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'wave-quantities');
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ example: 'f5', f: 5, T: 0.2, lambda: 1, v: 5, a: 0.1, tau: 0, running: false, measured: [] });

  await frame.locator('.pvc-act').click();
  await fig.advance(1000); // half the slowed period (2 s)
  const mid = await fig.call('get');
  expect(mid.running).toBe(true);
  expect(mid.travelled).toBeGreaterThan(0.3);
  expect(mid.travelled).toBeLessThan(0.7);
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ running: false, tau: 0.2, travelled: 1, measured: ['f5'] });

  expect(await fig.call('set', { example: 'f10', run: true, animate: false })).toMatchObject({ lambda: 0.5, v: 5, T: 0.1, travelled: 0.5 });
  expect(await fig.call('set', { example: 'f2', run: true, animate: false })).toMatchObject({ lambda: 2, v: 5, T: 0.4, travelled: 2 });
  expect(await fig.call('set', { example: 'heavy', run: true, animate: false })).toMatchObject({
    f: 5,
    lambda: 0.5,
    v: 2.5,
    measured: ['f5', 'f10', 'f2', 'heavy'],
  });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ example: 'f5', tau: 0, measured: [], playing: false, mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('wave-quantities: a second tap mid-period does not skip it; play runs on', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'wave-quantities');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await fig.advance(600);
  await frame.locator('.pvc-act').click();
  await fig.advance(200);
  expect(await fig.call('get')).toMatchObject({ running: true });
  await fig.advance(2000);
  expect(await fig.call('get')).toMatchObject({ running: false, tau: 0.2 });
  await fig.call('set', { play: true });
  await fig.advance(1000);
  const s = await fig.call('get');
  expect(s.playing).toBe(true);
  expect(s.tau).toBeGreaterThan(0.25);
  // a period started while running begins at the next whole period
  await fig.call('set', { run: true });
  const after = await fig.call('get');
  expect(after.running).toBe(false);
  expect(Math.abs(after.tau / 0.2 - Math.round(after.tau / 0.2))).toBeLessThan(1e-3);
  expect(log.errors).toEqual([]);
});

test('wave-quantities: the test runs six questions; the right answers are marked right', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'wave-quantities');
  const frame = frameOf(page);
  await fig.call('practice');
  // the answers that do not depend on the rope the question picks
  const known = { 'দুই দোলনকাল': '১ m', 'কোন দুটি বিন্দুতে': 'A ও C', 'কম্পাঙ্ক ৫ Hz থেকে': 'λ অর্ধেক হবে, v একই থাকবে' };
  let checked = 0;
  for (let i = 0; i < 6; i++) {
    await fig.advance(1200);
    await expect(frame.locator('[data-q]')).toHaveCount(4);
    const text = await frame.locator('.pvc-q-text').textContent();
    const key = Object.keys(known).find((k) => text.includes(k));
    if (key) {
      await frame.locator('[data-q]', { hasText: new RegExp(`^${known[key].replace(/ /g, '\\s')}$`) }).click();
      await fig.advance(300);
      await expect(frame.locator('.pvc-q-feedback')).toHaveAttribute('data-tone', 'ok');
      checked++;
    } else {
      await frame.locator('[data-q]').first().click();
      await fig.advance(300);
    }
    await frame.locator('[data-act="q-next"]').click();
  }
  expect(checked).toBe(3);
  await fig.advance(500);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', example: 'f5', running: false });
  expect(log.errors).toEqual([]);
});
