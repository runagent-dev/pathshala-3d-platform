// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's
// steps on one action, the marker, the words, the test with its scoring, and leaving the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { VIEWPORTS } from '../../../test/figures/figures.mjs';
import { STRINGS } from '../src/i18n.js';

const settled = async (fig) => {
  for (let i = 0; i < 80; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(1200);
  }
  throw new Error('the step never ended');
};

test('light-spectrum: the six steps on one action', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  const outcome = fig.frame.locator('.pvc-outcome');
  let st = await fig.call('get');
  expect(st.show).toBe('none');
  expect(st.done).toEqual([]);
  await expect(outcome).toContainText('?');

  for (const [i, name] of ['light', 'grooves', 'sweep', 'ir', 'uv', 'all'].entries()) {
    await act();
    await settled(fig);
    st = await fig.call('get');
    expect(st.show).toBe(name);
    expect(st.done.length).toBe(i + 1);
    if (name === 'sweep') {
      expect(st.nm).toBe(700);
      expect(st.marker).toBe(true);
      await expect(outcome).toContainText('৭০০ nm');
    }
    if (name === 'ir') {
      expect(st.kind).toBe('ir');
      expect(st.visible).toBe(false);
      await expect(outcome).toContainText('অবলোহিত');
    }
    if (name === 'uv') {
      expect(st.kind).toBe('uv');
      await expect(outcome).toContainText('অতিবেগুনী');
    }
    if (name === 'all') {
      expect(st.marker).toBe(false);
      await expect(outcome).toContainText('৪০০ থেকে ৭০০ nm');
    }
  }

  // a word chooses a colour, and the wrong order still works from the start
  await fig.call('reset');
  await fig.advance(1000);
  st = await fig.call('get');
  expect(st.done).toEqual([]);
  await fig.frame.locator('[data-example="green"]').click();
  await settled(fig);
  st = await fig.call('get');
  expect(st.kind).toBe('green');
  expect(st.nm).toBe(530);
  expect(st.marker).toBe(true);
  expect(st.done).toEqual(['light']);
  await expect(fig.frame.locator('[data-example="green"]')).toHaveAttribute('aria-checked', 'true');
  expect(log.errors).toEqual([]);
});

test('light-spectrum: a drag on the band and the arrow keys move the marker; the panel follows', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
  await fig.call('set', { show: 'wave', nm: 550, animate: false });
  await fig.advance(600);
  const box = await fig.frame.locator('.lab-draw').boundingBox();
  const to = (fx, fy, options) => page.mouse.move(box.x + box.width * fx, box.y + box.height * fy, options);
  // a little left of the middle of the view: the band; up is a longer wavelength
  await to(0.42, 0.5);
  await page.mouse.down();
  await fig.advance(100);
  const first = (await fig.call('get')).nm;
  await to(0.42, 0.3, { steps: 3 });
  await fig.advance(100);
  const up = (await fig.call('get')).nm;
  expect(up).toBeGreaterThan(first);
  await to(0.42, 0.7, { steps: 3 });
  await fig.advance(100);
  expect((await fig.call('get')).nm).toBeLessThan(first);
  await page.mouse.up();
  await fig.advance(200);
  const was = (await fig.call('get')).nm;
  await fig.frame
    .locator('#app')
    .focus()
    .catch(() => {});
  await page.keyboard.press('ArrowRight');
  await fig.advance(100);
  expect((await fig.call('get')).nm).toBe(was + 5);
  expect(log.errors).toEqual([]);
});

test('light-spectrum: set works at once, an interrupted step is not lost', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
  await fig.call('set', { show: 'light' });
  await fig.advance(300);
  await fig.call('set', { show: 'wave', nm: 620, animate: false });
  let st = await fig.call('get');
  expect(st.nm).toBe(620);
  expect(st.kind).toBe('red');
  expect(st.busy).toBe(false);
  expect(st.sensitivity).toBeCloseTo(0.381, 2);
  await fig.call('reset');
  await fig.advance(800);
  st = await fig.call('get');
  expect(st.show).toBe('none');
  expect(st.nm).toBe(550);
  expect(log.errors).toEqual([]);
});

test('light-spectrum: every right answer scores, and a wrong one does not', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
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

test('light-spectrum: leaving the test restores the learn state; a step cut short is not kept', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
  await fig.call('set', { show: 'wave', nm: 620, animate: false });
  await fig.call('practice');
  await fig.advance(1500);
  expect((await fig.call('get')).locked).toBe(true);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(1200);
  let st = await fig.call('get');
  expect(st.locked).toBe(false);
  expect(st.nm).toBe(620);
  expect(st.marker).toBe(true);

  await fig.call('reset');
  await fig.advance(600);
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(400);
  await fig.call('practice');
  await fig.advance(1500);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(1200);
  st = await fig.call('get');
  expect(st.done).toEqual([]);
  expect(st.show).toBe('none');
  await expect(fig.frame.locator('.pvc-act').first()).toContainText('সিডিতে আলো');

  // the sweep cut short by the test: no wavelength of the half-done sweep comes back
  await fig.call('set', { show: 'grooves', animate: false });
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(2500);
  expect((await fig.call('get')).busy).toBe(true);
  await fig.call('practice');
  await fig.advance(1500);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(1200);
  st = await fig.call('get');
  expect(st.nm).toBe(550);
  expect(st.marker).toBe(false);
  await expect(fig.frame.locator('.pvc-act').first()).toContainText('বেগুনি থেকে লাল');
  expect(log.errors).toEqual([]);
});

test('light-spectrum: a tap on the view is not a turn of it; a move of the finger is', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
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

test('light-spectrum: after the last step the action offers the test; the quiet button plays the step again', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
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
  ['act_light', true],
  ['act_grooves', true],
  ['act_sweep', true],
  ['act_ir', true],
  ['act_uv', true],
  ['act_all', true],
  ['act_test', false],
]).map(([key, numbered]) => [STRINGS.bn[key].replace(/\{\w\}/g, '১'), numbered, key === 'act_test']);
for (const { width, height } of VIEWPORTS) {
  test(`light-spectrum: every action stays on one line at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const log = await preparePage(page);
    const fig = await openFigure(page, 'light-spectrum');
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

test('light-spectrum: a lower render resolution leaves the view where the student turned it', async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
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
