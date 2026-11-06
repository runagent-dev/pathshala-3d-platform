// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the first
// screen is calm and uncharged; one tap charges the spheres (the book's +1 C and −1 C at 10 cm: −9 × 10¹¹ N, attraction);
// like charges repel; twice as far gives a quarter; the law's step takes the student's charges and distance; the third
// charge feels no force at the book's 0.43 m; the test answered all right scores five of five. Steps are jumped with
// animate: false (and the virtual clock) so each test stays short under software rendering.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'coulombs-law';

test(`${ID}: attraction, repulsion, a quarter at twice the distance, the law, the balance at 0.43 m`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = fig.frame;
  expect(await fig.call('get')).toMatchObject({ step: 'intro', q1: 0, q2: 0, F: 0, next: 'charge' });
  expect(await frame.locator('[data-example]').count()).toBe(5);
  expect(await frame.locator('.cl-lead.pvc-note').count()).toBe(1);

  // one tap: the book's example (a), unlike charges pull together
  await frame.locator('.pvc-act').click();
  await fig.advance(2600);
  const a = await fig.call('get');
  expect(a).toMatchObject({ step: 'attract', busy: false, q1: 1, q2: -1, r: 0.1, kind: 'attract', next: 'flip' });
  expect(a.F).toBeCloseTo(-9e11, -6);
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('আকর্ষণ');

  // like charges push apart
  expect(await fig.call('set', { step: 'repel', animate: false })).toMatchObject({ kind: 'repel', q2: 1 });
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('বিকর্ষণ');

  // twice as far: a quarter
  const d = await fig.call('set', { step: 'distance', animate: false });
  expect(d.r).toBe(0.2);
  expect(d.F / 9e11).toBeCloseTo(0.25, 6);
  await expect(frame.locator('.pvc-outcome')).toContainText('চার ভাগের এক ভাগ');

  // the law: back at the book's example, then the student's numbers
  const l = await fig.call('set', { step: 'law', animate: false });
  expect(l).toMatchObject({ q1: 1, q2: -1, r: 0.1 });
  await expect(frame.locator('.pvc-outcome')).toContainText('−৯ × ১০');
  await frame.locator('[data-qstep="1:1"]').click();
  expect(await fig.call('get')).toMatchObject({ q1: 2, q2: -1 });
  const l2 = await fig.call('set', { r: 0.2 });
  expect(l2.F).toBeCloseTo(-4.5e11, -6);
  // the arrow keys move the sphere 1 cm
  await frame.locator('#app').focus();
  await page.keyboard.press('ArrowRight');
  expect((await fig.call('get')).r).toBeCloseTo(0.21, 6);

  // the book's example (b): no force at 0.43 m from +9 C
  const b = await fig.call('set', { step: 'balance', animate: false });
  expect(b).toMatchObject({ q1: 9, q2: 16, r: 1, x: 0.2, found: false, next: 'find' });
  expect(b.net).toBeGreaterThan(0);
  const f = await fig.call('set', { x: 0.425 });
  expect(f.found).toBe(true);
  expect(Math.abs(f.net)).toBeLessThan(1);
  await expect(frame.locator('.pvc-outcome')).toContainText('০.৪৩');
  expect((await fig.call('set', { x: 0.6 })).net).toBeLessThan(0);

  // the action finds it too
  await fig.call('set', { x: 0.2 });
  await frame.locator('.pvc-act').click();
  await fig.advance(3200);
  expect(await fig.call('get')).toMatchObject({ found: true, busy: false, next: 'quiz' });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', q1: 0, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test answered all right scores five of five, all wrong none; leaving it restores the learn state`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { step: 'distance', animate: false });
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
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'distance', r: 0.2, question: null });
  expect(log.errors).toEqual([]);
});
