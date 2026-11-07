// This figure's own behaviour, through the bridge (dev only, never packaged): the first screen is calm; the scales come
// on (200 g and 0 g); while the ship is lowered the hanging scale's reading and the water in the beaker always add up to
// the ship's 200 g, until it floats at 0 g with 200 g spilled; lifting it back lowers the tank's water and spills
// nothing back; unhooked, weight = buoyancy; every container spills exactly 50 g more; the test scores four right
// answers. Steps are jumped with animate: false where the motion itself is not the point, so each test stays short.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/displaced-water-ship/'));

test('displaced-water-ship: lowered, the scale loses exactly the water that runs out', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'displaced-water-ship');
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ step: 'intro', on: false, spilled: 0, level: 11.6, hooked: true, next: 'weigh' });
  expect(await frame.locator('[data-example]').count()).toBe(4);
  expect(await frame.locator('.dw-lead.pvc-note').count()).toBe(1);

  // ① the scales come on
  await frame.locator('.pvc-act').click();
  await fig.advance(2600);
  expect(await fig.call('get')).toMatchObject({ step: 'weigh', busy: false, on: true, reading: 200, spilled: 0 });
  expect(await frame.locator('.pvc-outcome').textContent()).toContain('২০০');

  // ② lowered by the action: part of the way, the two readings add up to 200 g; at the end it floats
  await frame.locator('.pvc-act').click();
  let seenPart = false;
  for (let i = 0; i < 12; i++) {
    await fig.advance(450);
    const s = await fig.call('get');
    expect(s.reading + Math.round(s.spilled)).toBe(200);
    if (s.reading > 0 && s.reading < 200) seenPart = true;
  }
  expect(seenPart).toBe(true);
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ step: 'lower', busy: false, reading: 0, spilled: 200, floating: true, draft: 2 });
  expect(await frame.locator('.pvc-rule b').first().textContent()).toContain('ওজন থেকে কমে যায়');

  // lifted back by hand: the tank's water drops, the beaker keeps its 200 g, the scale reads 200 g again
  const up = await fig.call('set', { lowered: 0 });
  expect(up).toMatchObject({ reading: 200, spilled: 200 });
  expect(up.level).toBeLessThan(11.6);
  // and down again: it floats once more and nothing more runs out
  await frame.locator('.pvc').press('ArrowDown');
  expect((await fig.call('get')).lowered).toBeCloseTo(0.05, 5);
  expect(await fig.call('set', { lowered: 1 })).toMatchObject({ reading: 0, spilled: 200, level: 11.6 });

  // ③ unhooked: the ship floats on its own, weight = buoyancy
  const b = await fig.call('set', { step: 'buoy', animate: false });
  expect(b).toMatchObject({ step: 'buoy', hooked: false, reading: null, spilled: 200, weight: 1.96, buoyancy: 1.96 });

  // ④ every container spills exactly 50 g more and sinks the ship 0.5 cm
  for (const n of [1, 3, 6]) {
    const l = await fig.call('set', { step: 'load', containers: n });
    expect(l).toMatchObject({ containers: n, mass: 200 + 50 * n, spilled: 200 + 50 * n, draft: 2 + 0.5 * n });
    expect(l.weight).toBeCloseTo(l.buoyancy, 6);
  }
  expect(await frame.locator('.dw-bar').count()).toBe(2);

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', spilled: 0, containers: 0, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('displaced-water-ship: a container tapped onto the deck', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'displaced-water-ship');
  const frame = frameOf(page);
  await fig.call('set', { step: 'buoy', animate: false });
  await frame.locator('.pvc-act').click();
  await fig.advance(4000);
  expect(await fig.call('get')).toMatchObject({ step: 'load', busy: false, containers: 1, spilled: 250 });
  expect(await frame.locator('.dw-bars b').allTextContents()).toEqual(['২৫০ g', '২৫০ g']);
  expect(log.errors).toEqual([]);
});

test('displaced-water-ship: the test scores four right answers', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'displaced-water-ship');
  const frame = frameOf(page);
  const bn = (x) => String(x).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
  await fig.call('practice');
  for (let i = 0; i < 4; i++) {
    await fig.advance(900);
    const s = await fig.call('get');
    // the right answer, worked out from the scene the question shows
    const right = [
      `${bn(200 - Math.round(s.spilled))} g`,
      'পানির ঊর্ধ্বমুখী বল, প্লবতা',
      `${bn(Math.round(s.spilled) + 50)} g`,
      `${bn(Math.round(s.spilled * 0.0098 * 100) / 100)} N`,
    ][i];
    const texts = (await frame.locator('[data-q]').allTextContents()).map((x) => x.trim());
    const at = texts.indexOf(right);
    expect(at, `${right} in ${texts.join(' | ')}`).toBeGreaterThanOrEqual(0);
    await frame.locator('[data-q]').nth(at).click();
    await fig.advance(300);
    expect(await frame.locator('.pvc-q-feedback').textContent()).not.toContain('হয়নি');
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  expect(await frame.locator('.pvc-quiz').textContent()).toContain('৪টির মধ্যে ৪টি সঠিক');
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'intro' });
  expect(log.errors).toEqual([]);
});
