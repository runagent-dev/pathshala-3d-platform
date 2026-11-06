// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's
// sequence (white, red, green), what leaves each object in each light, the pixels of the 3D view, and the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { VIEWPORTS } from '../../../test/figures/figures.mjs';
import { STRINGS } from '../src/i18n.js';

/** Average colour of a small box of a captured picture. */
function sample(page, src, spots) {
  return page.evaluate(
    async ({ src, spots }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      return spots.map(([x, y]) => {
        const d = g.getImageData(Math.round(x * img.width) - 3, Math.round(y * img.height) - 3, 7, 7).data;
        const sum = [0, 0, 0];
        for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) sum[k] += d[i + k];
        return sum.map((v) => v / (d.length / 4));
      });
    },
    { src, spots },
  );
}

test('colour-of-objects: the book in order, on one action', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 600, height: 300 }); // every step really plays: few pixels, so that CI stays inside its limit
  const log = await preparePage(page);
  const fig = await openFigure(page, 'colour-of-objects');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  const settled = async () => {
    for (let i = 0; i < 60; i++) {
      await fig.advance(300);
      if (!(await fig.call('get')).busy) return fig.advance(1200);
    }
    throw new Error('the story never ended');
  };
  const labels = () =>
    fig.frame.locator('.pvc-anno').evaluateAll((all) => all.filter((a) => getComputedStyle(a).visibility !== 'hidden').map((a) => a.textContent));
  expect(await fig.call('get')).toMatchObject({ light: 'white', rays: false, toEye: ['red', 'green'] });

  // white light: every colour comes in, only red leaves the petal and only green the leaf
  // the camera tells it: close on the petal, close on the leaf, then the whole idea
  await act();
  await fig.advance(3000);
  expect((await fig.call('get')).frame).toBe('rose');
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'শোষণ' }).first()).toBeVisible();
  await fig.advance(3000);
  expect((await fig.call('get')).frame).toBe('leaf');
  await settled();
  let st = await fig.call('get');
  expect(st).toMatchObject({ light: 'white', rays: true, busy: false, frame: 'both' });
  expect(st.band).toEqual(['violet', 'blue', 'green', 'yellow', 'orange', 'red']);
  expect(st.rose).toMatchObject({ looks: 'red', reflected: ['red'], arrow: true });
  expect(st.rose.absorbed).toEqual(['violet', 'blue', 'green', 'yellow', 'orange']);
  expect(st.leaf).toMatchObject({ looks: 'green', reflected: ['green'], arrow: true });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('শোষণ');
  expect((await labels()).sort()).toEqual(['প্রতিফলন: লাল', 'প্রতিফলন: সবুজ', 'শোষণ', 'শোষণ', 'সাদা (সব রং)'].sort());

  // red light: one band; the leaf gives nothing back
  await act();
  await settled();
  st = await fig.call('get');
  expect(st).toMatchObject({ light: 'red', band: ['red'], toEye: ['red'] });
  expect(st.rose).toMatchObject({ looks: 'red', arrow: true });
  expect(st.leaf).toMatchObject({ looks: 'black', reflected: [], arrow: false });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('কালো');
  // the rose absorbs nothing here, so only the leaf says শোষণ
  expect((await labels()).sort()).toEqual(['কালো দেখায়', 'প্রতিফলন: লাল', 'লাল আলো', 'শোষণ'].sort());

  // green light: now the rose
  await act();
  await settled();
  st = await fig.call('get');
  expect(st).toMatchObject({ light: 'green', band: ['green'], toEye: ['green'] });
  expect(st.rose).toMatchObject({ looks: 'black', reflected: [], arrow: false });
  expect(st.leaf).toMatchObject({ looks: 'green', arrow: true });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('কুচকুচে কালো');
  expect((await labels()).sort()).toEqual(['কালো দেখায়', 'প্রতিফলন: সবুজ', 'শোষণ', 'সবুজ আলো'].sort());

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ light: 'white', rays: false, mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('colour-of-objects: the 3D view really turns the rose and the leaf black, and the band is in a capture', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'colour-of-objects');
  await fig.advance(300);
  // the outer petals and the blade of the main leaf (no band over them with rays off), wherever the camera has them
  const { marks } = await fig.call('get');
  const at = { bloom: marks.rose, leaf: marks.leaf };
  const shot = async (light, rays = false) => {
    await fig.call('set', { light, rays, animate: false });
    await fig.advance(200);
    return fig.call('capture', { width: 844, height: 390 });
  };
  const [roseW, leafW] = await sample(page, await shot('white'), [at.bloom, at.leaf]);
  expect(roseW[0]).toBeGreaterThan(90);
  expect(roseW[1]).toBeLessThan(50);
  expect(leafW[1]).toBeGreaterThan(50);
  expect(leafW[0]).toBeLessThan(45);
  const [roseG, leafG] = await sample(page, await shot('green'), [at.bloom, at.leaf]);
  expect(Math.max(...roseG)).toBeLessThan(48); // black: nothing leaves it
  expect(leafG[1]).toBeGreaterThan(50);
  const [roseR, leafR] = await sample(page, await shot('red'), [at.bloom, at.leaf]);
  expect(roseR[0]).toBeGreaterThan(90);
  expect(Math.max(...leafR)).toBeLessThan(48);
  // a capture carries the drawing: the arrows' red is in the picture, not only on the screen
  const png = await shot('white', true);
  const red = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, 60).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 90 && d[i + 2] < 90) n++;
    return n;
  }, png);
  expect(red).toBeGreaterThan(40);
  expect(log.errors).toEqual([]);
});

test('colour-of-objects: the words choose the light, and the test gives back the learn view', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'colour-of-objects');
  const settled = async () => {
    for (let i = 0; i < 60; i++) {
      await fig.advance(300);
      if (!(await fig.call('get')).busy) return fig.advance(1200);
    }
    throw new Error('the story never ended');
  };
  await fig.frame.locator('[data-example="green"]').click();
  await settled();
  expect(await fig.call('get')).toMatchObject({ light: 'green', rays: true, frame: 'both' });
  // a change half way: the last one wins, and nothing is left over from the first
  await fig.frame.locator('[data-example="red"]').click();
  await fig.advance(300);
  await fig.frame.locator('[data-example="white"]').click();
  await settled();
  const st = await fig.call('get');
  expect(st).toMatchObject({ light: 'white', busy: false });
  expect(st.band.length).toBe(6);
  await fig.frame.locator('.pvc').first().press('ArrowRight');
  await settled();
  expect((await fig.call('get')).light).toBe('red');

  await fig.call('practice');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ mode: 'quiz', locked: true });
  for (let i = 0; i < 5; i++) {
    await fig.advance(900);
    await fig.frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(300);
    expect(['ok', 'bad']).toContain(await fig.frame.locator('.pvc-q-feedback').getAttribute('data-tone'));
    await settled();
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(900);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(900);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', light: 'red', rays: true, busy: false, locked: false, frame: 'both' });
  expect(log.errors).toEqual([]);
});

test('colour-of-objects: a tap on the view is not a turn of it; a move of the finger is', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'colour-of-objects');
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

test('colour-of-objects: after the last step the action offers the test; the quiet button plays the step again', async ({ page }) => {
  test.setTimeout(280_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'colour-of-objects');
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
  ['act_show', true],
  ['act_red', true],
  ['act_green', true],
  ['act_white', false],
  ['act_test', false],
]).map(([key, numbered]) => [STRINGS.bn[key].replace(/\{\w\}/g, '১'), numbered, key === 'act_test']);
for (const { width, height } of VIEWPORTS) {
  test(`colour-of-objects: every action stays on one line at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const log = await preparePage(page);
    const fig = await openFigure(page, 'colour-of-objects');
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

test('colour-of-objects: a lower render resolution leaves the view where the student turned it', async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'colour-of-objects');
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
