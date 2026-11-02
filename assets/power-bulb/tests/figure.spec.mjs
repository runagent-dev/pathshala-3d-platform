// Power: the 100 W bulb (book p120, topic 4.7) through the bridge: switched on, it uses 100 J each second (real
// time), P = W ÷ t from the stopwatch's whole seconds; at the end the book's 1000 MW power plant joins the table; the
// test has three questions and gives the learn state back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('power-bulb: 1 W = 1 J each second', async ({ page }) => {
  test.setTimeout(480_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'power-bulb');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  const start = await fig.call('get');
  expect(start).toMatchObject({ phase: 'ready', runs: 0, bulb: { P: 100, t: 0, E: 0, on: false } });
  await fig.advance(1500);
  expect((await fig.call('get')).phase).toBe('ready'); // nothing happens without the switch

  await fig.frame.locator('.pvc-act').click();
  await fig.advance(4500);
  const lit = await fig.call('get');
  expect(lit).toMatchObject({ phase: 'run', bulb: { P: 100, t: 4, E: 400, on: true } });
  expect(await text('.pvc-outcome')).toContain('৪০০ J÷৪ s=১০০ W');
  expect(await text('.pvc-rule')).toContain('প্রতি সেকেন্ডে ১০০ J');
  await fig.advance(6500);
  const off = await fig.call('get');
  expect(off).toMatchObject({ phase: 'done', runs: 1, bulb: { t: 10, E: 1000, on: false } });
  expect(await text('.pvc-outcome')).toContain('MW');
  expect(await text('.pvc-rule')).toContain('W (ওয়াট)');
  expect(off.next).toEqual({ label: 'act_again', step: '' });

  await fig.call('practice');
  await fig.advance(300);
  expect(await fig.call('get')).toMatchObject({ mode: 'quiz', locked: true });
  expect(await fig.frame.locator('.pvc-opt').count()).toBe(4);
  for (let i = 0; i < 3; i++) {
    await fig.frame.locator('.pvc-opt').first().click();
    await fig.advance(200);
    await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(300);
  }
  await expect(fig.frame.locator('.pvc-quiz.is-done')).toHaveCount(1);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', locked: false });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ phase: 'ready', runs: 0 });
  expect(log.errors).toEqual([]);
});
