import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { VIEWPORTS } from '../../../test/figures/figures.mjs';

test('scalar-vector: one journey, then only two of the book’s arrows at a time', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'scalar-vector');
  const button = fig.frame.locator('.pvc-act');
  expect(await fig.call('get')).toMatchObject({ stage: 0, mode: 'explore', journey: { distance: 0, magnitude: 20, vectorVisible: false } });
  await expect(button).toContainText('পথ ধরে চলো');
  const height = await fig.frame.locator('.pvc-stage').evaluate((el) => el.getBoundingClientRect().height);
  await button.click();
  await fig.advance(150);
  await expect(button).toBeDisabled();
  await button.click({ force: true });
  await fig.advance(3600);
  expect(await fig.call('get')).toMatchObject({ stage: 1, busy: false, journey: { distance: 120, vectorVisible: false } });
  await expect(fig.frame.locator('.pvc-anno-reading')).toContainText('স্কেলার');
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('১২০ m');
  await fig.call('set', { act: true });
  expect(await fig.call('get')).toMatchObject({ stage: 2, journey: { magnitude: 20, direction: 'n', vectorVisible: true } });
  await expect(fig.frame.locator('.pvc-anno-reading').filter({ hasText: 'ভেক্টর' })).toContainText('২০ m উত্তর দিকে');
  const expected = {
    3: { name: 'B', with: 'A', verdict: 'equal' },
    4: { name: 'C', with: 'A', verdict: 'direction' },
    5: { name: 'D', with: 'C', verdict: 'magnitude' },
  };
  for (const stage of [3, 4, 5]) {
    const state = await fig.call('set', { stage, animate: false });
    expect(state.current).toEqual(expected[stage]);
    expect(await fig.frame.locator('.pvc-anno-arrow').count()).toBe(2);
    expect(await fig.frame.locator('.pvc-anno-reading').count()).toBe(0);
    expect(await fig.frame.locator('.pvc-stage').evaluate((el) => el.getBoundingClientRect().height)).toBe(height);
  }
  await fig.call('reset');
  await button.click();
  await fig.advance(200);
  await fig.frame.locator('[data-act="home"]').click();
  await fig.advance(3600);
  expect(await fig.call('get')).toMatchObject({ stage: 0, busy: false, journey: { distance: 0, vectorVisible: false } });
  await fig.frame.locator('#app').focus();
  await page.keyboard.press('ArrowRight');
  await fig.advance(3600);
  expect((await fig.call('get')).stage).toBe(1);
  expect(log.errors).toEqual([]);
});

test('scalar-vector: every quiz scene is locked, five picture questions finish, and learn state returns', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 520 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'scalar-vector');
  await fig.call('set', { stage: 4, view: '3d' });
  await fig.call('practice');
  const seen = [];
  const height = await fig.frame.locator('.pvc-stage').evaluate((el) => el.getBoundingClientRect().height);
  for (let i = 0; i < 5; i++) {
    await fig.advance(250);
    const state = await fig.call('get');
    expect(state.mode).toBe('quiz');
    expect(state.view).toBe('front');
    seen.push(state.question);
    await expect(fig.frame.locator('[data-view="3d"]')).toBeDisabled();
    await fig.frame.locator('#app').focus();
    await page.keyboard.press('ArrowRight');
    expect((await fig.call('get')).stage).toBe(state.stage);
    // A deliberately varied answer exercises the per-choice explanations as well as the reveal.
    await fig.frame.locator(`.pvc-opt[data-q="${i % 4}"]`).click();
    await expect(fig.frame.locator('.pvc-q-feedback')).toHaveAttribute('data-tone', /ok|bad/);
    expect(await fig.frame.locator('.pvc-stage').evaluate((el) => el.getBoundingClientRect().height)).toBe(height);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  expect(seen.sort()).toEqual(['difference', 'direction', 'equal', 'scalar', 'vector']);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে');
  await fig.frame.locator('[data-mode="explore"]').click();
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', stage: 4, view: '3d', current: { name: 'C' } });
  expect(log.errors).toEqual([]);
});

for (const viewport of VIEWPORTS)
  test(`scalar-vector: clear labels and steady frame ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await preparePage(page);
    const fig = await openFigure(page, 'scalar-vector');
    let initialHeight;
    for (const stage of [0, 1, 2, 3, 4, 5]) {
      await fig.call('set', { stage, animate: false });
      await fig.advance(100);
      const report = await fig.frame.evaluate(() => {
        const canvas = document.querySelector('.pvc-stage').getBoundingClientRect();
        const labels = [...document.querySelectorAll('.pvc-anno')]
          .filter((el) => getComputedStyle(el).visibility !== 'hidden')
          .map((el) => ({ text: el.textContent, rect: el.getBoundingClientRect() }));
        const overlaps = [];
        for (let i = 0; i < labels.length; i++)
          for (let j = i + 1; j < labels.length; j++) {
            const a = labels[i].rect,
              b = labels[j].rect;
            if (a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1)
              overlaps.push([labels[i].text, labels[j].text]);
          }
        return {
          height: canvas.height,
          overlaps,
          clipped: labels
            .filter(({ rect: r }) => r.left < canvas.left - 1 || r.right > canvas.right + 1 || r.top < canvas.top - 1 || r.bottom > canvas.bottom + 1)
            .map((x) => x.text),
        };
      });
      initialHeight ??= report.height;
      expect(report.height).toBe(initialHeight);
      expect(report.overlaps, `step ${stage}: label overlap`).toEqual([]);
      expect(report.clipped, `step ${stage}: clipped label`).toEqual([]);
    }
  });

test('scalar-vector: the walker follows the route, and a four-direction compass follows the map', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'scalar-vector');
  await expect(fig.frame.locator('.sv-compass svg')).toHaveAttribute('role', 'img');
  expect(await fig.frame.locator('.sv-compass text').allTextContents()).toEqual(['উ', 'পূ', 'দ', 'প']);
  const readCompass = () =>
    fig.frame.evaluate(() => {
      const w = /** @type {any} */ (window);
      return w.figure._internals.compass.directions();
    });
  await fig.advance(100);
  let directions = await readCompass();
  expect(directions.n.y).toBeLessThan(-0.99);
  expect(directions.e.x).toBeGreaterThan(0.99);
  expect(directions.s.y).toBeGreaterThan(0.99);
  expect(directions.w.x).toBeLessThan(-0.99);
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(1100);
  expect((await fig.call('get')).busy).toBe(true);
  const position = await fig.frame.evaluate(async () => {
    const source = '/assets/scalar-vector/src/journey.js';
    const { JOURNEY, pointAt } = await import(source);
    const w = /** @type {any} */ (window);
    const app = w.figure,
      state = app.getState(),
      walker = app._internals.diagram.traveler;
    const expected = pointAt(state.journey.distance / JOURNEY.length);
    return {
      error: Math.hypot(walker.position.x - expected[0], walker.position.z + expected[1]),
      visible: walker.visible,
      box: app._internals.diagram.walkerBox(),
    };
  });
  expect(position.visible).toBe(true);
  expect(position.error).toBeLessThan(0.01);
  expect(position.box.bottom - position.box.top).toBeGreaterThan(35);
  await fig.advance(2500);
  await fig.call('set', { stage: 2, view: '3d' });
  await expect(fig.frame.locator('.sv-meaning.scalar')).toContainText('১২০ m');
  await expect(fig.frame.locator('.sv-meaning.vector')).toContainText('২০ m উত্তর দিকে');
  await fig.frame.evaluate(() => {
    const w = /** @type {any} */ (window);
    const { stage } = w.figure._internals;
    stage.camera.position.copy(stage.controls.target).add({ x: 100, y: 200, z: 0 });
    stage.camera.lookAt(stage.controls.target);
    stage.controls.update();
    stage.invalidate();
  });
  await fig.advance(150);
  directions = await readCompass();
  expect(directions.n.x).toBeGreaterThan(0.99);
  expect(Math.abs(directions.n.y)).toBeLessThan(0.01);
  expect(directions.e.y).toBeGreaterThan(0.99);
  await fig.call('practice');
  await fig.advance(100);
  expect((await readCompass()).n.y).toBeLessThan(-0.99);
  expect(log.errors).toEqual([]);
});
