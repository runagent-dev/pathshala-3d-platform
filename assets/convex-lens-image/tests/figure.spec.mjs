// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the story on one action,
// a screen moved until it is sharp, the book's cases, the উদাহরণ, the graph and the table, the test answered all right and all wrong.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'convex-lens-image';
const settled = async (fig) => {
  for (let i = 0; i < 160; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the step never ended');
};

test(`${ID}: the lens, the three rays and the screen, on one action`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const act = async () => {
    await fig.frame.locator('.pvc-act').first().click();
    await settled(fig);
    return fig.call('get');
  };
  let st = await fig.call('get');
  // the simplest picture first: the pencil at 2F, the lens and the inverted image, no rays
  expect(st).toMatchObject({ stage: 'start', u: 30, v: 30, m: 1, rays: 0, image: true, kind: 'real', inverted: true });
  st = await act();
  expect(st).toMatchObject({ stage: 'parallel', bundle: 'parallel', image: false });
  // the book's নিজে করো: a screen at F′ catches the far light's picture
  expect(st.screen).toMatchObject({ x: 15 });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('নিজে করো');
  st = await act();
  expect(st).toMatchObject({ stage: 'point', bundle: 'point' });
  st = await act();
  expect(st).toMatchObject({ stage: 'ray1', rays: 1, bundle: null });
  st = await act();
  expect(st).toMatchObject({ stage: 'ray2', rays: 2 });
  st = await act();
  expect(st).toMatchObject({ stage: 'ray3', rays: 3, rayMiss: 0 });
  st = await act();
  expect(st).toMatchObject({ stage: 'screen', frame: 'screen', image: false, found: false });
  expect(st.screen.sharp).toBe(false);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('ঝাপসা');
  st = await act(); // the action finds the place
  expect(st).toMatchObject({ found: true });
  expect(st.screen).toMatchObject({ x: 30, sharp: true });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('স্পষ্ট');
  expect(log.errors).toEqual([]);
});

test(`${ID}: the book's cases in its order, the উদাহরণ, the graph and the table`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const act = async () => {
    await fig.frame.locator('.pvc-act').first().click();
    await settled(fig);
    return fig.call('get');
  };
  await fig.call('set', { stage: 'screen', screen: 30, animate: false });
  await fig.advance(1500);
  let st = await act();
  expect(st).toMatchObject({ stage: 'cases', u: 9, v: -22.5, m: 2.5, zone: 'inside', kind: 'virtual', inverted: false, eye: true });
  expect(st.screen).toBeNull(); // nothing to catch: the paper has gone
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'অবাস্তব' })).toHaveCount(1);
  st = await act();
  expect(st).toMatchObject({ u: 22.5, v: 45, m: 2, zone: 'between', kind: 'real' });
  st = await act();
  expect(st).toMatchObject({ u: 30, v: 30, m: 1, zone: 'two' });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'বাস্তব · উল্টো · সমান' })).toHaveCount(1);
  st = await act();
  expect(st).toMatchObject({ u: 45, v: 22.5, m: 0.5, zone: 'far' });
  expect(st.screen).toMatchObject({ x: 22.5, sharp: true });
  // a small image gets the magnifier
  st = await act();
  expect(st).toMatchObject({ stage: 'swap', u: 22.5, v: 45, swap: { a: 45, b: 22.5 } });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('একটি অন্যটিতে');
  st = await act();
  expect(st).toMatchObject({ stage: 'graph' });
  await expect(fig.frame.locator('.lab-graph svg circle')).toHaveCount(2);
  st = await act();
  expect(st).toMatchObject({ stage: 'table' });
  await expect(fig.frame.locator('.lab-table tbody tr')).toHaveCount(6);
  await expect(fig.frame.locator('.lab-table tr.on td').first()).toHaveText('F ও 2F এর মাঝে');
  await fig.frame.locator('[data-example="c0"]').click();
  await settled(fig);
  await expect(fig.frame.locator('.lab-table tr.on td').first()).toHaveText('F এর ভেতরে');
  expect((await fig.call('get')).u).toBe(9);
  // the test is offered only now; the reset goes back to the beginning
  await expect(fig.frame.locator('.pvc-act').first()).toContainText('পরীক্ষা দাও');
  await fig.frame.locator('[data-act="home"]').first().click();
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'start', u: 30, rays: 0, found: false });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the keys move the screen until it is sharp, and the pencil afterwards`, async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID, { params: { stage: 'screen' } });
  let st = await fig.call('get');
  expect(st.screen.x).toBe(42);
  expect(st.grips).toEqual({ pencil: false, screen: true });
  await fig.frame.locator('.pvc').first().focus();
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowLeft');
  st = await fig.call('get');
  expect(st.screen).toMatchObject({ x: 30, sharp: true });
  expect(st.found).toBe(true);
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowLeft');
  await fig.advance(200);
  expect((await fig.call('get')).screen.sharp).toBe(false);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('ঝাপসা');
  // later the arrows move the pencil: → toward the lens
  await fig.call('set', { stage: 'cases', u: 40, animate: false });
  await fig.frame.locator('.pvc').first().focus();
  await page.keyboard.press('ArrowRight');
  st = await fig.call('get');
  expect(st).toMatchObject({ u: 39 });
  expect(st.formulaError).toBeCloseTo(0, 6);
  expect(st.rayMiss).toBe(0);
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test, all right and all wrong, and what it leaves behind`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID, { params: { stage: 'cases', u: '22.5' } });
  const answerAll = async (pick) => {
    for (let i = 0; i < 5; i++) {
      await fig.advance(900);
      const { question } = await fig.call('get');
      expect(question).not.toBeNull();
      await fig.frame.locator(`.pvc-opt[data-q="${pick(question.right)}"]`).click();
      await fig.advance(500);
      await settled(fig);
      await expect(fig.frame.locator('.pvc-q-feedback')).not.toBeEmpty();
      await fig.frame.locator('[data-act="q-next"]').click();
    }
    await fig.advance(600);
  };
  await fig.frame.locator('[data-mode="quiz"]').first().click();
  await answerAll((right) => right);
  await expect(fig.frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ৫টি সঠিক');
  await fig.frame.locator('[data-act="q-again"]').first().click();
  await answerAll((right) => (right + 1) % 4);
  await expect(fig.frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ০টি সঠিক');
  await fig.frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(600);
  const st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'cases', u: 22.5, v: 45, mode: 'explore', locked: false, question: null });
  expect(log.errors).toEqual([]);
});

test(`${ID}: a tap on the view is not a turn of it; a move of the finger is`, async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
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

test(`${ID}: the উদাহরণ from 2F uses the book's pair, keeps both places in view, and no panel scrolls`, async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID, { params: { stage: 'cases', u: '30' } });
  await fig.call('set', { stage: 'swap' });
  await settled(fig);
  const st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'swap', u: 22.5, v: 45, swap: { a: 45, b: 22.5 } });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'আগে পেনসিল' })).toHaveCount(1);
  const fits = () => fig.frame.locator('.pvc-panel').evaluate((p) => p.scrollHeight - p.clientHeight);
  expect(await fits()).toBeLessThanOrEqual(1);
  for (const stage of ['graph', 'table', 'parallel']) {
    await fig.call('set', { stage, u: 4, animate: false });
    await fig.advance(800);
    expect(await fits(), stage).toBeLessThanOrEqual(1);
  }
  await fig.call('set', { stage: 'cases', u: 45, animate: false });
  await fig.advance(800);
  expect((await fig.call('get')).magnifier).toBe(true);
  expect(log.errors).toEqual([]);
});
