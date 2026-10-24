// Speed and velocity through the bridge (book pages 40–41, topic 2.5): the stone keeps its speed while its
// velocity turns, flies off along the tangent when let go (and lands in the pond when let go at the right moment),
// and the cycle on the road of চিত্র ২.০৪ gives the book's 12 km/h and 6 km/h. Runs with `npm run test:figures`
// (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('speed-velocity: whirl, let go, ride from A to B', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'speed-velocity');

  // going round: same speed, the direction of the velocity changes
  let s = await fig.call('set', { angle: 0, whirl: false });
  expect(s).toMatchObject({ scene: 'stone', stone: { phase: 'still', angle: 0, speed: 4, heading: 90, direction: 'N' } });
  await fig.call('set', { angle: 0 });
  await fig.advance(1000); // 1 s on screen is 1/3 s of real time: 4/3 rad, about 76°
  s = await fig.call('get');
  expect(s.stone.phase).toBe('whirl');
  expect(s.stone.angle).toBeGreaterThan(70);
  expect(s.stone.angle).toBeLessThan(82);
  expect(s.stone.speed).toBe(4);
  expect(s.stone.direction).toBe('W'); // heading = angle + 90°, about 166°

  // let go facing the pond (the usual mistake): it flies along the tangent and misses
  s = await fig.call('set', { release: 35, animate: false });
  expect(s.stone.released).toMatchObject({ angle: 35, heading: 125, direction: 'NW', inPond: false });
  await fig.advance(200);
  expect((await fig.call('get')).stone.phase).toBe('done');

  // let go when the velocity points at the pond: in it goes
  await fig.call('set', { whirl: true });
  s = await fig.call('set', { release: 331 });
  expect(s.stone).toMatchObject({ phase: 'flying', released: { inPond: true } });
  await fig.advance(3000);
  s = await fig.call('get');
  expect(s.stone).toMatchObject({ phase: 'done', landed: { inPond: true } });

  // the cycle: 4 km along the road, 2 km straight, in 20 minutes
  s = await fig.call('set', { km: 2 });
  expect(s).toMatchObject({ scene: 'road', road: { km: 2, minutes: 10, distance: 2, avgSpeed: 12, playing: false } });
  expect(s.road.displacement).toBeLessThan(2);
  s = await fig.call('set', { minutes: 20 });
  expect(s.road).toMatchObject({ km: 4, minutes: 20, distance: 4, avgSpeed: 12 });
  expect(s.road.displacement).toBeCloseTo(2, 2);
  expect(s.road.avgVelocity).toBeCloseTo(6, 2);
  await fig.call('set', { km: 0, playing: true });
  await fig.advance(4000);
  s = await fig.call('get');
  expect(s.road.playing).toBe(true);
  expect(s.road.km).toBeGreaterThan(1.8);
  expect(s.road.km).toBeLessThan(2.2);
  await fig.advance(4500);
  expect((await fig.call('get')).road).toMatchObject({ km: 4, minutes: 20, playing: false });

  await fig.call('reset');
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ scene: 'stone', view: 'front', stone: { phase: 'whirl', released: null } });
  expect(log.errors).toEqual([]);
});
