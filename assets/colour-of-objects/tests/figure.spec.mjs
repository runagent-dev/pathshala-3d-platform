// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's
// sequence (white, red, green), what leaves each object in each light, the pixels of the 3D view, and the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

/** Average colour of a small box of a captured picture. */
function sample(page, src, spots) {
  return page.evaluate(
    async ({ src, spots }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      return spots.map(([x, y]) => {
        const d = g.getImageData(Math.round(x * img.width) - 3, Math.round(y * img.height) - 3, 7, 7).data;
        const sum = [0, 0, 0];
        for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) sum[k] += d[i + k];
        return sum.map((v) => v / (d.length / 4));
      });
    },
    { src, spots },
  );
}

test('colour-of-objects: the book in order, on one action', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'colour-of-objects');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  expect(await fig.call('get')).toMatchObject({ light: 'white', rays: false, toEye: ['red', 'green'] });

  // white light: every colour comes in, only red leaves the petal and only green the leaf
  await act();
  await fig.advance(3500);
  let st = await fig.call('get');
  expect(st).toMatchObject({ light: 'white', rays: true, busy: false });
  expect(st.band).toEqual(['violet', 'blue', 'green', 'yellow', 'orange', 'red']);
  expect(st.rose).toMatchObject({ looks: 'red', reflected: ['red'], arrow: true });
  expect(st.rose.absorbed).toEqual(['violet', 'blue', 'green', 'yellow', 'orange']);
  expect(st.leaf).toMatchObject({ looks: 'green', reflected: ['green'], arrow: true });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('শোষণ');

  // red light: one band; the leaf gives nothing back
  await act();
  await fig.advance(3200);
  st = await fig.call('get');
  expect(st).toMatchObject({ light: 'red', band: ['red'], toEye: ['red'] });
  expect(st.rose).toMatchObject({ looks: 'red', arrow: true });
  expect(st.leaf).toMatchObject({ looks: 'black', reflected: [], arrow: false });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('কালো');

  // green light: now the rose
  await act();
  await fig.advance(3200);
  st = await fig.call('get');
  expect(st).toMatchObject({ light: 'green', band: ['green'], toEye: ['green'] });
  expect(st.rose).toMatchObject({ looks: 'black', reflected: [], arrow: false });
  expect(st.leaf).toMatchObject({ looks: 'green', arrow: true });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('কুচকুচে কালো');

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ light: 'white', rays: false, mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('colour-of-objects: the 3D view really turns the rose and the leaf black, and the band is in a capture', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'colour-of-objects');
  await fig.advance(300);
  // the outer petals at the bloom's lower right, and the blade of the main leaf (no band over them with rays off)
  const at = { bloom: [0.56, 0.52], leaf: [0.66, 0.84] };
  const shot = async (light, rays = false) => {
    await fig.call('set', { light, rays, animate: false });
    await fig.advance(200);
    return fig.call('capture', { width: 844, height: 390 });
  };
  const [roseW, leafW] = await sample(page, await shot('white'), [at.bloom, at.leaf]);
  expect(roseW[0]).toBeGreaterThan(90);
  expect(roseW[1]).toBeLessThan(50);
  expect(leafW[1]).toBeGreaterThan(50);
  expect(leafW[0]).toBeLessThan(45);
  const [roseG, leafG] = await sample(page, await shot('green'), [at.bloom, at.leaf]);
  expect(Math.max(...roseG)).toBeLessThan(48); // black: nothing leaves it
  expect(leafG[1]).toBeGreaterThan(50);
  const [roseR, leafR] = await sample(page, await shot('red'), [at.bloom, at.leaf]);
  expect(roseR[0]).toBeGreaterThan(90);
  expect(Math.max(...leafR)).toBeLessThan(48);
  // a capture carries the drawing: the arrows' red is in the picture, not only on the screen
  const png = await shot('white', true);
  const red = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, 60).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 90 && d[i + 2] < 90) n++;
    return n;
  }, png);
  expect(red).toBeGreaterThan(40);
  expect(log.errors).toEqual([]);
});

test('colour-of-objects: the words choose the light, and the test gives back the learn view', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'colour-of-objects');
  await fig.frame.locator('[data-example="green"]').click();
  await fig.advance(3500);
  expect(await fig.call('get')).toMatchObject({ light: 'green', rays: true });
  // a change half way: the last one wins, and nothing is left over from the first
  await fig.frame.locator('[data-example="red"]').click();
  await fig.advance(300);
  await fig.frame.locator('[data-example="white"]').click();
  await fig.advance(3500);
  const st = await fig.call('get');
  expect(st).toMatchObject({ light: 'white', busy: false });
  expect(st.band.length).toBe(6);
  await fig.frame.locator('.pvc').first().press('ArrowRight');
  await fig.advance(3500);
  expect((await fig.call('get')).light).toBe('red');

  await fig.call('practice');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ mode: 'quiz', locked: true });
  for (let i = 0; i < 5; i++) {
    await fig.advance(900);
    await fig.frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(300);
    expect(['ok', 'bad']).toContain(await fig.frame.locator('.pvc-q-feedback').getAttribute('data-tone'));
    await fig.advance(2800);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(900);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(900);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', light: 'red', rays: true, busy: false, locked: false });
  expect(log.errors).toEqual([]);
});
