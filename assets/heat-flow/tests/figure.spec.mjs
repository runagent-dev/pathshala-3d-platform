// Internal energy and the flow of heat through the bridge (book p162, topic 6.1.1, চিত্র ৬.০১): with the tap shut
// nothing moves; opened, water runs from the higher surface to the lower one and stops when the two heights are equal
// (the vessel, with far more water, hardly rises); the heat view is the same picture; the test sets up each scene.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('heat-flow: water goes from the higher surface to the lower and stops at equal heights', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'heat-flow');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  const start = await fig.call('get');
  expect(start).toMatchObject({ example: 'water', phase: 'rest', progress: 0, tap: 0, left: 22, right: 8, direction: 'right' });
  // shut: nothing moves however long we wait
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', left: 22, right: 8 });
  expect(await text('.pvc-outcome')).toContain('বাম নলে ২২ সেমি');
  expect(await text('.pvc-act-badge')).toBe('১');
  expect(await text('.pvc-act')).toContain('কলটি খোলো');

  // open it: the tap turns, then the water runs: the tube falls, the vessel rises a little, never past each other
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(1500);
  const mid = await fig.call('get');
  expect(mid.phase).toBe('run');
  expect(mid.flowing).toBe(true);
  expect(mid.left).toBeLessThan(22);
  expect(mid.left).toBeGreaterThan(mid.right);
  expect(mid.right).toBeGreaterThan(8);
  expect(await text('.pvc-rule')).toContain('বেশি উচ্চতা থেকে কম উচ্চতায়');
  await fig.advance(6000);
  const end = await fig.call('get');
  expect(end).toMatchObject({ phase: 'done', progress: 1 });
  expect(end.left).toBe(end.right);
  expect(end.left).toBeCloseTo(8.8, 1);
  expect(await text('.pvc-rule')).toContain('যতক্ষণ না দুটি উচ্চতা সমান হয়');
  expect(await text('.pvc-act')).toContain('আবার করো');

  // again: the water goes back, the tap shuts
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', progress: 0, tap: 0, left: 22, right: 8 });
  expect(log.errors).toEqual([]);
});

test('heat-flow: the heat view is the same picture, with temperatures', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'heat-flow');
  await fig.call('set', { example: 'heat' });
  expect(await fig.call('get')).toMatchObject({ example: 'heat', phase: 'rest', left: 22, right: 8 });
  expect((await fig.frame.locator('.pvc-outcome').first().textContent()).replace(/ /g, ' ')).toContain('তাপশক্তি অল্প');
  await fig.call('set', { open: true, animate: false });
  await fig.advance(8000);
  expect(await fig.call('get')).toMatchObject({ example: 'heat', phase: 'done' });
  expect(await fig.frame.locator('.pvc-outcome').first().textContent()).toContain('তাপমাত্রা সমান হয়েছে');
  expect(log.errors).toEqual([]);
});

test('heat-flow: the test sets up its scenes and opens the tap with the answer', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'heat-flow');
  await fig.call('practice');
  await fig.advance(500);
  // question 1: the tube is the lower one; the tap is shut, nothing labels the heights yet
  const q1 = await fig.call('get');
  expect(q1).toMatchObject({ example: 'water', phase: 'rest', direction: 'left', mode: 'quiz', locked: true });
  expect(await fig.frame.locator('.pvc-opt').count()).toBe(4);
  await fig.frame.locator('.pvc-opt').first().click();
  await fig.advance(1000);
  expect((await fig.call('get')).phase).toBe('run'); // the answer is shown: the tap opens
  expect(log.errors).toEqual([]);
});
