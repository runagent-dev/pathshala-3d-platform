// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): three
// balls of the same volume have the book's densities (cork 0.25, wood 0.45, iron 7.8 gm/cc); dropped in water, the
// cork and the wood float and the iron sinks; the box keeps its 100 gm while each squeeze halves the volume and doubles
// the density; the action button drops the balls one by one; and the test runs five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/density/'));

test('density: the same volume, different masses; the same mass, different volumes', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'density');
  const start = await fig.call('get');
  expect(start).toMatchObject({ show: 'cork', m: 25, V: 100, rho: 0.25, kgm3: 250, next: 'drop', box: { m: 100, V: 400, rho: 0.25 } });
  expect(start.balls).toMatchObject({
    cork: { m: 25, V: 100, rho: 0.25, where: 'table' },
    wood: { m: 45, V: 100, rho: 0.45, where: 'table' },
    iron: { m: 780, V: 100, rho: 7.8, where: 'table' },
  });

  // all three in the water at once
  const dropped = await fig.call('set', { drop: 'all', animate: false });
  for (const id of ['cork', 'wood', 'iron']) expect(dropped.balls[id].where).toBe('water');
  expect(dropped.found).toMatchObject({ cork: true, wood: true, iron: true });
  expect(dropped).toMatchObject({ show: 'iron', rho: 7.8, kgm3: 7800, next: 'box' });

  // the box: the same mass, half the volume each time, twice the density
  const box = await fig.call('set', { show: 'box', animate: false });
  expect(box).toMatchObject({ show: 'box', m: 100, V: 400, rho: 0.25 });
  const v200 = await fig.call('set', { V: 200, animate: false });
  expect(v200).toMatchObject({ m: 100, V: 200, rho: 0.5, found: { squeeze: true } });
  const v50 = await fig.call('set', { V: 50, animate: false });
  expect(v50).toMatchObject({ V: 50, rho: 2, kgm3: 2000, next: 'expand' });

  // the row of words chooses what the panel works out
  await frameOf(page).locator('[data-example="wood"]').click();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ show: 'wood', m: 45, V: 100, rho: 0.45 });

  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ show: 'cork', box: { V: 400 }, view: 'front', next: 'drop' });
  expect(reset.found).toEqual({ cork: false, wood: false, iron: false, squeeze: false });
  for (const id of ['cork', 'wood', 'iron']) expect(reset.balls[id].where).toBe('table');
  expect(log.errors).toEqual([]);
});

test('density: the button drops each ball in turn, then squeezes the box; the test runs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'density');
  const frame = frameOf(page);
  for (const id of ['cork', 'wood', 'iron']) {
    await frame.locator('.pvc-act').click();
    await fig.advance(800);
    expect((await fig.call('get')).balls[id].where).toBe('falling');
    await fig.advance(2600);
    const s = await fig.call('get');
    expect(s.balls[id].where).toBe('water');
    expect(s.show).toBe(id);
  }
  // then to the box, and a squeeze
  await frame.locator('.pvc-act').click();
  await fig.advance(1500);
  expect((await fig.call('get')).show).toBe('box');
  await frame.locator('.pvc-act').click();
  await fig.advance(1600);
  expect(await fig.call('get')).toMatchObject({ V: 200, rho: 0.5 });

  // the test: five questions, each answered
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1500);
    await frame.locator('[data-q]').first().click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  const back = await fig.call('get');
  expect(back).toMatchObject({ mode: 'explore', show: 'box', V: 200 });
  expect(back.balls.iron.where).toBe('water');
  expect(log.errors).toEqual([]);
});
