// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the first
// screen is calm; one tap sends red light in, bent toward the normal; it leaves turned toward the base, at every angle of
// the lamp; white light comes out with violet bent most; the colours' indices; the test answered all right scores 5 of 5.
// Steps are jumped with animate: false so each test stays short under software rendering.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/prism-dispersion/'));

test('prism-dispersion: red light bends toward the normal, then toward the base; white light splits, violet most', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'prism-dispersion');
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ step: 'intro', light: 'off', i: 50, next: 'on' });
  expect(await frame.locator('[data-example]').count()).toBe(5);
  expect(await frame.locator('.pd-card').isVisible()).toBe(true);

  // one tap: the lamp comes on and the light goes in, toward the normal
  await frame.locator('.pvc-act').click();
  await fig.advance(4600);
  const enter = await fig.call('get');
  expect(enter).toMatchObject({ step: 'enter', busy: false, light: 'red', next: 'exit' });
  expect(enter.r1).toBeLessThan(50);
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('লম্বের দিকে');

  // out, then toward the base, at both ends of the rail
  expect(await fig.call('set', { step: 'exit', animate: false })).toMatchObject({ step: 'exit', r2: 30, e: 49 });
  for (const i of [45, 66]) {
    const s = await fig.call('set', { step: 'base', i, animate: false });
    expect(s).toMatchObject({ step: 'base', i, toward: 'base' });
    expect(s.deviation).toBeGreaterThan(38);
  }
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('ভূমির দিকে');

  // white light: the colours in order, violet lowest (bent most)
  const white = await fig.call('set', { step: 'white', i: 50, animate: false });
  expect(white).toMatchObject({ light: 'white', order: ['violet', 'blue', 'green', 'yellow', 'orange', 'red'] });
  const green = await fig.call('set', { step: 'colours', colour: 'green', animate: false });
  expect(green).toMatchObject({ colour: 'green', n: 1.523 });
  await frame.locator('.pd-graph [data-colour="violet"]').click();
  expect(await fig.call('get')).toMatchObject({ colour: 'violet', n: 1.532 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', light: 'off', i: 50, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('prism-dispersion: the test answered all right scores five of five', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'prism-dispersion');
  const frame = frameOf(page);
  await fig.call('practice');
  for (let q = 0; q < 5; q++) {
    await fig.advance(900);
    const { question } = await fig.call('get');
    expect(question.index).toBeGreaterThanOrEqual(0);
    await frame.locator(`[data-q="${question.index}"]`).click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  expect(await frame.locator('.pvc-quiz').textContent()).toContain('৫টির মধ্যে ৫টি সঠিক');
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'intro' });
  expect(log.errors).toEqual([]);
});
