// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's
// three steps on one action, the words on the panel, the marks in the picture, leaving the test, and the test itself.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { VIEWPORTS } from '../../../test/figures/figures.mjs';
import { STRINGS } from '../src/i18n.js';

test('light-at-boundary: three steps on one action, then all three', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  const settled = async () => {
    for (let i = 0; i < 60; i++) {
      await fig.advance(300);
      if (!(await fig.call('get')).busy) return fig.advance(1200);
    }
    throw new Error('the step never ended');
  };
  const outcome = fig.frame.locator('.pvc-outcome');
  let st = await fig.call('get');
  expect(st.show).toBe('none');
  expect(st.drawn).toEqual([]);
  await expect(outcome).toContainText('?');

  for (const [i, name] of ['reflection', 'refraction', 'absorption'].entries()) {
    await act();
    await settled();
    st = await fig.call('get');
    expect(st.show).toBe(name);
    expect(st.frame).toBe(name);
    expect(st.seen.length).toBe(i + 1);
    expect(st.drawn).toContain(name);
  }
  await expect(outcome).not.toContainText('?');
  await act();
  await settled();
  st = await fig.call('get');
  expect(st.show).toBe('all');
  expect(st.drawn.length).toBe(3);
  expect(st.refractedAngle).toBeCloseTo(30.71, 1);

  // the words choose one part, and what was not chosen stays seen
  await fig.frame.locator('[data-example="refraction"]').click();
  await settled();
  expect((await fig.call('get')).show).toBe('refraction');
  expect((await fig.call('get')).seen.length).toBe(3);

  // the last tap starts again
  await fig.frame.locator('[data-act="home"]').click();
  await fig.advance(1200);
  st = await fig.call('get');
  expect(st.show).toBe('none');
  expect(st.seen).toEqual([]);
  expect(log.errors).toEqual([]);
});

test('light-at-boundary: an interrupted step is not lost, and set works at once', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
  await fig.call('set', { show: 'reflection' });
  await fig.advance(300);
  await fig.call('set', { show: 'absorption', animate: false });
  let st = await fig.call('get');
  expect(st.show).toBe('absorption');
  expect(st.busy).toBe(false);
  expect(st.drawn).toEqual(['absorption']);
  await fig.call('set', { show: 'all', angle: 35, animate: false });
  st = await fig.call('get');
  expect(st.angle).toBe(35);
  expect(st.refractedAngle).toBeCloseTo(22.48, 1);
  await fig.call('reset');
  await fig.advance(800);
  st = await fig.call('get');
  expect(st.show).toBe('none');
  expect(st.angle).toBe(50);
  expect(log.errors).toEqual([]);
});

test('light-at-boundary: every right answer scores, and a wrong one does not', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
  const play = async (wrongAt) => {
    for (let i = 0; i < 5; i++) {
      await fig.advance(1500);
      const { question } = await fig.call('get');
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
      await fig.advance(1200);
      await fig.frame.locator('[data-act="q-next"]').click();
    }
    await fig.advance(800);
  };
  await fig.call('practice');
  await play(-1);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে ৫টি');
  await fig.frame.locator('[data-act="q-again"]').click();
  await play(2);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে ৪টি');
  expect(log.errors).toEqual([]);
});

test('light-at-boundary: the first questions do not name the media, and a step cut short by the test is not kept', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(400);
  await fig.call('practice');
  await fig.advance(1500);
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'মাধ্যম' })).toHaveCount(0);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(1200);
  const st = await fig.call('get');
  expect(st.show).toBe('none');
  expect(st.seen).toEqual([]);
  expect(st.drawn).toEqual([]);
  expect(st.frame).toBe('start');
  await expect(fig.frame.locator('.pvc-act').first()).toContainText('প্রতিফলন দেখো');
  expect(log.errors).toEqual([]);
});

test('light-at-boundary: the test runs to the end and leaves the learn state as it was', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
  await fig.call('set', { show: 'reflection', animate: false });
  await fig.call('practice');
  await fig.advance(1500);
  expect((await fig.call('get')).locked).toBe(true);
  for (let i = 0; i < 5; i++) {
    await expect(fig.frame.locator('.pvc-opt')).toHaveCount(4);
    await fig.frame.locator('.pvc-opt').first().click();
    await fig.advance(1600);
    await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(1500);
  }
  await expect(fig.frame.locator('.pvc-q-result')).toBeVisible();
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(1200);
  const st = await fig.call('get');
  expect(st.locked).toBe(false);
  expect(st.show).toBe('reflection');
  expect(st.seen).toEqual(['reflection']);
  expect(st.angle).toBe(50);
  expect(log.errors).toEqual([]);
});

test('light-at-boundary: a tap on the view is not a turn of it; a move of the finger is', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
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

test('light-at-boundary: after the last step the action offers the test; the quiet button plays the step again', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
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
  ['act_reflection', true],
  ['act_refraction', true],
  ['act_absorption', true],
  ['act_all', false],
  ['act_test', false],
]).map(([key, numbered]) => [STRINGS.bn[key].replace(/\{\w\}/g, '১'), numbered, key === 'act_test']);
for (const { width, height } of VIEWPORTS) {
  test(`light-at-boundary: every action stays on one line at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const log = await preparePage(page);
    const fig = await openFigure(page, 'light-at-boundary');
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

test('light-at-boundary: a lower render resolution leaves the view where the student turned it', async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
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
