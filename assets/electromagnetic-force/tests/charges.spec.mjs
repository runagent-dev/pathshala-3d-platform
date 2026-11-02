import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('comb: complete human model, transferred charge and neutral paper polarization follow the experiment', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'electromagnetic-force');
  const representation = () =>
    fig.frame.evaluate(() => {
      const root = /** @type {any} */ (window).figure.exportRoot();
      const names = {};
      let hair = 0,
        comb = 0;
      root.traverse((part) => {
        names[part.name] = (names[part.name] || 0) + 1;
        // static parts are merged into one mesh per material; their names are kept in userData.parts
        for (const n of part.userData.parts || []) names[n] = (names[n] || 0) + 1;
        // the markers are instanced: "+" discs on the hair (one instance each), "−" discs on both faces of the comb
        if (part.name === 'HairPositiveCharges' && part.visible) hair += part.children[0].count;
        if (part.name === 'ChargeDiscs' && part.visible) comb += part.count / 2;
      });
      const positive = root.getObjectByName('PaperPositiveCharge');
      const negative = root.getObjectByName('PaperNegativeCharge');
      const combObject = root.getObjectByName('Comb');
      const centre = positive.position.clone().add(negative.position).multiplyScalar(0.5);
      return {
        names,
        hair,
        comb,
        paperPlus: positive.visible,
        paperMinus: negative.visible,
        near: positive.position.clone().sub(negative.position).dot(combObject.position.clone().sub(centre)),
      };
    });
  const initial = await representation();
  expect(initial.names).toMatchObject({ Head: 1, Eye: 2, Eyebrow: 2, Ear: 2, Nose: 1, Mouth: 1, Neck: 1, Shoulders: 1, HandHoldingComb: 1 });
  expect(initial).toMatchObject({ hair: 0, comb: 0, paperPlus: false, paperMinus: false });
  for (const charge of [3, 5]) {
    await fig.call('set', { charge });
    await fig.advance(100);
    expect(await representation()).toMatchObject({ hair: charge * 2, comb: charge * 2, paperPlus: false, paperMinus: false });
    await expect(fig.frame.locator('.pvc-outcome')).toContainText('চুল (+), চিরুনি (−)');
  }
  await fig.call('set', { place: 'paper', height: 60, animate: false });
  await fig.advance(100);
  const near = await representation();
  expect(near).toMatchObject({ paperPlus: true, paperMinus: true });
  expect(near.near).toBeGreaterThan(0);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('কাগজ মোট নিরপেক্ষ');
  expect((await fig.call('get')).comb.lifted).toBe(0);
  await fig.call('set', { height: 30, animate: false });
  await fig.advance(800);
  expect((await fig.call('get')).comb.lifted).toBeGreaterThan(0);
  expect(await representation()).toMatchObject({ paperPlus: true, paperMinus: true });
  await fig.call('set', { charge: 0 });
  await fig.advance(100);
  expect(await representation()).toMatchObject({ hair: 0, comb: 0, paperPlus: false, paperMinus: false });
  expect(log.errors).toEqual([]);
});

test('comb: charge explanations and labels fit all six frames in both languages', async ({ page }) => {
  const log = await preparePage(page);
  for (const lang of ['bn', 'en']) {
    const fig = await openFigure(page, 'electromagnetic-force', { params: { lang } });
    for (const [width, height] of [
      [390, 700],
      [390, 520],
      [844, 390],
      [640, 400],
      [800, 500],
      [1280, 800],
    ]) {
      await page.setViewportSize({ width, height });
      for (const state of [
        { again: true, animate: false },
        { charge: 5 },
        { place: 'paper', height: 60, animate: false },
        { place: 'paper', height: 30, animate: false },
      ]) {
        await fig.call('set', state);
        await fig.advance(800);
        const layout = await fig.frame.evaluate(() => {
          const bad = [];
          for (const el of document.querySelectorAll('.pvc-learn button,.pvc-outcome,.pvc-rule,.ef-forces,.pvc-anno')) {
            const style = getComputedStyle(el);
            if (el.closest('[hidden]') || style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            if (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1 || el.scrollWidth > el.clientWidth + 1)
              bad.push(el.textContent);
          }
          const panel = document.querySelector('.pvc-panel');
          return { bad, overflow: panel.scrollHeight - panel.clientHeight };
        });
        expect(layout.bad, `${lang} ${width}×${height}`).toEqual([]);
        expect(layout.overflow).toBeLessThanOrEqual(1);
      }
    }
  }
  expect(log.errors).toEqual([]);
});
