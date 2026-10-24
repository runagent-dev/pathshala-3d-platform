// Distance and displacement through the bridge (book p39, topic 2.4): riding the winding road from A, the distance
// counts every kilometre ridden (the way back too) and the displacement is the straight line from A, with the book's
// numbers: B is 4 km along the road but 2 km from A, C is 6 km along the road but 1.31 km from A, and back at A the
// displacement is zero. Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('distance-displacement: ride to B, to C and back to A', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'distance-displacement');

  expect(await fig.call('get')).toMatchObject({ km: 0, trip: 0, at: 'A', displacement: { km: 0, bearing: null, dir: null } });

  // the book's example: 4 km of road to B, a displacement of only 2 km, north-east
  await fig.call('set', { ride: 'B' });
  expect(await fig.call('get')).toMatchObject({ km: 4, trip: 4, at: 'B', riding: false, displacement: { km: 2, dir: 'NE' } });
  // the panel says so in Bangla digits
  await expect(fig.frame.locator('.dd-card.dist b')).toHaveText('৪.০০');
  await expect(fig.frame.locator('.dd-card.disp b')).toHaveText('২.০০');
  await expect(fig.frame.locator('.dd-dir')).toHaveText('উত্তর-পূর্ব দিকে');

  // on to C: 6 km in all, but C is only 1.311 km from A
  await fig.call('set', { ride: 'C' });
  expect(await fig.call('get')).toMatchObject({ km: 6, trip: 6, at: 'C', displacement: { km: 1.311, dir: 'N' } });

  // back to A along the road: the distance keeps growing, the displacement is zero
  await fig.call('set', { ride: 'A' });
  expect(await fig.call('get')).toMatchObject({ km: 0, trip: 12, at: 'A', displacement: { km: 0, bearing: null } });

  // a new trip through stops: out to km 5, back to km 3 → 7 km ridden
  await fig.call('set', { route: [5, 3], animate: false });
  expect(await fig.call('get')).toMatchObject({ km: 3, trip: 7 });
  await fig.call('set', { newTrip: true });
  expect(await fig.call('get')).toMatchObject({ km: 0, trip: 0 });

  // the arrow keys ride along the road a tenth of a kilometre at a time, and it counts
  await fig.frame.locator('.pvc').focus();
  for (let i = 0; i < 5; i++) await fig.frame.locator('.pvc').press('ArrowRight');
  await fig.frame.locator('.pvc').press('ArrowLeft');
  expect(await fig.call('get')).toMatchObject({ km: 0.4, trip: 0.6 });

  // the panel's buttons
  await fig.frame.locator('[data-act="ride"][data-to="C"]').click();
  await fig.advance(4000);
  expect(await fig.call('get')).toMatchObject({ km: 6, at: 'C' });
  await fig.frame.locator('[data-act="new"]').click();
  expect(await fig.call('get')).toMatchObject({ km: 0, trip: 0 });

  // the test: five questions, each answered
  const results = [];
  await fig.frame.evaluate(() => window.figure.on('practice-result', (r) => (window.__results = [...(window.__results || []), r])));
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(4500); // the scene rides first, then the choices appear
    await fig.frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  results.push(...(await fig.frame.evaluate(() => window.__results)));
  expect(results).toHaveLength(5);
  expect(new Set(results.map((r) => r.kind)).size).toBe(5);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫');

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ km: 0, trip: 0, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});
