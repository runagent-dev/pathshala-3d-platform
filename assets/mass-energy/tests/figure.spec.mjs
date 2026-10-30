// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged):
// the split's masses and energy as the book's E = mc², the chain's 1 → 3 → 9, the fuel and the power plant.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('mass-energy: the split, the chain and the power plant follow E = mc²', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'mass-energy');
  // before the neutron arrives: the book's left side, nothing split
  let st = await fig.call('get');
  expect(st).toMatchObject({ scene: 'one', t: 0, left: 236.0526, right: 235.8667, defect: 0.1859, split: false });
  expect(st.energyPerSplit).toBeCloseTo(2.778e-11, 13);
  // scrubbed past the split: one nucleus has split
  st = await fig.call('set', { t: 6.6 });
  expect(st).toMatchObject({ split: true, splits: 1 });
  // the chain: 1, then 1 + 3, then 1 + 3 + 9
  st = await fig.call('set', { scene: 'chain', t: 3.2, animate: false });
  expect(st.splits).toBe(1);
  st = await fig.call('set', { t: 7 });
  expect(st.splits).toBe(4);
  st = await fig.call('set', { t: st.duration });
  expect(st.splits).toBe(13);
  // the power plant: 1 g split → 7.12 × 10¹⁰ J, about 23 years of a 100 W bulb; all of 1 kg → 9 × 10¹⁶ J
  st = await fig.call('set', { scene: 'plant', run: true, animate: false });
  expect(st).toMatchObject({ scene: 'plant', on: true, power: 1, m: 1, part: 'fission' });
  expect(st.E).toBeCloseTo(7.118e10, -7);
  expect(Math.round(st.bulbYears)).toBe(23);
  st = await fig.call('set', { m: 1000, part: 'full' });
  expect(st.E).toBe(9e16);
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ scene: 'one', t: 0, m: 1, part: 'fission', on: false });
  expect(log.errors).toEqual([]);
});
