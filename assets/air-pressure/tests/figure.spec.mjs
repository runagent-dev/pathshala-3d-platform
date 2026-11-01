// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): each
// stroke of the pump takes 20,000 Pa out of the box and leaves F = ΔP × A on each face (1,000 N with no air left), the
// box crumples more and more, the "only from the top" ghost and the real crush, the air column's weight over 1 m², the
// body in space, and the test runs five questions.
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

  // the air column: 10⁵ N over 1 m²
  const column = await fig.call('set', { part: 'column', weigh: true, animate: false });
  expect(column).toMatchObject({ part: 'column', weighed: true, columnWeight: 100000 });

  // the body, in space
  const space = await fig.call('set', { part: 'body', space: true, animate: false });
  expect(space).toMatchObject({ part: 'body', space: true, next: 'earth' });

  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ part: 'can', strokes: 0, whatIf: false, weighed: false, space: false, view: 'front' });
  expect(log.errors).toEqual([]);
});

test('air-pressure: each tap is one stroke; the row of words changes the part; the test', async ({ page }) => {
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
  await frame.locator('[data-example="column"]').click();
  await fig.advance(1500);
  expect((await fig.call('get')).part).toBe('column');
  await frame.locator('.pvc-act').click();
  await fig.advance(300);
  expect((await fig.call('get')).weighed).toBe(true);
  // the test: five questions, each answered
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1500);
    await frame.locator('[data-q]').first().click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  const back = await fig.call('get');
  expect(back).toMatchObject({ mode: 'explore', part: 'column', strokes: 2 });
  expect(log.errors).toEqual([]);
});
