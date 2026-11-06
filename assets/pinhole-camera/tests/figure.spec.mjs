// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's
// steps on one action, the drag and its numbers, the words on the panel, leaving the test, and the test itself.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { VIEWPORTS } from '../../../test/figures/figures.mjs';
import { STRINGS } from '../src/i18n.js';

const settled = async (fig) => {
  for (let i = 0; i < 80; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(1500);
  }
  throw new Error('the step never ended');
};

test('pinhole-camera: the steps on one action, from a dark paper to the book’s sentence', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 600, height: 300 }); // every step really plays: few pixels, so that CI stays inside its limit
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

  await expect(fig.frame.locator('.pvc-act').first()).toContainText('পরীক্ষা দাও');
  await fig.call('reset');
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
  test.setTimeout(280_000);
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

test('pinhole-camera: a tap on the view is not a turn of it; a move of the finger is', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pinhole-camera');
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

test('pinhole-camera: every movable part wears a handle, and a drag from it moves the part', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pinhole-camera');
  await fig.call('set', { stage: 3, animate: false });
  await fig.advance(2500);
  const handles = fig.frame.locator('.pvc-dh:not([hidden])');
  await expect(handles).toHaveCount(2);
  await expect(handles.first().locator('.pvc-dh-word')).toHaveText('টেনে সরাও');
  const from = (await fig.call('get')).v;
  const b = await handles.first().boundingBox();
  await page.mouse.move(b.x + 23, b.y + 23);
  await page.mouse.down();
  await page.mouse.move(b.x + 83, b.y + 23, { steps: 4 });
  await page.mouse.up();
  await fig.advance(300);
  expect((await fig.call('get')).v).toBeGreaterThan(from);
  await expect(handles.first().locator('.pvc-dh-word')).toHaveCount(0);
  await expect(handles.first()).toHaveClass(/used/);
  await expect(handles).toHaveCount(2);
  expect(log.errors).toEqual([]);
});

test('pinhole-camera: after the last step the action offers the test; the quiet button plays the step again', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pinhole-camera');
  const action = fig.frame.locator('.pvc-act').first();
  const again = fig.frame.locator('[data-act="replay"]');
  await expect(again).toBeHidden();
  const settled = async () => {
    for (let i = 0; i < 120; i++) {
      await fig.advance(300);
      if (!(await action.isDisabled())) return fig.advance(1300);
    }
    throw new Error('the step never ended');
  };
  await fig.call('set', { stage: 6, animate: false }); // near the end: it's the last step that matters here
  await settled();
  for (let i = 0; i < 30 && !(await action.textContent()).includes('পরীক্ষা'); i++) {
    const lines = await fig.frame
      .locator('.pvc-act-text')
      .first()
      .evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return new Set([...range.getClientRects()].map((q) => Math.round(q.top / 8))).size;
      });
    expect(lines, await action.textContent()).toBe(1);
    await action.click();
    await fig.advance(200);
    await settled();
  }
  await expect(action).toContainText('পরীক্ষা দাও');
  await expect(again).toBeVisible();
  await again.click();
  await fig.advance(200);
  await expect(action).toBeDisabled();
  await settled();
  await expect(action).toContainText('পরীক্ষা দাও');
  await action.click();
  await fig.advance(500);
  expect((await fig.call('get')).mode).toBe('quiz');
  expect(log.errors).toEqual([]);
});

/** Every action of this figure, as the pill shows it: its words, and whether it has a step's number. */
const ACTIONS = /** @type {[string, boolean][]} */ ([
  ['act_hole', true],
  ['act_x', true],
  ['act_y', true],
  ['act_drag', true],
  ['act_big', true],
  ['act_tiny', true],
  ['act_test', false],
]).map(([key, numbered]) => [STRINGS.bn[key].replace(/\{\w\}/g, '১'), numbered, key === 'act_test']);
for (const { width, height } of VIEWPORTS) {
  test(`pinhole-camera: every action stays on one line at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const log = await preparePage(page);
    const fig = await openFigure(page, 'pinhole-camera');
    await fig.advance(300);
    const r = await fig.frame.evaluate((actions) => {
      const row = document.querySelector('.pvc-act-row');
      const text = row.querySelector('.pvc-act-text');
      const num = /** @type {HTMLElement} */ (row.querySelector('.pvc-act .pvc-act-num'));
      const home = /** @type {HTMLElement} */ (row.querySelector('[data-act="home"]'));
      /** @type {HTMLElement} */ (row.querySelector('[data-act="replay"]')).hidden = false;
      const long = [];
      const heights = new Set();
      for (const [words, numbered, offer] of actions) {
        text.textContent = words;
        num.textContent = numbered ? '১' : '';
        num.hidden = !numbered;
        home.hidden = offer;
        const range = document.createRange();
        range.selectNodeContents(text);
        const lines = new Set([...range.getClientRects()].map((q) => Math.round(q.top / 8)));
        if (lines.size !== 1 || text.scrollWidth - text.clientWidth > 1) long.push(words);
        heights.add(Math.round(row.getBoundingClientRect().height));
      }
      return { long, heights: [...heights] };
    }, ACTIONS);
    expect(r.long).toEqual([]);
    expect(r.heights.length, `the row keeps its height: ${r.heights}`).toBe(1);
    expect(log.errors).toEqual([]);
  });
}

test('pinhole-camera: a lower render resolution leaves the view where the student turned it', async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'pinhole-camera');
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
