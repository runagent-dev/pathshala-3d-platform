// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the first
// screen is calm; one tap brings the test charge in (W = 1,800 nJ at 10 cm); V = W/q₀ = 900 V, and the charge can be dragged
// with the keys; the wire levels 1,800 V and 300 V to 1,050 V; the crow is at the wire's potential; earthing gives 0 V; the
// test answered all right scores five of five. Steps are jumped with animate: false so each test stays short.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'electric-potential';

test(`${ID}: the work, the potential, the wire, the crow, the earth`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = fig.frame;
  expect(await fig.call('get')).toMatchObject({ step: 'intro', r: 30, next: 'bring', mode: 'explore' });
  expect(await frame.locator('[data-example]').count()).toBe(5);
  expect(await frame.locator('.ep-lead.pvc-note').count()).toBe(1);

  // one tap: it comes in at constant speed, and the work grows
  await frame.locator('.pvc-act').click();
  await fig.advance(800);
  expect((await fig.call('get')).busy).toBe(true);
  await fig.advance(4200);
  const b = await fig.call('get');
  expect(b).toMatchObject({ step: 'bring', busy: false, r: 10, work: 1800, next: 'potential' });
  await expect(frame.locator('.pvc-rule')).toContainText('বিকর্ষণ বল');

  // the potential: W ÷ q₀
  expect(await fig.call('set', { step: 'potential', animate: false })).toMatchObject({ r: 10, potential: 900 });
  await expect(frame.locator('.pvc-outcome')).toContainText('৯০০');
  await expect(frame.locator('.pvc-rule')).toContainText('তড়িৎ বিভব');

  // twice as far, half the potential; the arrow keys move it 1 cm
  expect(await fig.call('set', { r: 20 })).toMatchObject({ r: 20, potential: 450, work: 900 });
  await frame.locator('#app').focus();
  await page.keyboard.press('ArrowLeft');
  expect((await fig.call('get')).r).toBe(19);

  // the wire: from 1,800 V and 300 V to 1,050 V each, electrons from B to A
  await fig.call('set', { step: 'potential', animate: false });
  await frame.locator('.pvc-act').click();
  await fig.advance(1400 + 1400);
  const j0 = await fig.call('get');
  expect(j0).toMatchObject({ busy: true, va: 1800, vb: 300 });
  await fig.advance(800 + 1600 + 1800);
  const j1 = await fig.call('get');
  expect(j1.busy).toBe(true);
  expect(j1.va).toBeLessThan(1800);
  expect(j1.vb).toBeGreaterThan(300);
  expect(j1.va).toBeGreaterThan(j1.vb);
  await fig.advance(3200);
  expect(await fig.call('get')).toMatchObject({ step: 'join', busy: false, qa: 5, qb: 5, va: 1050, vb: 1050, next: 'crow' });

  // the crow: same potential, no difference
  await frame.locator('.pvc-act').click();
  await fig.advance(2600);
  expect(await fig.call('get')).toMatchObject({ step: 'crow', busy: false, va: 1050, next: 'earth' });
  await expect(frame.locator('.pvc-outcome')).toContainText('শক নেই');

  // the earth: 0 V
  expect(await fig.call('set', { step: 'earth', animate: false })).toMatchObject({ step: 'earth', qa: 0, qb: 0, va: 0, vb: 0, next: 'quiz' });
  await expect(frame.locator('.pvc-rule')).toContainText('শূন্য বিভব');

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', r: 30, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test answered all right scores five of five, all wrong none; leaving it restores the learn state`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { step: 'join', animate: false });
  const answerAll = async (pick) => {
    for (let i = 0; i < 5; i++) {
      await fig.advance(800);
      const { question } = await fig.call('get');
      expect(question?.right).toBeGreaterThanOrEqual(0);
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
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'join', question: null });
  expect(log.errors).toEqual([]);
});
