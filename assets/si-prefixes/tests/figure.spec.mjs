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
  // the strip sits under the view, not over it
  const [stage, panel] = await fig.frame.evaluate(() =>
    ['.hb-stage', '.hb-panel'].map((q) => {
      const r = document.querySelector(q).getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    }),
  );
  expect(panel.top).toBeGreaterThanOrEqual(stage.bottom - 1);
  expect(log.errors).toEqual([]);
});
