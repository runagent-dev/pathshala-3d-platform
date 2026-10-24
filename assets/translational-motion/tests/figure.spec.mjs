// Translational motion through the bridge (book p36, topic 2.2): straight ahead every painted point goes the same
// distance (চলন গতি); driving takes the car to the end of its path; the point on the wheel goes farther along its
// arches; round the bend the points go different distances. Runs with `npm run test:figures` (dev only).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('translational-motion: equal distances straight, not on the wheel, not round the bend', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'translational-motion');

  expect(await fig.call('get')).toMatchObject({ path: 'straight', distance: 0, wheel: false, playing: false, translational: true });

  const at3 = await fig.call('set', { distance: 3, animate: false });
  expect(at3.distances).toMatchObject({ front: 3, window: 3, roof: 3, back: 3 });
  expect(at3.translational).toBe(true);
  await expect(fig.frame.locator('.tm-verdict')).toHaveAttribute('data-state', 'yes');

  // driving on: a gentle start and stop, to the end of the straight road (4 m)
  await fig.call('set', { playing: true });
  expect((await fig.call('get')).playing).toBe(true);
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ distance: 4, playing: false, distances: { front: 4, roof: 4 } });

  // the tyre point: two turns of the wheel along a cycloid (16 × radius = 5.09 m) while the body goes 4 m
  await fig.call('set', { wheel: true, animate: false });
  const wheel = await fig.call('get');
  expect(wheel.wheel).toBe(true);
  expect(wheel.distances.wheel).toBeCloseTo(5.09, 1);
  expect(wheel.translational).toBe(true); // the body still is
  await expect(fig.frame.locator('.tm-yes')).toContainText('চাকা বাদে');

  // round the bend: each point on its own circle; the bend hides the tyre point
  const bend = await fig.call('set', { path: 'turn', distance: 7.86, animate: false });
  expect(bend).toMatchObject({ path: 'turn', wheel: false, translational: false });
  expect(bend.distances.roof).toBeCloseTo(8, 1);
  expect(bend.distances.front).toBeGreaterThan(bend.distances.window);
  expect(bend.distances.window).toBeGreaterThan(bend.distances.back);
  expect(bend.distances.back).toBeGreaterThan(bend.distances.roof);
  await expect(fig.frame.locator('.tm-verdict')).toHaveAttribute('data-state', 'no');

  await fig.call('reset');
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ path: 'straight', distance: 0, wheel: false, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('translational-motion: the test asks five different questions and marks the answers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'translational-motion');
  await fig.frame.evaluate(() => {
    const w = /** @type {any} */ (window);
    w.__results = [];
    w.figure.on('practice-result', (p) => w.__results.push(p));
  });
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(2500);
    await fig.frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(300);
    await expect(fig.frame.locator('.pvc-q-feedback')).toHaveAttribute('data-tone', /ok|bad/);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await expect(fig.frame.locator('.pvc-quiz')).toHaveClass(/is-done/);
  const results = await fig.frame.evaluate(() => /** @type {any} */ (window).__results);
  expect(results.map((r) => r.kind)).toEqual(expect.arrayContaining(['dist', 'same', 'turn', 'wheel', 'which']));
  for (const r of results) expect(r.choices).toHaveLength(4);
  // the distance is the difference of the two marks, the same for every point
  const dist = results.find((r) => r.kind === 'dist');
  expect(dist.expected).toBeCloseTo(dist.to - dist.from, 6);
  expect(log.errors).toEqual([]);
});
