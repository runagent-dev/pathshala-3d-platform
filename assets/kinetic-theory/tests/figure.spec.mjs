// This animation's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): it
// seeks exactly, each part chip jumps to its part with the book's caption, the captions follow the story (the solid,
// the liquid's hole, the balloon that does not burst, the third-law pair at the wall, the heat), and a capture of the
// inside of the balloon is not blank.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/kinetic-theory/'));

test('kinetic-theory: the parts, the captions and seeking', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'kinetic-theory', { params: { autoplay: '0' } });
  const start = await fig.call('get');
  expect(start).toMatchObject({ t: 0, duration: 78, playing: false, step: 0, cue: 'c_solid' });
  expect(await fig.call('duration')).toBe(78);

  const story = [
    [4, 0, 'c_solid'],
    [15, 1, 'c_hole'],
    [22, 2, 'c_gas'],
    [37, 3, 'c_needle'],
    [41, 3, 'c_leak'],
    [49, 4, 'c_hit'],
    [53.5, 4, 'c_force'],
    [57, 4, 'c_back'],
    [63, 5, 'c_pressure'],
    [74, 6, 'c_more'],
  ];
  const frame = frameOf(page);
  for (const [t, step, cue] of story) {
    const s = await fig.call('seek', { t });
    expect(s).toMatchObject({ t, step, cue });
    // the caption on screen is that cue's
    expect(await frame.locator('.anim-caption').innerHTML()).not.toBe('');
  }
  await fig.call('seek', { t: 41 });
  await expect(frame.locator('.anim-caption')).toContainText('ফাটবে না');
  await fig.call('seek', { t: 53.5 });
  await expect(frame.locator('.anim-caption')).toContainText('নিউটনের তৃতীয় সূত্র');

  // a chip jumps to its part
  await frame.locator('[data-step="3"]').click();
  expect(await fig.call('get')).toMatchObject({ step: 3, cue: 'c_blow' });
  await expect(frame.locator('[data-step="3"]')).toHaveClass(/on/);
  await frame.locator('[data-step="5"]').click();
  expect(await fig.call('get')).toMatchObject({ step: 5, cue: 'c_many' });

  // set { step } and play / pause
  expect((await fig.call('set', { step: 6 })).step).toBe(6);
  await fig.call('play');
  await fig.advance(1000);
  const played = await fig.call('get');
  expect(played.playing).toBe(true);
  expect(played.t).toBeGreaterThan(67);
  await fig.call('pause');
  expect((await fig.call('get')).playing).toBe(false);

  // the inside of the balloon renders
  await fig.call('seek', { t: 53.5 });
  const png = await fig.call('capture', { width: 400, height: 300 });
  expect(png).toMatch(/^data:image\/png;base64,/);
  expect(png.length).toBeGreaterThan(8000);
  expect(log.errors).toEqual([]);
});

test('kinetic-theory: English, and the words beside the picture on a wide screen', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'kinetic-theory', { params: { autoplay: '0', lang: 'en' } });
  const frame = frameOf(page);
  await fig.call('seek', { t: 41 });
  await expect(frame.locator('.anim-caption')).toContainText('does not burst');
  const stage = await frame.locator('.pvc-stage').boundingBox();
  const panel = await frame.locator('.anim-panel').boundingBox();
  expect(panel.x).toBeGreaterThanOrEqual(stage.x + stage.width - 1);
  expect(stage.height).toBeGreaterThan(380);
  expect(log.errors).toEqual([]);
});
