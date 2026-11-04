// Linear motion: the falling ball, through the bridge (book p36, topic 2.2): a ball let go falls straight down
// (shown 4 times slower), a ball thrown sideways curves away from the straight line through its ends; clear and
// reset bring things back; the test runs by touch-free clicks.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('linear-motion-ball: a drop is straight, a sideways throw is curved', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'linear-motion-ball');

  expect(await fig.call('get')).toMatchObject({ example: 'drop', phase: 'ready', ball: { onHolder: true }, runs: { drop: null, throw: null } });

  // the drop: 0.4 s of real fall, shown 4 times slower, straight down onto the bench
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
  expect(await fig.call('get')).toMatchObject({ example: 'drop', phase: 'ready', mode: 'explore', view: 'front', runs: { drop: null, throw: null } });
  expect(log.errors).toEqual([]);
});
