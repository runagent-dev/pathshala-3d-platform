// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// book's story on one action, the rod's drag, charges that stay in the end, and a test answered all right.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'electrostatic-induction';
const settled = async (fig) => {
  for (let i = 0; i < 120; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the step never ended');
};

test(`${ID}: one sphere: neutral at the start, electrons move, the total stays zero`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'intro', moved: 0, charge: { sphere1: 0, sphere2: 0 }, next: 'near' });
  await fig.frame.locator('.pvc-act').first().click();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ step: 'near', moved: 8, charge: { sphere1: 0, sphere2: 0 }, next: 'pair' });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('বৈদ্যুতিক আবেশ');
  // the rod taken away: they go back
  await fig.call('set', { gap: 11, animate: false });
  expect(await fig.call('get')).toMatchObject({ moved: 0 });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('ছড়িয়ে আছে');
  await fig.call('set', { gap: 5, animate: false });
  expect((await fig.call('get')).moved).toBeGreaterThan(0);
  expect(log.errors).toEqual([]);
});

test(`${ID}: two spheres: electrons cross where they touch, and the charges stay after they part`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { step: 'near', animate: false });
  await fig.frame.locator('.pvc-act').first().click();
  await settled(fig);
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'pair', touching: true, charge: { sphere1: -8, sphere2: 8 }, rod: true });
  await fig.frame.locator('.pvc-act').first().click();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ step: 'apart', touching: false, charge: { sphere1: -8, sphere2: 8 }, rod: false, next: 'comb' });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('ভিন্ন চার্জ আবেশিত');
  expect(log.errors).toEqual([]);
});

test(`${ID}: a landing on any step puts the electrons on the right sphere`, async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const neutral = { sphere1: 0, sphere2: 0 };
  const split = { sphere1: -8, sphere2: 8 };
  await fig.call('set', { step: 'apart', animate: false }); // straight from the first screen, nothing played
  expect(await fig.call('get')).toMatchObject({ step: 'apart', charge: split, moved: 8 });
  await fig.call('set', { step: 'comb', animate: false });
  expect((await fig.call('get')).charge).toEqual(split);
  await fig.call('set', { step: 'near', animate: false }); // back: sphere 2 gets its electrons back
  expect(await fig.call('get')).toMatchObject({ step: 'near', charge: neutral, moved: 8 });
  await fig.call('set', { step: 'pair', animate: false });
  expect((await fig.call('get')).charge).toEqual(split);
  await fig.call('set', { step: 'near', animate: false });
  expect((await fig.call('get')).charge).toEqual(neutral);
  await fig.call('set', { step: 'intro', animate: false });
  expect(await fig.call('get')).toMatchObject({ moved: 0, charge: neutral });
  // the test's scenes, then back to learning from the step the student left
  await fig.call('practice');
  await fig.advance(900);
  await fig.frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(600);
  await fig.call('set', { step: 'near', animate: false });
  expect((await fig.call('get')).charge).toEqual(neutral);
  expect(log.errors).toEqual([]);
});

for (const step of ['apart', 'comb']) {
  test(`${ID}: opened at ?step=${step} the spheres are charged, opposite`, async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 300 });
    const log = await preparePage(page);
    const fig = await openFigure(page, ID, { params: { step } });
    expect(await fig.call('get')).toMatchObject({ step, charge: { sphere1: -8, sphere2: 8 }, busy: false });
    expect(log.errors).toEqual([]);
  });
}

test(`${ID}: the comb plays to the end and leads to the test; nothing runs ahead of the student`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { step: 'apart', animate: false });
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(300);
  expect(await fig.call('get')).toMatchObject({ step: 'comb', busy: true });
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ step: 'comb', comb: 1, busy: false, next: 'quiz' });
  await fig.advance(2000);
  expect((await fig.call('get')).mode).toBe('explore');
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(600);
  expect((await fig.call('get')).mode).toBe('quiz');
  expect(log.errors).toEqual([]);
});

test(`${ID}: a drag of the rod changes how many electrons move; the arrow keys do too`, async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const box = await fig.frame.locator('.pvc-dh').first().boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y + 2, { steps: 4 });
  await page.mouse.move(x + 90, y + 3, { steps: 4 });
  await page.mouse.up();
  await fig.advance(800);
  const st = await fig.call('get');
  expect(st.step).toBe('near');
  expect(st.moved).toBeGreaterThan(0);
  await fig.frame.locator('.pvc').first().focus();
  await page.keyboard.press('ArrowLeft');
  await fig.advance(300);
  expect((await fig.call('get')).gap).toBeGreaterThan(st.gap);
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test, every answer right, and the score says so`, async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const right = { sign: 'নেগেটিভ চার্জ', moves: 'ইলেকট্রন (নেগেটিভ)', apart: 'পজিটিভ চার্জ', paper: 'পজিটিভ চার্জ', fly: 'চিরুনি থেকে নেগেটিভ চার্জ পেয়ে' };
  const events = [];
  await fig.call('practice');
  await fig.advance(900);
  for (const kind of ['sign', 'moves', 'apart', 'paper', 'fly']) {
    await fig.frame
      .locator('.pvc-opt', { hasText: new RegExp(`^${right[kind].replace(/[()]/g, '\\$&')}$`) })
      .first()
      .click();
    await fig.advance(500);
    await expect(fig.frame.locator('.pvc-q-feedback')).toContainText('ঠিক হয়েছে');
    events.push(kind);
    await fig.frame.locator('[data-act="q-next"]').first().click();
    await fig.advance(900);
  }
  await expect(fig.frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ৫টি সঠিক');
  expect(log.errors).toEqual([]);
});
