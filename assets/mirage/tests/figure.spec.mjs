// This figure's own behaviour, through the bridge (dev only, never packaged): the calm first screen; one tap shows the
// direct ray; the steps land as the book says (the layers, total internal reflection at the lowest boundary far away,
// the image under the tree, no mirage up close); dragging the eye by keys brings the mirage back; and the test,
// answered all right, scores five of five (the quiz scores numbers, so the choices are indices).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { createI18n } from '../src/i18n.js';

const ID = 'mirage';
const frameOf = (page) => page.frames().find((f) => f.url().includes(`/assets/${ID}/`));

test(`${ID}: the steps, far and near, and the eye moved`, async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ step: 'intro', mirage: true, next: 'direct', shown: { direct: false } });
  expect(await frame.locator('[data-example]').count()).toBe(5);
  expect(await frame.locator('.mg-lead.pvc-note').count()).toBe(1);

  // one tap: the straight ray
  await frame.locator('.pvc-act').click();
  await fig.advance(2200);
  expect(await fig.call('get')).toMatchObject({ step: 'direct', busy: false, shown: { direct: true, layers: false } });

  expect(await fig.call('set', { step: 'layers', animate: false })).toMatchObject({ shown: { layers: true, bent: false } });
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('প্রতিসরণাঙ্ক বেশি');

  // far: refracted (r > i), then totally reflected at the lowest boundary (i > θc)
  const bend = await fig.call('set', { step: 'bend', animate: false });
  expect(bend).toMatchObject({ kind: 'tir', critical: 65, shown: { bent: true } });
  expect(bend.r).toBeGreaterThan(bend.i);
  expect(bend.iB).toBeGreaterThan(bend.critical);
  expect(await frame.locator('.pvc-rule b').last().textContent()).toBe('পূর্ণ অভ্যন্তরীণ প্রতিফলন');

  const img = await fig.call('set', { step: 'image', animate: false });
  expect(img).toMatchObject({ mirage: true, shown: { image: true } });
  expect(img.image).toBeLessThan(-1);

  // near: no total reflection, no image
  const close = await fig.call('set', { step: 'near', animate: false });
  expect(close).toMatchObject({ kind: 'sand', mirage: false, image: null, next: 'quiz' });
  expect(close.iB).toBeLessThan(close.critical);

  // the arrow keys take the eye back: the mirage comes back past the critical angle
  await frame.locator('.pvc-act').focus();
  await page.keyboard.press('Escape');
  await frame.locator('canvas').first().focus();
  for (let k = 0; k < 20; k++) await frame.locator('.mg').press('ArrowLeft');
  await fig.advance(800);
  const back = await fig.call('get');
  expect(back.eye).toBeLessThan(-2);
  expect(back.mirage).toBe(true);

  expect(await fig.call('set', { eye: -0.5 })).toMatchObject({ mirage: false });
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', view: 'front', mode: 'explore' });
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
      .replace(/&nbsp;/g, ' ')
      .trim();
  const kinds = ['n', 'r', 'tir', 'img', 'road'];
  const right = Object.fromEntries(kinds.map((k) => [plain(t(`q_${k}`)), plain(t(`c_${k}_right`))]));
  await fig.call('practice');
  for (let i = 0; i < kinds.length; i++) {
    await fig.advance(800);
    const q = (await frame.locator('.pvc-q-text').textContent()).trim();
    const answer = right[q];
    expect(answer, `question ${i + 1}: ${q}`).toBeTruthy();
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
