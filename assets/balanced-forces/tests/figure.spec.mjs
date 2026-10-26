// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('balanced-forces: the forces and the state follow the ball and the rope', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'balanced-forces');

  // hanging still: T = W = 9.8 N, opposite; the resultant zero
  let s = await fig.call('get');
  expect(s).toMatchObject({ scene: 'pendulum', phase: 'rest', state: 'balanced', balanced: true });
  expect(s.forces.tension).toBeCloseTo(9.8, 5);
  expect(s.forces.T).toEqual({ x: 0, y: 9.8 });
  expect(s.resultant.size).toBe(0);

  // held aside at 30° by a hand: T = mg cos 30° = 8.49 N, the hand pulls with mg sin 30° = 4.9 N, the three cancel
  s = await fig.call('set', { hold: 30, animate: false });
  expect(s).toMatchObject({ phase: 'held', state: 'balanced', balanced: true, angle: 30 });
  expect(s.forces.tension).toBeCloseTo(8.49, 2);
  expect(Math.hypot(s.forces.hand.x, s.forces.hand.y)).toBeCloseTo(4.9, 2);
  expect(s.forces.hand.x).toBeGreaterThan(0); // away from the lowest point
  expect(s.resultant.size).toBe(0);

  // the cord is not cut while the ball is held (or swings): the button rests
  await expect(
    page
      .frames()
      .find((f) => f.url().includes('/assets/balanced-forces/'))
      .locator('[data-act="a1"]'),
  ).toBeDisabled();

  // let go: the hand's pull is gone; T and W give a resultant (mg sin 30° = 4.9 N, towards the lowest point)
  s = await fig.call('set', { release: 30, at: 0.02, freeze: true });
  expect(s).toMatchObject({ phase: 'swing', state: 'unbalanced', balanced: false, frozen: true });
  expect(s.forces.hand).toBeNull();
  expect(s.resultant.size).toBeCloseTo(4.9, 1);
  expect(s.resultant.x).toBeLessThan(0);
  expect(s.resultant.y).toBeLessThan(0);
  // it swings, back and forth
  s = await fig.call('set', { release: 30, at: 0.2 });
  expect(s).toMatchObject({ phase: 'swing', state: 'unbalanced', frozen: false });
  expect(Math.abs(s.angle)).toBeLessThan(30);
  await fig.advance(1000);
  s = await fig.call('get');
  expect(s.phase).toBe('swing');

  // cut: only W is left; it lands on the bench 0.15 m below, then the bench pushes it up (balanced again)
  s = await fig.call('set', { cut: true, at: 0.4 });
  expect(s).toMatchObject({ phase: 'fall', state: 'unbalanced' });
  expect(s.forces.T).toBeNull();
  expect(s.resultant).toMatchObject({ x: 0, y: -9.8 });
  s = await fig.call('set', { cut: true, animate: false });
  expect(s).toMatchObject({ phase: 'landed', state: 'balanced', dropped: 0.15 });
  expect(s.forces.push).toEqual({ x: 0, y: 9.8 });
  s = await fig.call('set', { rehang: true });
  expect(s).toMatchObject({ phase: 'rest', state: 'balanced', dropped: 0 });

  // the book: T₁ = T₂ = W / (2 sin α), the resultant zero at every angle
  for (const [alpha, tension] of [
    [30, 9.8],
    [20, 14.33],
    [70, 5.21],
  ]) {
    s = await fig.call('set', { scene: 'book', alpha, animate: false });
    expect(s).toMatchObject({ scene: 'book', state: 'balanced', alpha });
    expect(s.forces.tension).toBeCloseTo(tension, 2);
    expect(s.resultant.size).toBe(0);
  }
  // the hands never go past 20° … 70°
  s = await fig.call('set', { alpha: 5, animate: false });
  expect(s.alpha).toBe(20);

  await fig.call('reset');
  s = await fig.call('get');
  expect(s).toMatchObject({ scene: 'pendulum', phase: 'rest', alpha: 30 });
  expect(log.errors).toEqual([]);
});

test('balanced-forces: the test runs five questions, each answered by a tap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'balanced-forces');
  const frame = page.frames().find((f) => f.url().includes('/assets/balanced-forces/'));
  await frame.evaluate(() => {
    const w = /** @type {any} */ (window);
    w.__results = [];
    w.figure.on('practice-result', (e) => w.__results.push(e));
  });
  const canvasHeight = async () => (await frame.locator('.pvc-canvas canvas').first().boundingBox()).height;
  const h0 = await canvasHeight();
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1500);
    await expect(frame.locator('.pvc-opt[data-q="0"]')).toBeEnabled();
    await frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(1500);
    expect(await canvasHeight()).toBe(h0); // the 3D view keeps its size
    await frame.locator('[data-act="q-next"]').click();
  }
  const results = await frame.evaluate(() => /** @type {any} */ (window).__results);
  expect(results.map((r) => r.kind).sort()).toEqual(['book', 'cut', 'pull', 'release', 'tension']);
  // the tension's question comes before the cut's (its scene shows T = W), the book's before the pull's
  const order = results.map((r) => r.kind);
  expect(order.indexOf('tension')).toBeLessThan(order.indexOf('cut'));
  expect(order.indexOf('book')).toBeLessThan(order.indexOf('pull'));
  // leaving the test brings back the learn view, at rest
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', phase: 'rest' });
  expect(log.errors).toEqual([]);
});
