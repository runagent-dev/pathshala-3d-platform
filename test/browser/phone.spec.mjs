// Kit behaviour on phones, in one figure (screw-gauge): the stage draws again as soon as its size changes
// (shared/lib/stage.js), so there is no blank frame when a phone turns or the panel under the 3D view changes height;
// and quick taps on the kit's buttons never zoom the page (student.css). Pages run on the virtual clock, so animation
// frames come only when the test advances time; a resize must not need one.
import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';
import { openFigure, preparePage } from '../../scripts/lib/export/driver.mjs';

/** The share of the 3D canvas's pixels that are not (almost) white (blank, only the magnifier's ring shows: ~0.03). */
async function inked(page) {
  const png = PNG.sync.read(await page.locator('.pvc-canvas canvas').screenshot());
  let n = 0;
  for (let i = 0; i < png.data.length; i += 4) if (Math.min(png.data[i], png.data[i + 1], png.data[i + 2]) < 230) n++;
  return n / (png.width * png.height);
}

test('stage: redraws at once when it is resized (a phone turned)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'screw-gauge', { harness: false });
  await fig.advance(1000);
  expect(await inked(page)).toBeGreaterThan(0.15);

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(300); // real time: the resize is handled, but no animation frame runs
  expect(await inked(page)).toBeGreaterThan(0.15);
  expect(log.errors).toEqual([]);
});

test('student view: buttons never zoom the page on a double tap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await preparePage(page);
  await openFigure(page, 'screw-gauge', { harness: false });
  const actions = await page.evaluate(() => [...new Set([...document.querySelectorAll('.pvc button')].map((b) => getComputedStyle(b).touchAction))]);
  expect(actions).toEqual(['manipulation']);
});
