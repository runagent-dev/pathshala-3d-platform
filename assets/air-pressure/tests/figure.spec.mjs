// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): each
// stroke of the pump takes 20,000 Pa out of the box and leaves F = ΔP × A on each face (1,000 N with no air left), the
// box crumples more and more, the "only from the top" ghost and the real crush; the body's guided sequence (the Earth,
// space without a suit, the pressure suit, then again), and the test runs four questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/air-pressure/'));

test('air-pressure: pumping the air out leaves the outside pressure unbalanced', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'air-pressure');
  const start = await fig.call('get');
  expect(start).toMatchObject({ part: 'can', strokes: 0, pOut: 100000, pIn: 100000, dP: 0, area: 0.01, F: 0, crumple: 0, next: 'pump' });

  const three = await fig.call('set', { strokes: 3, animate: false });
  expect(three).toMatchObject({ strokes: 3, pIn: 40000, dP: 60000, F: 600 });
  expect(three.crumple).toBeGreaterThan(0.3);

  const empty = await fig.call('set', { strokes: 5, animate: false });
  expect(empty).toMatchObject({ strokes: 5, pIn: 0, dP: 100000, F: 1000, crumple: 1, next: 'whatif' });

  // the book's (b), then the real (c)
  const ghost = await fig.call('set', { whatIf: true, animate: false });
  expect(ghost).toMatchObject({ whatIf: true, next: 'real' });
  const real = await fig.call('set', { whatIf: false, animate: false });
  expect(real).toMatchObject({ whatIf: false, crumple: 1, next: 'new' });

  // the body: on the Earth the outside and inside pressures are equal; in space nothing presses from outside; the suit
  const earth = await fig.call('set', { part: 'body', animate: false });
  expect(earth).toMatchObject({ part: 'body', step: 'earth', space: false, bodyOut: 100000, bodyIn: 100000, next: 'space' });
  const space = await fig.call('set', { space: true, animate: false });
  expect(space).toMatchObject({ step: 'space', space: true, suit: false, bodyOut: 0, bodyIn: 100000, next: 'suit' });
  const suit = await fig.call('set', { space: 'suit', animate: false });
  expect(suit).toMatchObject({ step: 'suit', suit: true, bodyOut: 100000, next: 'again' });

  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ part: 'can', strokes: 0, whatIf: false, step: 'earth', space: false, view: 'front' });
  expect(log.errors).toEqual([]);
});

test('air-pressure: each tap is one stroke; the body is one guided sequence; the test', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'air-pressure');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await fig.advance(600);
  expect((await fig.call('get')).busy).toBe('pump');
  await fig.advance(1400);
  const one = await fig.call('get');
  expect(one).toMatchObject({ strokes: 1, pIn: 80000, F: 200, busy: '' });
  // a second tap at once does nothing (a double tap), the next one pumps again
  await frame.locator('.pvc-act').click();
  await fig.advance(1800);
  expect((await fig.call('get')).strokes).toBe(2);
  // the body: one button takes it to space, puts on the suit, and starts again
  await frame.locator('[data-example="body"]').click();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ part: 'body', step: 'earth' });
  await frame.locator('.pvc-act').click();
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ step: 'space', busy: 'space' });
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ step: 'space', busy: '', bodyOut: 0 });
  await frame.locator('.pvc-act').click();
  await fig.advance(2800);
  expect(await fig.call('get')).toMatchObject({ step: 'suit', busy: '', bodyOut: 100000 });
  await frame.locator('.pvc-act').click();
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ step: 'earth', space: false });
  await frame.locator('.pvc-act').click();
  await fig.advance(2200);
  // the test: four questions, each answered
  await fig.call('practice');
  for (let i = 0; i < 4; i++) {
    await fig.advance(1500);
    await frame.locator('[data-q]').first().click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  const back = await fig.call('get');
  expect(back).toMatchObject({ mode: 'explore', part: 'body', step: 'space', strokes: 2 });
  expect(log.errors).toEqual([]);
});
