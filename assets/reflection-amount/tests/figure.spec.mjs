// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the action
// through the stops, the words, a drag on the glass, keys, leaving the test, and the test itself.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const settled = async (fig) => {
  for (let i = 0; i < 60; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the glass never stopped');
};

test("reflection-amount: the action lifts the glass through the stops, and the numbers are Fresnel's", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-amount');
  const act = fig.frame.locator('.pvc-act').first();
  let st = await fig.call('get');
  expect(st).toMatchObject({ angle: 30, reflected: 4, refractedShare: 96, seen: [30] });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৪%');
  const expected = [
    [60, 9],
    [80, 39],
    [87, 74],
  ];
  for (const [angle, reflected] of expected) {
    await act.click();
    await settled(fig);
    st = await fig.call('get');
    expect(st.angle).toBe(angle);
    expect(st.reflected).toBe(reflected);
  }
  expect(st.seen).toEqual([30, 60, 80, 87]);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('ফ্রেনেলের');
  await expect(fig.frame.locator('[data-example="a80"] .pvc-ex-res')).toContainText('৩৯%');
  // from the top the action brings it down
  await act.click();
  await settled(fig);
  expect((await fig.call('get')).angle).toBe(30);
  // a word goes straight to its angle; what was seen stays
  await fig.frame.locator('[data-example="a60"]').click();
  await settled(fig);
  st = await fig.call('get');
  expect(st.angle).toBe(60);
  expect(st.seen.length).toBe(4);
  await fig.frame.locator('[data-act="home"]').click();
  await fig.advance(1000);
  st = await fig.call('get');
  expect(st.angle).toBe(30);
  expect(st.seen).toEqual([30]);
  expect(log.errors).toEqual([]);
});

test('reflection-amount: set works at once, the keys step the angle, and a run can be cut short', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-amount');
  await fig.call('set', { angle: 80 });
  await fig.advance(300);
  await fig.call('set', { angle: 45, animate: false });
  let st = await fig.call('get');
  expect(st.angle).toBe(45);
  expect(st.busy).toBe(false);
  expect(st.reflected).toBe(5);
  await fig.call('set', { angle: 200, animate: false });
  expect((await fig.call('get')).angle).toBe(87);
  await fig.call('set', { angle: 50, animate: false });
  await fig.frame.locator('.pvc').first().focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Shift+ArrowDown');
  await fig.advance(100);
  st = await fig.call('get');
  expect(st.angle).toBe(47);
  await fig.call('reset');
  await fig.advance(800);
  st = await fig.call('get');
  expect(st.angle).toBe(30);
  expect(log.errors).toEqual([]);
});

test('reflection-amount: a drag on the glass lifts it by hand, and a tap on it is the action', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-amount', { params: { angle: '45' } });
  // the ring of the action is on the jack, under the glass
  const spot = async () => {
    await fig.advance(400);
    const r = await fig.frame.locator('.pvc-act-ring').boundingBox();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  };
  const { x, y } = await spot();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await fig.advance(50);
  await page.mouse.move(x, y - 40, { steps: 4 });
  await fig.advance(50);
  await page.mouse.up();
  await fig.advance(200);
  let st = await fig.call('get');
  expect(st.angle).toBeGreaterThan(50);
  expect(st.view).toBe('front'); // the view did not turn
  const before = st.angle;
  const at = await spot();
  await page.mouse.click(at.x, at.y);
  await settled(fig);
  st = await fig.call('get');
  expect(st.angle).toBeGreaterThan(before);
  expect(log.errors).toEqual([]);
});

test('reflection-amount: what he sees really changes with the angle', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-amount');
  // the middle of the picture from his eye is the flower's image in the glass: how much redder than blue it is
  const red = async (angle) => {
    await fig.call('set', { angle, animate: false });
    await fig.advance(300);
    return fig.frame.evaluate(() => {
      const c = /** @type {HTMLCanvasElement} */ (document.querySelector('.ra-eye canvas'));
      const g = c.getContext('2d');
      const d = g.getImageData(c.width * 0.42, c.height * 0.45, c.width * 0.16, c.height * 0.16).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += d[i] - d[i + 2];
      return sum / (d.length / 4);
    });
  };
  const low = await red(30);
  const high = await red(70);
  expect(high).toBeGreaterThan(low + 15);
  expect(log.errors).toEqual([]);
});

test('reflection-amount: every right answer scores, and a wrong one does not', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-amount');
  const play = async (wrongAt) => {
    for (let i = 0; i < 5; i++) {
      await fig.advance(2200);
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
      await expect(right).toHaveClass(/right/);
      await fig.advance(800);
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

test('reflection-amount: the test locks the glass and leaves the learn state as it was', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-amount');
  await fig.call('set', { angle: 60, animate: false });
  await fig.call('practice');
  await fig.advance(2000);
  let st = await fig.call('get');
  expect(st.locked).toBe(true);
  // the first question's scene does not show its answer
  await expect(fig.frame.locator('.pvc-anno', { hasText: '%' })).toHaveCount(0);
  await fig.frame.locator('.pvc').first().focus();
  await page.keyboard.press('ArrowUp');
  await fig.advance(100);
  expect((await fig.call('get')).angle).toBe(30);
  for (let i = 0; i < 5; i++) {
    await expect(fig.frame.locator('.pvc-opt')).toHaveCount(4);
    await fig.frame.locator('.pvc-opt').first().click();
    await fig.advance(1200);
    await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(2200);
  }
  await expect(fig.frame.locator('.pvc-q-result')).toBeVisible();
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(1200);
  st = await fig.call('get');
  expect(st).toMatchObject({ locked: false, angle: 60 });
  expect(st.seen).toContain(60);
  expect(log.errors).toEqual([]);
});
