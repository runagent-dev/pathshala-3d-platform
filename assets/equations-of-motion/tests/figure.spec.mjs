// Uniform acceleration on a number line through the bridge (book pages 45–46, topic 2.7): s = ut + ½at² and
// v = u + at in real time, the two parts drawn tip to tail, the time steps, the car that stops at an end of the
// axis, the panel's live equations, the test. Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('equations-of-motion: sliders, run, steps, the end of the axis', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'equations-of-motion');
  const frame = page.frames().find((f) => f.url().includes('/assets/equations-of-motion/'));

  // one frame, the owner's layout: formula, buttons, sliders, both graphs and the 3D strip all on screen
  for (const sel of [
    '.eom-formula',
    '[data-act="run"]',
    '[data-act="pause"]',
    '[data-sl="t"]',
    '[data-graph="s"]',
    '[data-graph="v"]',
    '.eom-strip canvas',
  ])
    await expect(frame.locator(sel).first()).toBeVisible();

  // no x₀ anywhere: three sliders, and the formula is the book's
  await expect(frame.locator('[data-sl]')).toHaveCount(3);
  await expect(frame.locator('.eom-formula')).toContainText('s = ut +');

  // the opening: the car at 0, u = 1.9 m/s, a = 1.7 ms⁻², t = 0
  expect(await fig.call('get')).toMatchObject({ u: 1.9, a: 1.7, t: 0, s: 0, v: 1.9, phase: 'ready', end: null });

  // it runs in real time: after 1 s, s = 1.9 + 0.85 = 2.75 m and v = 3.6 m/s
  await frame.locator('[data-act="run"]').click();
  await fig.advance(1000);
  const s = await fig.call('get');
  expect(s.phase).toBe('running');
  expect(s.t).toBeGreaterThan(0.9);
  expect(s.t).toBeLessThan(1.2);
  expect(s.s).toBeCloseTo(1.9 * s.t + 0.85 * s.t ** 2, 2);
  expect(s.v).toBeCloseTo(1.9 + 1.7 * s.t, 2);
  expect(s.parts.ut + s.parts.half).toBeCloseTo(s.s, 2);
  expect(s.v ** 2).toBeCloseTo(1.9 ** 2 + 2 * 1.7 * s.s, 1); // v² = u² + 2as

  // থামাও pauses, চালাও goes on from there
  await frame.locator('[data-act="pause"]').click();
  expect((await fig.call('get')).phase).toBe('paused');
  await frame.locator('[data-act="run"]').click();
  expect((await fig.call('get')).phase).toBe('running');

  // it reaches the right end of the axis after about 2.49 s and stops there
  await fig.advance(3000);
  const e = await fig.call('get');
  expect(e).toMatchObject({ phase: 'done', end: 'right', s: 10, playing: false });
  expect(e.t).toBeCloseTo(2.49, 2);
  await expect(frame.locator('.eom-rule')).toContainText(/১০|10/);

  // the time steps: back one step lands on the 0.1 s grid
  await frame.locator('[data-act="back"]').click();
  expect((await fig.call('get')).t).toBeCloseTo(2.4, 6);
  await frame.locator('[data-act="back"]').click();
  expect((await fig.call('get')).t).toBeCloseTo(2.3, 6);
  await frame.locator('[data-act="fwd"]').click();
  expect(await fig.call('get')).toMatchObject({ t: 2.4, phase: 'paused' });
  await frame.locator('[data-act="reset"]').click();
  expect(await fig.call('get')).toMatchObject({ t: 0, phase: 'ready', s: 0 });

  // the sliders: u = −2, a = 1; the live equations show the numbers
  for (const [k, v] of [
    ['u', '-2'],
    ['a', '1'],
  ])
    await frame.locator(`[data-sl="${k}"]`).fill(v);
  expect(await fig.call('get')).toMatchObject({ u: -2, a: 1, t: 0 });
  await expect(frame.locator('[data-eq="s"]')).toContainText(/\(০\.৫\)t2 \+ \(−২\)t$|\(0\.5\)t2 \+ \(−2\)t$/);
  await expect(frame.locator('[data-eq="v"]')).toContainText(/\(১\)t \+ \(−২\)|\(1\)t \+ \(−2\)/);
  // the t slider: at 2 s the car has turned back (v = 0) at s = −4 + 2 = −2 m
  await frame.locator('[data-sl="t"]').fill('2');
  expect(await fig.call('get')).toMatchObject({ t: 2, s: -2, v: 0 });
  await expect(frame.locator('.eom-rule')).toContainText(/২|2/);

  // the keyboard: arrows step the time, Space runs and pauses
  await frame.locator('.eom').focus();
  await page.keyboard.press('ArrowRight');
  expect((await fig.call('get')).t).toBeCloseTo(2.1, 6);
  await page.keyboard.press(' ');
  expect((await fig.call('get')).phase).toBe('running');
  await page.keyboard.press(' ');
  expect((await fig.call('get')).phase).toBe('paused');

  // the left end: at −5 m/s it reaches −7 m after 1.4 s; an old host's x0 is ignored and s stays −7 m, not moved by it
  expect(await fig.call('set', { x0: -5, u: -5, a: 0, t: 'end' })).toMatchObject({ end: 'left', s: -7, t: 1.4 });
  expect((await fig.call('get')).x0).toBeUndefined();

  // s negative with no turn to come: the sentence says so
  await fig.call('set', { u: -2, a: 0, t: 1 });
  await expect(frame.locator('.eom-rule')).toContainText(/ঋণাত্মক|negative/);

  // the test: five questions, each answered
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await frame.locator('[data-q]').first().click();
    await fig.advance(800);
    const next = frame.locator('[data-act="q-next"]');
    if (await next.isVisible()) await next.click();
  }
  await frame.locator('[data-mode="explore"]').click();
  expect((await fig.call('get')).mode).toBe('explore');

  await fig.call('reset');
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ u: 1.9, a: 1.7, t: 0, s: 0, phase: 'ready', view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});
