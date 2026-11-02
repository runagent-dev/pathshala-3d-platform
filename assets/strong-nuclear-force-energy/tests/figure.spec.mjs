// Strong nuclear force: nuclear energy, through the bridge (book p69, topic 3.2.4): a big nucleus splits and two
// small ones join, each giving energy; the test runs.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('strong-nuclear-force-energy: splitting and joining', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'strong-nuclear-force-energy');

  // the split plays by itself at the start
  expect(await fig.call('get')).toMatchObject({ scene: 'split', energy: { playing: true } });
  await fig.advance(6500);
  expect((await fig.call('get')).energy).toMatchObject({ playing: false, phase: 'done', t: 5.6 });
  const joined = await fig.call('set', { scene: 'join', t: 4.4 });
  expect(joined).toMatchObject({ scene: 'join', energy: { phase: 'done' } });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ scene: 'split', view: 'front', energy: { t: 0 } });
  expect(log.errors).toEqual([]);
});

test('strong-nuclear-force-energy: the test runs four questions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'strong-nuclear-force-energy');
  const frame = fig.frame;
  await fig.call('practice');
  for (let i = 0; i < 4; i++) {
    await fig.advance(600);
    await frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(200);
    await expect(frame.locator('.pvc-q-feedback')).not.toHaveAttribute('data-tone', '');
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(600);
  await expect(frame.locator('.pvc-q-result')).toBeVisible();
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore' });
  expect(log.errors).toEqual([]);
});
