import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('simple-harmonic-motion: graph moments pause at the matching physical position', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 520 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'simple-harmonic-motion');
  for (const example of ['swing', 'spring']) {
    await fig.call('set', { example, playing: true, animate: false });
    for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
      const button = fig.frame.locator(`[data-phase="${phase}"]`);
      await button.click();
      const state = await fig.call('get');
      expect(state.playing).toBe(false);
      expect(state.place).toBe(phase % 0.5 === 0 ? 'end' : 'middle');
      expect(state.speed).toBeCloseTo(phase % 0.5 === 0 ? 0 : state.maxSpeed, 3);
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(await fig.frame.locator('.shm-dot').evaluate((el) => Number.parseFloat(el.style.left))).toBeCloseTo(phase * 100, 2);
    }
  }
  // The graph is a set of keyboard-accessible buttons too.
  const start = fig.frame.locator('[data-phase="0"]');
  await start.focus();
  await start.press('Enter');
  await expect(start).toHaveAttribute('aria-pressed', 'true');
  expect(log.errors).toEqual([]);
});

test('simple-harmonic-motion: graph controls and diagram labels stay separate at all six frame sizes', async ({ page }) => {
  const log = await preparePage(page);
  const fig = await openFigure(page, 'simple-harmonic-motion');
  for (const [width, height] of [
    [390, 700],
    [390, 520],
    [844, 390],
    [640, 400],
    [800, 500],
    [1280, 800],
  ]) {
    await page.setViewportSize({ width, height });
    for (const example of ['swing', 'spring']) {
      await fig.call('set', { example, angle: 8, amplitude: example === 'spring' ? 0.06 : undefined, playing: false, animate: false });
      await fig.advance(500);
      const overlaps = await fig.frame.evaluate(() => {
        const found = [];
        for (const selector of ['.shm-stops button', '.pvc-anno-part']) {
          const boxes = [...document.querySelectorAll(selector)].map((el) => ({ text: el.textContent, box: el.getBoundingClientRect() }));
          for (let i = 0; i < boxes.length; i++)
            for (let j = i + 1; j < boxes.length; j++) {
              const a = boxes[i].box,
                b = boxes[j].box;
              if (Math.min(a.right, b.right) > Math.max(a.left, b.left) + 1 && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 1)
                found.push([boxes[i].text, boxes[j].text]);
            }
        }
        return found;
      });
      expect(overlaps, `${example} at ${width}×${height}`).toEqual([]);
    }
  }
  expect(log.errors).toEqual([]);
});
