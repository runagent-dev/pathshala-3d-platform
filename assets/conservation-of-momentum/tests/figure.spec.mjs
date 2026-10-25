// Conservation of momentum through the bridge (book pages 72–73, topic 3.5.1): the heavy ball runs into the light
// one (3 kg at 2 m/s into 1 kg at rest) and they leave at 1 and 3 m/s; the total momentum stays 6 kg m/s before,
// all through the contact and after; the kinetic energy is 6 J before and after; the panel shows the after side
// only once they have collided; a drag on m₁'s arrow sets u₁; the head-on example keeps the signs; the test starts,
// an answer is marked; reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('conservation-of-momentum: the total momentum never changes, the velocities do', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'conservation-of-momentum');
  const frame = page.frames().find((f) => f.url().includes('/assets/conservation-of-momentum/'));
  if (!frame) throw new Error('no figure frame');
  const after = (k) => frame.locator(`.cm-term b[data-v="${k}"]`).innerText();

  const start = await fig.call('get');
  expect(start).toMatchObject({ preset: 'heavy', m1: 3, m2: 1, u1: 2, u2: 0, v1: 1, v2: 3, phase: 'before', t: 0, revealed: false });
  expect(start.momentum).toEqual({ before: [6, 0], after: [3, 3], now: [6, 0], total: 6 });
  expect(start.energy).toEqual({ before: [6, 0], after: [1.5, 4.5], total: 6 });
  // before the collision the after side of the equations is unknown
  expect(await after('p_v1')).toBe('?');

  // play: the balls meet, touch (the momenta trade, the total stays 6), part
  await fig.call('set', { play: true });
  const T = start.duration;
  let sawContact = false;
  for (let ms = 0; ms < T * 1000 + 600; ms += 400) {
    await fig.advance(400);
    const s = await fig.call('get');
    expect(s.momentum.now[0] + s.momentum.now[1]).toBeCloseTo(6, 6);
    if (s.phase === 'contact') {
      sawContact = true;
      expect(s.momentum.now[0]).toBeLessThan(6 + 1e-9);
      expect(s.momentum.now[0]).toBeGreaterThan(3 - 1e-9);
    }
  }
  expect(sawContact).toBe(true);
  const end = await fig.call('get');
  expect(end).toMatchObject({ phase: 'after', playing: false, revealed: true, t: T });
  expect(end.momentum.now).toEqual([3, 3]);
  // now the panel writes the after side: 3 + 3 kg m/s and 1.5 + 4.5 J (Bangla digits)
  expect(await after('p_v1')).toBe('৩');
  expect(await after('k_v2')).toBe('৪.৫');

  // half way through the contact both move with the centre of mass, 1.5 m/s
  await fig.call('set', { at: 'contact' });
  const mid = await fig.call('get');
  expect(mid.phase).toBe('contact');
  expect(mid.momentum.now).toEqual([4.5, 1.5]);

  // dragging m₁'s arrow to the right makes u₁ bigger (whole m/s) and starts again from the start
  await fig.call('set', { at: 'start' });
  await fig.advance(600);
  const box = await (await frame.frameElement()).boundingBox();
  // the dot of u₁'s label sits on the middle of m₁'s arrow (the labels' dots: m₁, u₁, m₂, u₂)
  const tipPx = await frame.evaluate(() => {
    const dot = document.querySelectorAll('.pvc-anno-lines circle')[1];
    return { x: Number(dot.getAttribute('cx')), y: Number(dot.getAttribute('cy')) };
  });
  await page.mouse.move(box.x + tipPx.x, box.y + tipPx.y);
  await page.mouse.down();
  await fig.advance(50);
  await page.mouse.move(box.x + tipPx.x + 40, box.y + tipPx.y, { steps: 6 });
  await fig.advance(50);
  await page.mouse.up();
  await fig.advance(800);
  const dragged = await fig.call('get');
  expect(dragged.u1).toBe(3);
  expect(dragged).toMatchObject({ preset: null, u2: 0, t: 0, revealed: false });
  expect(dragged.momentum.total).toBe(3 * dragged.u1);

  // head-on: signs count; momentum 6 + (−2) = 0 + 4; energy 6 + 2 = 0 + 8
  await fig.call('set', { preset: 'headon', at: 'end', animate: false });
  const h = await fig.call('get');
  expect(h).toMatchObject({ u1: 2, u2: -2, v1: 0, v2: 4 });
  expect(h.momentum).toMatchObject({ before: [6, -2], after: [0, 4], total: 4 });
  expect(h.energy).toMatchObject({ before: [6, 2], after: [0, 8], total: 8 });

  // the test starts, an answer is marked with a worked answer
  await fig.call('practice');
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'quiz' });
  await frame.locator('.pvc-opt').first().click();
  await fig.advance(400);
  expect(await frame.locator('.pvc-q-feedback').innerText()).toMatch(/(kg m\/s|m\/s|J|দুটি|ভরবেগ|ফিরে)/);

  // reset: the first example, at the start, learning
  await fig.call('reset');
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ preset: 'heavy', u1: 2, u2: 0, t: 0, phase: 'before', mode: 'explore', revealed: false });
  expect(log.errors).toEqual([]);
});
