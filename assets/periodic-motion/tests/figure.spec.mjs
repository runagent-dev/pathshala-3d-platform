// Periodic motion through the bridge (book p37, topic 2.2): each example comes back to the mark after the same
// time, so total ÷ count is its period (fan 0.2 s, comet 76 years, spring 0.8 s, heart 0.8 s); moving the mark
// starts the count again; pausing stops the clock; the test runs. Runs with `npm run test:figures` (dev only).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { validateGlb } from '../../../scripts/lib/export/glb.mjs';

test('periodic-motion: the same time between repetitions, for every example', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'periodic-motion');

  expect(await fig.call('get')).toMatchObject({ example: 'fan', unit: 's', period: 0.2, count: 0, playing: true });

  // the fan is shown 10 times slower: a turn every 2 s on the screen, 0.2 s on its clock
  await fig.advance(7000);
  const fan = await fig.call('get');
  expect(fan.count).toBeGreaterThanOrEqual(3);
  expect(fan.measured).toBeCloseTo(0.2, 6);
  for (const lap of fan.laps) expect(lap).toBeCloseTo(0.2, 6);

  const comet = await fig.call('set', { example: 'comet', time: 170, animate: false });
  expect(comet).toMatchObject({ example: 'comet', unit: 'yr', period: 76, count: 2, total: 152, measured: 76 });

  // a new mark: the count starts again, and the period is the same wherever the mark is
  expect(await fig.call('set', { mark: 0.3 })).toMatchObject({ count: 0, mark: 0.3 });
  const moved = await fig.call('set', { time: 300 });
  expect(moved.count).toBe(3);
  expect(moved.measured).toBeCloseTo(76, 6);

  const spring = await fig.call('set', { example: 'spring', time: 4, animate: false });
  expect(spring).toMatchObject({ example: 'spring', count: 4 });
  expect(spring.measured).toBeCloseTo(0.8, 6);

  const heart = await fig.call('set', { example: 'heart', time: 3, animate: false });
  expect(heart).toMatchObject({ example: 'heart', count: 3 });
  expect(heart.measured).toBeCloseTo(0.8, 6);

  // paused: the clock stands still
  await fig.call('set', { playing: false });
  const t0 = (await fig.call('get')).time;
  await fig.advance(1500);
  expect((await fig.call('get')).time).toBe(t0);
  await fig.call('set', { playing: true });
  await fig.advance(500);
  expect((await fig.call('get')).time).toBeGreaterThan(t0);

  // the test: an answer is marked
  const frame = page.frames().find((f) => f.url().includes('/assets/periodic-motion/'));
  await fig.call('practice');
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'quiz' });
  await frame.locator('.pvc-opt[data-q="1"]').click();
  await fig.advance(300);
  expect(await frame.locator('.pvc-q-feedback').getAttribute('data-tone')).toMatch(/ok|bad/);

  await fig.call('reset');
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ example: 'fan', mode: 'explore', view: 'front', playing: true });
  expect(log.errors).toEqual([]);
});

test('periodic-motion: the detailed heart pauses, repeats its count and exports a valid sculpted model', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'periodic-motion', { params: { example: 'heart' } });
  await fig.call('set', { playing: false, time: 3.6, animate: false });
  const paused = await fig.call('get');
  await fig.advance(1000);
  expect((await fig.call('get')).time).toBe(paused.time);
  expect(paused.measured).toBeCloseTo(0.8, 6);
  const glb = await fig.call('export-glb');
  const bytes = Buffer.from(glb.base64, 'base64');
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  const names = json.nodes.map((node) => node.name);
  expect(names).toEqual(
    expect.arrayContaining(['SculptedMyocardium', 'Aorta', 'AortaLumen', 'PulmonaryTrunk', 'SuperiorVenaCava', 'AnteriorCoronaryArtery']),
  );
  const validation = await validateGlb(bytes);
  expect(validation.errors, JSON.stringify(validation.messages)).toBe(0);
  expect(validation.warnings, JSON.stringify(validation.messages)).toBe(0);
  await fig.call('set', { playing: true });
  await fig.advance(800);
  const after = await fig.call('get');
  expect(after.count).toBe(paused.count + 1);
  expect(after.measured).toBeCloseTo(0.8, 6);
  expect(log.errors).toEqual([]);
});
