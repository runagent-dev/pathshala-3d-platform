// This figure's own behaviour, through the bridge (dev only, never packaged): the first screen is calm; one tap lights
// the ray at 30° (θ₁ = 48.6°); the book's three cases; turning the source by keys; water on top (θc = 62.5°); the
// prism; and the test, answered all right, scores 5 of 5 (the quiz scores numbers, so the choices are indices).
// Steps are jumped with animate: false so each test stays short under software rendering.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { createI18n } from '../src/i18n.js';

const ID = 'total-internal-reflection';
const frameOf = (page) => page.frames().find((f) => f.url().includes(`/assets/${ID}/`));

test(`${ID}: one tap lights the ray; the three cases; water; the prism`, async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ step: 'intro', light: false, next: 'less', thetaC: 41.8 });
  expect(await frame.locator('[data-example]').count()).toBe(5);
  expect(await frame.locator('.tir-lead.pvc-note').count()).toBe(1);

  // one tap: the normal, the ray in, the rays out, the angles
  await frame.locator('.pvc-act').click();
  await fig.advance(4600);
  expect(await fig.call('get')).toMatchObject({ step: 'less', busy: false, light: true, theta2: 30, theta1: 48.6, case: 'less', outside: 'air' });
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('অভিলম্ব থেকে দূরে সরে যায়');

  expect(await fig.call('set', { step: 'critical', animate: false })).toMatchObject({ theta2: 41.8, theta1: 90, case: 'critical', reflected: 1 });
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('ক্রান্তি কোণ বা সংকট কোণ');
  expect(await fig.call('set', { step: 'more', animate: false })).toMatchObject({ theta2: 60, theta1: null, case: 'more', reflected: 1 });
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('পূর্ণ অভ্যন্তরীণ প্রতিফলন');

  // the book's water example: θc grows, so at 45° light leaves
  expect(await fig.call('set', { step: 'water', animate: false })).toMatchObject({
    outside: 'water',
    thetaC: 62.5,
    theta2: 45,
    theta1: 52.9,
    case: 'less',
  });
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('পূর্ণ অভ্যন্তরীণ প্রতিফলন হবে না');

  // the prism (চিত্র ৯.০৭)
  expect(await fig.call('set', { step: 'prism', animate: false })).toMatchObject({ step: 'prism', case: 'prism', outside: 'air', next: 'quiz' });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the source turns by keys and stops on θc; the panel follows the light`, async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = frameOf(page);
  await fig.call('set', { step: 'less', animate: false });
  expect(await fig.call('set', { theta: 40 })).toMatchObject({ theta2: 40, case: 'less' });
  await frame.locator('.pvc').first().press('ArrowRight');
  expect(await fig.call('get')).toMatchObject({ theta2: 41 });
  await frame.locator('.pvc').first().press('ArrowRight');
  expect(await fig.call('get')).toMatchObject({ theta2: 41.8, theta1: 90, case: 'critical' });
  await frame.locator('.pvc').first().press('ArrowRight');
  expect(await fig.call('get')).toMatchObject({ theta2: 42, theta1: null, case: 'more' });
  await fig.advance(300);
  // the rule follows the light, not the step word: past θc it names total internal reflection
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('পূর্ণ অভ্যন্তরীণ প্রতিফলন');
  // under water the same angle refracts
  await fig.call('set', { step: 'water', animate: false });
  expect(await fig.call('set', { theta: 62.2 })).toMatchObject({ theta2: 62.5, case: 'critical' });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test, answered all right, scores five of five`, async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const frame = frameOf(page);
  const t = createI18n('bn');
  const plain = (html) =>
    html
      .replace(/<[^>]+>/g, '')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&nbsp;/g, ' ')
      .trim();
  const kinds = ['away', 'crit', 'tir', 'water', 'prism'];
  const right = Object.fromEntries(kinds.map((k) => [plain(t(`q_${k}`)), plain(t(`c_${k}_right`))]));
  await fig.call('practice');
  for (let i = 0; i < kinds.length; i++) {
    await fig.advance(800);
    const q = (await frame.locator('.pvc-q-text').textContent()).trim();
    const answer = right[q];
    expect(answer, `question ${i + 1}: ${q}`).toBeTruthy();
    const options = frame.locator('[data-q]');
    const n = await options.count();
    let clicked = false;
    for (let j = 0; j < n; j++) {
      if ((await options.nth(j).textContent()).trim() === answer) {
        await options.nth(j).click();
        clicked = true;
        break;
      }
    }
    expect(clicked, `the right answer is offered for ${q}`).toBe(true);
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  expect(await frame.locator('.pvc-quiz').textContent()).toContain(t('q_result', { right: 5, total: 5 }));
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'intro' });
  expect(log.errors).toEqual([]);
});
