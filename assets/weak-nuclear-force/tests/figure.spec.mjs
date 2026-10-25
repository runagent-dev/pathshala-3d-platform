// Weak nuclear force through the bridge (book p68, topic 3.2.3): the β emission turns a neutron into a proton as the
// electron leaves (protons 6 → 7, neutrons 8 → 7), the zoom goes into the neutron (the scale bar shows 10⁻¹⁸ m) and
// out to the atom, "β" pressed far from the nucleus first goes back to it, and the test runs by tapping.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('weak-nuclear-force: β emission, the three stops, the test', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'weak-nuclear-force');
  const frame = page.frames().find((f) => f.url().includes('/assets/weak-nuclear-force/'));

  expect(await fig.call('get')).toMatchObject({ stop: 'nucleus', beta: null, protons: 6, neutrons: 8, electrons: 0, flying: false });

  // the β emission, slowed down: the neutron changes, the electron leaves, then it is over
  await fig.call('set', { beta: true });
  expect(await fig.call('get')).toMatchObject({ beta: 'change', protons: 6, neutrons: 8 });
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ beta: 'fly', protons: 7, neutrons: 7, electrons: 1 });
  await fig.advance(2600);
  const done = await fig.call('get');
  expect(done).toMatchObject({ beta: 'done', protons: 7 });
  expect(done.flight).toBeGreaterThan(1); // the electron stops inside the view, not off its edge
  expect(done.flight).toBeLessThan(16);
  await expect(frame.locator('[data-act="beta"]')).toContainText('আবার'); // check:allow-bangla "again"
  // the force's label was there with the spark; now the changed ball says what happened to it
  await expect(frame.locator('.pvc-anno.in', { hasText: 'প্রোটন' }).last()).toContainText('→'); // check:allow-bangla

  // into the neutron: a fresh nucleus, and the scale bar at the weak force's reach
  await fig.call('set', { stop: 'reach', animate: false });
  expect(await fig.call('get')).toMatchObject({ stop: 'reach', beta: null, protons: 6, scale: -18 });

  // out to the atom, flying through the powers of ten
  await fig.call('set', { stop: 'atom' });
  expect((await fig.call('get')).flying).toBe(true);
  await fig.advance(6500); // slowly out of the neutron, then quickly to the atom
  expect(await fig.call('get')).toMatchObject({ stop: 'atom', flying: false });

  // "β" at the atom: the zoom goes back to the nucleus first, then it plays
  await frame.locator('[data-act="beta"]').click();
  await fig.advance(3000);
  const back = await fig.call('get');
  expect(back.stop).toBe('nucleus');
  expect(['change', 'fly']).toContain(back.beta);

  // the test: five questions, answered by tapping
  await fig.call('practice');
  await fig.advance(3000);
  expect((await fig.call('get')).mode).toBe('quiz');
  for (let i = 0; i < 5; i++) {
    await frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(600);
    await expect(frame.locator('.pvc-q-feedback')).not.toHaveAttribute('data-tone', '');
    await frame.locator('[data-act="q-next"]').click();
    await fig.advance(3000);
  }
  await expect(frame.locator('.pvc-q-result')).toBeVisible();

  await fig.call('reset');
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ stop: 'nucleus', beta: null, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});
