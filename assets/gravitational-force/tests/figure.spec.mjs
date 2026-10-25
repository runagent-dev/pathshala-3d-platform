// Gravitational force through the bridge (book p68, topic 3.2.1): you stand anywhere on the Earth's edge (in a boat
// at sea), the apples fall and come back, the pull between two apples follows Newton's law (a quarter at twice the
// distance), the Moon goes round at the figure's speed and flies off in a straight line while its pull is gone,
// the keys move you, and the test runs. Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('gravitational-force: down is towards the centre, the pull reaches any distance', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'gravitational-force');

  // you start in Bangladesh; exactly opposite is the Pacific Ocean (a boat); the poles are ice
  expect(await fig.call('get')).toMatchObject({ stop: 'earth', angle: 66.5, place: 'bangladesh', boat: false, mode: 'explore' });
  await fig.call('set', { angle: 246.5, animate: false });
  expect(await fig.call('get')).toMatchObject({ angle: 246.5, place: 'pacific', boat: true });
  await fig.call('set', { angle: 180, animate: false });
  expect(await fig.call('get')).toMatchObject({ place: 'south_pole', boat: false });
  await fig.call('set', { angle: 310, animate: false });
  expect((await fig.call('get')).place).toBe('usa');

  // the apples fall (about half a second), lie on the ground, then come back to the hands
  await fig.call('set', { drop: true });
  expect((await fig.call('get')).dropping).toBe(true);
  await fig.advance(4000);
  expect((await fig.call('get')).dropping).toBe(false);

  // two 200 g apples: about 6.7 × 10⁻¹¹ N at 20 cm, a quarter of that at 40 cm; the distance stays between 20 and 40 cm
  await fig.call('set', { stop: 'apples', animate: false });
  const near = await fig.call('get');
  expect(near).toMatchObject({ stop: 'apples', gap: 20 });
  expect(near.pull).toBeCloseTo(6.67e-11, 13);
  await fig.call('set', { gap: 40 });
  const far = await fig.call('get');
  expect(far.pull / near.pull).toBeCloseTo(0.25, 3);
  await fig.call('set', { gap: 100 });
  expect((await fig.call('get')).gap).toBe(40);
  await fig.call('set', { gap: 2 });
  expect((await fig.call('get')).gap).toBe(20);

  // the Moon goes round once in 10 s here: a quarter turn in 2.5 s
  await fig.call('set', { stop: 'moon', orbit: 90, playing: false, animate: false });
  expect(await fig.call('get')).toMatchObject({ stop: 'moon', orbit: 90, playing: false });
  await fig.call('set', { playing: true });
  await fig.advance(2500);
  await fig.call('set', { playing: false });
  const moon = await fig.call('get');
  expect(moon.orbit).toBeGreaterThan(170);
  expect(moon.orbit).toBeLessThan(195);

  // take the pull away: the Moon leaves its circle; after a while the pull comes back by itself
  await fig.call('set', { nopull: true });
  expect((await fig.call('get')).nopull).toBe(true);
  await fig.advance(5000);
  expect((await fig.call('get')).nopull).toBe(false);

  // the keys: arrows move you round the Earth, 5° a press
  await fig.call('set', { stop: 'earth', angle: 66.5, animate: false });
  await fig.frame.locator('#app').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  expect((await fig.call('get')).angle).toBe(76.5);
  await page.keyboard.press('1');
  expect((await fig.call('get')).stop).toBe('apples');

  // the test: five questions, each answered by a tap
  await fig.call('practice');
  const frame = fig.frame;
  for (let i = 0; i < 5; i++) {
    await fig.advance(1200);
    await frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(2400);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  await expect(frame.locator('.pvc-q-result')).toContainText('৫');

  await fig.call('reset');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ stop: 'earth', angle: 66.5, gap: 20, view: 'front', mode: 'explore', nopull: false });
  expect(log.errors).toEqual([]);
});
