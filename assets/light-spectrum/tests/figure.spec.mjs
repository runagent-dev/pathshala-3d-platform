// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's
// steps on one action, the marker, the words, the test with its scoring, and leaving the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const settled = async (fig) => {
  for (let i = 0; i < 80; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the step never ended');
};

test('light-spectrum: the six steps on one action', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  const outcome = fig.frame.locator('.pvc-outcome');
  let st = await fig.call('get');
  expect(st.show).toBe('none');
  expect(st.done).toEqual([]);
  await expect(outcome).toContainText('?');

  for (const [i, name] of ['light', 'grooves', 'sweep', 'ir', 'uv', 'all'].entries()) {
    await act();
    await settled(fig);
    st = await fig.call('get');
    expect(st.show).toBe(name);
    expect(st.done.length).toBe(i + 1);
    if (name === 'sweep') {
      expect(st.nm).toBe(700);
      expect(st.marker).toBe(true);
      await expect(outcome).toContainText('৭০০ nm');
    }
    if (name === 'ir') {
      expect(st.kind).toBe('ir');
      expect(st.visible).toBe(false);
      await expect(outcome).toContainText('অবলোহিত');
    }
    if (name === 'uv') {
      expect(st.kind).toBe('uv');
      await expect(outcome).toContainText('অতিবেগুনী');
    }
    if (name === 'all') {
      expect(st.marker).toBe(false);
      await expect(outcome).toContainText('৪০০ থেকে ৭০০ nm');
    }
  }

  // a word chooses a colour, and the wrong order still works from the start
  await fig.frame.locator('[data-act="home"]').click();
  await fig.advance(1000);
  st = await fig.call('get');
  expect(st.done).toEqual([]);
  await fig.frame.locator('[data-example="green"]').click();
  await settled(fig);
  st = await fig.call('get');
  expect(st.kind).toBe('green');
  expect(st.nm).toBe(530);
  expect(st.marker).toBe(true);
  expect(st.done).toEqual(['light']);
  await expect(fig.frame.locator('[data-example="green"]')).toHaveAttribute('aria-checked', 'true');
  expect(log.errors).toEqual([]);
});

test('light-spectrum: a drag on the band and the arrow keys move the marker; the panel follows', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
  await fig.call('set', { show: 'wave', nm: 550, animate: false });
  await fig.advance(600);
  const box = await fig.frame.locator('.lab-draw').boundingBox();
  const to = (fx, fy, options) => page.mouse.move(box.x + box.width * fx, box.y + box.height * fy, options);
  // a little left of the middle of the view: the band; up is a longer wavelength
  await to(0.42, 0.5);
  await page.mouse.down();
  await fig.advance(100);
  const first = (await fig.call('get')).nm;
  await to(0.42, 0.3, { steps: 3 });
  await fig.advance(100);
  const up = (await fig.call('get')).nm;
  expect(up).toBeGreaterThan(first);
  await to(0.42, 0.7, { steps: 3 });
  await fig.advance(100);
  expect((await fig.call('get')).nm).toBeLessThan(first);
  await page.mouse.up();
  await fig.advance(200);
  const was = (await fig.call('get')).nm;
  await fig.frame
    .locator('#app')
    .focus()
    .catch(() => {});
  await page.keyboard.press('ArrowRight');
  await fig.advance(100);
  expect((await fig.call('get')).nm).toBe(was + 5);
  expect(log.errors).toEqual([]);
});

test('light-spectrum: set works at once, an interrupted step is not lost', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
  await fig.call('set', { show: 'light' });
  await fig.advance(300);
  await fig.call('set', { show: 'wave', nm: 620, animate: false });
  let st = await fig.call('get');
  expect(st.nm).toBe(620);
  expect(st.kind).toBe('red');
  expect(st.busy).toBe(false);
  expect(st.sensitivity).toBeCloseTo(0.381, 2);
  await fig.call('reset');
  await fig.advance(800);
  st = await fig.call('get');
  expect(st.show).toBe('none');
  expect(st.nm).toBe(550);
  expect(log.errors).toEqual([]);
});

test('light-spectrum: every right answer scores, and a wrong one does not', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
  const play = async (wrongAt) => {
    for (let i = 0; i < 5; i++) {
      await fig.advance(1500);
      const { question } = await fig.call('get');
      const right = fig.frame.locator(`.pvc-opt[data-q="${question.right}"]`);
      if (i === wrongAt) {
        const other = fig.frame.locator(`.pvc-opt[data-q="${(question.right + 1) % 4}"]`);
        await other.click();
        await expect(other).toHaveClass(/wrong/);
        await expect(fig.frame.locator('.pvc-q-feedback')).toContainText('হয়নি');
      } else {
        await right.click();
        await expect(fig.frame.locator('.pvc-q-feedback')).toContainText('ঠিক');
      }
      await expect(right).toHaveClass(/right/); // the right choice is marked either way
      await fig.advance(1200);
      await fig.frame.locator('[data-act="q-next"]').click();
    }
    await fig.advance(800);
  };
  await fig.call('practice');
  await play(-1);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে ৫টি');
  await fig.frame.locator('[data-act="q-again"]').click();
  await play(2);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে ৪টি');
  expect(log.errors).toEqual([]);
});

test('light-spectrum: leaving the test restores the learn state; a step cut short is not kept', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-spectrum');
  await fig.call('set', { show: 'wave', nm: 620, animate: false });
  await fig.call('practice');
  await fig.advance(1500);
  expect((await fig.call('get')).locked).toBe(true);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(1200);
  let st = await fig.call('get');
  expect(st.locked).toBe(false);
  expect(st.nm).toBe(620);
  expect(st.marker).toBe(true);

  await fig.call('reset');
  await fig.advance(600);
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(400);
  await fig.call('practice');
  await fig.advance(1500);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(1200);
  st = await fig.call('get');
  expect(st.done).toEqual([]);
  expect(st.show).toBe('none');
  await expect(fig.frame.locator('.pvc-act').first()).toContainText('সূর্যের আলো');

  // the sweep cut short by the test: no wavelength of the half-done sweep comes back
  await fig.call('set', { show: 'grooves', animate: false });
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(2500);
  expect((await fig.call('get')).busy).toBe(true);
  await fig.call('practice');
  await fig.advance(1500);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(1200);
  st = await fig.call('get');
  expect(st.nm).toBe(550);
  expect(st.marker).toBe(false);
  await expect(fig.frame.locator('.pvc-act').first()).toContainText('পর্যন্ত');
  expect(log.errors).toEqual([]);
});
