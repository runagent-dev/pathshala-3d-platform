// The coin and the card through the bridge (runs with `npm run test:figures`; dev only, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('inertia-coin-card: the card flies off, the coin stays and drops into the glass', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'inertia-coin-card');
  const frame = fig.frame;
  await expect(frame.locator('[data-example]')).toHaveCount(0); // one scene: no row of events

  let s = await fig.call('get');
  expect(s).toMatchObject({ event: 'coin', inertia: 'rest', phase: 'before', playing: false, landed: false });

  // just after the flick: the card flies off, the coin hardly moves sideways
  s = await fig.call('set', { t: 0.26, animate: false });
  expect(s.lowerSpeed).toBeGreaterThan(2);
  expect(s.upperSpeed).toBeLessThan(0.15);
  await expect(frame.locator('.in-tag')).toHaveCount(2);

  // it plays 10 times slower and ends with the coin in the glass
  await fig.call('set', { t: 0, playing: true });
  await fig.advance(2000);
  s = await fig.call('get');
  expect(s.playing).toBe(true);
  expect(s.t).toBeGreaterThan(0.15);
  expect(s.t).toBeLessThan(0.25);
  await fig.advance(6000);
  s = await fig.call('get');
  expect(s).toMatchObject({ playing: false, phase: 'after', landed: true });

  // the keyboard: space plays again from the start
  await frame.locator('#app').focus();
  await page.keyboard.press(' ');
  await fig.advance(300);
  expect((await fig.call('get')).playing).toBe(true);

  // the test: three questions, each answered by a tap, the scene plays on after each answer
  await fig.call('practice');
  for (let i = 0; i < 3; i++) {
    await fig.advance(1500);
    await frame.locator(`.pvc-opt[data-q="${i % 4}"]`).click();
    await fig.advance(600);
    await expect(frame.locator('.pvc-q-feedback')).not.toHaveAttribute('data-tone', '');
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(1500);
  await expect(frame.locator('.pvc-q-result')).toContainText('৩টির');

  await fig.call('reset');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ t: 0, playing: false, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});
