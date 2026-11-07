// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// first screen is calm; a tap shows the wall stopping the flower's light; the head raised over the wall shows the
// flower through two 90° turns (and the wall while it is low); the prism's 45° beats the critical angle 41.8°; the
// binoculars fold the light with four reflections; the test, answered all right, scores five of five. Steps are jumped
// with animate: false so each test stays short under software rendering.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { createI18n } from '../src/i18n.js';

const ID = 'prism-periscope';
const frameOf = (page) => page.frames().find((f) => f.url().includes(`/assets/${ID}/`));

test(`${ID}: the wall stops the light, the periscope turns it twice, the prisms reflect it totally`, async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ step: 'intro', head: 0, seen: 'wall', light: 'none', next: 'look' });
  expect(await frame.locator('[data-example]').count()).toBe(4);

  // one tap: the flower's light is stopped by the wall
  await frame.locator('.pvc-act').click();
  await fig.advance(2400);
  expect(await fig.call('get')).toMatchObject({ step: 'wall', busy: false, next: 'raise' });

  // the head raised over the wall: the light reaches the eye through two 90° turns
  const peri = await fig.call('set', { step: 'peri', animate: false });
  expect(peri).toMatchObject({ step: 'peri', head: 1, seen: 'flower', light: 'flower', angle: 45, critical: 41.8, total: true, turn: 90 });
  expect(await frame.locator('.pvc-outcome').first().textContent()).toContain('ফুলটি দেখছে');
  // lowered again below the wall's top: the eye sees the wall, and the panel says so
  expect(await fig.call('set', { head: 0.1 })).toMatchObject({ seen: 'wall', light: 'wall' });
  expect(await frame.locator('.pvc-outcome').first().textContent()).toContain('দেয়ালটি দেখছে');

  // close to the prism: the book's term
  expect(await fig.call('set', { step: 'prism', animate: false })).toMatchObject({ step: 'prism', head: 1, pose: 'prism' });
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('পূর্ণ অভ্যন্তরীণ প্রতিফলন');

  // the binoculars: four reflections, a long path in a short body
  expect(await fig.call('set', { step: 'bino', animate: false })).toMatchObject({ step: 'bino', reflections: 4, path: 27, body: 14, next: 'quiz' });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', head: 0, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test(`${ID}: a step plays from a tap, and the head can be dragged with the keys`, async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = frameOf(page);
  await fig.call('set', { step: 'wall', animate: false });
  await frame.locator('.pvc').focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowUp');
  const mid = await fig.call('get');
  expect(mid.head).toBeCloseTo(0.4, 5);
  expect(mid.step).toBe('wall');
  // the action raises the rest of the way and plays the light in
  await frame.locator('.pvc-act').click();
  await fig.advance(5200);
  expect(await fig.call('get')).toMatchObject({ step: 'peri', busy: false, head: 1, light: 'flower' });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the binoculars' numbers come in one by one, and a prism can be played again`, async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 }); // the how-to row shows here
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = frameOf(page);
  const state = () => frame.evaluate(() => /** @type {any} */ (window).figure.getState());
  await fig.call('set', { step: 'prism', animate: false });
  await fig.advance(300);
  await frame.locator('.pvc-act').click();
  const seen = [];
  // frames of 50 ms (the stage's longest step): a 12 s animation in about 250 frames, quick under software rendering
  for (let i = 0; i < 40; i++) {
    await fig.advance(400, 50);
    const st = await state();
    seen.push(st.numbers);
    if (!st.busy && st.step === 'bino') break;
  }
  // never all at once: 0, then 1, 2, 3, 4 in turn
  expect(seen.at(-1)).toBe(4);
  for (const n of [1, 2, 3]) expect(seen).toContain(n);
  for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
  // the how-to row's tap plays the light through the first prism again: its numbers go and come back
  await frame.locator('button.pvc-howto-item.pvc-howto-tap').click();
  await fig.advance(400);
  const again = await state();
  expect(again.busy).toBe(true);
  expect(again.numbers).toBeLessThan(2);
  for (let i = 0; i < 30 && (await state()).busy; i++) await fig.advance(400, 50);
  expect(await state()).toMatchObject({ step: 'bino', busy: false, numbers: 4, reflections: 4 });
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
      .replace(/&nbsp;/g, ' ')
      .trim();
  const right = {
    [plain(t('q_see'))]: plain(t('c_see_right')),
    [plain(t('q_angle'))]: `${t.num(45)}°`,
    [plain(t('q_why'))]: plain(t('c_why_right')),
    [plain(t('q_times'))]: plain(t('c_times', { n: 4 })),
    [plain(t('q_bino'))]: plain(t('c_b_right')),
  };
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1200);
    const q = (await frame.locator('.pvc-q-text').textContent()).trim();
    expect(right[q], `question ${i + 1}: ${q}`).toBeTruthy();
    const options = frame.locator('[data-q]');
    const n = await options.count();
    let clicked = false;
    for (let j = 0; j < n; j++) {
      if ((await options.nth(j).textContent()).trim() === right[q]) {
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
