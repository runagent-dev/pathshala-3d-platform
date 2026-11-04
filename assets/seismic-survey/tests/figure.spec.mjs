// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// blast's echoes are recorded, each echo gives depth = v t / 2, the 3D picture is made, the test runs.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('seismic-survey: echoes give the depths, then the 3D picture', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'seismic-survey');
  let st = await fig.call('get');
  expect(st).toMatchObject({ fired: false, done: false, layer: 0, image: false, v: 2500 });
  // the blast: the camera moves in first, then the waves run (slowed 6×), the record is made after 1.15 s of survey time
  await fig.call('set', { fire: true });
  await fig.advance(300);
  st = await fig.call('get');
  expect(st).toMatchObject({ running: true, wave: 0 });
  expect(st.focus).toBeGreaterThan(0);
  await fig.advance(700);
  st = await fig.call('get');
  expect(st.wave).toBeGreaterThan(0);
  expect(st.focus).toBe(1);
  await fig.advance(2000);
  st = await fig.call('get');
  expect(st.running).toBe(true);
  expect(st.wave).toBeGreaterThan(0.3);
  expect(st.wave).toBeLessThan(0.7);
  await fig.advance(5000);
  st = await fig.call('get');
  expect(st).toMatchObject({ running: false, done: true, layer: 1, t: 0.28, depth: 350, focus: 0 });
  // each echo: t at the first geophone and v t / 2
  st = await fig.call('set', { layer: 2 });
  expect(st).toMatchObject({ layer: 2, t: 0.56, depth: 700 });
  // the word in the panel chooses too
  await fig.frame.locator('[data-example="e2"]').click();
  st = await fig.call('get');
  expect(st).toMatchObject({ layer: 3, t: 0.8, depth: 1000 });
  expect(st.measured.map((m) => m.depth)).toEqual([350, 700, 1000]);
  // the 3D picture
  st = await fig.call('set', { image: true, animate: false });
  expect(st).toMatchObject({ image: true, mapped: true });
  // the test starts, an answer is marked
  await fig.call('practice');
  await fig.advance(2000);
  expect((await fig.call('get')).mode).toBe('quiz');
  await fig.frame.locator('.pvc-opt[data-q="0"]').click();
  await fig.advance(300);
  expect(['ok', 'bad']).toContain(await fig.frame.locator('.pvc-q-feedback').getAttribute('data-tone'));
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ fired: false, layer: 0, image: false, mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('seismic-survey: a frozen blast is the same picture every time, and the view is back for the echoes', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'seismic-survey');
  const shot = () => fig.call('capture', { width: 422, height: 195 });
  await fig.call('set', { wave: 0.08 });
  await fig.advance(100);
  expect((await fig.call('get')).focus).toBe(1);
  const a = await shot();
  await fig.call('set', { wave: 0.5 });
  await fig.advance(100);
  expect((await fig.call('get')).focus).toBe(0);
  await fig.call('set', { wave: 0.08 });
  await fig.advance(100);
  expect(JSON.stringify(await shot()) === JSON.stringify(a)).toBe(true);
  await fig.call('reset');
  expect((await fig.call('get')).focus).toBe(0);
  expect(log.errors).toEqual([]);
});
