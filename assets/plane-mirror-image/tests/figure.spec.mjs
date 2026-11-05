// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the three
// steps built in the book's order, the optics read back from the rays, the mirror's edges, the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('plane-mirror-image: the three steps', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'plane-mirror-image');
  const act = async (ms = 1400) => {
    await fig.frame.locator('.pvc-act').first().click();
    await fig.advance(ms);
  };
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'distance', stage: 0, d: 1, xp: 1, xpImage: 1 });

  // one thing at a time: the image, the distances, a move, the lengths
  await act();
  expect((await fig.call('get')).stage).toBe(1);
  await fig.advance(600);
  await act();
  expect((await fig.call('get')).stage).toBe(2);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('১.০০');
  await fig.advance(600);
  await act(1800);
  st = await fig.call('get');
  expect(st.stage).toBe(3);
  expect(st.d).not.toBe(1);
  expect(st.xp).toBe(st.xpImage);
  for (const d of [0.5, 0.85, 2]) {
    st = await fig.call('set', { d, animate: false });
    expect(st).toMatchObject({ xp: d, xpImage: d });
  }
  await act();
  expect((await fig.call('get')).stage).toBe(4);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('১.৫');
  await fig.advance(600);
  await act();
  st = await fig.call('get');
  expect(st).toMatchObject({ step: 'rays', ray: 0, frame: 'pair' });

  // the rays: the law read back from them, at every distance, and their extensions reach the image
  for (const ray of [1, 2, 3, 4]) {
    await act();
    expect((await fig.call('get')).ray).toBe(ray);
    await fig.advance(800);
  }
  st = await fig.call('get');
  expect(st.frame).toBe('all');
  await expect(fig.frame.locator('.pvc-rule')).toContainText('অবাস্তব প্রতিবিম্ব');
  for (const d of [0.5, 1, 2]) {
    st = await fig.call('set', { d, animate: false });
    expect(st.head.thetaR).toBeCloseTo(st.head.thetaI, 6);
    expect(st.feet.thetaR).toBeCloseTo(st.feet.thetaI, 6);
    expect(st.head.miss).toBeCloseTo(0, 6);
    expect(st.feet.miss).toBeCloseTo(0, 6);
    expect(st.head.y).toBeCloseTo(st.height, 6);
    expect(st.feet.y).toBeCloseTo(0, 6);
  }

  // চিত্র ৮.১২: too short, then found; the same at 10 m
  await fig.call('set', { d: 1, animate: false });
  await fig.advance(300);
  await act(1800);
  st = await fig.call('get');
  expect(st).toMatchObject({ step: 'length', seesHead: false, seesFeet: false, eyeView: true, d: 1 });
  await act(1500);
  st = await fig.call('get');
  expect(st).toMatchObject({ seesHead: false, seesFeet: true, bottom: 0.7 });
  await act(2000);
  st = await fig.call('get');
  expect(st).toMatchObject({ seesHead: true, seesFeet: true, top: 1.45, bottom: 0.7, length: 0.75, frame: 'half' });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('০.৭৫');
  await act(2400);
  st = await fig.call('get');
  expect(st).toMatchObject({ d: 10, far: true, seesHead: true, seesFeet: true, length: 0.75 });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('অর্ধেক');

  // a mirror that loses the feet says so
  st = await fig.call('set', { d: 1, bottom: 0.9, animate: false });
  expect(st).toMatchObject({ seesFeet: false, seesHead: true });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('পা দেখা যাচ্ছে না');

  // never "half" or "at half the eye's height" when it is not so
  st = await fig.call('set', { d: 1, top: 1.45, bottom: 0.5, animate: false });
  await fig.advance(1500);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('দরকারের চেয়ে বড়');
  await expect(fig.frame.locator('.pvc-anno', { hasText: '০.৯৫ m' })).not.toContainText('অর্ধেক');
  await fig.call('set', { top: 1.2, bottom: 0.45, animate: false });
  await fig.advance(600);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('দরকারের চেয়ে নিচে');
  await fig.call('set', { top: 1.6, bottom: 0.9, animate: false });
  await fig.advance(600);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('দরকারের চেয়ে উপরে');

  // the test started in the middle of a demonstration keeps what the demonstration was going to leave
  await fig.call('set', { top: 1.3, bottom: 0.92, animate: false });
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(300);
  await fig.call('practice');
  await fig.advance(800);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect((await fig.call('get')).bottom).toBe(0.7);

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'distance', stage: 0, d: 1 });
  expect(log.errors).toEqual([]);
});

test('plane-mirror-image: the test runs to its end and leaves the learn state as it was', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'plane-mirror-image', { params: { step: 'rays', ray: '4', d: '1.2' } });
  await fig.call('practice');
  const f = fig.frame;
  for (let i = 0; i < 5; i++) {
    await fig.advance(900);
    await expect(f.locator('.pvc-opt')).toHaveCount(4);
    await f.locator('.pvc-opt').first().click();
    await fig.advance(300);
    await expect(f.locator('.pvc-q-feedback')).not.toBeEmpty();
    await f.locator('[data-act="q-next"]').click();
  }
  await fig.advance(600);
  await expect(f.locator('.pvc-q-result')).toContainText('৫');
  await f.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'rays', ray: 4, d: 1.2, height: 1.5 });
  expect(log.errors).toEqual([]);
});
