// Strong nuclear force through the bridge (book p69, topic 3.2.4): a proton held within 10⁻¹⁵ m is pulled back by
// the strong force (much bigger than the electric push) and snaps back when let go; farther out the strong force
// is gone and the electric push sends it away; a big nucleus splits and two small ones join, each giving energy.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('strong-nuclear-force: the reach of the strong force, splitting and joining', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'strong-nuclear-force');

  expect(await fig.call('get')).toMatchObject({ scene: 'pull', distance: 0, phase: 'seated', arrows: { strong: false, electric: false } });

  // within reach: the strong pull is far bigger than the electric push, and it snaps back
  const held = await fig.call('set', { pull: 0.6 });
  expect(held).toMatchObject({ distance: 0.6, phase: 'held', inRange: true, verdict: 'back', arrows: { strong: true, electric: true } });
  expect(held.forces.strong).toBeGreaterThan(50 * held.forces.electric);
  expect(await fig.call('set', { pull: 1.0 })).toMatchObject({ inRange: true, verdict: 'back' });
  await fig.call('set', { release: true });
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ distance: 0, phase: 'back' });

  // beyond 10⁻¹⁵ m: no strong force, only the push; let go, it flies off
  const far = await fig.call('set', { pull: 1.1 });
  expect(far).toMatchObject({ inRange: false, verdict: 'away', arrows: { strong: false, electric: true } });
  expect(far.forces.strong).toBe(0);
  expect(far.forces.electric).toBeGreaterThan(0);
  await fig.call('set', { release: true });
  await fig.advance(300);
  expect((await fig.call('get')).phase).toBe('flying');
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ phase: 'gone' });

  // the keys: → pulls it out by 0.1 × 10⁻¹⁵ m, Space lets go
  await fig.call('reset');
  await page
    .frames()
    .find((f) => f.url().includes('/assets/strong-nuclear-force/'))
    .locator('.pvc')
    .focus();
  for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowRight');
  expect(await fig.call('get')).toMatchObject({ distance: 0.7, phase: 'held' });
  await page.keyboard.press(' ');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ distance: 0, phase: 'back' });

  // a big nucleus splits; two small ones join
  await fig.call('set', { scene: 'split' });
  expect((await fig.call('get')).energy).toMatchObject({ playing: true });
  await fig.advance(6500);
  expect((await fig.call('get')).energy).toMatchObject({ playing: false, phase: 'done', t: 5.6 });
  const joined = await fig.call('set', { scene: 'join', t: 4.4 });
  expect(joined).toMatchObject({ scene: 'join', energy: { phase: 'done' } });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ scene: 'pull', distance: 0, phase: 'seated', view: 'front' });
  expect(log.errors).toEqual([]);
});

test('strong-nuclear-force: the test runs five questions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'strong-nuclear-force');
  const frame = page.frames().find((f) => f.url().includes('/assets/strong-nuclear-force/'));
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(600);
    await frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(200);
    await expect(frame.locator('.pvc-q-feedback')).not.toHaveAttribute('data-tone', '');
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(600);
  await expect(frame.locator('.pvc-q-result')).toBeVisible();
  // leaving the test gives back the learning view
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', scene: 'pull', phase: 'seated' });
  expect(log.errors).toEqual([]);
});
