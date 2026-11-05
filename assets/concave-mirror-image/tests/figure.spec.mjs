// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the story on one action,
// a screen dragged until it is sharp, the book's cases, leaving the test, and a test answered all right and all wrong.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'concave-mirror-image';
const settled = async (fig) => {
  for (let i = 0; i < 120; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the step never ended');
};

test(`${ID}: the whole story on one action`, async ({ page }) => {
  test.setTimeout(420_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const act = async () => {
    await fig.frame.locator('.pvc-act').first().click();
    await settled(fig);
    return fig.call('get');
  };
  let st = await fig.call('get');
  // the simplest picture first: the pencil, the mirror and the image, no rays
  expect(st).toMatchObject({ stage: 'start', u: 40, v: 24, m: 0.6, rays: 0, image: true, kind: 'real', inverted: true });

  st = await act();
  expect(st).toMatchObject({ stage: 'points', rays: 0 });
  st = await act();
  expect(st).toMatchObject({ stage: 'ray1', rays: 1 });
  st = await act();
  expect(st).toMatchObject({ stage: 'ray2', rays: 2, second: 'focus' });
  st = await act();
  expect(st).toMatchObject({ stage: 'screen', frame: 'screen', image: false, found: false });
  expect(st.screen.sharp).toBe(false);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('ঝাপসা');
  st = await act(); // the action finds the place
  expect(st).toMatchObject({ found: true });
  expect(st.screen).toMatchObject({ x: 24, sharp: true });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('স্পষ্ট');

  // the book's cases, one tap each
  st = await act();
  expect(st).toMatchObject({ stage: 'cases', u: 30, v: 30, m: 1, zone: 'o' });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'বাস্তব · উল্টো · সমান' })).toHaveCount(1);
  st = await act();
  expect(st).toMatchObject({ u: 22.5, v: 45, m: 2, zone: 'between', second: 'pole' });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('P বিন্দুতে');
  st = await act();
  expect(st).toMatchObject({ u: 15, v: null, m: null, zone: 'focus', kind: 'none' });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('কোনো প্রতিবিম্ব নেই');
  st = await act();
  expect(st).toMatchObject({ u: 10, v: -30, m: 3, zone: 'inside', kind: 'virtual', inverted: false, second: 'radial' });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'অবাস্তব · সোজা · বড়' })).toHaveCount(1);
  expect(st.screen).toBeNull(); // nothing to catch: the paper has gone

  // the formula and the table only at the end
  st = await act();
  expect(st).toMatchObject({ stage: 'formula' });
  await expect(fig.frame.locator('.pvc-rule .pvc-formula')).toHaveCount(2);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('−৩০');
  st = await act();
  expect(st).toMatchObject({ stage: 'table' });
  await expect(fig.frame.locator('.lab-table tbody tr')).toHaveCount(7);
  await expect(fig.frame.locator('.lab-table tr.on')).toContainText('F ও P এর মাঝে');
  // a word moves the pencil, and the table's row follows
  await fig.frame.locator('[data-example="c1"]').click();
  await settled(fig);
  await expect(fig.frame.locator('.lab-table tr.on td').first()).toHaveText('O তে');

  // the test is offered only now, and the reset goes back to the beginning
  await expect(fig.frame.locator('.pvc-act').first()).toContainText('পরীক্ষা দাও');
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(900);
  st = await fig.call('get');
  expect(st).toMatchObject({ mode: 'quiz' });
  await fig.frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(600);
  await fig.frame.locator('[data-act="home"]').first().click();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'start', u: 40, rays: 0, found: false });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the keys move the screen until it is sharp, and the pencil afterwards`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID, { params: { stage: 'screen' } });
  let st = await fig.call('get');
  expect(st.screen.x).toBe(32);
  expect(st.grips).toEqual({ pencil: false, screen: true });
  await fig.frame.locator('.pvc').first().focus();
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowLeft');
  st = await fig.call('get');
  expect(st.screen).toMatchObject({ x: 24, sharp: true });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('স্পষ্ট');
  expect(st.found).toBe(true);
  // past it, a blur again: the panel says so
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowLeft');
  await fig.advance(200);
  st = await fig.call('get');
  expect(st.screen.sharp).toBe(false);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('ঝাপসা');

  await fig.call('set', { stage: 'cases', u: 40, animate: false });
  await fig.frame.locator('.pvc').first().focus();
  await page.keyboard.press('ArrowLeft');
  st = await fig.call('get');
  expect(st).toMatchObject({ u: 39 });
  expect(st.formulaError).toBeCloseTo(0, 6);
  expect(log.errors).toEqual([]);
});

test(`${ID}: a step that plays is not cut short, nothing is queued, and a finished step can be seen again`, async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID, { params: { stage: 'ray1' } });
  // two quick words: the first plays to its end, the second is ignored
  await fig.frame.locator('[data-example="c2"]').click();
  await fig.advance(300);
  await fig.frame.locator('[data-example="c1"]').click();
  await settled(fig);
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'cases', u: 22.5, rays: 2, image: true });
  expect(st.screen).not.toBeNull();
  // the same during a pencil's move, and during the hold on its result
  await fig.frame.locator('[data-example="c4"]').click();
  await fig.advance(200);
  await fig.frame.locator('[data-example="c1"]').click();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'cases', u: 10, rays: 2, image: true, kind: 'virtual' });
  expect(st.grips.pencil).toBe(true);
  // the word of the case replays its move, and the pencil ends where it was
  await fig.frame.locator('[data-example="c4"]').click();
  await fig.advance(600);
  expect((await fig.call('get')).busy).toBe(true);
  await settled(fig);
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ u: 10, busy: false });
  // the test started in the middle of a run leaves a whole scene behind it
  await fig.frame.locator('[data-example="c2"]').click();
  await fig.advance(200);
  await fig.frame.locator('[data-mode="quiz"]').first().click();
  await fig.advance(900);
  expect((await fig.call('get')).grips).toEqual({ pencil: false, screen: false });
  await fig.frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(600);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'cases', rays: 2, image: true });
  // a story step plays again from the picture before it, and waits
  await fig.call('set', { stage: 'ray1', animate: false });
  await fig.frame.locator('[data-act="replay"]').first().click();
  await fig.advance(400);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'ray1', busy: true, rays: 0 });
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'ray1', rays: 1, busy: false });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test, right and wrong, and what it leaves behind`, async ({ page }) => {
  test.setTimeout(420_000);
  await page.setViewportSize({ width: 800, height: 500 });
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
