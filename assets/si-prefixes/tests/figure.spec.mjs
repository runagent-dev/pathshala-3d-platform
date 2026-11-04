// SI prefixes (book page 17, topic 1.5.2): the tour plays by itself; paused or held at a chosen stop it draws
// nothing; a stop in the strip flies there and the caption names it; seek/duration drive the video export; with
// loop off it stops at the end. Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frames = (fig) => fig.frame.evaluate(() => /** @type {any} */ (window).figure._internals.stage.renderer.info.render.frame);

test('si-prefixes: plays, pauses without drawing, flies to a chosen stop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'si-prefixes');

  // plays from the student (seek to 0: getting ready already ran the virtual clock a little)
  await fig.call('seek', { t: 0 });
  await fig.advance(100);
  let s = await fig.call('get');
  expect(s).toMatchObject({ playing: true, stop: 'student' });
  const duration = await fig.call('duration');
  expect(duration).toBe(s.duration);
  expect(duration).toBeGreaterThan(90);
  await fig.advance(4000);
  expect((await fig.call('get')).time).toBeGreaterThan(3.5);

  // paused: nothing is drawn
  await fig.call('pause');
  await fig.advance(200);
  const f0 = await frames(fig);
  await fig.advance(2000);
  expect(await frames(fig)).toBe(f0);

  // a stop in the strip: it flies there, holds, names it, and stops drawing again
  await fig.frame.locator('.hb-strip button[data-go="earth"]').click();
  await fig.advance(300);
  expect((await fig.call('get')).flyingTo).toBe('earth');
  await fig.advance(4000);
  s = await fig.call('get');
  expect(s).toMatchObject({ playing: false, stop: 'earth', flyingTo: null });
  await expect(fig.frame.locator('.hb-name')).toHaveText('পৃথিবী');
  await expect(fig.frame.locator('.hb-strip button.on')).toHaveAttribute('data-go', 'earth');
  const f1 = await frames(fig);
  await fig.advance(1500);
  expect(await frames(fig)).toBe(f1);

  // play continues the tour from there: the next stop is the Sun
  await fig.call('play');
  await fig.advance(7000);
  expect((await fig.call('get')).stop).toBe('sun');

  // keyboard: ← goes one smaller
  await fig.call('pause');
  await fig.frame.locator('.hb').focus();
  await page.keyboard.press('ArrowLeft');
  await fig.advance(4000);
  expect((await fig.call('get')).stop).toBe('earth');

  // seek (the video export) lands on the stop at that time, even while paused
  const t = 2.6 + 0.5; // the student's hold is 2.6 s; the move to the mango follows
  await fig.call('seek', { t });
  await fig.advance(100);
  s = await fig.call('get');
  expect(s.playing).toBe(false);
  expect(s.stop).toBe(null);
  await fig.call('goto', { id: 'quark', animate: false });
  await fig.advance(100);
  expect((await fig.call('get')).stop).toBe('quark');
  await expect(fig.frame.locator('.hb-name')).toHaveText('কোয়ার্ক');

  // reset: back to the start, playing
  await fig.call('reset');
  await fig.advance(100);
  expect(await fig.call('get')).toMatchObject({ playing: true, stop: 'student' });

  expect(log.errors).toEqual([]);
});

test('si-prefixes: with loop off it stops at the end', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'si-prefixes', { params: { loop: '0' } });
  const duration = await fig.call('duration');
  await fig.call('seek', { t: duration - 1 });
  await fig.advance(2500);
  expect((await fig.call('get')).playing).toBe(false);
  const f0 = await frames(fig);
  await fig.advance(1500);
  expect(await frames(fig)).toBe(f0);
  // the panel sits beside the view (landscape) or under it (portrait), never over it
  const [stage, panel] = await fig.frame.evaluate(() =>
    ['.hb-stage', '.hb-panel'].map((q) => {
      const r = document.querySelector(q).getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    }),
  );
  expect(panel.top >= stage.bottom - 1 || panel.left >= stage.right - 1).toBe(true);
  expect(log.errors).toEqual([]);
});

test('si-prefixes: the calculator converts what the student types, exactly, and shows the object of that size', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'si-prefixes');
  const f = fig.frame;
  const tap = (k) => f.locator(`.hb-keys [data-key="${k}"]`).click();

  // the tab pauses the tour; it opens on 1 km = 1,000 m
  await f.locator('[role="tab"][data-mode="calc"]').click();
  await fig.advance(200);
  let s = await fig.call('get');
  expect(s).toMatchObject({ mode: 'calc', playing: false, calc: { typed: '1', from: 'k', to: 'base', result: '1,000' } });
  await expect(f.locator('[data-out]')).toHaveText('= ১,০০০');

  // type 2.5, pick সেন্টিমিটার in the list of units: 2,50,000 cm, with the working
  await tap('clear');
  for (const k of ['2', '.', '5']) await tap(k);
  await f.locator('[data-pick="to"]').click();
  await expect(f.locator('.hb-picker')).toBeVisible();
  await f.locator('.hb-picker [data-unit="c"]').click();
  await expect(f.locator('.hb-picker')).toBeHidden();
  await expect(f.locator('[data-out]')).toHaveText('= ২,৫০,০০০');
  await expect(f.locator('[data-w2]')).toContainText('২.৫ km = ২.৫ × ১০৫ cm = ২,৫০,০০০ cm');
  // 2.5 km is about the Padma Bridge: the 3D flies there once the student stops typing
  await fig.advance(5000);
  s = await fig.call('get');
  expect(s).toMatchObject({ stop: 'bridge', calc: { near: 'bridge' } });

  // swap: 2.5 cm in km, written as a × 10ⁿ when it is long
  await tap('swap');
  expect((await fig.call('get')).calc).toMatchObject({ from: 'c', to: 'k', result: '0.000025', scientific: '2.5e-5' });

  // a real keyboard: 6 e 24 in m → exametres; Escape clears
  await fig.call('set', { from: 'base', to: 'E', value: '' });
  await f.locator('[data-key="0"]').focus();
  await page.keyboard.type('6e24');
  expect((await fig.call('get')).calc).toMatchObject({ typed: '6e24', result: '60,00,000' });
  await page.keyboard.press('Escape');
  expect((await fig.call('get')).calc.typed).toBe('');

  // nothing in the calculator spills out of the panel
  const [panel, keys] = await f.evaluate(() => ['.hb-panel', '.hb-keys'].map((q) => document.querySelector(q).getBoundingClientRect().bottom));
  expect(keys).toBeLessThanOrEqual(panel + 0.5);

  // back to the tour tab: the caption and stops again
  await f.locator('[role="tab"][data-mode="tour"]').click();
  await expect(f.locator('.hb-strip')).toBeVisible();
  expect(log.errors).toEqual([]);
});
