// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// first screen is calm; one tap flies into the nucleus (18 protons, 22 neutrons); the electrons fill 2, 8, 8 and the
// atom is neutral; taking outer electrons away leaves +1, +2 (a tap on an inner one takes nothing); chlorine with one
// electron more is −1; no "{…}" is ever left on screen; the test answered all right scores five of five, all wrong
// none. Steps are jumped with animate: false so each test stays short under software rendering.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'charge-atom';
const frameOf = (page) => page.frames().find((f) => f.url().includes(`/assets/${ID}/`));
/** No placeholder left anywhere in the figure's text. */
const noPlaceholders = async (frame) => expect(await frame.locator('body').innerText()).not.toMatch(/\{\w+\}/);

test(`${ID}: the nucleus, the shells 2-8-8, fewer electrons +, more electrons −`, async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ step: 'intro', atom: 'ar', protons: 18, neutrons: 22, electrons: 18, net: 0, next: 'nucleus' });
  expect(await frame.locator('[data-example]').count()).toBe(4);
  expect(await frame.locator('.ca-lead.pvc-note').count()).toBe(1);
  await noPlaceholders(frame);

  // one tap: the camera flies into the nucleus
  await frame.locator('.pvc-act').click();
  await fig.advance(2600);
  expect(await fig.call('get')).toMatchObject({ step: 'nucleus', busy: false, next: 'shells' });
  await expect(frame.locator('.pvc-rule b').first()).toHaveText('ধনাত্মক বা পজিটিভ');
  await noPlaceholders(frame);

  // the electrons fill one orbit before the next: 2, 8, 8; as many as the protons: neutral
  const shells = await fig.call('set', { step: 'shells', animate: false });
  expect(shells).toMatchObject({ electrons: 18, shells: [2, 8, 8], net: 0, charge: 0 });
  await expect(frame.locator('.pvc-rule b').first()).toHaveText('বিদ্যুৎ নিরপেক্ষ বা নিস্তড়িৎ');
  await noPlaceholders(frame);

  // one outer electron taken away: one positive charge; two: two
  const less = await fig.call('set', { step: 'less', animate: false });
  expect(less).toMatchObject({ removed: 1, electrons: 17, shells: [2, 8, 7], net: 1 });
  expect(less.charge).toBeCloseTo(1.6e-19, 25);
  expect(await fig.call('set', { removed: 2, animate: false })).toMatchObject({ removed: 2, electrons: 16, net: 2 });
  await expect(frame.locator('.pvc-outcome')).toContainText('+২');
  await noPlaceholders(frame);

  // the arrow key takes one more away (it flies out)
  await fig.call('set', { removed: 1, animate: false });
  await frame.locator('.pvc').first().press('ArrowUp');
  await fig.advance(2400);
  expect(await fig.call('get')).toMatchObject({ removed: 2, net: 2 });

  // chlorine (2-8-7) and one stray electron: −1; without it, neutral
  const more = await fig.call('set', { step: 'more', animate: false });
  expect(more).toMatchObject({ atom: 'cl', protons: 17, neutrons: 18, electrons: 18, shells: [2, 8, 8], net: -1, joined: true });
  expect(more.charge).toBeCloseTo(-1.6e-19, 25);
  expect(await fig.call('set', { joined: false, animate: false })).toMatchObject({ electrons: 17, net: 0, joined: false });
  await noPlaceholders(frame);

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', atom: 'ar', net: 0, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test answered all right scores five of five, all wrong none; leaving it restores the learn state`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = frameOf(page);
  await fig.call('set', { step: 'shells', animate: false });
  const answerAll = async (pick) => {
    for (let i = 0; i < 5; i++) {
      await fig.advance(800);
      const { question } = await fig.call('get');
      expect(question?.right).not.toBeNull();
      await noPlaceholders(frame);
      await frame.locator(`.pvc-opt[data-q="${pick(question.right)}"]`).click();
      await fig.advance(300);
      await expect(frame.locator('.pvc-q-feedback')).not.toBeEmpty();
      await noPlaceholders(frame);
      await frame.locator('[data-act="q-next"]').click();
    }
    await fig.advance(600);
  };
  await fig.call('practice');
  await answerAll((right) => right);
  await expect(frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ৫টি সঠিক');
  await frame.locator('[data-act="q-again"]').first().click();
  await answerAll((right) => (right + 1) % 4);
  await expect(frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ০টি সঠিক');
  await frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'shells', net: 0, question: null });
  expect(log.errors).toEqual([]);
});
