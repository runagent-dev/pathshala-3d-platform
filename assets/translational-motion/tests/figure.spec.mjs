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
  expect(at3.distances).toMatchObject({ front: 3, door: 3, roof: 3, back: 3 });
  expect(at3.translational).toBe(true);

  // driving on: a gentle start and stop, to the end of the straight road (4 m)
  await fig.call('set', { playing: true });
  expect((await fig.call('get')).playing).toBe(true);
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ distance: 4, playing: false, distances: { front: 4, roof: 4 } });

  // the tyre point: two turns of the wheel, a longer path than the body's 4 m
  await fig.call('set', { wheel: true });
  const wheel = await fig.call('get');
  expect(wheel.wheel).toBe(true);
  expect(wheel.distances.wheel).toBeGreaterThan(4.5);
  expect(wheel.distances.wheel).toBeLessThan(5);
  expect(wheel.translational).toBe(true); // the body still is

  // round the bend: each point on its own circle
  const bend = await fig.call('set', { path: 'turn', wheel: false, distance: 7.86, animate: false });
  expect(bend).toMatchObject({ path: 'turn', translational: false });
  expect(bend.distances.roof).toBeCloseTo(8, 1);
  expect(bend.distances.front).toBeGreaterThan(bend.distances.door);
  expect(bend.distances.door).toBeGreaterThan(bend.distances.back);
  expect(bend.distances.back).toBeGreaterThan(bend.distances.roof);
  await expect(fig.frame.locator('.tm-verdict')).toHaveAttribute('data-state', 'no');

  await fig.call('reset');
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ path: 'straight', distance: 0, wheel: false, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('translational-motion: the test asks five questions and marks the answers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'translational-motion');
  await fig.frame.evaluate(() => {
    window.__results = [];
    window.figure.on('practice-result', (p) => window.__results.push(p));
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
  const results = await fig.frame.evaluate(() => window.__results);
  expect(results.map((r) => r.kind).sort()).toEqual(['dist', 'lift', 'turn', 'wheel', 'which']);
  for (const r of results) expect(r.choices).toHaveLength(4);
  // the numeric ones: the right answer is the same distance every point went
  const dist = results.find((r) => r.kind === 'dist');
  expect(dist.expected).toBe(dist.distance);
  expect(log.errors).toEqual([]);
});
