// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('inertia: each event shows the right kind of inertia', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'inertia');

  // the bus starts: the feet go with the bus, the upper body lags, he leans back (inertia of rest)
  let s = await fig.call('set', { event: 'start', t: 1.1, animate: false });
  expect(s).toMatchObject({ event: 'start', scene: 'bus', inertia: 'rest', phase: 'act', playing: false });
  expect(s.lean).toBeGreaterThan(5);
  expect(s.lowerSpeed).toBeGreaterThan(s.upperSpeed + 0.3);

  // the bus brakes: the feet stop with it, the upper body runs on, he leans forward (inertia of motion)
  s = await fig.call('set', { event: 'brake', t: 1.3, animate: false });
  expect(s).toMatchObject({ event: 'brake', inertia: 'motion' });
  expect(s.lean).toBeLessThan(-5);
  expect(s.upperSpeed).toBeGreaterThan(s.lowerSpeed + 0.3);

  // stepping off a moving bus: the feet stop on the road, the upper body is still moving
  s = await fig.call('set', { event: 'alight', t: 1.05, animate: false });
  expect(s).toMatchObject({ inertia: 'motion', landed: true, lowerSpeed: 0 });
  expect(s.upperSpeed).toBeGreaterThan(2);

  // the coin and the card: the card flies off, the coin hardly moves sideways
  s = await fig.call('set', { event: 'coin', t: 0.26, animate: false });
  expect(s).toMatchObject({ scene: 'coin', inertia: 'rest' });
  expect(s.lowerSpeed).toBeGreaterThan(2);
  expect(s.upperSpeed).toBeLessThan(0.15);
  expect(log.errors).toEqual([]);
});

test('inertia: it plays in slow motion, stops at the end, and the view keeps its size', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'inertia');
  const canvasHeight = () => fig.frame.evaluate(() => document.querySelector('.pvc-canvas canvas').getBoundingClientRect().height);
  const h0 = await canvasHeight();

  await fig.call('set', { event: 'start', t: 0, playing: true });
  await fig.advance(3000);
  let s = await fig.call('get');
  expect(s.playing).toBe(true);
  expect(s.t).toBeGreaterThan(0.8); // 3 s of real time is about 1 s of event time (3× slower)
  expect(s.t).toBeLessThan(1.2);
  expect(await canvasHeight()).toBe(h0);
  await fig.advance(8000);
  s = await fig.call('get');
  expect(s).toMatchObject({ playing: false, phase: 'after' });
  expect(s.t).toBeCloseTo(s.duration, 5);

  // every event, and the test, leave the 3D view the same size
  for (const event of ['brake', 'alight', 'coin']) {
    await fig.call('set', { event, t: 1, animate: false });
    await fig.advance(200);
    expect(await canvasHeight(), event).toBe(h0);
  }
  await fig.call('practice');
  await fig.advance(1500);
  expect(await canvasHeight(), 'test').toBe(h0);
  expect(log.errors).toEqual([]);
});

test('inertia: the test has five answerable questions and locks the scene while one is asked', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'inertia');
  const canvasHeight = () => fig.frame.evaluate(() => document.querySelector('.pvc-canvas canvas').getBoundingClientRect().height);
  await fig.call('practice');
  await fig.advance(1500);
  const h0 = await canvasHeight();
  const before = await fig.call('get');
  // keys that would change the event are ignored during a question
  await fig.frame.locator('.pvc-canvas').focus();
  await fig.frame.evaluate(() => document.querySelector('.pvc').dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true })));
  await fig.advance(200);
  expect((await fig.call('get')).event).toBe(before.event);
  for (let i = 0; i < 5; i++) {
    // choices 1, 2, 3, 0, 1: mostly wrong answers, whose worked answer and mistake line are the longest
    await fig.frame.locator(`.pvc-opt[data-q="${(i + 1) % 4}"]`).click();
    await fig.advance(600);
    await expect(fig.frame.locator('.pvc-q-feedback')).not.toHaveAttribute('data-tone', '');
    expect(await canvasHeight(), `the 3D view keeps its size after answer ${i + 1}`).toBe(h0);
    await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(1500);
  }
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫');
  expect(log.errors).toEqual([]);
});
