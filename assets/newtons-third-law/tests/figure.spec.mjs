import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('third law: boat recoil replaces both mass tabs, and the apple–Earth pair has full equations', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'newtons-third-law');
  expect(await fig.frame.locator('.pvc-examples [data-example]').evaluateAll((es) => es.map((e) => e.dataset.example))).toEqual(['boat', 'apple']);
  expect(await fig.frame.locator('.pvc-examples').textContent()).not.toMatch(/সমান ভর|হালকা|ভারী/);
  expect(await fig.call('get')).toMatchObject({ example: 'boat', phase: 'rest', force: 0 });
  await fig.call('set', { push: true });
  await fig.advance(350);
  let s = await fig.call('get');
  expect(s.phase).toBe('push');
  expect(s.arrows).toEqual({ onPerson: true, onBoat: true });
  expect(s.force).toBe(300);
  expect(s.position.person).toBeGreaterThan(0.35);
  expect(s.position.boat).toBeLessThan(0);
  await fig.advance(800);
  s = await fig.call('get');
  expect(s.phase).toBe('flight');
  expect(s.arrows).toEqual({ onPerson: false, onBoat: false });
  expect(s.speed.person).toBeGreaterThan(0);
  expect(s.speed.boat).toBeLessThan(0);
  await fig.advance(2500);
  expect(await fig.call('get')).toMatchObject({ phase: 'landed', done: true, playing: false });
  await fig.call('set', { example: 'apple', at: 0.2 });
  s = await fig.call('get');
  expect(s).toMatchObject({ example: 'apple', phase: 'fall', force: 9.8, arrows: { onApple: true, onEarth: true } });
  expect(s.acceleration.earth).toBeCloseTo(1.64e-24, 26);
  const maths = await fig.frame.locator('.nt-equations').textContent();
  expect(maths).toContain('mg');
  expect(maths).toContain('a = F/M');
  expect(maths).not.toContain('G =');
  await fig.frame.locator('[data-act="maths-open"]').click();
  await expect(fig.frame.locator('.nt-math-dialog')).toBeVisible();
  const full = await fig.frame.locator('.nt-dialog-maths').textContent();
  expect(full).toContain('aM = F/M = (m/M)g');
  expect(full).toContain('G =');
  await fig.frame.locator('.nt-math-dialog').press('Escape');
  await expect(fig.frame.locator('.nt-math-dialog')).not.toBeVisible();
  expect(maths).toContain('১.৬৪');
  expect(maths).toContain('−২৪');
  // The real texture is bundled and ready, and the entire globe is exported rather than a cropped surface.
  const earth = await fig.frame.evaluate(() => {
    const model = /** @type {any} */ (window).figure.exportRoot();
    const e = model.getObjectByName('Earth');
    return { texture: e.material.map.image.width, radius: e.geometry.parameters.radius };
  });
  expect(earth.texture).toBe(1024);
  expect(earth.radius).toBe(1.05);
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ example: 'boat', phase: 'rest', mode: 'explore', view: 'front' });
  expect(log.errors).toEqual([]);
});

test('third law: five questions use the new boat and Earth scenes and reveal both forces', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'newtons-third-law');
  await fig.call('set', { view: '3d' });
  await fig.call('practice');
  expect((await fig.call('get')).view).toBe('front');
  for (let i = 0; i < 5; i++) {
    await fig.advance(100);
    await expect(fig.frame.locator('.pvc-opt')).toHaveCount(4);
    const s = await fig.call('get');
    expect(s.mode).toBe('quiz');
    expect(s.example).toBe(i < 3 ? 'boat' : 'apple');
    if (i === 0) expect(s.arrows).toEqual({ onPerson: true, onBoat: false });
    if (i === 3) expect(s.arrows).toEqual({ onApple: true, onEarth: false });
    await fig.frame.locator('.pvc-examples [data-example="apple"]').evaluate((el) => el.click());
    expect((await fig.call('get')).example).toBe(s.example);
    await fig.frame.locator('[data-q="0"]').click();
    await fig.advance(100);
    expect(await fig.frame.locator('.pvc-q-feedback').textContent()).not.toMatch(/undefined|NaN/);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫');
  expect(log.errors).toEqual([]);
});

test('third law: the new pictures, equations and controls fit all six frames in both languages', async ({ page }) => {
  const log = await preparePage(page);
  for (const lang of ['bn', 'en']) {
    for (const [width, height] of [
      [390, 700],
      [390, 520],
      [844, 390],
      [640, 400],
      [800, 500],
      [1280, 800],
    ]) {
      await page.setViewportSize({ width, height });
      const fig = await openFigure(page, 'newtons-third-law', { params: { lang } });
      for (const state of [
        { example: 'boat', at: 0 },
        { example: 'boat', at: 0.2 },
        { example: 'boat', at: 0.55 },
        { example: 'apple', at: 0.2 },
      ]) {
        await fig.call('set', state);
        await fig.frame.locator('.pvc-stage').boundingBox();
        await fig.advance(300);
        const report = await fig.frame.evaluate(() => {
          const bad = [];
          for (const e of document.querySelectorAll('.pvc-learn button,.nt-equations,.nt-equations>div,.pvc-outcome,.pvc-rule,.pvc-anno')) {
            const style = getComputedStyle(e);
            if (e.closest('[hidden]') || style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;
            const r = e.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            if (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1 || e.scrollWidth > e.clientWidth + 1)
              bad.push({ text: e.textContent, width: r.width, scroll: e.scrollWidth - e.clientWidth, bottom: r.bottom });
          }
          const p = document.querySelector('.pvc-panel');
          return { bad, overflow: p.scrollHeight - p.clientHeight, stage: document.querySelector('.pvc-stage').getBoundingClientRect().height };
        });
        expect(report.bad, `${lang} ${width}×${height} ${state.example}`).toEqual([]);
        expect(report.overflow).toBeLessThanOrEqual(1);
        expect(report.stage).toBeGreaterThan(160);
        if (state.example === 'apple') {
          await fig.frame.locator('[data-act="maths-open"]').click();
          const full = await fig.frame.locator('.nt-math-dialog').evaluate((el) => {
            const r = el.getBoundingClientRect();
            return {
              width: r.width,
              height: r.height,
              scroll: el.scrollHeight - el.clientHeight,
              inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1,
            };
          });
          expect(full.inside).toBe(true);
          expect(full.scroll).toBeLessThanOrEqual(1);
          await fig.frame.locator('[data-act="maths-close"]').click();
        }
      }
    }
  }
  expect(log.errors).toEqual([]);
});
