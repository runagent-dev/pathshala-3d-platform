import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('spring graphs: signed motion, energy exchange, playback and inspection all use the same state', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'simple-harmonic-motion', { params: { example: 'spring', lang: 'en' } });
  await fig.call('set', { example: 'spring', amplitude: 0.12, side: 1, phase: 0, playing: false, animate: false });
  const value = (key) => fig.frame.locator(`[data-value="${key}"]`);
  await expect(value('x')).toHaveText('0.12');
  await expect(value('v')).toHaveText('0.00');
  await expect(value('a')).toHaveText('−3.00');
  await fig.frame.locator('[data-phase="0.25"]').click();
  await expect(value('x')).toHaveText('0.00');
  await expect(value('v')).toHaveText('−0.60');
  await expect(value('a')).toHaveText('0.00');
  await fig.frame.locator('[data-graph="energy"]').click();
  await expect(value('k')).toHaveText('0.36');
  await expect(value('u')).toHaveText('0.00');
  await expect(value('e')).toHaveText('0.36');
  await fig.frame.locator('[data-phase="0.5"]').click();
  await expect(value('k')).toHaveText('0.00');
  await expect(value('u')).toHaveText('0.36');
  await expect(value('e')).toHaveText('0.36');
  expect(await fig.frame.locator('.sg-ring-k').evaluate((el) => Number.parseFloat(getComputedStyle(el).strokeDasharray))).toBeCloseTo(0, 8);
  const energyHeight = await fig.frame.locator('.pvc-stage').evaluate((el) => el.getBoundingClientRect().height);
  await fig.frame.locator('[data-graph="motion"]').click();
  expect(await fig.frame.locator('.pvc-stage').evaluate((el) => el.getBoundingClientRect().height)).toBe(energyHeight);
  await fig.call('set', { amplitude: 0.12, side: -1, phase: 0.25 });
  await expect(value('v')).toHaveText('0.60');
  await fig.call('set', { amplitude: 0.06, phase: 0, playing: true });
  await fig.advance(200);
  const state = await fig.call('get');
  const cursor = await fig.frame.locator('.sg-motion .sg-cursor').first().getAttribute('x1');
  expect(Number(cursor) / 240).toBeCloseTo(state.phase, 2);
  await fig.call('set', { playing: false });
  await fig.frame.locator('[data-graph="energy"]').click();
  await expect(value('e')).toHaveText('0.09');
  expect(log.errors).toEqual([]);
});

test('spring graphs: both views fit every frame in Bangla and English without changing scene height', async ({ page }) => {
  const log = await preparePage(page);
  for (const lang of ['bn', 'en']) {
    const fig = await openFigure(page, 'simple-harmonic-motion', { params: { example: 'spring', lang } });
    await fig.call('set', { playing: false, phase: 0.125 });
    for (const [width, height] of [
      [390, 700],
      [390, 520],
      [844, 390],
      [640, 400],
      [800, 500],
      [1280, 800],
    ]) {
      await page.setViewportSize({ width, height });
      await fig.advance(500);
      const heights = [];
      for (const mode of ['motion', 'energy']) {
        await fig.frame.locator(`[data-graph="${mode}"]`).click();
        const layout = await fig.frame.evaluate(() => {
          const panel = document.querySelector('.pvc-panel');
          const visible = (el) => !el.closest('[hidden]') && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
          const bad = [];
          for (const el of document.querySelectorAll('.pvc-learn button, .sg-label, .sg-energy-values, .sg-hint')) {
            if (!visible(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.left < 0 || r.right > innerWidth + 1 || r.top < 0 || r.bottom > innerHeight + 1 || el.scrollWidth > el.clientWidth + 1)
              bad.push(el.textContent);
          }
          return {
            bad,
            overflow: panel.scrollHeight - panel.clientHeight,
            stage: document.querySelector('.pvc-stage').getBoundingClientRect().height,
          };
        });
        expect(layout.bad, `${lang} ${mode} ${width}×${height}`).toEqual([]);
        expect(layout.overflow).toBeLessThanOrEqual(1);
        expect(layout.stage).toBeGreaterThan(140);
        heights.push(layout.stage);
      }
      expect(heights[0]).toBe(heights[1]);
    }
  }
  expect(log.errors).toEqual([]);
});
