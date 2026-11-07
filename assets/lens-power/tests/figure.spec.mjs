// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the calm first card;
// the action plays the first step (the beams meet at F′, 40 cm: the book's glasses); every scene lands with the right lens, power,
// image and graph dots; a lens is lifted out and another set in by the action; the test, answered all right, scores five (the kit
// scores by index) with no {placeholder} left. Scenes are jumped with animate: false so each test stays short under software rendering.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'lens-power';

test(`${ID}: the first step is played; every scene shows the book's lens, power and image`, async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  expect(await fig.call('get')).toMatchObject({ scene: 'intro', lens: 'plus40', power: null, busy: false, next: 'focus' });
  expect(await fig.frame.locator('[data-example]').count()).toBe(5);
  expect(await fig.frame.locator('.lp-lead.pvc-note').count()).toBe(1);

  // ① the light: played step by step on the virtual clock
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ scene: 'focus', busy: true });
  await fig.advance(9000);
  expect(await fig.call('get')).toMatchObject({ scene: 'focus', busy: false, f: 40, next: 'pencil' });
  await expect(fig.frame.locator('.pvc-outcome b')).toHaveText('৪০ cm');
  await expect(fig.frame.locator('.pvc-rule b:visible')).toHaveText('ফোকাস দূরত্ব');

  // চিত্র ৯.২৭: the same pencil, two lenses
  let st = await fig.call('set', { scene: 'pencil', animate: false });
  expect(st).toMatchObject({ lens: 'plus40', image: { kind: 'virtual', m: 1.43 } });
  st = await fig.call('set', { scene: 'compare', animate: false });
  expect(st).toMatchObject({ lens: 'plus20', f: 20, image: { kind: 'virtual', m: 2.5 } });

  // the power: the book's glasses first (f = 0.4 m, +2.5), then +5 and +10; the graph's dots
  st = await fig.call('set', { scene: 'power', animate: false });
  expect(st).toMatchObject({ lens: 'plus40', power: 2.5, dots: ['plus40'], image: null });
  await expect(fig.frame.locator('.pvc-outcome b')).toHaveText('+২.৫ ডায়াপটার');
  await expect(fig.frame.locator('.pvc-rule')).toContainText('বইয়ের উদাহরণের চশমা');
  st = await fig.call('set', { scene: 'power20', animate: false });
  expect(st).toMatchObject({ lens: 'plus20', power: 5, dots: ['plus40', 'plus20'] });
  await expect(fig.frame.locator('.pvc-outcome b')).toHaveText('+৫ ডায়াপটার');
  expect(await fig.call('set', { scene: 'power10', animate: false })).toMatchObject({ lens: 'plus10', f: 10, power: 10 });
  expect(await fig.call('set', { scene: 'concave', animate: false })).toMatchObject({ lens: 'minus40', kind: 'concave', power: -2.5 });
  // the concave lens's f is negative in the reading: f = −0.4 m, P = 1/f = −2.5
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('f = −০.৪ m');
  st = await fig.call('set', { scene: 'concave20', animate: false });
  expect(st).toMatchObject({ lens: 'minus20', power: -5, next: 'quiz' });
  expect(st.dots).toHaveLength(5);
  await expect(fig.frame.locator('.pvc-outcome b')).toHaveText('−৫ ডায়াপটার');

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ scene: 'intro', lens: 'plus40', view: 'front', mode: 'explore', dots: [] });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the action lifts a lens out and sets the next one in; a step word and the replay work`, async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { scene: 'compare', animate: false });
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ scene: 'power', busy: true });
  await fig.advance(9000);
  expect(await fig.call('get')).toMatchObject({ scene: 'power', busy: false, lens: 'plus40', power: 2.5 });
  // a key press while it plays is ignored, not queued (the button is disabled meanwhile)
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(300);
  expect(await fig.frame.locator('.pvc-act').isDisabled()).toBe(true);
  await fig.frame.locator('.lp').press('ArrowRight');
  await fig.advance(9000);
  expect(await fig.call('get')).toMatchObject({ scene: 'power20', busy: false, lens: 'plus20', power: 5 });
  // the word of a step goes to its first scene; the replay plays the scene again
  await fig.frame.locator('[data-example="concave"]').click();
  await fig.advance(10000);
  expect(await fig.call('get')).toMatchObject({ scene: 'concave', busy: false, lens: 'minus40' });
  await fig.frame.locator('[data-act="replay"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ scene: 'concave', busy: true });
  await fig.advance(10000);
  expect(await fig.call('get')).toMatchObject({ scene: 'concave', busy: false, power: -2.5 });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test, answered all right, scores five`, async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('practice');
  const kinds = new Set();
  for (let i = 0; i < 5; i++) {
    await fig.advance(900);
    const st = await fig.call('get');
    expect(st.question).not.toBeNull();
    kinds.add(st.question.kind);
    expect(await fig.frame.locator('.pvc-quiz').innerText()).not.toContain('{');
    await fig.frame.locator(`[data-q="${st.question.right}"]`).first().click();
    await fig.advance(4000);
    expect(await fig.frame.locator('.pvc-quiz').innerText()).not.toContain('{');
    const next = fig.frame.locator('[data-act="q-next"]').first();
    if (await next.isVisible()) await next.click();
  }
  await fig.advance(800);
  expect(kinds.size).toBe(5);
  await expect(fig.frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ৫টি');
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', scene: 'intro' });
  expect(log.errors).toEqual([]);
});
