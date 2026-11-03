// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// action starts and pauses the driver, the green particle only swings in place on both media, the two words switch
// the medium and the wave's name is found; set and reset; the five-question test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/wave-types/'));

test('wave-types: shake the rope, then push the spring; the particles only swing in place', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'wave-types');
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ medium: 'rope', kind: 'transverse', running: false, t: 0, particle: 0, next: 'rope' });

  await frame.locator('.pvc-act').click();
  await fig.advance(600);
  let st = await fig.call('get');
  expect(st).toMatchObject({ running: true, particle: 0 }); // the wave has not reached the green particle yet
  expect(st.front).toBeGreaterThan(0.2);
  await fig.advance(3500);
  st = await fig.call('get');
  expect(st).toMatchObject({ running: true, seen: ['rope'], next: 'pause' });
  expect(Math.abs(st.particle)).toBeLessThanOrEqual(st.amplitude + 1e-9);

  await frame.locator('.pvc-act').click(); // pause
  await fig.advance(800);
  const paused = await fig.call('get');
  expect(paused.running).toBe(false);
  await fig.advance(800);
  expect((await fig.call('get')).t).toBe(paused.t);

  await frame.locator('[data-example="spring"]').click();
  await fig.advance(900);
  expect(await fig.call('get')).toMatchObject({ medium: 'spring', kind: 'longitudinal', running: false, t: 0, next: 'spring' });
  await frame.locator('.pvc-act').click();
  await fig.advance(4500);
  st = await fig.call('get');
  expect(st.seen).toEqual(['rope', 'spring']);
  expect(Math.abs(st.particle)).toBeLessThanOrEqual(st.amplitude + 1e-9);
  expect(['ahead', 'back', 'still']).toContain(st.heading);

  expect(await fig.call('set', { medium: 'rope', t: 4, running: false, animate: false })).toMatchObject({ medium: 'rope', t: 4, running: false });
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ medium: 'rope', t: 0, running: false, seen: [], mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('wave-types: a second tap within the double-tap time does not undo the first', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'wave-types');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await fig.advance(100);
  await frame.locator('.pvc-act').click();
  await fig.advance(300);
  expect((await fig.call('get')).running).toBe(true);
  expect(log.errors).toEqual([]);
});

test('wave-types: a tap on the driver in the 3D view starts it, a second tap pauses it', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'wave-types');
  const frame = frameOf(page);
  const canvas = await frame.locator('canvas').first().boundingBox();
  const tap = async () => {
    const { driverAt } = await fig.call('get');
    await page.mouse.click(canvas.x + driverAt.x, canvas.y + driverAt.y);
  };
  await tap();
  await fig.advance(1500);
  expect((await fig.call('get')).running).toBe(true);
  await tap();
  await fig.advance(300);
  const st = await fig.call('get');
  expect(st.running).toBe(false);
  expect(st.t).toBeGreaterThan(1);
  await fig.call('set', { medium: 'spring', animate: false });
  await tap();
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ medium: 'spring', running: true });
  expect(log.errors).toEqual([]);
});

test('wave-types: the test runs five questions and leaves a sensible learn state', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'wave-types');
  const frame = frameOf(page);
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1200);
    await frame.locator('[data-q]').first().click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', medium: 'rope', running: false, t: 0 });
  expect(log.errors).toEqual([]);
});
