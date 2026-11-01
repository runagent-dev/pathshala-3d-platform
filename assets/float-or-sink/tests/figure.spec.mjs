// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// wood floats half under with buoyancy = weight, the brick sinks and the floor holds up W − B, the tin stays where it
// is put; the book's উদাহরণ gives 50% for wood (V₁/V = ρ/ρw) and the other materials theirs; the submarine sinks with
// full tanks, stays at its depth with half, floats with none; the action button walks the steps; the test runs.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/float-or-sink/'));

test('float-or-sink: the three cases, the worked example and the submarine come out as the book says', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'float-or-sink');
  const start = await fig.call('get');
  expect(start).toMatchObject({ step: 'cases', next: 'drop_wood', material: 'wood', rho: 500, percent: 50 });
  for (const id of ['wood', 'brick', 'tin']) expect(start.cases[id].status).toBe('held');

  // all three let go: wood floats half under, the brick sinks (the floor holds up 19.6 − 9.8 N), the tin stays
  const cases = (await fig.call('set', { release: 'all', animate: false })).cases;
  expect(cases.wood).toMatchObject({ status: 'floats', W: 4.9, B: 4.9, N: 0, under: 50 });
  expect(cases.brick).toMatchObject({ status: 'sinks', W: 19.6, B: 9.8, N: 9.8, y: 0, under: 100 });
  expect(cases.tin).toMatchObject({ status: 'stays', W: 9.8, B: 9.8, N: 0, under: 100 });

  // the worked example: 50% for the book's wood, then ice and brick
  const wood = await fig.call('set', { step: 'wood', drop: true, animate: false });
  expect(wood).toMatchObject({ step: 'wood', dropped: true, percent: 50 });
  expect(wood.block).toMatchObject({ status: 'floats', W: 4.9, B: 4.9, under: 50 });
  const ice = await fig.call('set', { material: 'ice', animate: false });
  expect(ice.block).toMatchObject({ status: 'floats', under: 92 });
  expect(ice.percent).toBe(92);
  const brick = await fig.call('set', { material: 'brick', animate: false });
  expect(brick.block).toMatchObject({ status: 'sinks', under: 100, N: 9.8 });

  // the submarine: full tanks sink it, half full it stays where it is, empty it floats
  const sub0 = await fig.call('set', { step: 'sub', animate: false });
  expect(sub0.sub).toMatchObject({ status: 'floats', ballast: 0, W: 7.84, B: 7.84 });
  const sunk = await fig.call('set', { sub: 'fill', animate: false });
  expect(sunk.sub).toMatchObject({ status: 'sinks', ballast: 0.4, y: 0 });
  const hover = await fig.call('set', { sub: 'hover', animate: false });
  expect(hover.sub).toMatchObject({ ballast: 0.2, W: 9.8, B: 9.8 });
  const up = await fig.call('set', { sub: 'blow', animate: false });
  expect(up.sub).toMatchObject({ status: 'floats', ballast: 0 });

  await fig.call('reset');
  const reset = await fig.call('get');
  expect(reset).toMatchObject({ step: 'cases', material: 'wood', dropped: false, view: 'front', mode: 'explore' });
  expect(reset.cases.brick.status).toBe('held');
  expect(log.errors).toEqual([]);
});

test('float-or-sink: the action drops them one by one, the tin stays at a new depth, the submarine hovers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'float-or-sink');
  const frame = frameOf(page);
  const act = frame.locator('.pvc-act');
  await act.click(); // the wood
  await fig.advance(6000);
  expect((await fig.call('get')).cases.wood.status).toBe('floats');
  await act.click(); // the brick
  await fig.advance(3000);
  expect((await fig.call('get')).cases.brick.status).toBe('sinks');
  await act.click(); // the tin is put under water and let go
  await fig.advance(3000);
  const placed = await fig.call('get');
  expect(placed.cases.tin.status).toBe('stays');
  expect(placed.next).toBe('move_tin');
  await act.click(); // another depth: it stays there too
  await fig.advance(3000);
  const moved = await fig.call('get');
  expect(moved.cases.tin.status).toBe('stays');
  expect(Math.abs(moved.cases.tin.y - placed.cases.tin.y)).toBeGreaterThan(0.08);
  expect(moved.found).toMatchObject({ wood: true, brick: true, tin: true, move: true });

  // the row of words: the example; a tap on a material word
  await frame.locator('[data-example="wood"]').click();
  await fig.advance(1200);
  await act.click();
  await fig.advance(6000);
  expect((await fig.call('get')).block.status).toBe('floats');
  await frame.locator('[data-mat="cork"]').click();
  await fig.advance(6000);
  expect((await fig.call('get')).block).toMatchObject({ status: 'floats', under: 24 });

  // the submarine: take water in, then make W = B on the way down: it stops part way
  await frame.locator('[data-example="sub"]').click();
  await fig.advance(1200);
  await act.click();
  await fig.advance(1500);
  expect((await fig.call('get')).next).toBe('sub_hover');
  await act.click();
  await fig.advance(8000);
  const sub = (await fig.call('get')).sub;
  expect(sub).toMatchObject({ status: 'stays', ballast: 0.2 });
  expect(sub.y).toBeGreaterThan(0.01);
  expect(sub.y).toBeLessThan(0.3);

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
  expect((await fig.call('get')).mode).toBe('explore');
  expect(log.errors).toEqual([]);
});
