// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's
// steps on one action, the drag and its numbers, the words on the panel, leaving the test, and the test itself.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const settled = async (fig) => {
  for (let i = 0; i < 80; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(1500);
  }
  throw new Error('the step never ended');
};

test('pinhole-camera: the steps on one action, from a dark paper to the book’s sentence', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pinhole-camera');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  const outcome = fig.frame.locator('.pvc-outcome');
  const rule = fig.frame.locator('.pvc-rule');
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 0, hole: 'none', image: false, rays: [] });
  await expect(outcome).toContainText('আলো নেই');

  await act();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 1, hole: 'tiny', image: true, frame: 'both', seen: ['real'] });
  await expect(rule).toContainText('বাস্তব প্রতিবিম্ব');

  await act();
  await settled(fig);
  expect((await fig.call('get')).rays).toEqual(['x']);
  await act();
  await settled(fig);
  st = await fig.call('get');
  expect(st.rays).toEqual(['x', 'y']);
  expect(st.frame).toBe('drag');
  expect(st.seen).toEqual(['real', 'inverted']);
  await expect(outcome).toContainText('উল্টো');

  // the action's own slide of the paper
  await act();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 4, v: 24, imageLength: 8, m: 2 });
  await expect(outcome).toContainText('৮ cm');

  await act();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 5, hole: 'big', frame: 'big' });
  expect(st.blur).toBeCloseTo(2.4, 3);
  await expect(rule).toContainText('ঝাপসা');
  await expect(fig.frame.locator('[data-example="sharp"]')).not.toHaveAttribute('aria-checked', 'true'); // not on a blurred image

  await act();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 6, hole: 'tiny', v: 18, seen: ['real', 'inverted', 'bigger', 'sharp'] });
  await expect(rule).toContainText('সকল দূরত্বে স্পষ্ট');
  await expect(rule).toContainText('পিন হোল ক্যামেরা');

  await act();
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 0, hole: 'none', seen: [] });
  expect(log.errors).toEqual([]);
});

test('pinhole-camera: dragging the paper and the candle changes the image; a short drag does not end the step', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pinhole-camera');
  await fig.call('set', { stage: 3, animate: false });
  await fig.advance(800);
  const box = await fig.frame.locator('.pvc-canvas').first().boundingBox();
  const canvas = fig.frame.locator('.pvc-canvas').first();
  const drag = async (fromX, fromY, toX, toY) => {
    const at = (x, y) => ({ pointerType: 'touch', clientX: x, clientY: y, isPrimary: true, pointerId: 7, bubbles: true, button: 0 });
    await canvas.dispatchEvent('pointerdown', at(fromX, fromY));
    for (let i = 1; i <= 4; i++) {
      await canvas.dispatchEvent('pointermove', at(fromX + ((toX - fromX) * i) / 4, fromY + ((toY - fromY) * i) / 4));
      await fig.advance(50);
    }
    await canvas.dispatchEvent('pointerup', at(toX, toY));
    await fig.advance(200);
  };
  // the paper is in the right part of the view
  const x = box.x + box.width * 0.72;
  const y = box.y + box.height * 0.4;
  await drag(x, y, x + 6, y);
  let st = await fig.call('get');
  expect(st.stage).toBe(3);
  await drag(x, y, x + 60, y);
  st = await fig.call('get');
  expect(st.v).toBeGreaterThan(20);
  expect(st.stage).toBe(4);
  expect(st.imageLength).toBeCloseTo((4 * st.v) / st.u, 2);
  // the keys
  await fig.frame
    .locator('.pvc')
    .first()
    .focus()
    .catch(() => {});
  await page.keyboard.press('ArrowLeft');
  await fig.advance(200);
  expect((await fig.call('get')).v).toBe(st.v - 1);
  await page.keyboard.press('ArrowUp');
  await fig.advance(200);
  expect((await fig.call('get')).u).toBe(st.u - 1);
  expect(log.errors).toEqual([]);
});

test('pinhole-camera: an interrupted step is not lost, the words jump, and set works at once', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pinhole-camera');
  await fig.call('set', { stage: 1 });
  await fig.advance(300);
  await fig.call('set', { stage: 3, u: 10, v: 25, animate: false });
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 3, busy: false, u: 10, v: 25, imageLength: 10 });
  expect(st.rays).toEqual(['x', 'y']);
  await fig.frame.locator('[data-example="real"]').click();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 1, frame: 'both' });
  expect(st.rays).toEqual([]);
  await fig.frame.locator('[data-example="sharp"]').click();
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 6, hole: 'tiny' }); // স্পষ্ট ends on the sharp image
  await fig.call('reset');
  await fig.advance(1000);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 0, u: 12, v: 18, hole: 'none' });
  expect(log.errors).toEqual([]);
});

test('pinhole-camera: every right answer scores, and a wrong one does not', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pinhole-camera');
  const play = async (wrongAt) => {
    const kinds = [];
    for (let i = 0; i < 5; i++) {
      await fig.advance(1500);
      const { question } = await fig.call('get');
      kinds.push(question.kind);
      const right = fig.frame.locator(`.pvc-opt[data-q="${question.right}"]`);
      if (i === wrongAt) {
        const other = fig.frame.locator(`.pvc-opt[data-q="${(question.right + 1) % 4}"]`);
        await other.click();
        await expect(other).toHaveClass(/wrong/);
        await expect(fig.frame.locator('.pvc-q-feedback')).toContainText('হয়নি');
      } else {
        await right.click();
        await expect(fig.frame.locator('.pvc-q-feedback')).toContainText('ঠিক');
      }
      await expect(right).toHaveClass(/right/); // the right choice is marked either way
      await fig.advance(1600);
      await fig.frame.locator('[data-act="q-next"]').click();
    }
    await fig.advance(800);
    return kinds;
  };
  await fig.call('practice');
  expect(await play(-1)).toEqual(['flip', 'size', 'near', 'blur', 'real']);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে ৫টি');
  await fig.frame.locator('[data-act="q-again"]').click();
  expect((await play(2))[2]).toBe('far'); // the candle's question and the paper's take turns
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে ৪টি');
  expect(log.errors).toEqual([]);
});

test('pinhole-camera: the flame holds still when left alone and wakes on a touch', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pinhole-camera');
  const picture = () => fig.call('capture', { width: 200, height: 125 });
  await fig.advance(21_000);
  const a = await picture();
  await fig.advance(700);
  expect(await picture()).toBe(a); // nothing moved
  await fig.frame.locator('.pvc-canvas').first().dispatchEvent('pointerdown', { clientX: 5, clientY: 5, bubbles: true, pointerId: 3 });
  await fig.frame.locator('.pvc-canvas').first().dispatchEvent('pointerup', { clientX: 5, clientY: 5, bubbles: true, pointerId: 3 });
  await fig.advance(700);
  expect(await picture()).not.toBe(a);
  expect(log.errors).toEqual([]);
});

test('pinhole-camera: the picture does not answer the question, and leaving the test restores the state', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pinhole-camera');
  await fig.call('set', { stage: 4, v: 21, animate: false });
  await fig.call('practice');
  await fig.advance(1500);
  let st = await fig.call('get');
  expect(st.locked).toBe(true);
  expect(st.image).toBe(false); // where X lands is not on the paper yet
  await fig.frame.locator('.pvc-opt').first().click();
  await fig.advance(1200);
  await fig.frame.locator('[data-act="q-next"]').click();
  await fig.advance(1500);
  st = await fig.call('get');
  expect(st.question.kind).toBe('size');
  expect(st.image).toBe(false);
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'l′' })).toHaveCount(0);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(1200);
  st = await fig.call('get');
  expect(st).toMatchObject({ locked: false, stage: 4, u: 12, v: 21, image: true, question: null });
  expect(log.errors).toEqual([]);
});
