// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's story on one
// action in three parts, nothing running ahead of the student, the image on a phone, and a test answered all right and all wrong.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'concave-lens-image';
const settled = async (fig) => {
  for (let i = 0; i < 80; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the step never ended');
};
const actor = (fig) => async () => {
  await fig.frame.locator('.pvc-act').first().click();
  await settled(fig);
  return fig.call('get');
};

test(`${ID}: the start, চিত্র ৯.১৮ and ৯.১৯, on one action`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 600, height: 300 }); // every step really plays: few pixels
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const act = actor(fig);
  let st = await fig.call('get');
  // the first view is from the eye's side: the glass shows the pencil small
  expect(st).toMatchObject({ stage: 'see', u: 20, f: -15, frame: 'eye', throughLens: true, rays: 0, ghost: false });
  expect(st.m).toBeCloseTo(3 / 7, 4);
  await expect(fig.frame.locator('.lab-lead')).toContainText('ছোট দেখায়');
  st = await act();
  expect(st).toMatchObject({ stage: 'par', bundle: 'spread', frame: 'lens', throughLens: false });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('ছড়িয়ে পড়ল');
  st = await act();
  expect(st).toMatchObject({ stage: 'focus', bundle: 'spread' });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'ফোকাস দূরত্ব f = ১৫ cm' })).toHaveCount(1);
  st = await act();
  expect(st).toMatchObject({ stage: 'conv', bundle: 'converge' });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('অভিসারী রশ্মি');
  expect(log.errors).toEqual([]);
});

test(`${ID}: the three rays, the image and the eye, on one action`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const act = actor(fig);
  await fig.call('set', { stage: 'conv', animate: false });
  await fig.advance(600);
  let st = await act();
  expect(st).toMatchObject({ stage: 'r2', rays: 1, extended: 1, frame: 'rays' });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('প্রথম রশ্মি, বইয়ের নিয়ম (ii)');
  st = await act();
  expect(st).toMatchObject({ stage: 'r1', rays: 2 });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'X′' })).toHaveCount(1);
  st = await act();
  expect(st).toMatchObject({ stage: 'r3', rays: 3, extended: 2 });
  expect(st.miss).toBeLessThan(1e-6);
  st = await act();
  expect(st).toMatchObject({ stage: 'image', ghost: true });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'প্রতিবিম্ব (অবাস্তব)' })).toHaveCount(1);
  // from the far side the glass itself shows the image
  st = await act();
  expect(st).toMatchObject({ stage: 'eye', frame: 'eye', throughLens: true, rays: 0 });
  await expect(fig.frame.locator('.pvc-act')).toContainText('লেন্সের কাছে আনো');
  expect(log.errors).toEqual([]);
});

test(`${ID}: the row of distances, the graph, the table, and the test offered last`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const act = actor(fig);
  await fig.call('set', { stage: 'eye', animate: false });
  await fig.advance(600);
  await expect(fig.frame.locator('.lab-ex-cap')).toHaveText('পেনসিল (cm)');
  const seen = [];
  for (const u of [10, 15, 30, 60]) {
    const st = await act();
    expect(st).toMatchObject({ stage: 'cases', u });
    expect(-st.v).toBeLessThan(15); // never past F
    seen.push(st.m);
    await expect(fig.frame.locator('.pvc-outcome')).toContainText('m =');
  }
  expect(seen).toEqual([...seen].sort((a, b) => b - a)); // smaller and smaller
  let st = await act();
  expect(st.stage).toBe('graph');
  await expect(fig.frame.locator('.lab-graph svg')).toBeVisible();
  st = await act();
  expect(st.stage).toBe('table');
  await expect(fig.frame.locator('.lab-table tr')).toHaveCount(6);
  await expect(fig.frame.locator('.pvc-act')).toContainText('পরীক্ষা দাও');
  expect(st.mode).toBe('explore');
  // a word moves the pencil there; the quiet ⟲ goes back to the start
  await fig.frame.locator('[data-example="c1"]').click();
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'table', u: 15, v: -7.5, m: 0.5 });
  await fig.frame.locator('[data-act="home"]').click();
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'see', u: 20, frame: 'eye' });
  expect(log.errors).toEqual([]);
});

test(`${ID}: nothing runs ahead of the student`, async ({ page }) => {
  test.setTimeout(200_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { stage: 'r1', animate: false });
  await fig.advance(600);
  await fig.frame.locator('.pvc-act').first().click();
  // a second tap, and a word, while the step plays: ignored
  await fig.advance(600);
  await fig.frame.locator('.pvc-act').first().click({ force: true }); // disabled while the step plays
  await fig.frame.locator('[data-example="c2"]').click();
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'r3', busy: true });
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'r3', busy: false, rays: 3 });
  // finished: it waits, however long
  await fig.advance(6000);
  expect((await fig.call('get')).stage).toBe('r3');
  // the quiet ▶ plays the step again from where it began
  await fig.frame.locator('[data-act="replay"]').click();
  await fig.advance(300);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'r3', busy: true, rays: 2 });
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'r3', busy: false, rays: 3 });
  // arrow keys move the pencil (→ toward the lens)
  await fig.frame.locator('#app').press('ArrowRight');
  expect((await fig.call('get')).u).toBe(19);
  expect(log.errors).toEqual([]);
});

test(`${ID}: the image on a phone: big enough, or magnified`, async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 390, height: 700 });
  await preparePage(page);
  const fig = await openFigure(page, ID);
  for (const [stage, u] of [
    ['image', 20],
    ['cases', 10],
    ['cases', 30],
    ['cases', 60],
  ]) {
    await fig.call('set', { stage, u, animate: false });
    await fig.advance(900);
    const st = await fig.call('get');
    expect(st.imagePx >= 40 || st.magnifier, `${stage} ${u}: ${st.imagePx} px`).toBe(true);
  }
});

const answerAll = async (fig, right) => {
  for (let i = 0; i < 5; i++) {
    const st = await fig.call('get');
    const pick = right ? st.question.right : (st.question.right + 1) % 4;
    await fig.frame.locator('.pvc-opt').nth(pick).click();
    await fig.advance(2600);
    await fig.frame.locator('[data-act="q-next"]').first().click();
    await fig.advance(2600);
  }
};

test(`${ID}: the test, all right and all wrong`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('practice');
  await fig.advance(2500);
  await answerAll(fig, true);
  await expect(fig.frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ৫টি সঠিক');
  await fig.frame.locator('[data-act="q-again"]').first().click();
  await fig.advance(2500);
  await answerAll(fig, false);
  await expect(fig.frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ০টি সঠিক');
  // leaving the test gives back the learn view
  await fig.frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(2500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', locked: false });
  expect(log.errors).toEqual([]);
});
