// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the five
// parts jump where they should, the caption and the shape/volume row follow the book, the lens shows the right state,
// the words of the last part are on the stage and clear of each other, and the keys move between parts.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/states-of-matter/'));

test('states-of-matter: five parts, the book’s words, the lens follows the state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'states-of-matter', { params: { autoplay: '0' } });
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ t: 0, step: 0, part: 'one', lens: 'one', caption: 'cap_one', playing: false });
  expect(await fig.call('duration')).toBe(72);

  const parts = [
    { step: 1, part: 'solid', lens: 'solid', yes: 2, no: 0 },
    { step: 2, part: 'liquid', lens: 'solid', yes: 2, no: 0 }, // the flame is lit; the ice has not melted yet
    { step: 3, part: 'gas', lens: 'liquid', yes: 1, no: 1 }, // boiling starts: still water in the lens
    { step: 4, part: 'cycle', lens: 'cycle' },
  ];
  for (const p of parts) {
    await frame.locator(`[data-step="${p.step}"]`).click();
    const s = await fig.call('get');
    expect(s).toMatchObject({ step: p.step, part: p.part, lens: p.lens });
    if (p.yes != null) {
      await expect(frame.locator('.sm-prop.yes')).toHaveCount(p.yes);
      await expect(frame.locator('.sm-prop.no')).toHaveCount(p.no);
    }
    await expect(frame.locator(`[data-step="${p.step}"]`)).toHaveAttribute('aria-pressed', 'true');
  }

  // the middle of each state: its caption and its shape/volume row
  const states = [
    { t: 14, caption: 'cap_solid', lens: 'solid', yes: 2, no: 0 },
    { t: 34, caption: 'cap_liquid', lens: 'liquid', yes: 1, no: 1 },
    { t: 52, caption: 'cap_gas', lens: 'gas', yes: 0, no: 2 },
  ];
  for (const s of states) {
    expect(await fig.call('seek', { t: s.t })).toMatchObject({ caption: s.caption, lens: s.lens });
    await expect(frame.locator('.sm-prop.yes')).toHaveCount(s.yes);
    await expect(frame.locator('.sm-prop.no')).toHaveCount(s.no);
  }

  // the last part: three state names and four arrow words, all on the stage, none on top of another
  await fig.call('seek', { t: 71 });
  await fig.advance(300);
  await wordsApart(frame);

  // keys: ← → between parts, space plays and pauses
  await fig.call('set', { step: 2 });
  await frame.locator('.sm').press('ArrowRight');
  expect((await fig.call('get')).step).toBe(3);
  await frame.locator('.sm').press('ArrowLeft');
  await frame.locator('.sm').press('ArrowLeft');
  expect((await fig.call('get')).step).toBe(1);
  await frame.locator('.sm').press(' ');
  expect((await fig.call('get')).playing).toBe(true);
  await fig.advance(2000);
  expect((await fig.call('get')).t).toBeGreaterThan(9);
  await frame.locator('[data-act="play"]').click();
  expect((await fig.call('get')).playing).toBe(false);

  expect(log.errors).toEqual([]);
});

// the last part's words at the other crowded sizes, each on a fresh page (as the layout tests do)
for (const [width, height] of [
  [640, 400],
  [844, 390],
  [390, 520],
]) {
  test(`states-of-matter: the cycle's words apart at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await preparePage(page);
    const fig = await openFigure(page, 'states-of-matter', { params: { autoplay: '0' } });
    await fig.call('seek', { t: 71 });
    await fig.advance(300);
    await wordsApart(frameOf(page));
  });
}

test('states-of-matter: English words', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await preparePage(page);
  const fig = await openFigure(page, 'states-of-matter', { params: { autoplay: '0', lang: 'en' } });
  await fig.call('seek', { t: 52 });
  const frame = frameOf(page);
  await expect(frame.locator('.anim-caption')).toContainText('far apart');
  await expect(frame.locator('.sm-prop.no')).toHaveCount(2);
  await expect(frame.locator('[data-step="4"]')).toHaveText('All three');
});

async function wordsApart(frame) {
  const boxes = await frame.evaluate(() => {
    const stage = document.querySelector('.pvc-stage').getBoundingClientRect();
    return {
      stage: { w: stage.width, h: stage.height },
      words: [...document.querySelectorAll('.sm-state, .sm-arrow-tag')]
        .filter((d) => getComputedStyle(d).visibility !== 'hidden')
        .map((d) => d.getBoundingClientRect().toJSON()),
    };
  });
  expect(boxes.words).toHaveLength(7);
  for (const b of boxes.words) {
    expect(b.left).toBeGreaterThanOrEqual(-1);
    expect(b.top).toBeGreaterThanOrEqual(-1);
    expect(b.right).toBeLessThanOrEqual(boxes.stage.w + 1);
    expect(b.bottom).toBeLessThanOrEqual(boxes.stage.h + 1);
  }
  for (let i = 0; i < boxes.words.length; i++)
    for (let j = i + 1; j < boxes.words.length; j++) {
      const a = boxes.words[i];
      const b = boxes.words[j];
      const overlap =
        Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      expect(overlap, `words ${i} and ${j} overlap`).toBeLessThan(20);
    }
}
