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

  // one equation at a time; a tapped letter lights its quantity; the train at V only comes with s = Vt
  const frame = page.frames().find((f) => f.url().includes('/assets/equations-of-motion/'));
  expect(await fig.call('set', { u: 4, a: 1, t: 6, eq: 's2' })).toMatchObject({ eq: 's2', hl: null });
  await expect(frame.locator('.eom-f')).toHaveText('s = ut + ½at²');
  await frame.locator('.eom-chips [data-example="Vt"]').click();
  await frame.locator('.eom-f [data-sym="t"]').click();
  expect(await fig.call('get')).toMatchObject({ eq: 'Vt', hl: 't' });
  await expect(frame.locator('.eom-rule')).toContainText('t');

  // the derivation sheet: four steps, পরের ধাপ shows the next line, and it closes
  await frame.locator('[data-act="derive"]').click();
  expect((await fig.call('get')).derive).toEqual({ open: true, step: 1, part: 0 });
  await expect(frame.locator('.eom-dv-line.in')).toHaveCount(0);
  await frame.locator('[data-dv="next"]').click();
  await frame.locator('[data-dv="next"]').click();
  await expect(frame.locator('.eom-dv-line.in')).toHaveCount(2);
  await frame.locator('[data-dv-step="2"]').click();
  for (let i = 0; i < 4; i++) await frame.locator('[data-dv="next"]').click();
  // the student's numbers: 24 + 18 = 42 m, the same as the run
  await expect(frame.locator('.eom-dv-line.res .n')).toContainText(/42|\u09ea\u09e8/);
  await frame.locator('[data-dv="prev"]').click();
  expect((await fig.call('get')).derive).toEqual({ open: true, step: 2, part: 3 });
  await frame.locator('[data-dv="close"]').click();
  expect((await fig.call('get')).derive.open).toBe(false);

  // the book's worked example: from rest to 60 km/hour in 1 minute → 16.67 m/s, a = 0.278 m/s²
  await frame.locator('[data-act="example"]').click();
  expect((await fig.call('get')).example).toMatchObject({
    open: true,
    part: 0,
    kmh: 60,
    t: 60,
    v: 16.67,
    a: 0.278,
    rate: 1,
    view: 'side',
    phase: 'ready',
  });
  await expect(frame.locator('.eom-ex-line.in')).toHaveCount(0);
  // real time to start with; at ৫× 6 s of watching is 30 s for the car, half its final speed
  await frame.locator('[data-ex-rate="5"]').click();
  await frame.locator('[data-ex="run"]').click();
  await fig.advance(6000);
  const ex = (await fig.call('get')).example;
  expect(ex.phase).toBe('running');
  expect(ex.time).toBeGreaterThan(29);
  expect(ex.time).toBeLessThan(31.5);
  expect(ex.speed).toBeCloseTo((ex.time * 1000) / 3600, 2);
  await fig.advance(7000);
  expect((await fig.call('get')).example).toMatchObject({ phase: 'done', time: 60, playing: false, rate: 5 });
  // the timeline shows any moment, stopped there; the camera goes behind the car
  await frame.locator('.eom-ex-scrub input').fill('20');
  expect((await fig.call('get')).example).toMatchObject({ time: 20, phase: 'paused' });
  expect((await fig.call('get')).example.speed).toBeCloseTo(20000 / 3600, 2);
  await frame.locator('[data-ex-view="chase"]').click();
  expect((await fig.call('get')).example.view).toBe('chase');
  // the answer line by line, the last one the book's 0.278
  for (let i = 0; i < 4; i++) await frame.locator('[data-ex="next"]').click();
  await expect(frame.locator('.eom-ex-line.in')).toHaveCount(4);
  await expect(frame.locator('.eom-ex-line.res .f')).toContainText(/0\.278|\u09e6\.\u09e8\u09ed\u09ee/);
  // another question: 90 km/hour in 30 s → 25 m/s, a = 0.833 m/s²; the car goes back to the line
  await frame.locator('[data-ex-step="v"][data-dir="1"]').click();
  await frame.locator('[data-ex-step="v"][data-dir="1"]').click();
  await frame.locator('[data-ex-step="v"][data-dir="1"]').click();
  for (let i = 0; i < 3; i++) await frame.locator('[data-ex-step="t"][data-dir="-1"]').click();
  expect((await fig.call('get')).example).toMatchObject({ kmh: 90, t: 30, v: 25, a: 0.833, time: 0, phase: 'ready' });
  await frame.locator('[data-ex="close"]').click();
  expect((await fig.call('get')).example.open).toBe(false);

  await fig.call('reset');
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ u: 4, a: 1, t: 6, time: 0, phase: 'ready', view: 'front', mode: 'explore', eq: 'v', hl: null });
  expect(log.errors).toEqual([]);
});
