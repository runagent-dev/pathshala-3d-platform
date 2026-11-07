// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the first
// screen is calm and uncharged; one tap charges the sphere and q₀ feels the book's E; half the distance gives four times
// E; made negative the force turns round; the pair of unlike charges, then the like pair with E = 0 in the middle (q₀ can
// be dragged off it), then −2q with twice the lines; the flat view; the test answered all right scores five of five, all
// wrong none. Steps are jumped with animate: false (and the virtual clock) so each test stays short.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'electric-field-lines';

test(`${ID}: E = kq/r², four times at half the distance, the sign, the pairs, the zero, the flat view`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = fig.frame;
  expect(await fig.call('get')).toMatchObject({ step: 'intro', charges: [], lines: 0, E: null, next: 'pos', flat: false });
  expect(await frame.locator('[data-example]').count()).toBe(6);
  expect(await frame.locator('.efl-lead.pvc-note').count()).toBe(1);

  // one tap: the sphere is charged, its lines grow, q₀ at 12 cm reads 2,500 N/C
  await frame.locator('.pvc-act').click();
  await fig.advance(4500);
  expect(await fig.call('get')).toMatchObject({ step: 'pos', busy: false, charges: [1], lines: 1, r: 12, E: 2500, next: 'near' });
  await expect(frame.locator('.pvc-rule')).toContainText('স্পর্শকের দিক');

  // half the distance, four times E
  expect(await fig.call('set', { step: 'near', animate: false })).toMatchObject({ r: 6, E: 10000 });
  await expect(frame.locator('.pvc-outcome')).toContainText('১০,০০০');
  // the keys move q₀ half a centimetre, and q₀ stays where it may
  await frame.locator('#app').focus();
  await page.keyboard.press('ArrowRight');
  expect((await fig.call('get')).r).toBe(6.5);
  expect((await fig.call('set', { r: 1 })).r).toBe(5);
  expect((await fig.call('set', { r: 15 })).E).toBe(1600);

  // made negative: the same size, the other way
  const n = await fig.call('set', { step: 'neg', animate: false });
  expect(n).toMatchObject({ charges: [-1], r: 10, E: -3600 });
  expect((await fig.call('set', { r: 5 })).r).toBe(7);

  // unlike charges: q₀ in the middle is pushed toward −q; like charges: E = 0 there, not beside it
  expect(await fig.call('set', { step: 'unlike', animate: false })).toMatchObject({ charges: [1, -1], E: 11250 });
  expect(await fig.call('set', { step: 'like', animate: false })).toMatchObject({ charges: [1, 1], E: 0, testX: 0 });
  expect((await fig.call('set', { x: 2 })).E).toBeLessThan(0);
  expect((await fig.call('set', { x: -2 })).E).toBeGreaterThan(0);

  // −2q and +q: twice the lines end on −2q
  const d = await fig.call('set', { step: 'double', animate: false });
  expect(d).toMatchObject({ charges: [-2, 1], E: null, next: 'quiz' });

  // the book's flat cut, and back: fewer lines, the same step
  const flat = await fig.call('set', { flat: true, animate: false });
  expect(flat.flat).toBe(true);
  expect(flat.lineCount).toBeLessThan(d.lineCount);
  expect((await fig.call('set', { flat: false, animate: false })).lineCount).toBe(d.lineCount);

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', charges: [], view: 'front', mode: 'explore', flat: false });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test answered all right scores five of five, all wrong none; leaving it restores the learn state`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { step: 'near', animate: false });
  const answerAll = async (pick) => {
    for (let i = 0; i < 5; i++) {
      await fig.advance(800);
      const { question } = await fig.call('get');
      expect(question?.right).not.toBeNull();
      await fig.frame.locator(`.pvc-opt[data-q="${pick(question.right)}"]`).click();
      await fig.advance(300);
      await expect(fig.frame.locator('.pvc-q-feedback')).not.toBeEmpty();
      await fig.frame.locator('[data-act="q-next"]').click();
    }
    await fig.advance(600);
  };
  await fig.call('practice');
  await answerAll((right) => right);
  await expect(fig.frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ৫টি সঠিক');
  await fig.frame.locator('[data-act="q-again"]').first().click();
  await answerAll((right) => (right + 1) % 4);
  await expect(fig.frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ০টি সঠিক');
  await fig.frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'near', r: 6, question: null });
  expect(log.errors).toEqual([]);
});
