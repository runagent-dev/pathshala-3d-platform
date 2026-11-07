// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// book's story on one action, the rod's drag, a charge that stays, the sign test, and a test answered all right.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'gold-leaf-electroscope';
const settled = async (fig) => {
  for (let i = 0; i < 160; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the step never ended');
};

test(`${ID}: near without touching: the leaves open, the charge stays zero, and they close when the rod goes`, async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  expect(await fig.call('get')).toMatchObject({ step: 'intro', charge: 0, gap: 0, next: 'parts' });
  await fig.call('set', { step: 'parts', animate: false });
  await fig.frame.locator('.pvc-act').first().click();
  await settled(fig);
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'near', charge: 0, drag: 'glass' });
  expect(st.gap).toBeGreaterThan(40);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('চার্জের আবেশ');
  await fig.call('set', { d: 60, animate: false });
  st = await fig.call('get');
  expect(st.gap).toBe(0);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('বুজে');
  await fig.call('set', { d: 30, animate: false });
  const mid = (await fig.call('get')).gap;
  await fig.call('set', { d: 14, animate: false });
  expect(mid).toBeGreaterThan(0);
  expect((await fig.call('get')).gap).toBeGreaterThan(mid);
  expect(log.errors).toEqual([]);
});

test(`${ID}: touching leaves a charge, and the leaves stay apart`, async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { step: 'near', animate: false });
  await fig.frame.locator('.pvc-act').first().click();
  await settled(fig);
  const st = await fig.call('get');
  expect(st).toMatchObject({ step: 'touch', charge: 5, glass: { q: 2 } });
  expect(st.gap).toBeGreaterThan(40);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('চার্জ আহিতকরণ');
  expect(log.errors).toEqual([]);
});

test(`${ID}: the sign test: the comb makes the gap smaller, the glass makes it wider`, async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { step: 'touch', animate: false });
  const known = (await fig.call('get')).gap;
  await fig.call('set', { step: 'testNeg', animate: false });
  const neg = await fig.call('get');
  expect(neg.gap).toBeLessThan(known);
  expect(neg.gap).toBeGreaterThan(0);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('নেগেটিভ');
  await fig.call('set', { step: 'testPos', animate: false });
  const pos = await fig.call('get');
  expect(pos.gap).toBeGreaterThan(known);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('পজিটিভ');
  expect(pos.next).toBe('quiz');
  expect(log.errors).toEqual([]);
});

test(`${ID}: a drag of the rod changes the gap; the arrow keys do too`, async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID, { params: { step: 'near' } });
  await fig.advance(300);
  const before = await fig.call('get');
  const box = await fig.frame.locator('.pvc-dh').first().boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y - 8, { steps: 4 });
  await page.mouse.move(x + 120, y - 30, { steps: 4 });
  await page.mouse.up();
  await fig.advance(3000);
  const far = await fig.call('get');
  expect(far.glass.d).toBeGreaterThan(before.glass.d);
  expect(far.gap).toBeLessThan(before.gap);
  await fig.frame.locator('.pvc').first().focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowLeft');
  await fig.advance(3000);
  expect((await fig.call('get')).gap).toBeGreaterThan(far.gap);
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test, every answer right, and the score says so`, async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const pick = async (text) => {
    const option = fig.frame.locator('.pvc-opt:not([disabled])', { hasText: new RegExp(`^${text}$`) }).first();
    for (let i = 0; i < 60 && !(await option.count()); i++) await fig.advance(300);
    await option.click();
    await fig.advance(500);
    await expect(fig.frame.locator('.pvc-q-feedback')).toContainText('ঠিক হয়েছে');
    await fig.frame.locator('[data-act="q-next"]').first().click();
    await fig.advance(900);
  };
  await fig.call('practice');
  await fig.advance(900);
  await pick('পজিটিভ'); // the leaves, by induction
  await pick('দুটি পাতে একই চার্জ, তাই বিকর্ষণ');
  // the unknown rod: read the gap, as a student does: wider than the known 58° means positive
  for (let i = 0; i < 60 && !(await fig.frame.locator('.pvc-opt:not([disabled])').count()); i++) await fig.advance(300);
  await pick((await fig.call('get')).gap > 58 ? 'পজিটিভ' : 'নেগেটিভ');
  await pick('নেগেটিভ'); // the comb's touch
  await pick('বাতাসের জলীয় বাষ্পে চার্জ হারিয়ে যায়');
  await expect(fig.frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ৫টি সঠিক');
  expect((await fig.call('get')).mode).toBe('quiz');
  await fig.frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(600);
  expect((await fig.call('get')).mode).toBe('explore');
  expect(log.errors).toEqual([]);
});
