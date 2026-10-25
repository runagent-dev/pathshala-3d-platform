// Equations of motion through the bridge (book pages 45–46, topic 2.7): the train runs in real time with
// v = u + at and s = ut + ½at², the train at the average velocity V = (u + v)/2 arrives with it, a braking train
// stops (its time is cut to when it stops) and never goes backwards. Runs with `npm run test:figures` (dev-only
// folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('equations-of-motion: run, average velocity, braking', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'equations-of-motion');

  // the opening example: u = 4 m/s, a = 1 m/s², t = 6 s → v = 10 m/s, V = 7 m/s, s = 42 m
  expect(await fig.call('get')).toMatchObject({ u: 4, a: 1, t: 6, v: 10, V: 7, s: 42, time: 0, phase: 'ready' });

  // it runs in real time: after 3 s it has v = 7 m/s and has gone 16.5 m; the V-train has gone 21 m
  await fig.call('set', { playing: true });
  await fig.advance(3000);
  const s = await fig.call('get');
  expect(s.phase).toBe('running');
  expect(s.time).toBeGreaterThan(2.9);
  expect(s.time).toBeLessThan(3.15);
  expect(s.velocity).toBeCloseTo(4 + s.time, 6);
  expect(s.distance).toBeCloseTo(4 * s.time + 0.5 * s.time ** 2, 6);
  expect(s.ghost).toBeCloseTo(7 * s.time, 6);
  // both arrive at 42 m after 6 s
  await fig.advance(3500);
  expect(await fig.call('get')).toMatchObject({ phase: 'done', time: 6, distance: 42, ghost: 42, velocity: 10, playing: false });

  // any moment, stopped there
  expect(await fig.call('set', { time: 2 })).toMatchObject({ phase: 'paused', time: 2, velocity: 6, distance: 10, ghost: 14 });

  // braking from 12 m/s at 1.5 m/s² stops after 8 s: 9 s is cut to 8 s; s = u²/2|a| = 48 m
  expect(await fig.call('set', { u: 12, a: -1.5, t: 9 })).toMatchObject({ u: 12, a: -1.5, t: 8, v: 0, V: 6, s: 48 });
  expect(await fig.call('set', { time: 'end' })).toMatchObject({ phase: 'done', distance: 48, velocity: 0 });
  // at rest a negative acceleration would send it backwards: it is made zero
  expect(await fig.call('set', { u: 0, a: -1, t: 3 })).toMatchObject({ u: 0, a: 0, t: 3, v: 0, s: 0 });
  // no acceleration: v = u and s = vt
  expect(await fig.call('set', { u: 6, a: 0, t: 5 })).toMatchObject({ v: 6, V: 6, s: 30 });

  await fig.call('reset');
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ u: 4, a: 1, t: 6, time: 0, phase: 'ready', view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});
