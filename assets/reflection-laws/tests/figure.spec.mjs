// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the laws
// built one part at a time with the camera's framings, both laws read back from the vectors, the spread on wavy water,
// the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { VIEWPORTS } from '../../../test/figures/figures.mjs';
import { STRINGS } from '../src/i18n.js';

test('reflection-laws: the laws, step by step', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 600, height: 300 }); // every step really plays: few pixels, so that CI stays inside its limit
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-laws');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  const st = await fig.call('get');
  expect(st).toMatchObject({ step: 'laws', law: 0, theta: 50, thetaR: 50, inPlane: true, framing: 'wide' });

  // one part at a time, in the book's order: the camera flies to O and each part arrives before the button is back
  const steps = [
    { law: 1, ms: 3200, framing: 'ray', word: 'আলোক রশ্মি' },
    { law: 2, ms: 1700, framing: 'ray', word: 'আপতন বিন্দু' },
    { law: 3, ms: 1700, framing: 'ray', word: 'অভিলম্ব' },
    { law: 4, ms: 2600, framing: 'plane', word: 'সমতল' },
    { law: 5, ms: 1700, framing: 'plane', word: 'প্রতিফলিত রশ্মি' },
  ];
  for (const { law, ms, framing, word } of steps) {
    await act();
    await fig.advance(200);
    await expect(fig.frame.locator('.pvc-act').first()).toBeDisabled();
    await fig.advance(ms + 1500);
    expect(await fig.call('get')).toMatchObject({ law, framing });
    await expect(fig.frame.locator('.pvc-outcome')).toContainText(word);
    await expect(fig.frame.locator('.pvc-act').first()).toBeEnabled();
    await fig.advance(500);
  }
  await act();
  await fig.advance(1900);
  expect((await fig.call('get')).law).toBe(6);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৫০');
  await fig.advance(500);

  expect(log.errors).toEqual([]);
});

test('reflection-laws: the two laws, by the action and by set', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-laws');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  await fig.call('set', { law: 6, animate: false });
  await fig.advance(600);
  let st;

  // the first law: swing the plane, the camera stays, the reflected ray never leaves it, θr stays θi
  await act();
  await fig.advance(2300);
  st = await fig.call('get');
  expect(st).toMatchObject({ law: 7, framing: 'plane' });
  expect(st.phi).not.toBe(0);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('প্রথম সূত্র');
  for (const phi of [22, -46, 10]) {
    st = await fig.call('set', { phi });
    expect(st).toMatchObject({ phi, inPlane: true });
    expect(st.thetaR).toBeCloseTo(st.theta, 6);
  }

  // the second law: θr follows θi at every angle
  await fig.advance(500);
  await act();
  await fig.advance(2300);
  expect((await fig.call('get')).law).toBe(8);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('দ্বিতীয় সূত্র');
  for (const theta of [20, 35, 64, 75]) {
    st = await fig.call('set', { theta });
    expect(st.thetaR).toBeCloseTo(theta, 6);
  }
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৭৫');

  expect(log.errors).toEqual([]);
});

test('reflection-laws: still water and waves', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-laws');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  await fig.call('set', { law: 8, animate: false });
  await fig.advance(600);
  let st;

  // 8.2.2, back on the whole lake: parallel on still water, spread on waves
  await act();
  await fig.advance(1800);
  st = await fig.call('get');
  expect(st).toMatchObject({ step: 'surface', waves: false, framing: 'lake' });
  expect(st.spread).toBeLessThan(0.01);
  await fig.advance(500);
  await act();
  await fig.advance(2000);
  st = await fig.call('get');
  expect(st.wind).toBe(1);
  expect(st.spread).toBeGreaterThan(70);
  // left alone, the waves rest (a phone stops drawing), and a touch wakes them
  await fig.advance(21_000);
  expect((await fig.call('get')).resting).toBe(true);
  await fig.frame.locator('.pvc-canvas').first().dispatchEvent('pointerdown', { bubbles: true, pointerId: 3, clientX: 5, clientY: 5 });
  await fig.frame.locator('.pvc-canvas').first().dispatchEvent('pointerup', { bubbles: true, pointerId: 3, clientX: 5, clientY: 5 });
  await fig.advance(100);
  expect((await fig.call('get')).resting).toBe(false);
  await act();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ waves: false, wind: 0 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'laws', law: 0, theta: 50, phi: 0, waves: false, mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('reflection-laws: the handle and X can be dragged, and the test gives back the learn view', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-laws');
  await fig.call('set', { law: 6, theta: 40, phi: 12, animate: false });
  await fig.advance(300);
  // a quick look: keys work the same two moves
  await fig.frame.locator('.pvc').first().press('ArrowUp');
  expect((await fig.call('get')).law).toBe(7);
  await fig.frame.locator('.pvc').first().press('ArrowRight');
  expect(await fig.call('get')).toMatchObject({ law: 8, theta: 42 });
  // a capture carries the drawing: the rays' amber is in the picture, not only on the screen
  const png = await fig.call('capture', { width: 422, height: 195 });
  const amber = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] > 120 && d[i + 1] < 190 && d[i + 2] < 90) n++;
    return n;
  }, png);
  expect(amber).toBeGreaterThan(40);
  await fig.call('practice');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ mode: 'quiz', locked: true });
  for (let i = 0; i < 5; i++) {
    await fig.advance(900);
    await fig.frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(300);
    expect(['ok', 'bad']).toContain(await fig.frame.locator('.pvc-q-feedback').getAttribute('data-tone'));
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(900);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(900);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'laws', law: 8, theta: 42, waves: false });
  expect(log.errors).toEqual([]);
});

test('reflection-laws: a tap on the view is not a turn of it; a move of the finger is', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-laws');
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

test('reflection-laws: after the last step the action offers the test; the quiet button plays the step again', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-laws');
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
  await fig.call('set', { step: 'surface', animate: false }); // near the end: it's the last step that matters here
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
  // the last step is the waves: they come again, and a tap calms them
  expect((await fig.call('get')).waves).toBe(true);
  await action.click();
  await fig.advance(200);
  await settled();
  await expect(action).toContainText('পরীক্ষা দাও');
  await action.click();
  await fig.advance(500);
  expect((await fig.call('get')).mode).toBe('quiz');
  expect(log.errors).toEqual([]);
});

/** Every action of this figure, as the pill shows it: its words, and whether it has a step's number. */
const ACTIONS = /** @type {[string, boolean][]} */ ([
  ['act_ray', true],
  ['act_point', true],
  ['act_normal', true],
  ['act_plane', true],
  ['act_reflect', true],
  ['act_angles', true],
  ['act_swing', true],
  ['act_tilt', true],
  ['act_next', false],
  ['act_waves', true],
  ['act_calm', false],
  ['act_test', false],
]).map(([key, numbered]) => [STRINGS.bn[key].replace(/\{\w\}/g, '১'), numbered, key === 'act_test']);
for (const { width, height } of VIEWPORTS) {
  test(`reflection-laws: every action stays on one line at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const log = await preparePage(page);
    const fig = await openFigure(page, 'reflection-laws');
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

test('reflection-laws: a lower render resolution leaves the view where the student turned it', async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-laws');
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
