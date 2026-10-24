// Simple harmonic motion through the bridge (book p37, topic 2.2): let go from an end, the speed is zero there,
// greatest at the equilibrium point a quarter period later, and after one period it is back at the same end; the
// spring example does the same with its own period. Runs with `npm run test:figures` (dev only, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('simple-harmonic-motion: speed zero at the ends, greatest at the equilibrium point, one period', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'simple-harmonic-motion');

  const start = await fig.call('get');
  expect(start).toMatchObject({ example: 'swing', playing: true, slow: false, mode: 'explore' });
  expect(start.period).toBeCloseTo(2.458, 3);

  // let go from 20° on the left: at rest at that end
  let s = await fig.call('set', { angle: -20, playing: false });
  expect(s).toMatchObject({ side: -1, place: 'end', speed: 0, phase: 0 });
  expect(s.angle).toBeCloseTo(20, 1);
  expect(s.x).toBeCloseTo(-0.524, 3);

  // a quarter period later: the equilibrium point, at the greatest speed (A ω)
  s = await fig.call('set', { phase: 0.25 });
  expect(s).toMatchObject({ place: 'middle', going: 'out' });
  expect(s.speed).toBeCloseTo(s.maxSpeed, 3);
  expect(s.maxSpeed).toBeCloseTo(0.524 * Math.sqrt(9.8 / 1.5), 2);

  // playing for one period (2.458 s) brings it back to the same end
  await fig.call('set', { time: 0, playing: true });
  await fig.advance(2458);
  s = await fig.call('get');
  expect(Math.min(s.phase, 1 - s.phase)).toBeLessThan(0.03);
  expect(s.x).toBeLessThan(-0.5);

  // slowed down 4×: in the same time only a quarter of the way
  await fig.call('set', { slow: true, time: 0 });
  await fig.advance(2458);
  s = await fig.call('get');
  expect(s.phase).toBeGreaterThan(0.22);
  expect(s.phase).toBeLessThan(0.28);

  // the spring: its own period, the same pattern
  s = await fig.call('set', { example: 'spring', amplitude: 0.08, side: -1, phase: 0.5, playing: false, slow: false, animate: false });
  expect(s).toMatchObject({ example: 'spring', place: 'end', speed: 0, angle: null });
  expect(s.period).toBeCloseTo(1.257, 3);
  expect(s.x).toBeCloseTo(0.08, 3);
  s = await fig.call('set', { phase: 0.75 });
  expect(s.speed).toBeCloseTo(0.4, 3);

  await fig.call('reset');
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ example: 'swing', playing: true, slow: false, view: 'front' });
  expect(log.errors).toEqual([]);
});

test('simple-harmonic-motion: the test asks five different questions and marks the answers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'simple-harmonic-motion');
  const results = [];
  await fig.frame.evaluate(() => window.figure.on('practice-result', (r) => (window.__results ||= []).push(r)));
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1000);
    await fig.frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(300);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  results.push(...(await fig.frame.evaluate(() => window.__results)));
  expect(results).toHaveLength(5);
  expect(new Set(results.map((r) => r.kind)).size).toBe(5);
  for (const r of results) expect(r.correct).toBe(Math.abs(r.answer - r.expected) < (r.kind === 'time' ? 0.005 : 0.5));
  await fig.advance(500);
  expect(await fig.frame.locator('.pvc-q-result').textContent()).toMatch(/৫/);
  expect(log.errors).toEqual([]);
});
