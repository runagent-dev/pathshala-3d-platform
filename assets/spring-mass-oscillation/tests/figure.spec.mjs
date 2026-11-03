// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged):
// T = 2π√(m/k) for the chosen pair, the run after a pull down by a, the same T for another a, the test's scenes.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('spring-mass-oscillation: T = 2π√(m/k), the motion after a pull, and what the student finds', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'spring-mass-oscillation');
  let s = await fig.call('get');
  expect(s).toMatchObject({ m: 0.5, k: 50, state: 'rest', runs: 0, next: 'release' });
  expect(s.T).toBeCloseTo(2 * Math.PI * 0.1, 3);
  expect(s.stretch).toBeCloseTo(0.098, 4);

  // pulled down 4 cm and let go: x = −a at the start, +a half a period later (real time)
  s = await fig.call('set', { run: 0.04, at: 0, hold: true, animate: false });
  expect(s).toMatchObject({ state: 'run', a: 0.04 });
  expect(s.x).toBeCloseTo(-0.04, 4);
  s = await fig.call('set', { run: 0.04, at: Math.PI * 0.1, hold: true, animate: false });
  expect(s.x).toBeCloseTo(0.04, 3);
  expect(Math.abs(s.v)).toBeLessThan(0.002);
  // another amplitude, the same pair: the figure says T did not change
  s = await fig.call('set', { run: 0.02, at: 0, animate: false });
  expect(s.found.amp).toBe(true);
  expect(s.T).toBeCloseTo(0.6283, 3);

  // four times the mass on the same spring: twice the period
  const t0 = (await fig.call('set', { m: 0.25, k: 25, animate: false })).T;
  s = await fig.call('set', { m: 1, animate: false });
  expect(s.T / t0).toBeCloseTo(2, 3);
  expect(s.state).toBe('rest');
  s = await fig.call('set', { run: 0.05, at: 0, animate: false });
  expect(s.found.mk).toBe(true);

  // running in time: the virtual clock moves it (4 times slower than real)
  s = await fig.call('set', { m: 0.5, k: 50, animate: false });
  await fig.call('set', { run: 0.04, at: 0, animate: false });
  await fig.advance(1000); // 1 s on the screen is 0.25 s of real time
  s = await fig.call('get');
  expect(s.t).toBeGreaterThan(0.2);
  expect(s.t).toBeLessThan(0.3);

  await fig.call('set', { graph: 'v' });
  expect((await fig.call('get')).graph).toBe('v');
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ state: 'rest', runs: 0, m: 0.5, k: 50, graph: 'x' });
  expect(log.errors).toEqual([]);
});
