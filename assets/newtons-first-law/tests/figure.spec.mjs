// Newton's first law through the bridge (book p64, topic 3.1): a book at rest stays at rest; the same push sends it
// 1.31 m on the mat, 2.55 m on wood, 9.18 m on ice, each slowing evenly (then the view looks down the lane); with no
// friction its velocity stays 3 m/s
// for as long as we watch; the test starts and an answer is marked; reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('newtons-first-law: friction stops the book, without friction it keeps its velocity', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'newtons-first-law');

  const start = await fig.call('get');
  expect(start).toMatchObject({ surface: 'mat', phase: 'rest', speed: 0, distance: 0, results: { mat: null, wood: null, ice: null, none: null } });
  // at rest, with no push, nothing happens however long we wait
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', speed: 0, distance: 0 });

  // the mat: pushed (0.2 s), then slowing evenly: half-way through the slide it goes at half the speed
  await fig.call('set', { push: true });
  await fig.advance(100);
  expect((await fig.call('get')).phase).toBe('push');
  await fig.advance(100 + 437);
  const mid = await fig.call('get');
  expect(mid.phase).toBe('slide');
  expect(mid.speed).toBeGreaterThan(1.4);
  expect(mid.speed).toBeLessThan(1.6);
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ phase: 'stopped', speed: 0, distance: 1.31, results: { mat: 1.31 } });
  // a moment later the view pulls back down the lane, every stop in sight
  await fig.advance(1500);
  expect((await fig.call('get')).camera).toBe('overview');

  // wood and ice go farther (jumping to the end)
  await fig.call('set', { surface: 'wood', push: true, animate: false });
  expect(await fig.call('get')).toMatchObject({ surface: 'wood', phase: 'stopped', distance: 2.55 });
  await fig.call('set', { surface: 'ice', animate: false });
  await fig.call('set', { at: 2 });
  const ice = await fig.call('get');
  expect(ice).toMatchObject({ surface: 'ice', phase: 'slide', time: 2 });
  expect(ice.speed).toBeCloseTo(3 - 0.05 * 9.8 * 2, 2);
  await fig.call('set', { at: 7 });
  expect(await fig.call('get')).toMatchObject({ phase: 'stopped', distance: 9.18, results: { mat: 1.31, wood: 2.55, ice: 9.18 } });

  // no friction: the same velocity, 3 m/s, on and on (3 m every second)
  await fig.call('set', { surface: 'none', push: true });
  await fig.advance(1200);
  const a = await fig.call('get');
  await fig.advance(4000);
  const b = await fig.call('get');
  expect(a).toMatchObject({ surface: 'none', phase: 'slide', speed: 3 });
  expect(b).toMatchObject({ phase: 'slide', speed: 3, results: { none: 'never' } });
  expect(b.distance - a.distance).toBeCloseTo(12, 1);

  // back to the start: at rest again
  await fig.call('set', { home: true, animate: false });
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', speed: 0, distance: 0 });

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
    surface: 'mat',
    phase: 'rest',
    mode: 'explore',
    view: 'front',
    camera: 'side',
    results: { mat: null, wood: null, ice: null, none: null },
  });
  expect(log.errors).toEqual([]);
});
