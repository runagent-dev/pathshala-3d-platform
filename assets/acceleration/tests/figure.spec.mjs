// Acceleration through the bridge (book pages 43–44, topic 2.6): the CNG speeds up at +2 ms⁻² with the gas held,
// keeps its speed with nothing pressed, slows at −2 ms⁻² with the brake, and the graph's pieces give a = (v − u) ÷ t;
// on the bend its speed stays 2.5 m/s while it turns, with an acceleration only while turning. Runs with
// `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('acceleration: drive, read the graph, turn', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'acceleration');

  // standing, nothing drawn; the brake does not start the trip
  let s = await fig.call('get');
  expect(s).toMatchObject({ scene: 'line', pedal: 'none', line: { started: false, speed: 0, kind: 'none', stretches: [] } });
  await fig.call('set', { pedal: 'brake' });
  await fig.advance(1000);
  expect((await fig.call('get')).line.started).toBe(false);

  // the gas, held for 3 s: +2 m/s every second
  await fig.call('set', { pedal: 'gas' });
  await fig.advance(3000);
  s = await fig.call('get');
  expect(s.line.started).toBe(true);
  expect(s.line.kind).toBe('up');
  expect(s.line.acceleration).toBe(2);
  expect(s.line.speed).toBeGreaterThan(5.5);
  expect(s.line.speed).toBeLessThan(6.5);

  // let go: the same speed, no acceleration
  await fig.call('set', { pedal: 'none' });
  await fig.advance(300); // the tick under way when the pedal came up still ends
  const v1 = (await fig.call('get')).line.speed;
  await fig.advance(2000);
  s = await fig.call('get');
  expect(s.line).toMatchObject({ kind: 'none', acceleration: 0, speed: v1 });

  // the brake: −2 m/s every second, মন্দন
  await fig.call('set', { pedal: 'brake' });
  await fig.advance(1000);
  s = await fig.call('get');
  expect(s.line.kind).toBe('down');
  expect(s.line.acceleration).toBe(-2);
  expect(s.line.stretches.map((x) => x.kind)).toEqual(['up', 'none', 'down']);

  // the book's graph (চিত্র ২.০৬), driven at once: A up, B flat, C up, D down, a = (v − u) / t for each
  s = await fig.call('set', {
    drive: [
      ['gas', 5],
      ['none', 4],
      ['gas', 2.5],
      ['brake', 7.5],
    ],
    animate: false,
  });
  expect(s.line.stretches).toEqual([
    { letter: 'A', kind: 'up', from: 0, to: 5, u: 0, v: 10, t: 5, a: 2 },
    { letter: 'B', kind: 'none', from: 5, to: 9, u: 10, v: 10, t: 4, a: 0 },
    { letter: 'C', kind: 'up', from: 9, to: 11.5, u: 10, v: 15, t: 2.5, a: 2 },
    { letter: 'D', kind: 'down', from: 11.5, to: 19, u: 15, v: 0, t: 7.5, a: -2 },
  ]);
  expect(s.line).toMatchObject({ speed: 0, time: 19 });
  expect(s.line.distance).toBeCloseTo(25 + 40 + 31.25 + 56.25, 6);

  // the book's trip (the poster) brakes only until the CNG stands, and the student's own press takes over at once
  s = await fig.call('set', { trip: 'book' });
  expect(s).toMatchObject({ pedal: 'brake', line: { kind: 'down', speed: 11 } });
  await fig.frame.locator('.pvc').focus();
  await page.keyboard.down('ArrowUp');
  await fig.advance(1000);
  s = await fig.call('get');
  expect(s.pedal).toBe('gas');
  expect(s.line.kind).toBe('up');
  await page.keyboard.up('ArrowUp');
  s = await fig.call('set', { trip: 'book' });
  await fig.advance(6500); // 11 m/s at −2 ms⁻²: standing after 5.5 s, and the brake let go
  s = await fig.call('get');
  expect(s).toMatchObject({ pedal: 'none', line: { speed: 0, kind: 'none' } });

  // the graph is full after 30 s: the trip ends, the CNG rolls on at its last speed
  await fig.call('set', {
    drive: [
      ['gas', 4],
      ['none', 30],
    ],
    animate: false,
  });
  expect((await fig.call('get')).line).toMatchObject({ done: true, time: 30, speed: 8 });
  await fig.advance(1000);
  expect((await fig.call('get')).line).toMatchObject({ done: true, time: 30, speed: 8, kind: 'none' });

  // the bend: 2.5 m/s all the time; turning left changes the direction, with an acceleration v²/r
  s = await fig.call('set', { scene: 'turn' });
  expect(s).toMatchObject({ scene: 'turn', turn: { speed: 2.5, direction: 'E', turning: 'none', acceleration: 0 } });
  await fig.call('set', { pedal: 'left' });
  await fig.advance(1900); // 0.83 rad/s for about 2 s: about 95°, now heading north
  s = await fig.call('get');
  expect(s.turn).toMatchObject({ speed: 2.5, turning: 'left', direction: 'N' });
  expect(s.turn.acceleration).toBeCloseTo(6.25 / 3, 3);
  await fig.call('set', { pedal: 'none' });
  await fig.advance(500);
  expect((await fig.call('get')).turn).toMatchObject({ speed: 2.5, turning: 'none', acceleration: 0, direction: 'N' });

  await fig.call('reset');
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ scene: 'line', view: 'front', line: { started: false, stretches: [] } });
  expect(log.errors).toEqual([]);
});

test('acceleration: the test runs by itself through five questions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'acceleration');
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(800);
    await fig.frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(300);
    await expect(fig.frame.locator('.pvc-q-feedback')).not.toHaveAttribute('data-tone', '');
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await expect(fig.frame.locator('.pvc-quiz')).toHaveClass(/is-done/);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', scene: 'line', line: { started: false } });
  expect(log.errors).toEqual([]);
});
