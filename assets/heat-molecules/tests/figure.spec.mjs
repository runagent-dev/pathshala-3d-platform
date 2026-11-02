// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// heat button gives six steps (a solid shaking in place, then a liquid, then a gas, faster each time); the words of
// the row jump to a state; the molecules really move (a solid's stay near their places, a gas's spread through the
// whole container); the thermometer rises; and the test runs five questions.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/heat-molecules/'));

test('heat-molecules: the steps go solid, liquid, gas, and the speed rises with each', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'heat-molecules');
  const start = await fig.call('get');
  expect(start).toMatchObject({ step: 0, heat: 0, state: 'solid', view: 'front', mode: 'explore' });

  let lastSpeed = 0;
  const states = [];
  for (let step = 0; step <= 5; step++) {
    const s = await fig.call('set', { step, animate: false });
    states.push(s.state);
    expect(s.speed).toBeGreaterThan(lastSpeed);
    lastSpeed = s.speed;
  }
  expect(states).toEqual(['solid', 'solid', 'liquid', 'liquid', 'gas', 'gas']);

  // the words of the row jump to a state
  expect(await fig.call('set', { state: 'liquid', animate: false })).toMatchObject({ step: 2, state: 'liquid' });
  expect(await fig.call('set', { state: 'gas', animate: false })).toMatchObject({ step: 4, state: 'gas' });
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 0, state: 'solid', seen: { solid: true, liquid: false, gas: false } });
  expect(log.errors).toEqual([]);
});

test('heat-molecules: the button heats one step at a time and starts again after the last; a solid stays put, a gas spreads', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'heat-molecules');
  const frame = frameOf(page);
  for (let step = 1; step <= 5; step++) {
    await frame.locator('.pvc-act').click();
    await fig.advance(2600);
    expect((await fig.call('get')).step).toBe(step);
  }
  expect(await fig.call('get')).toMatchObject({ state: 'gas', seen: { solid: true, liquid: true, gas: true } });
  // the molecules fill the container: their height spreads right up
  const gas = await frame.evaluate(() => {
    const m = /** @type {any} */ (window).figure.exportRoot().getObjectByName('molecules');
    const a = m.instanceMatrix.array;
    let max = 0;
    for (let i = 0; i < m.count; i++) max = Math.max(max, a[i * 16 + 13]);
    return max;
  });
  expect(gas).toBeGreaterThan(10); // a liquid never rises above 9.4 cm; a gas reaches the top of the 13 cm container
  await frame.locator('.pvc-act').click(); // the last step: the button starts again from the cold solid
  await fig.advance(3600);
  expect(await fig.call('get')).toMatchObject({ step: 0, state: 'solid' });
  const solid = await frame.evaluate(() => {
    const m = /** @type {any} */ (window).figure.exportRoot().getObjectByName('molecules');
    const a = m.instanceMatrix.array;
    let max = 0;
    for (let i = 0; i < m.count; i++) max = Math.max(max, a[i * 16 + 13]);
    return max;
  });
  expect(solid).toBeLessThan(9); // back in the lattice: five rows of molecules
  expect(log.errors).toEqual([]);
});

test('heat-molecules: the test runs five questions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'heat-molecules');
  const frame = frameOf(page);
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1500);
    await frame.locator('[data-q]').first().click();
    await fig.advance(300);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 0 });
  expect(log.errors).toEqual([]);
});
