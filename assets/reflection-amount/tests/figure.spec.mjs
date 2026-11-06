// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the story, tap
// by tap, the stops, the words, the handle on the glass, turning the view, keys, leaving the test, and the test itself.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

// CI's software rendering is about nine times slower than a desktop, and a test has 300 s there. A frame is drawn for every 50 ms
// of animation whatever the step (the stage caps its time step at 50 ms), so the only saving is to animate less: jump what is not
// the point of a test, and wait for a state rather than a fixed time. Keep each test under about 15 s locally.
const open = (page, params = {}) => openFigure(page, 'reflection-amount', { params });
/** Time runs until the question's answers are open: at once in most, 3.6 s where the glass lifts. */
const answersOpen = async (fig) => {
  for (let i = 0; i < 30; i++) {
    await fig.advance(200);
    const { question } = await fig.call('get');
    if (question?.right != null) return question;
  }
  throw new Error('the answers never opened');
};

const settled = async (fig) => {
  for (let i = 0; i < 80; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the glass never stopped');
};

// Two short walks at the smallest page with a real 3D view (below 600 px the panel stacks and the view has no height): every step
// plays at its real speed, and CI's software rendering is slow (docs/ci.md). Keep each test under a minute here.
test('reflection-amount: the story goes one tap at a time and the numbers wait', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await open(page);
  expect((await fig.frame.locator('canvas').first().boundingBox())?.height).toBeGreaterThan(200); // a real view
  const act = fig.frame.locator('.pvc-act').first();
  const percents = fig.frame.locator('.pvc-anno', { hasText: '%' });
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 0, angle: 30, seen: [] });
  await expect(fig.frame.locator('.ra-graph')).toBeHidden();
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'কাচ' })).toHaveCount(1);
  // a step plays slowly, a tap meanwhile does nothing, and when it ends nothing moves on by itself
  await act.click();
  await fig.advance(600);
  expect((await fig.call('get')).busy).toBe(true);
  await fig.frame.locator('.pvc-act').first().click({ force: true });
  await fig.frame.locator('[data-example="w2"]').click({ force: true });
  await settled(fig);
  expect((await fig.call('get')).step).toBe(1);
  await fig.advance(1000);
  expect((await fig.call('get')).step).toBe(1);
  await expect(fig.frame.locator('.ra-tag-pattern')).toBeVisible();
  await expect(fig.frame.locator('.ra-tag-image')).toBeHidden();
  // the glass rises, and the flower comes up in the picture from his eye, which the panel points to
  await act.click();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ step: 2, angle: 85 });
  expect(st.handle.shown).toBe(true);
  await expect(fig.frame.locator('.ra-tag-image')).toBeVisible();
  await expect(fig.frame.locator('.ra-eye')).toHaveClass(/look/);
  await expect(percents).toHaveCount(0);
  expect(log.errors).toEqual([]);
});

test('reflection-amount: the angles come in two beats, still without a number, and a step plays again', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await open(page);
  const act = fig.frame.locator('.pvc-act').first();
  const percents = fig.frame.locator('.pvc-anno', { hasText: '%' });
  await fig.call('set', { step: 2, animate: false });
  await fig.advance(100);
  // what the rays are called, then the angles
  await act.click();
  await fig.advance(4400);
  await expect(fig.frame.locator('.pvc-anno')).toHaveCount(3);
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'θ' })).toHaveCount(0);
  await settled(fig);
  expect((await fig.call('get')).step).toBe(3);
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'অভিলম্ব' })).toHaveCount(1);
  await expect(fig.frame.locator('.pvc-anno')).toHaveCount(5);
  await expect(percents).toHaveCount(0);
  await expect(fig.frame.locator('.ra-graph')).toBeHidden();
  // its own word plays a step again, from where it began
  await fig.frame.locator('[data-example="w1"]').click();
  await fig.advance(400);
  expect(await fig.call('get')).toMatchObject({ step: 2, busy: true });
  expect(log.errors).toEqual([]);
});

test("reflection-amount: how much goes through the stops with Fresnel's numbers, and the test is offered at the end", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await open(page);
  const act = fig.frame.locator('.pvc-act').first();
  expect((await fig.frame.locator('canvas').first().boundingBox())?.height).toBeGreaterThan(200); // a real view
  await fig.call('set', { step: 3, animate: false });
  await fig.advance(200);
  // the glass goes back down past the other stops: they do not count until it rests on them
  await act.click();
  await settled(fig);
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 4, angle: 30, reflected: 4, refractedShare: 96, seen: [30] });
  await expect(fig.frame.locator('.ra-graph')).toBeVisible();
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৪%');
  await expect(fig.frame.locator('.pvc-anno', { hasText: '%' })).toHaveCount(2);
  await act.click(); // one real move; the others are jumped: the numbers are the point
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ angle: 60, reflected: 9 });
  for (const [angle, reflected] of [
    [80, 39],
    [87, 74],
  ]) {
    st = await fig.call('set', { angle, animate: false });
    expect(st.reflected).toBe(reflected);
  }
  await fig.advance(200);
  st = await fig.call('get');
  expect(st.seen).toEqual([30, 60, 80, 87]);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('ফ্রেনেলের');
  await expect(fig.frame.locator('[data-example="w2"] .pvc-ex-res')).toContainText('৩৯%');
  // a word goes straight to its angle; what was seen stays
  await fig.frame.locator('[data-example="w1"]').click();
  await fig.advance(200);
  expect((await fig.call('get')).busy).toBe(true); // a word moves the glass; what was seen stays
  expect((await fig.call('get')).seen.length).toBe(4);
  await fig.call('set', { angle: 60, animate: false });
  await fig.advance(100);
  // only now the test; never forced
  await expect(act).toContainText('পরীক্ষা');
  expect((await fig.call('get')).mode).toBe('explore');
  await act.click();
  await answersOpen(fig);
  expect((await fig.call('get')).mode).toBe('quiz');
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(300);
  await fig.frame.locator('[data-act="replay"]').click();
  await fig.advance(200);
  st = await fig.call('get');
  expect(st).toMatchObject({ step: 0, angle: 30, seen: [] });
  expect(log.errors).toEqual([]);
});

test('reflection-amount: set works at once, the keys step the angle, and a run can be cut short', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await open(page);
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

test('reflection-amount: the handle lifts the glass, a tap on it is the action, and the view turns all the way round', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await open(page, { angle: '45', coach: '1' });
  const spot = async () => {
    await fig.advance(200);
    const r = await fig.frame.locator('.pvc-dh .pvc-dh-disc').boundingBox();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  };
  await expect(fig.frame.locator('.pvc-dh-word')).toBeVisible();
  await expect(fig.frame.locator('.pvc-rc-word')).toBeVisible();
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
  expect(st.handle).toEqual({ shown: true, used: true });
  await expect(fig.frame.locator('.pvc-dh-word')).toBeHidden();
  // a tap on the glass, moving a little, is the action and not a turn of the view
  const before = st.angle;
  const at = await spot();
  await page.mouse.move(at.x, at.y - 10);
  await page.mouse.down();
  await fig.advance(40);
  await page.mouse.move(at.x + 3, at.y - 10);
  await page.mouse.up();
  await settled(fig);
  st = await fig.call('get');
  expect(st.angle).toBeGreaterThan(before);
  expect(st.view).toBe('front');
  expect(st.orbited).toBe(false);
  // off the glass a real drag turns the view; the sign shrinks to its icon and the way back appears
  const front = fig.frame.locator('[data-view="front"]');
  await expect(front).toBeHidden();
  const box = await fig.frame.locator('canvas').first().boundingBox();
  const from = { x: box.x + 90, y: box.y + 60 };
  const turnBy = async (dx) => {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await fig.advance(40);
    await page.mouse.move(from.x + dx, from.y, { steps: 4 });
    await fig.advance(40);
    await page.mouse.up();
    await fig.advance(200);
  };
  await turnBy(120);
  st = await fig.call('get');
  expect(st).toMatchObject({ view: '3d', orbited: true });
  await expect(fig.frame.locator('.pvc-rc-word')).toBeHidden();
  await expect(fig.frame.locator('.pvc-rc')).toContainText('৩৬০°');
  await expect(front).toBeVisible();
  await expect(front).toContainText('সামনে');
  // right round the back
  for (let i = 0; i < 3; i++) await turnBy(260);
  expect((await fig.call('get')).view).toBe('3d');
  await front.click();
  await fig.advance(200);
  expect((await fig.call('get')).view).toBe('front');
  await expect(front).toBeHidden();
  expect(log.errors).toEqual([]);
});

// the owner: labels pinned to what they name, and never hidden: nothing may lie under the picture from his eye, the handle, the
// panel's tab, the corner's buttons or another label, nor run off the view. The handle keeps off the picture too.
const hiddenLabels = (fig, { mayHide = false } = {}) =>
  fig.frame.evaluate((may) => {
    const seen = (el) =>
      el &&
      !el.hidden &&
      getComputedStyle(el).visibility !== 'hidden' &&
      getComputedStyle(el).opacity !== '0' &&
      el.getBoundingClientRect().width > 0;
    const boxOf = (el) => el.getBoundingClientRect();
    const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const covers = [...document.querySelectorAll('.ra-eye, .pvc-dh .pvc-dh-disc, .pvc-dh-word, .pvc-panel-toggle, .pvc-corner, .pvc-rc, .lab-note')]
      .filter(seen)
      .map((el) => ({ name: el.className, b: boxOf(el) }));
    const view = boxOf(document.querySelector('canvas'));
    const labels = [...document.querySelectorAll('.pvc-anno')];
    const bad = [];
    labels.forEach((el, i) => {
      if (getComputedStyle(el).visibility === 'hidden') {
        if (!may) bad.push(`${el.textContent}: not shown`);
        return;
      }
      const a = boxOf(el);
      if (a.left < view.left || a.right > view.right || a.top < view.top || a.bottom > view.bottom) bad.push(`${el.textContent} off the view`);
      for (const { name, b } of covers) if (hit(a, b)) bad.push(`${el.textContent} under ${name}`);
      for (const other of labels.slice(i + 1))
        if (getComputedStyle(other).visibility !== 'hidden' && hit(a, boxOf(other))) bad.push(`${el.textContent} on ${other.textContent}`);
    });
    const disc = document.querySelector('.pvc-dh .pvc-dh-disc'); // the handle on the view, not its miniature in the panel
    const eye = document.querySelector('.ra-eye');
    if (seen(disc) && seen(eye) && hit(boxOf(disc), boxOf(eye))) bad.push('the handle on the picture');
    for (const el of [disc, document.querySelector('.pvc-dh-word')]) {
      if (!seen(el)) continue;
      const a = boxOf(el);
      if (a.left < view.left || a.right > view.right || a.top < view.top || a.bottom > view.bottom) bad.push(`${el.className} off the view`);
      const n = document.querySelector('.lab-note');
      if (seen(n) && hit(a, boxOf(n))) bad.push(`${el.className} on the note`);
    }
    return bad;
  }, mayHide);

for (const [width, height] of [
  [390, 700],
  [390, 520],
  [844, 390],
  [640, 400],
]) {
  test(`reflection-amount: no label lies hidden at ${width}×${height}, in any step or at any stop`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width, height });
    const log = await preparePage(page);
    const fig = await open(page, { coach: '1' });
    for (const step of [0, 1, 2, 3]) {
      await fig.call('set', { step, animate: false });
      await fig.advance(250);
      expect(await hiddenLabels(fig), `step ${step}`).toEqual([]);
    }
    for (const angle of [30, 60, 80, 87]) {
      await fig.call('set', { step: 4, animate: false });
      await fig.call('set', { angle, animate: false });
      await fig.advance(250);
      expect(await hiddenLabels(fig), `${angle}°`).toEqual([]);
    }
    // and on the student's own view, right round: a label may give way, never cover something
    await fig.call('set', { step: 3, animate: false });
    await fig.advance(400);
    const box = await fig.frame.locator('canvas').first().boundingBox();
    const at = { x: box.x + 24, y: box.y + box.height * 0.45 };
    for (let i = 0; i < 4; i++) {
      await page.mouse.move(at.x, at.y);
      await page.mouse.down();
      await fig.advance(40);
      await page.mouse.move(at.x + box.height / 4, at.y, { steps: 2 });
      await fig.advance(600);
      await page.mouse.up();
      await fig.advance(250);
      expect(await hiddenLabels(fig, { mayHide: true }), `turned ${i + 1}`).toEqual([]);
    }
    expect(log.errors).toEqual([]);
  });
}

test('reflection-amount: what he sees really changes with the angle', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await open(page);
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

/** Answers the five questions, right but for question wrongAt. */
async function playTest(fig, wrongAt) {
  for (let i = 0; i < 5; i++) {
    const question = await answersOpen(fig);
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
    await fig.advance(200);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(400);
}

for (const { wrongAt, score, name } of [
  { wrongAt: -1, score: '৫টির মধ্যে ৫টি', name: 'every right answer scores' },
  { wrongAt: 2, score: '৫টির মধ্যে ৪টি', name: 'a wrong answer does not score' },
]) {
  test(`reflection-amount: ${name}`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 640, height: 400 }); // the answers are in the panel
    const log = await preparePage(page);
    const fig = await open(page);
    await fig.call('practice');
    await playTest(fig, wrongAt);
    await expect(fig.frame.locator('.pvc-q-result')).toContainText(score);
    expect(log.errors).toEqual([]);
  });
}

test('reflection-amount: the test locks the glass and leaves the learn state as it was', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await open(page);
  await fig.call('set', { angle: 60, animate: false });
  await fig.call('practice');
  await answersOpen(fig);
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
    await fig.advance(200);
    await fig.frame.locator('[data-act="q-next"]').click();
    if (i < 4) await answersOpen(fig);
  }
  await fig.advance(400);
  await expect(fig.frame.locator('.pvc-q-result')).toBeVisible();
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(300);
  st = await fig.call('get');
  expect(st).toMatchObject({ locked: false, angle: 60 });
  expect(st.seen).toContain(60);
  expect(log.errors).toEqual([]);
});
