// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// first screen is calm; the first taps rub the glass with silk (electrons glass → silk); the plastic with flannel
// (flannel → plastic); like charges turn the hanging rod away, unlike toward it; dragging the cloth rubs and dragging
// the rod brings it near; the test, answered right, scores five of five. Steps are jumped with animate: false so each
// test stays short under software rendering.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { STRINGS } from '../src/i18n.js';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/charging-by-friction/'));

test('charging-by-friction: rubbing moves electrons; like charges repel, unlike attract', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'charging-by-friction');
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ phase: 'intro', next: 'glass0', net: { glass: 0, silk: 0 } });
  expect(await frame.locator('[data-example]').count()).toBe(5);
  expect(await frame.locator('.cf-lead.pvc-note').count()).toBe(1);

  // ① look closely: both neutral; ② rub: three electrons go from the glass to the silk
  await frame.locator('.pvc-act').click();
  await fig.advance(3200);
  expect(await fig.call('get')).toMatchObject({ phase: 'glass0', busy: false, net: { glass: 0, silk: 0 } });
  await frame.locator('.pvc-act').click();
  await fig.advance(4200);
  expect(await fig.call('get')).toMatchObject({ phase: 'glass', done: true, moved: { glass: 3 }, net: { glass: 3, silk: -3 } });
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('পজিটিভ বা ধনাত্মক চার্জযুক্ত');

  // the plastic with flannel: three electrons from the flannel to the plastic
  expect(await fig.call('set', { phase: 'plastic', animate: false })).toMatchObject({ net: { plastic: -3, flannel: 3 } });

  // the hanging rods: + and + away, − and − away, + and − toward
  expect(await fig.call('set', { phase: 'pp', animate: false })).toMatchObject({ stand: 'A', force: 'repel', turned: 'away' });
  expect(await fig.call('set', { phase: 'nn', animate: false })).toMatchObject({ stand: 'B', force: 'repel', turned: 'away' });
  expect(await fig.call('set', { phase: 'pn', animate: false })).toMatchObject({ stand: 'B', force: 'attract', turned: 'toward' });
  // far away, the hanging rod hardly turns
  const far = await fig.call('set', { phase: 'pn0', animate: false });
  expect(far.swing).toEqual({ A: 0, B: 0 });
  expect(far.turned).toBe('still');
  // the parked rod at the other stand pulls on nothing
  expect((await fig.call('set', { phase: 'nn0', animate: false })).swing).toEqual({ A: 0, B: 0 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ phase: 'intro', view: 'front', mode: 'explore', net: { glass: 0 } });
  expect(log.errors).toEqual([]);
});

test('charging-by-friction: dragging the cloth rubs, dragging the rod brings it near', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'charging-by-friction');
  const frame = frameOf(page);
  await fig.call('set', { phase: 'glass0', animate: false });
  await fig.advance(600);
  const handle = frame.locator('.pvc-dh:visible').first();
  const box = await handle.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 5; i++) {
    await page.mouse.move(x + 70, y, { steps: 4 });
    await page.mouse.move(x - 70, y, { steps: 4 });
  }
  await page.mouse.up();
  await fig.advance(400);
  const rubbed = await fig.call('get');
  expect(rubbed.phase).toBe('glass');
  expect(rubbed.strokes.glass).toBeGreaterThan(2);
  expect(rubbed.moved.glass).toBeGreaterThan(1);

  await fig.call('set', { phase: 'pp0', animate: false });
  await fig.advance(600);
  const rod = frame.locator('.pvc-dh:visible').first();
  const rb = await rod.boundingBox();
  const before = await fig.call('get');
  const rx = rb.x + rb.width / 2;
  const ry = rb.y + rb.height / 2;
  await page.mouse.move(rx, ry);
  await page.mouse.down();
  // toward the hanging rod: up the screen
  await page.mouse.move(rx, ry - 160, { steps: 8 });
  await page.mouse.up();
  await fig.advance(3000);
  const after = await fig.call('get');
  expect(after.near).toBeGreaterThan(before.near + 0.3);
  expect(Math.abs(after.swing.A)).toBeGreaterThan(Math.abs(before.swing.A) + 5);
  expect(log.errors).toEqual([]);
});

test('charging-by-friction: the test, answered right, scores five of five', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'charging-by-friction');
  const frame = frameOf(page);
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(900);
    // the hidden rod's sign changes from run to run: the figure says which answer is right
    const { question } = await fig.call('get');
    await frame
      .locator('[data-q]')
      .filter({ has: frame.getByText(STRINGS.bn[question.answer], { exact: true }) })
      .click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await expect(frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ৫টি সঠিক');
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', phase: 'intro' });
  expect(log.errors).toEqual([]);
});
