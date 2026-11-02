// Linear motion: the push, through the bridge (book p36, topic 2.2): a pushed striker slides along a straight line
// and stops; clear and reset bring things back; the test runs by touch-free clicks.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('linear-motion: a push leaves a straight path', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'linear-motion');

  expect(await fig.call('get')).toMatchObject({ phase: 'ready', striker: { x: 0, z: 0.255 }, runs: { push: null } });

  // straight ahead at full strength: it slides to 2.5 cm short of the far frame, slowing evenly (μ = 0.12)
  await fig.call('set', { angle: 0, strength: 1 });
  await fig.advance(400);
  const mid = await fig.call('get');
  expect(mid.phase).toBe('moving');
  expect(mid.striker.z).toBeLessThan(0.2);
  expect(mid.striker.z).toBeGreaterThan(-0.3);
  await fig.advance(2000);
  const pushed = await fig.call('get');
  expect(pushed).toMatchObject({ phase: 'done', path: 'straight', linear: true });
  expect(pushed.striker.x).toBeCloseTo(0, 3);
  expect(pushed.striker.z).toBeCloseTo(-0.324, 3);
  expect(pushed.runs.push).toMatchObject({ linear: true, distance: 0.579, duration: 0.993, pictures: 10, step: 0.1 });
  expect(pushed.runs.push.deviation).toBeLessThan(0.002);

  // at an angle, jumping to the end: still a straight line
  const angled = await fig.call('set', { angle: -25, strength: 0.8, animate: false });
  expect(angled).toMatchObject({ phase: 'done', path: 'straight', runs: { push: { angle: -25, strength: 0.8 } } });

  const cleared = await fig.call('set', { clear: true });
  expect(cleared).toMatchObject({ phase: 'ready', runs: { push: null }, striker: { x: 0, z: 0.255 } });

  // the test starts, an answer is marked
  await fig.call('practice');
  await fig.advance(6000);
  expect((await fig.call('get')).mode).toBe('quiz');
  await fig.frame.locator('.pvc-opt[data-q="0"]').click();
  await fig.advance(300);
  expect(['ok', 'bad']).toContain(await fig.frame.locator('.pvc-q-feedback').getAttribute('data-tone'));

  await fig.call('reset');
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({
    phase: 'ready',
    mode: 'explore',
    view: 'front',
    striker: { x: 0, z: 0.255 },
    runs: { push: null },
  });
  expect(log.errors).toEqual([]);
});
