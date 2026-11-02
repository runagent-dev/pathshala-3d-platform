// The calorimetry figure through the bridge (book pp179-181, topic 6.6): the three worked examples end at the book's
// temperatures (ice 20 °C, two waters 56.6 °C as the book prints (exactly 56.67), iron 30.1 °C), the heat given equals the heat
// taken, the sum shows the student's numbers once it has run, the test has five questions, reset brings it all back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('calorimetry: the book examples end at the book temperatures', async ({ page }) => {
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'calorimetry');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  const start = await fig.call('get');
  expect(start).toMatchObject({ example: 'ice', k: 0, running: false, done: false, T: 30, final: 20.04 });
  expect(await text('.pvc-act')).toContain('বরফ ছেড়ে দাও');
  expect(await text('.cal-list')).toContain('০.১ kg');
  expect(await text('.cal-list')).toContain('৩৩৪ kJ/kg');
  expect(await text('.pvc-rule')).toContain('বেশি তাপমাত্রার বস্তু');

  // let the ice go: part way the beaker is cooling, at the end T is the book's 20 °C
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(4500);
  const mid = await fig.call('get');
  expect(mid.running).toBe(true);
  expect(mid.T).toBeLessThan(30);
  await fig.advance(4000);
  const done = await fig.call('get');
  expect(done).toMatchObject({ example: 'ice', done: true, running: false, litres: 1.1 });
  expect(done.T).toBeCloseTo(20.04, 1);
  expect(await text('.pvc-outcome')).toContain('২০°C');
  expect(await text('.pvc-outcome')).toContain('৪১,৮০০ J');
  expect(await text('.pvc-rule')).toContain('ঠিক ততটুকু তাপ');
  expect(await text('[data-example="ice"] .pvc-ex-res')).toBe('২০°C');

  // two waters: 2 L at 75 °C and 1 L at 20 °C make 3 L at 56.6 °C
  await fig.frame.locator('[data-example="water"]').click();
  expect(await fig.call('get')).toMatchObject({ example: 'water', k: 0, T: 75 });
  expect(await text('.cal-list')).toContain('৭৫°C');
  await fig.call('set', { k: 1 });
  expect(await fig.call('get')).toMatchObject({ example: 'water', done: true, litres: 3 });
  expect(await text('.pvc-outcome')).toContain('৫৬.৬°C');
  expect(await text('.pvc-outcome')).toContain('১,৫৪,০০০ J');

  // the hot iron: 30.1 °C, and a few joules (about 405 J) move
  await fig.call('set', { example: 'iron', k: 1 });
  expect((await fig.call('get')).T).toBeCloseTo(30.1, 1);
  expect(await text('.pvc-outcome')).toContain('৩০.১°C');
  expect(await text('.pvc-outcome')).toContain('৪০৫ J');

  // the test: five questions, locked scenes
  await fig.call('practice');
  await fig.advance(800);
  expect(await fig.frame.locator('.pvc-q-text').textContent()).toContain('লোহার টুকরো');
  expect((await fig.call('get')).locked).toBe(true);
  expect(log.errors).toEqual([]);

  // reset
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ example: 'ice', k: 0, running: false, locked: false });
});
