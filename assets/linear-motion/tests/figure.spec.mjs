// Linear motion through the bridge (book p36, topic 2.2): a pushed striker slides along a straight line and stops,
// a ball let go falls straight down (shown 4 times slower), a ball thrown sideways curves away from the straight
// line through its ends; clear and reset bring things back; the test runs by touch-free clicks.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('linear-motion: push, drop and throw leave straight and curved paths', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'linear-motion');

  expect(await fig.call('get')).toMatchObject({
    example: 'push',
    phase: 'ready',
    striker: { x: 0, z: 0.255 },
    ball: { onHolder: true },
    runs: { push: null, drop: null, throw: null },
  });

  // straight ahead at full strength: it slides to 2.5 cm short of the far frame, slowing evenly (μ = 0.12)
  await fig.call('set', { example: 'push', angle: 0, strength: 1 });
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

  // the drop: 0.4 s of real fall, shown 4 times slower, straight down onto the board
  await fig.call('set', { example: 'drop' });
  await fig.call('set', { run: true });
  await fig.advance(800); // 0.2 s of the fall: still in the air
  const falling = await fig.call('get');
  expect(falling.phase).toBe('moving');
  expect(falling.ball.y).toBeGreaterThan(0.3);
  expect(falling.ball.y).toBeLessThan(0.78);
  await fig.advance(2500);
  const dropped = await fig.call('get');
  expect(dropped).toMatchObject({ example: 'drop', phase: 'done', path: 'straight', ball: { x: -0.2, y: 0.036, onHolder: false } });
  expect(dropped.runs.drop).toMatchObject({ linear: true, duration: 0.395, pictures: 8, step: 0.05 });

  // the sideways throw at 1 m/s: it lands 39.5 cm to the side, the path up to ~9 cm off the straight line
  const thrown = await fig.call('set', { example: 'throw', run: true, animate: false });
  expect(thrown).toMatchObject({ example: 'throw', phase: 'done', path: 'curved', linear: false });
  expect(thrown.ball.x).toBeCloseTo(0.195, 3);
  expect(thrown.runs.throw.deviation).toBeGreaterThan(0.08);
  expect(thrown.runs.throw.deviation).toBeLessThan(0.1);
  expect(thrown.runs.drop.linear).toBe(true); // the drop's marks stay for comparison

  const cleared = await fig.call('set', { clear: true });
  expect(cleared).toMatchObject({ phase: 'ready', runs: { throw: null }, ball: { onHolder: true } });

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
    example: 'push',
    phase: 'ready',
    mode: 'explore',
    view: 'front',
    striker: { x: 0, z: 0.255 },
    runs: { push: null, drop: null, throw: null },
  });
  expect(log.errors).toEqual([]);
});
