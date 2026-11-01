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
  await expect(fig.frame.locator('.pvc-anno').filter({ hasText: 'ছেলের বেগ' })).toHaveCount(0);
  await expect(fig.frame.locator('.pvc-anno').filter({ hasText: 'নৌকার বেগ' })).toHaveCount(1);
  await fig.call('set', { example: 'apple', at: 0.2 });
  s = await fig.call('get');
  expect(s).toMatchObject({ example: 'apple', phase: 'fall', force: 9.8, arrows: { onApple: true, onEarth: true } });
  expect(s.acceleration.earth).toBeCloseTo(1.64e-24, 26);
  const maths = await fig.frame.locator('.nt-equations').textContent();
  expect(maths).toContain('পৃথিবী টানে আপেলকে');
  expect(maths).toContain('আপেল টানে পৃথিবীকে');
  expect(maths).not.toContain('a = F/M');
  expect(maths).not.toContain('G =');
  await fig.frame.locator('[data-act="maths-open"]').click();
  await expect(fig.frame.locator('.nt-math-dialog')).toBeVisible();
  const full = await fig.frame.locator('.nt-dialog-maths').textContent();
  expect(full).toContain('aM = F/M = (m/M)g');
  expect(full).toContain('G =');
  await fig.frame.locator('.nt-math-dialog').press('Escape');
  await expect(fig.frame.locator('.nt-math-dialog')).not.toBeVisible();
  expect(full).toContain('১.৬৪');
  expect(full).toContain('−২৪');
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
  test.setTimeout(240000);
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
      let appleStage = null;
      for (const state of [
        { example: 'boat', at: 0 },
        { example: 'boat', at: 0.2 },
        { example: 'boat', at: 0.55 },
        { example: 'apple', at: 0.2 },
        { example: 'apple', at: 0.43, lessonStep: 1 },
        { example: 'apple', at: 0.43, lessonStep: 2 },
        { example: 'apple', at: 0.43, lessonStep: 2, answer: 'force' },
        { example: 'apple', at: 0.43, lessonStep: 2, answer: 'mass' },
      ]) {
        const { answer, ...setup } = state;
        await fig.call('set', setup);
        if (answer) await fig.frame.locator(`[data-reason="${answer}"]`).click();
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
          const content = document.querySelector('.nt-lesson-content');
          if (content && content.scrollHeight > content.clientHeight + 1)
            bad.push({
              text: 'lesson content overflows',
              width: content.clientWidth,
              scroll: content.scrollHeight - content.clientHeight,
              bottom: content.getBoundingClientRect().bottom,
            });
          return { bad, overflow: p.scrollHeight - p.clientHeight, stage: document.querySelector('.pvc-stage').getBoundingClientRect().height };
        });
        expect(report.bad, `${lang} ${width}×${height} ${state.example}`).toEqual([]);
        expect(report.overflow).toBeLessThanOrEqual(1);
        expect(report.stage).toBeGreaterThan(160);
        if (state.example === 'apple') {
          if (appleStage === null) appleStage = report.stage;
          expect(report.stage).toBeCloseTo(appleStage, 0);
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

test('third law: shoes grip the pitching boat until takeoff rather than sliding', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'newtons-third-law');
  const measure = () =>
    fig.frame.evaluate(async () => {
      const { Vector3 } = await import('three');
      const root = /** @type {any} */ (window).figure.exportRoot();
      root.updateMatrixWorld(true);
      const boat = root.getObjectByName('WoodenBoat');
      return {
        pitch: boat.rotation.z,
        shoes: ['RightSole', 'LeftSole'].map((name) => {
          const sole = root.getObjectByName(name);
          const world = sole.localToWorld(new Vector3(0, -0.009, 0));
          return { world: world.toArray(), onBoat: boat.worldToLocal(world.clone()).toArray() };
        }),
      };
    });
  const start = await measure();
  for (const at of [0.05, 0.15, 0.25, 0.35]) {
    await fig.call('set', { at });
    const sample = await measure();
    for (let foot = 0; foot < 2; foot++) {
      expect(sample.shoes[foot].onBoat[1]).toBeCloseTo(0.34, 4);
      for (let axis = 0; axis < 3; axis++) expect(sample.shoes[foot].onBoat[axis]).toBeCloseTo(start.shoes[foot].onBoat[axis], 4);
    }
    expect(sample.pitch).toBeLessThan(start.pitch);
  }
  const takeoff = await measure();
  await fig.call('set', { at: 0.350001 });
  const released = await measure();
  for (let foot = 0; foot < 2; foot++)
    for (let axis = 0; axis < 3; axis++) expect(released.shoes[foot].world[axis]).toBeCloseTo(takeoff.shoes[foot].world[axis], 4);
  await fig.call('set', { at: 0.65 });
  const air = await measure();
  expect(air.shoes[0].onBoat[1]).toBeGreaterThan(0.5);
  expect(Math.abs(air.pitch)).toBeLessThan(Math.abs(takeoff.pitch));
  await fig.call('reset');
  expect(await measure()).toEqual(start);
  expect(log.errors).toEqual([]);
});

test('third law: a guided fall, equal-force comparison and retryable mass question teach the apple example', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'newtons-third-law');
  await fig.call('set', { example: 'apple' });
  const action = fig.frame.locator('.pvc-act');
  await expect(fig.frame.locator('.nt-progress [aria-current]')).toContainText('পতন');
  const stageHeight = await fig.frame.locator('.pvc-stage').evaluate((el) => el.clientHeight);
  await expect(fig.frame.locator('.nt-pull-row b')).toHaveCount(0);
  await action.click();
  await fig.advance(1000);
  const state = await fig.call('get');
  expect(state.playing).toBe(true);
  expect(state.time).toBeLessThan(0.3);
  expect(state.arrows).toEqual({ onApple: true, onEarth: true });
  const trail = await fig.frame.evaluate(() => {
    const root = /** @type {any} */ (window).figure.exportRoot();
    return {
      visible: root.getObjectByName('FallTrail').visible,
      start: root.getObjectByName('AppleStart').position.y,
      now: root.getObjectByName('Apple').position.y,
    };
  });
  expect(trail.visible).toBe(true);
  expect(trail.now).toBeLessThan(trail.start);
  await fig.frame.locator('[data-act="maths-open"]').click();
  const paused = (await fig.call('get')).time;
  await fig.advance(500);
  expect((await fig.call('get')).time).toBe(paused);
  await fig.frame.locator('.nt-math-dialog').press('Escape');
  // the dialog's close event (which restarts the fall) is queued on the browser's own clock, not the virtual one: on a slow
  // machine advancing at once would run before it, and the fall would not move
  await expect.poll(async () => (await fig.call('get')).playing, { timeout: 15_000 }).toBe(true);
  await fig.advance(2200);
  expect(await fig.call('get')).toMatchObject({ done: true, playing: false, lesson: { step: 0, reason: null } });
  await expect(action).toContainText('বল দুটি তুলনা');
  await action.click();
  await fig.advance(500);
  expect((await fig.call('get')).lesson.step).toBe(1);
  await expect(fig.frame.locator('.nt-pull-row b')).toHaveText(['৯.৮ N', '৯.৮ N']);
  await action.click();
  await fig.advance(500);
  expect((await fig.call('get')).lesson.step).toBe(2);
  await expect(action).toBeDisabled();
  await fig.frame.locator('[data-reason="force"]').click();
  await expect(fig.frame.locator('.nt-reason-feedback')).toContainText('বল কম নয়');
  await expect(fig.frame.locator('[data-reason="mass"]')).toBeFocused();
  expect((await fig.call('get')).arrows).toEqual({ onApple: true, onEarth: true });
  await fig.frame.locator('[data-reason="mass"]').press('Enter');
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('ঠিক');
  await expect(fig.frame.locator('.nt-lesson-content')).toContainText('a = F/m');
  await expect(fig.frame.locator('.nt-lesson-content')).not.toContainText('−২৪');
  await expect(action).toBeFocused();
  expect((await fig.call('get')).lesson).toEqual({ step: 2, reason: 'mass' });
  expect(await fig.frame.locator('.pvc-stage').evaluate((el) => el.clientHeight)).toBe(stageHeight);
  await action.click();
  expect(await fig.call('get')).toMatchObject({ playing: true, lesson: { step: 0, reason: null } });
  await fig.call('set', { home: true });
  expect(await fig.call('get')).toMatchObject({ time: 0, playing: false, lesson: { step: 0, reason: null } });
  await expect(fig.frame.locator('[data-reason]')).toHaveCount(0);
  expect(log.errors).toEqual([]);
});

test('third law: gravity cards stay outside their own shafts without crossed leaders', async ({ page }) => {
  test.setTimeout(240000);
  const log = await preparePage(page);
  for (const lang of ['bn', 'en'])
    for (const [width, height] of [
      [390, 700],
      [390, 520],
      [844, 390],
      [640, 400],
      [800, 500],
      [1280, 800],
      [1000, 1100],
    ]) {
      await page.setViewportSize({ width, height });
      const fig = await openFigure(page, 'newtons-third-law', { params: { lang, example: 'apple' } });
      for (const view of ['front', '3d'])
        for (const lessonStep of [0, 1]) {
          await fig.call('set', { view, at: 0.43, lessonStep });
          await fig.advance(150);
          const cards = await fig.frame.evaluate(() => {
            const svg = document.querySelector('.pvc-anno-lines');
            const origin = svg.getBoundingClientRect();
            const lines = [...svg.querySelectorAll('line')]
              .filter((line) => line.style.visibility !== 'hidden')
              .map((line) => Object.fromEntries(['x1', 'x2', 'y1', 'y2'].map((key) => [key, Number(line.getAttribute(key))])));
            return [...document.querySelectorAll('.nt-gravity-label')].flatMap((span) => {
              const el = span.closest('.pvc-anno');
              if (getComputedStyle(el).visibility === 'hidden') return [];
              const r = el.getBoundingClientRect();
              const box = { left: r.left - origin.left, right: r.right - origin.left, top: r.top - origin.top, bottom: r.bottom - origin.top };
              const leaders = lines.filter(
                (line) => line.x2 >= box.left - 1 && line.x2 <= box.right + 1 && line.y2 >= box.top - 1 && line.y2 <= box.bottom + 1,
              );
              return [{ body: span.getAttribute('data-force-body'), ...box, leaders }];
            });
          });
          for (const card of cards) {
            expect(card.leaders, `${lang} ${width} ${view} ${card.body}`).toHaveLength(1);
            const leader = card.leaders[0];
            // Every leader stays horizontal and reaches the card's near edge from its own shaft.
            expect(Math.abs(leader.y1 - leader.y2)).toBeLessThan(1);
            expect(card.right <= leader.x1 - 8 || card.left >= leader.x1 + 8).toBe(true);
          }
          if (cards.length === 2) {
            const ordered = cards.toSorted((a, b) => a.leaders[0].x1 - b.leaders[0].x1);
            expect(ordered[0].right).toBeLessThan(ordered[0].leaders[0].x1);
            expect(ordered[1].left).toBeGreaterThan(ordered[1].leaders[0].x1);
            expect(ordered[0].leaders[0].x1).toBeLessThan(ordered[1].leaders[0].x1);
          }
          if (view === 'front' && width >= 800) expect(cards, `${lang} ${width}×${height}`).toHaveLength(2);
          if (lessonStep === 1) {
            await expect(fig.frame.locator('.nt-pull-row')).toHaveCount(2);
            await expect(fig.frame.locator('.nt-pull-row b')).toHaveText(lang === 'bn' ? ['৯.৮ N', '৯.৮ N'] : ['9.8 N', '9.8 N']);
          }
        }
    }
  expect(log.errors).toEqual([]);
});
