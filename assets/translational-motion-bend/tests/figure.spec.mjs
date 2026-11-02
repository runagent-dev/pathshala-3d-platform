// A car taking a bend through the bridge (book p36, topic 2.2): each painted point goes its own distance round its
// own circle, so this is not translational motion; then the test. Runs with `npm run test:figures` (dev only).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('translational-motion-bend: each point its own distance round the bend', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'translational-motion-bend');

  expect(await fig.call('get')).toMatchObject({ distance: 0, playing: false, translational: false });

  const bend = await fig.call('set', { distance: 7.86, animate: false });
  expect(bend.distances.roof).toBeCloseTo(8, 1);
  expect(bend.distances.front).toBeGreaterThan(bend.distances.window);
  expect(bend.distances.window).toBeGreaterThan(bend.distances.back);
  expect(bend.distances.back).toBeGreaterThan(bend.distances.roof);
  await expect(fig.frame.locator('.tm-verdict')).toHaveAttribute('data-state', 'no');

  // driving again from the start: a gentle start and stop, to the end of the bend
  await fig.call('set', { distance: 0, animate: false });
  await fig.call('set', { playing: true });
  expect((await fig.call('get')).playing).toBe(true);
  await fig.advance(7000);
  expect(await fig.call('get')).toMatchObject({ distance: 7.85, playing: false });

  await fig.call('reset');
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ distance: 0, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('translational-motion-bend: the test asks three different questions and marks the answers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'translational-motion-bend');
  await fig.frame.evaluate(() => {
    const w = /** @type {any} */ (window);
    w.__results = [];
    w.figure.on('practice-result', (p) => w.__results.push(p));
  });
  await fig.call('practice');
  for (let i = 0; i < 3; i++) {
    await fig.advance(6000);
    await fig.frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(300);
    await expect(fig.frame.locator('.pvc-q-feedback')).toHaveAttribute('data-tone', /ok|bad/);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await expect(fig.frame.locator('.pvc-quiz')).toHaveClass(/is-done/);
  const results = await fig.frame.evaluate(() => /** @type {any} */ (window).__results);
  expect(results.map((r) => r.kind)).toEqual(expect.arrayContaining(['far', 'turn', 'which']));
  for (const r of results) expect(r.choices).toHaveLength(4);
  expect(log.errors).toEqual([]);
});
