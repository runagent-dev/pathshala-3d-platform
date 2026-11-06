// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the three
// steps built in the book's order, the optics read back from the rays, the mirror's edges, the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { VIEWPORTS } from '../../../test/figures/figures.mjs';
import { STRINGS } from '../src/i18n.js';

test('plane-mirror-image: the three steps', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 600, height: 300 }); // every step really plays: few pixels, so that CI stays inside its limit
  const log = await preparePage(page);
  const fig = await openFigure(page, 'plane-mirror-image');
  const act = async (ms = 1400) => {
    await fig.frame.locator('.pvc-act').first().click();
    await fig.advance(ms + 2000);
  };
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'distance', stage: 0, d: 1, xp: 1, xpImage: 1 });

  // one thing at a time: the image, the distances, a move, the lengths
  await act();
  expect((await fig.call('get')).stage).toBe(1);
  await fig.advance(600);
  await act();
  expect((await fig.call('get')).stage).toBe(2);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('১.০০');
  await fig.advance(600);
  await act(1800);
  st = await fig.call('get');
  expect(st.stage).toBe(3);
  expect(st.d).not.toBe(1);
  expect(st.xp).toBe(st.xpImage);
  for (const d of [0.5, 0.85, 2]) {
    st = await fig.call('set', { d, animate: false });
    expect(st).toMatchObject({ xp: d, xpImage: d });
  }
  await act();
  expect((await fig.call('get')).stage).toBe(4);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('১.৫');
  await fig.advance(600);
  await act();
  st = await fig.call('get');
  expect(st).toMatchObject({ step: 'rays', ray: 0, frame: 'pair' });

  expect(log.errors).toEqual([]);
});

test('plane-mirror-image: the rays, one tap each', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'plane-mirror-image', { params: { step: 'rays' } });
  await fig.advance(600);
  const act = async (ms = 1400) => {
    await fig.frame.locator('.pvc-act').first().click();
    await fig.advance(ms + 2000);
  };
  let st;

  // the rays: the law read back from them, at every distance, and their extensions reach the image
  for (const ray of [1, 2, 3, 4]) {
    await act();
    expect((await fig.call('get')).ray).toBe(ray);
    await fig.advance(800);
  }
  st = await fig.call('get');
  expect(st.frame).toBe('all');
  await expect(fig.frame.locator('.pvc-rule')).toContainText('অবাস্তব প্রতিবিম্ব');
  for (const d of [0.5, 1, 2]) {
    st = await fig.call('set', { d, animate: false });
    expect(st.head.thetaR).toBeCloseTo(st.head.thetaI, 6);
    expect(st.feet.thetaR).toBeCloseTo(st.feet.thetaI, 6);
    expect(st.head.miss).toBeCloseTo(0, 6);
    expect(st.feet.miss).toBeCloseTo(0, 6);
    expect(st.head.y).toBeCloseTo(st.height, 6);
    expect(st.feet.y).toBeCloseTo(0, 6);
  }

  expect(log.errors).toEqual([]);
});

test('plane-mirror-image: how long a mirror must be', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'plane-mirror-image', { params: { step: 'rays', ray: '4', d: '1' } });
  await fig.advance(600);
  const act = async (ms = 1400) => {
    await fig.frame.locator('.pvc-act').first().click();
    await fig.advance(ms + 2000);
  };
  let st;

  // চিত্র ৮.১২: too short, then found; the same at 10 m
  await act(1800);
  st = await fig.call('get');
  expect(st).toMatchObject({ step: 'length', seesHead: false, seesFeet: false, eyeView: true, d: 1 });
  await act(1500);
  st = await fig.call('get');
  expect(st).toMatchObject({ seesHead: false, seesFeet: true, bottom: 0.7 });
  await act(2000);
  st = await fig.call('get');
  expect(st).toMatchObject({ seesHead: true, seesFeet: true, top: 1.45, bottom: 0.7, length: 0.75, frame: 'half' });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('০.৭৫');
  await act(2400);
  st = await fig.call('get');
  expect(st).toMatchObject({ d: 10, far: true, seesHead: true, seesFeet: true, length: 0.75 });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('অর্ধেক');

  // a mirror that loses the feet says so
  st = await fig.call('set', { d: 1, bottom: 0.9, animate: false });
  expect(st).toMatchObject({ seesFeet: false, seesHead: true });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('পা দেখা যাচ্ছে না');

  // never "half" or "at half the eye's height" when it is not so
  st = await fig.call('set', { d: 1, top: 1.45, bottom: 0.5, animate: false });
  await fig.advance(1500);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('দরকারের চেয়ে বড়');
  await expect(fig.frame.locator('.pvc-anno', { hasText: '০.৯৫ m' })).not.toContainText('অর্ধেক');
  await fig.call('set', { top: 1.2, bottom: 0.45, animate: false });
  await fig.advance(600);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('দরকারের চেয়ে নিচে');
  await fig.call('set', { top: 1.6, bottom: 0.9, animate: false });
  await fig.advance(600);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('দরকারের চেয়ে উপরে');

  // the test started in the middle of a demonstration keeps what the demonstration was going to leave
  await fig.call('set', { top: 1.3, bottom: 0.92, animate: false });
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(300);
  await fig.call('practice');
  await fig.advance(800);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect((await fig.call('get')).bottom).toBe(0.7);

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'distance', stage: 0, d: 1 });
  expect(log.errors).toEqual([]);
});

test('plane-mirror-image: the test runs to its end and leaves the learn state as it was', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'plane-mirror-image', { params: { step: 'rays', ray: '4', d: '1.2' } });
  await fig.call('practice');
  const f = fig.frame;
  for (let i = 0; i < 5; i++) {
    await fig.advance(900);
    await expect(f.locator('.pvc-opt')).toHaveCount(4);
    await f.locator('.pvc-opt').first().click();
    await fig.advance(300);
    await expect(f.locator('.pvc-q-feedback')).not.toBeEmpty();
    await f.locator('[data-act="q-next"]').click();
  }
  await fig.advance(600);
  await expect(f.locator('.pvc-q-result')).toContainText('৫');
  await f.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'rays', ray: 4, d: 1.2, height: 1.5 });
  expect(log.errors).toEqual([]);
});

test('plane-mirror-image: a tap on the view is not a turn of it; a move of the finger is', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'plane-mirror-image');
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

test('plane-mirror-image: after the last step the action offers the test; the quiet button plays the step again', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'plane-mirror-image');
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
  await fig.call('set', { step: 'length', animate: false }); // near the end: it's the last step that matters here
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
  ['act_image', true],
  ['act_bars', true],
  ['act_drag', true],
  ['act_measure', true],
  ['act_to_rays', false],
  ['act_head', true],
  ['act_feet', true],
  ['act_normal', true],
  ['act_extend', true],
  ['act_to_length', false],
  ['act_bottom', true],
  ['act_top', true],
  ['act_far', true],
  ['act_near', false],
  ['act_test', false],
]).map(([key, numbered]) => [STRINGS.bn[key].replace(/\{\w\}/g, '১'), numbered, key === 'act_test']);
for (const { width, height } of VIEWPORTS) {
  test(`plane-mirror-image: every action stays on one line at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const log = await preparePage(page);
    const fig = await openFigure(page, 'plane-mirror-image');
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

test('plane-mirror-image: a lower render resolution leaves the view where the student turned it', async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'plane-mirror-image');
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
