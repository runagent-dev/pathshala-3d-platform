// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's story on
// one action, the pencil and the image, the rear-view mirror, leaving the test, and a test answered all right and all wrong.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'convex-mirror-image';
const settled = async (fig) => {
  for (let i = 0; i < 80; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the step never ended');
};

test(`${ID}: the whole story on one action`, async ({ page }) => {
  test.setTimeout(420_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const act = async () => {
    await fig.frame.locator('.pvc-act').first().click();
    await settled(fig);
    return fig.call('get');
  };
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'see', u: 15, v: -7.5, m: 0.5, rays: 0, ghost: false });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('ছোট');

  st = await act();
  expect(st).toMatchObject({ stage: 'ray1', rays: 1, frame: 'rays' });
  st = await act();
  expect(st).toMatchObject({ stage: 'ray2', rays: 2 });
  st = await act();
  expect(st).toMatchObject({ stage: 'ray3', rays: 3 });
  expect(st.miss).toBeLessThan(0.1);
  st = await act();
  expect(st).toMatchObject({ stage: 'image', ghost: true, frame: 'image' });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'প্রতিবিম্ব (অবাস্তব)' })).toHaveCount(1);

  st = await act();
  expect(st).toMatchObject({ stage: 'move', frame: 'move' });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('আয়নার পেছনে');
  await expect(fig.frame.locator('svg.lab-zone')).toBeVisible();
  // the action moves the pencil away, then near
  st = await act();
  expect(st).toMatchObject({ u: 60, v: -12, m: 0.2, sawFar: true, sawNear: false });
  st = await act();
  expect(st).toMatchObject({ u: 8, sawNear: true });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('P ও F এর মাঝখানে');

  st = await act();
  expect(st).toMatchObject({ stage: 'plane', frame: 'eye', seen: 3, curve: 0, row: true });
  st = await act();
  expect(st).toMatchObject({ stage: 'eye', frame: 'eye', seen: 7, curve: 1 });
  st = await act();
  expect(st).toMatchObject({ stage: 'wide', frame: 'wide' });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৭টি');

  // again: back to the start, with the pencil where it began
  st = await act();
  expect(st).toMatchObject({ stage: 'see', u: 15, sawFar: false, curve: 1, row: false });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the bridge, the arrow keys, jumps cut short`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  // a jump, and another before it ends
  await fig.call('set', { stage: 'image', u: 30, animate: false });
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'image', u: 30, v: -10, ghost: true, rays: 3 });
  expect(st.imageHeight).toBeCloseTo(2, 5);
  await fig.frame.locator('[data-example="rear"]').click();
  await fig.advance(250);
  await fig.frame.locator('[data-example="see"]').click();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'see', rays: 0, ghost: false, u: 30, curve: 1, row: false });
  // the keys move the pencil, and it stops at the ends
  await fig.call('set', { stage: 'move', u: 74, animate: false });
  await fig.frame.locator('.pvc').first().focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  st = await fig.call('get');
  expect(st.u).toBe(75);
  // not on the rear-view stages
  await fig.call('set', { stage: 'wide', animate: false });
  await page.keyboard.press('ArrowLeft');
  expect((await fig.call('get')).u).toBe(75);
  await fig.call('reset');
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'see', u: 15, rays: 0 });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test scores right answers and wrong ones, and leaves things as they were`, async ({ page }) => {
  test.setTimeout(420_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { stage: 'ray2', u: 22, animate: false });
  await fig.call('practice');
  await fig.advance(900);
  const kinds = [];
  for (let i = 0; i < 5; i++) {
    const st = await fig.call('get');
    expect(st.locked).toBe(true);
    kinds.push(st.question.kind);
    // the numbers on the buttons are places in the figure's list; the first run answers all of them right
    await fig.frame.locator(`[data-q="${st.question.right}"]`).click();
    await fig.advance(500);
    await expect(fig.frame.locator('.pvc-q-feedback')).toContainText('ঠিক');
    await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(900);
  }
  expect(new Set(kinds).size).toBe(5);
  await expect(fig.frame.locator('.pvc-q-done')).toContainText('৫টির মধ্যে ৫টি');

  // again, every answer wrong
  await fig.frame.locator('[data-act="q-again"]').click();
  await fig.advance(900);
  for (let i = 0; i < 5; i++) {
    const st = await fig.call('get');
    await fig.frame.locator(`[data-q="${(st.question.right + 1) % 4}"]`).click();
    await fig.advance(500);
    await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(900);
  }
  await expect(fig.frame.locator('.pvc-q-done')).toContainText('৫টির মধ্যে ০টি');

  await fig.frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(900);
  const st = await fig.call('get');
  expect(st).toMatchObject({ mode: 'explore', locked: false, stage: 'ray2', u: 22, rays: 2, question: null });
  expect(log.errors).toEqual([]);
});
