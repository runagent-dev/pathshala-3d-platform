// This figure's own behaviour, through the bridge (dev only, never packaged): the calm first screen; one tap flies to the
// core and the clad; the light goes all the way at θ₁ = 83°; the bend keeps every θ₁ over 75°; the tilt lets the light
// out and the screen goes dark; keys bend and turn; and the test, answered all right, scores five of five (the quiz
// scores numbers, so the choices are indices). Steps are jumped with animate: false so each test stays short.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { createI18n } from '../src/i18n.js';

const ID = 'optical-fibre';
const frameOf = (page) => page.frames().find((f) => f.url().includes(`/assets/${ID}/`));

test(`${ID}: the core and clad; the light trapped; the bend; the tilt lets it out`, async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ step: 'intro', light: 0, next: 'look' });
  expect(await frame.locator('[data-example]').count()).toBe(5);
  expect(await frame.locator('.of-lead.pvc-note').count()).toBe(1);

  // one tap: the camera flies to the near end; core and clad named with the book's indices
  await frame.locator('.pvc-act').click();
  await fig.advance(2500);
  expect(await fig.call('get')).toMatchObject({ step: 'parts', busy: false, next: 'light' });
  expect(await frame.locator('.pvc-outcome').textContent()).toContain('১.৫০');

  // the light: every wall at 83°, all of it on the screen
  const light = await fig.call('set', { step: 'light', animate: false });
  expect(light).toMatchObject({ step: 'light', light: 1, leaked: false, arrived: 1, minTheta: 83 });
  expect(light.walls).toBeGreaterThanOrEqual(6);
  expect(await fig.call('set', { step: 'one', animate: false })).toMatchObject({ critical: 75, minTheta: 83 });

  // the bend: θ₁ falls in the bends but stays over 75°; the keys move the far end
  const bend = await fig.call('set', { step: 'bend', animate: false });
  expect(bend).toMatchObject({ h: 8, leaked: false, arrived: 1 });
  expect(bend.minTheta).toBeGreaterThan(75);
  expect(bend.minTheta).toBeLessThan(83);
  await frame
    .locator('canvas')
    .first()
    .click({ position: { x: 20, y: 380 } });
  await page.keyboard.press('ArrowDown');
  await fig.advance(100);
  expect((await fig.call('get')).h).toBe(7);

  // the tilt: θ₁ below 75°, the light leaves into the clad, nothing on the screen; turned back, all of it again
  const tilt = await fig.call('set', { step: 'tilt', animate: false });
  expect(tilt).toMatchObject({ alpha: 35, leaked: true, arrived: 0 });
  expect(tilt.minTheta).toBeLessThan(75);
  expect(await fig.call('set', { alpha: 12 })).toMatchObject({ leaked: false, arrived: 1 });
  await frame
    .locator('canvas')
    .first()
    .click({ position: { x: 300, y: 380 } });
  await page.keyboard.press('ArrowRight');
  await fig.advance(100);
  expect((await fig.call('get')).alpha).toBe(13);

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', light: 0, h: 0, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test, answered all right, scores five of five`, async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = frameOf(page);
  const t = createI18n('bn');
  const plain = (html) =>
    html
      .replace(/<[^>]+>/g, '')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&nbsp;/g, ' ')
      .trim();
  const right = {
    [plain(t('q_crit'))]: () => `${t.num(75)}°`,
    [plain(t('q_leak'))]: () => plain(t('c_lk_right')),
    [plain(t('q_bend'))]: () => plain(t('c_bd_right')),
    [plain(t('q_ir'))]: () => plain(t('c_ir_right')),
    // the wall's angle decides: above 75° all of it comes back
    [plain(t('q_what'))]: async () => plain(t((await fig.call('get')).theta[0] >= 75 ? 'c_wh_tir' : 'c_wh_leak')),
  };
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(800);
    const q = (await frame.locator('.pvc-q-text').textContent()).trim();
    expect(right[q], `question ${i + 1}: ${q}`).toBeTruthy();
    const answer = await right[q]();
    const options = frame.locator('[data-q]');
    const n = await options.count();
    let clicked = false;
    for (let j = 0; j < n; j++) {
      if ((await options.nth(j).textContent()).trim() === answer) {
        await options.nth(j).click();
        clicked = true;
        break;
      }
    }
    expect(clicked, `the right answer is offered for ${q}`).toBe(true);
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  expect(await frame.locator('.pvc-quiz').textContent()).toContain(t('q_result', { right: 5, total: 5 }));
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'intro' });
  expect(log.errors).toEqual([]);
});
