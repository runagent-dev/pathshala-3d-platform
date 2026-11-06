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
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 600, height: 300 }); // every step really plays: few pixels, so that CI stays inside its limit
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const act = async () => {
    await fig.frame.locator('.pvc-act').first().click();
    await settled(fig);
    return fig.call('get');
  };
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'see', u: 10, v: -6, m: 0.6, rays: 0, ghost: false });
  await expect(fig.frame.locator('.lab-lead')).toContainText('ছোট');

  // one new thing per tap: the parallel ray alone, then its extension, then the others
  st = await act();
  expect(st).toMatchObject({ stage: 'par', rays: 1, extended: 0, frame: 'near' });
  await expect(fig.frame.locator('.pvc-anno', { hasText: '(ii) সমান্তরাল' })).toHaveCount(1);
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'O' })).toHaveCount(0);
  st = await act();
  expect(st).toMatchObject({ stage: 'ext', rays: 1, extended: 1 });
  st = await act();
  expect(st).toMatchObject({ stage: 'cen', rays: 2, extended: 2, frame: 'rays' });
  await expect(fig.frame.locator('.pvc-anno', { hasText: '(i) কেন্দ্রমুখী' })).toHaveCount(1);
  st = await act();
  expect(st).toMatchObject({ stage: 'foc', rays: 3, extended: 3 });
  await expect(fig.frame.locator('.pvc-anno', { hasText: '(iii) F অভিমুখী' })).toHaveCount(1);
  expect(st.miss).toBeLessThan(0.2);
  st = await act();
  expect(st).toMatchObject({ stage: 'image', ghost: true, frame: 'near' });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'অবাস্তব · সোজা · ছোট' })).toHaveCount(1);
  expect(log.errors).toEqual([]);
});

test(`${ID}: the story from the image to the end, on one action`, async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const act = async () => {
    await fig.frame.locator('.pvc-act').first().click();
    await settled(fig);
    return fig.call('get');
  };
  await fig.call('set', { stage: 'image', animate: false });
  await fig.advance(600);

  let st = await act();
  expect(st).toMatchObject({ stage: 'move', frame: 'zoom' });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'ছোট: ৩/৫ গুণ' })).toHaveCount(1);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('আয়নার পেছনে');
  // the action moves the pencil away, then near; the size on the image follows
  st = await act();
  expect(st).toMatchObject({ u: 60, v: -12, m: 0.2, sawFar: true, sawNear: false });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'ছোট: ১/৫ গুণ' })).toHaveCount(1);
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'পেনসিল ৬০ cm' })).toHaveCount(1);
  st = await act();
  expect(st).toMatchObject({ u: 6, sawNear: true });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('P ও F এর মাঝখানে');

  st = await act();
  expect(st).toMatchObject({ stage: 'formula', u: 6 });
  await expect(fig.frame.locator('.lab-formula')).toBeVisible();
  st = await act();
  expect(st).toMatchObject({ stage: 'plane', frame: 'eye', seen: 3, curve: 0, row: true });
  st = await act();
  expect(st).toMatchObject({ stage: 'eye', frame: 'eye', seen: 7, curve: 1 });
  st = await act();
  expect(st).toMatchObject({ stage: 'wide', frame: 'wide' });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৭টি');

  // the end offers the test, and only then; it can be declined by a tap on a word
  await expect(fig.frame.locator('.pvc-act')).toContainText('পরীক্ষা দাও');
  st = await fig.call('get');
  expect(st.mode).toBe('explore');
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(1800);
  expect((await fig.call('get')).mode).toBe('quiz');
  await fig.frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(1800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', stage: 'wide' });
  await fig.frame.locator('[data-example="see"]').click();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'see', u: 10, sawFar: false, curve: 1, row: false });
  expect(log.errors).toEqual([]);
});

test(`${ID}: nothing runs ahead of the student`, async ({ page }) => {
  test.setTimeout(200_000); // the steps must really play here, so they can't be skipped
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const action = fig.frame.locator('.pvc-act').first();
  await action.click();
  // a second tap, and a word, while the step plays: ignored
  await fig.advance(600);
  await fig.frame.locator('[data-example="rear"]').click();
  await fig.frame.locator('[data-example="rear"]').click();
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'par', busy: true });
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'par', busy: false, rays: 1, extended: 0 });
  // finished: it waits, however long
  await fig.advance(6000);
  expect((await fig.call('get')).stage).toBe('par');
  // the quiet button plays the step again from where it began; so does its word
  await fig.frame.locator('[data-act="replay"]').click();
  await fig.advance(300);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'par', busy: true, rays: 0 });
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'par', busy: false, rays: 1 });
  await fig.frame.locator('[data-example="rays"]').click();
  await fig.advance(300);
  expect((await fig.call('get')).busy).toBe(true);
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'par', rays: 1 });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the image is big on a phone, in its own step and with the pencil far off`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 700 });
  await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { stage: 'image', animate: false });
  await fig.advance(600);
  expect((await fig.call('get')).imagePx).toBeGreaterThanOrEqual(40);
  await fig.call('set', { stage: 'move', u: 15, animate: false });
  await fig.advance(600);
  expect((await fig.call('get')).imagePx).toBeGreaterThanOrEqual(30);
  await fig.call('set', { stage: 'move', u: 60, animate: false });
  await fig.advance(600);
  expect((await fig.call('get')).imagePx).toBeGreaterThanOrEqual(18);
});

test(`${ID}: the drag handle shows what can be moved`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID, { params: { coach: '1' } });
  await fig.advance(600);
  const handle = fig.frame.locator('.pvc-dh .pvc-dh-disc');
  let st = await fig.call('get');
  expect(st.handle).toEqual({ shown: true, used: false });
  await expect(fig.frame.locator('.pvc-dh-word')).toBeVisible();
  // it can be taken with the mouse, and then stays, smaller, without its words
  const b = await handle.boundingBox();
  expect(b.width).toBeGreaterThanOrEqual(28);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 - 40, b.y + b.height / 2, { steps: 4 });
  await page.mouse.up();
  await fig.advance(300);
  st = await fig.call('get');
  expect(st.u).not.toBe(10);
  expect(st.handle).toEqual({ shown: true, used: true });
  await expect(fig.frame.locator('.pvc-dh-word')).toBeHidden();
  await expect(handle).toBeVisible();
  // not in the rear-view stages, nor in the test
  await fig.call('set', { stage: 'eye', animate: false });
  await fig.advance(300);
  await expect(fig.frame.locator('.pvc-rc')).toBeHidden(); // the camera cannot turn in the eye's view
  await fig.advance(300);
  await expect(handle).toBeHidden();
  await fig.call('set', { stage: 'move', animate: false });
  await fig.advance(300);
  await expect(handle).toBeVisible();
  await fig.call('practice');
  await fig.advance(900);
  await expect(handle).toBeHidden();
  expect(log.errors).toEqual([]);
});

test(`${ID}: the bridge, the arrow keys, jumps cut short`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { stage: 'image', u: 30, animate: false });
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'image', u: 30, v: -10, ghost: true, rays: 3 });
  expect(st.imageHeight).toBeCloseTo(2, 5);
  // a jump across the story, cut short by the book
  await fig.frame.locator('[data-example="rear"]').click();
  await fig.advance(250);
  await fig.call('set', { stage: 'see' });
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
  expect(st).toMatchObject({ stage: 'see', u: 10, rays: 0 });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test scores right answers and wrong ones, and leaves things as they were`, async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { stage: 'ext', u: 22, animate: false });
  await fig.call('practice');
  await fig.advance(1800);
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
    await fig.advance(1800);
  }
  expect(new Set(kinds).size).toBe(5);
  await expect(fig.frame.locator('.pvc-q-done')).toContainText('৫টির মধ্যে ৫টি');

  // again, every answer wrong
  await fig.frame.locator('[data-act="q-again"]').click();
  await fig.advance(1800);
  for (let i = 0; i < 5; i++) {
    const st = await fig.call('get');
    await fig.frame.locator(`[data-q="${(st.question.right + 1) % 4}"]`).click();
    await fig.advance(500);
    await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(1800);
  }
  await expect(fig.frame.locator('.pvc-q-done')).toContainText('৫টির মধ্যে ০টি');

  await fig.frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(1800);
  const st = await fig.call('get');
  expect(st).toMatchObject({ mode: 'explore', locked: false, stage: 'ext', u: 22, rays: 1, question: null });
  expect(log.errors).toEqual([]);
});

test('convex-mirror-image: a tap on the view is not a turn of it; a move of the finger is', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'convex-mirror-image');
  const box = await fig.frame.locator('.pvc-canvas').first().boundingBox();
  const x = box.x + 40;
  const y = box.y + 40;
  await page.mouse.click(x, y);
  await fig.advance(300);
  expect((await fig.call('get')).view).toBe('front');
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 60, y, { steps: 4 });
  await page.mouse.up();
  await fig.advance(300);
  expect((await fig.call('get')).view).toBe('3d');
  expect(log.errors).toEqual([]);
});

test('convex-mirror-image: a lower render resolution leaves the view where the student turned it', async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'convex-mirror-image');
  const canvas = fig.frame.locator('.pvc-canvas canvas').first();
  const ratio = () => canvas.evaluate((c) => c.width / c.clientWidth);
  expect(await ratio()).toBe(2);
  const box = await canvas.boundingBox();
  const x = box.x + 30;
  const y = box.y + 30;
  await page.mouse.move(x, y);
  await page.mouse.down();
  // slow frames while the view turns: the stage lowers its resolution, and tells the figure through onResize
  for (let i = 1; i <= 60 && (await ratio()) === 2; i++) {
    await page.mouse.move(x + (i % 20) * 4, y);
    await fig.advance(40, 40);
  }
  await page.mouse.up();
  expect(await ratio()).toBeLessThan(2);
  await fig.advance(300);
  expect((await fig.call('get')).view).toBe('3d');
  expect(log.errors).toEqual([]);
  await page.close();
});
