// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// first screen is calm; one tap flies into a drop; the steps land where they should; the bow is red outside at about
// 42°, violet at about 41°; with the sun high the bow is below the horizon; the test runs five questions and scores all
// right when every right answer is tapped. Steps are jumped with animate: false so each test stays short.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { createI18n } from '../src/i18n.js';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/rainbow/'));

test('rainbow: into one drop, back out to the sky, the sun up', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'rainbow');
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ step: 'intro', scene: 'sky', sun: 15, next: 'in', red: 42.4, violet: 40.7 });
  expect(await frame.locator('[data-example]').count()).toBe(4);
  expect(await frame.locator('.rb-lead.pvc-note').count()).toBe(1);

  // one tap: the camera flies into the drop and the white light goes in
  await frame.locator('.pvc-act').click();
  await fig.advance(5200);
  expect(await fig.call('get')).toMatchObject({ step: 'in', scene: 'drop', busy: false, next: 'back' });
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('প্রতিসরণ');

  expect(await fig.call('set', { step: 'back', animate: false })).toMatchObject({ step: 'back', scene: 'drop' });
  expect(await frame.locator('.pvc-outcome b').first().textContent()).toBe('প্রতিফলিত');
  const bow = await fig.call('set', { step: 'bow', animate: false });
  expect(bow).toMatchObject({ step: 'bow', scene: 'sky', bow: true, sun: 15 });
  expect(bow.top).toBeCloseTo(27.4, 1);

  // the sun up: the bow sinks below the horizon
  expect(await fig.call('set', { sun: 30 })).toMatchObject({ step: 'noon', sun: 30, bow: true });
  expect(await fig.call('set', { sun: 50 })).toMatchObject({ step: 'noon', sun: 50, bow: false, top: null });
  expect(await frame.locator('.pvc-outcome').textContent()).toContain('দিগন্তের নিচে');
  // the keys move the sun too
  await frame.locator('.pvc').focus();
  await page.keyboard.press('ArrowDown');
  expect((await fig.call('get')).sun).toBe(48);

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', sun: 15, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('rainbow: the test, answered all right, scores five of five', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'rainbow');
  const frame = frameOf(page);
  const t = createI18n('bn');
  const plain = (html) =>
    html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  const qv = { r: 42, v: 41 };
  const right = {
    [plain(t('q_where'))]: t('c_wh_right'),
    [plain(t('q_bend'))]: t('c_be_right'),
    [plain(t('q_outer', qv))]: t('c_ou_right'),
    [plain(t('q_noon', { ...qv, a: 60 }))]: t('c_no_right'),
    [plain(t('q_height', { ...qv, a: 20 }))]: `${t.num(22)}°`,
  };
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
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
