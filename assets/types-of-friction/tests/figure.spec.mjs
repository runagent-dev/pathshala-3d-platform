// Types of friction through the bridge (book pages 89–90, topic 3.9.1): the 2 kg block pushed with a force gauge. Taps
// of the big button push 3, 6, 9 N (the friction equals the push, the block does not move); the 4th goes past 9.8 N,
// the block gives way, the gauge falls to 7.8 N and it slides at a steady pace until it is let go; then the block is
// put on the trolley and pushed again (about 1 N). The words under the row fill in (9.8, 7.8, 1 N), the rule grows
// to the formulas f_s = μ_s N and f_k = μ_k N. Every test question sets up its own scene; reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';
import { glbInfo } from '../../../scripts/lib/export/glb.mjs';

test('types-of-friction: static grows with the push, kinetic is smaller, rolling is smallest', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'types-of-friction');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/\u00a0/g, ' ');
  const tap = async () => {
    await fig.frame.locator('.pvc-act').click();
    await fig.advance(1300);
  };

  const start = await fig.call('get');
  expect(start).toMatchObject({
    stage: 'rest',
    support: 'floor',
    push: 0,
    friction: 0,
    mass: 2,
    found: { static: null, kinetic: null, rolling: null },
  });
  expect(await text('.pvc-act')).toContain('ধীরে ধীরে ঠেলো');
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(1);

  // three taps: 3, 6, 9 N; the friction is exactly the push and the block stays where it is
  for (const n of [3, 6, 9]) {
    await tap();
    expect(await fig.call('get')).toMatchObject({ stage: 'pull', push: n, friction: n, speed: 0, distance: 0 });
  }
  expect(await text('.pvc-outcome')).toContain('ঘর্ষণও ৯ নিউটন');
  expect(await text('.pvc-rule')).toContain('স্থিতি ঘর্ষণ');
  expect(await text('.pvc-act')).toContain('আরও জোরে ঠেলো');

  // the 4th: it gives way at 9.8 N, the friction is now 7.84 N and the faint old arrow is the 9.8
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(1800);
  const slide = await fig.call('get');
  expect(slide.stage).toBe('slide');
  expect(slide.found).toMatchObject({ static: 9.8, kinetic: 7.84, rolling: null });
  expect(slide.friction).toBe(7.84);
  expect(slide.push).toBeLessThan(9.8);
  expect(slide.distance).toBeGreaterThan(0);
  // static friction has no one number (the page): the word says "maximum"
  expect(await text('[data-example="static"] .pvc-ex-res')).toBe('সর্বোচ্চ ৯.৮ নিউটন');
  expect(await text('[data-example="kinetic"] .pvc-ex-res')).toBe('৭.৮ নিউটন');
  expect(await text('.pvc-outcome')).toContain('স্থিতি ঘর্ষণ সর্বোচ্চ ৯.৮ নিউটন ছিল');
  expect(await text('.pvc-outcome')).toContain('গতি ঘর্ষণ ৭.৮ নিউটন');
  expect(await text('.pvc-anno-layer')).toContain('ঘর্ষণ ৭.৮ নিউটন');
  expect(await text('[data-example="static"]')).toContain('সর্বোচ্চ ৯.৮ নিউটন'); // the earlier maximum remains in the comparison row
  expect(await text('.pvc-act')).toContain('ঠেলা ছেড়ে দাও');
  // a steady pace: the push settles at the friction
  await fig.advance(1500);
  const steady = await fig.call('get');
  expect(steady.stage).toBe('slide');
  expect(Math.abs(steady.push - 7.84)).toBeLessThan(0.15);
  // the steady pace goes on until the student lets go (nothing ends it for several seconds)
  await fig.advance(4000);
  expect((await fig.call('get')).stage).toBe('slide');
  // the person lets go: the push is 0 at once and the block stops within a moment, the panel true at that moment
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(250);
  const slid = await fig.call('get');
  expect(slid).toMatchObject({ stage: 'slid', push: 0, friction: 0, speed: 0 });
  expect(await text('.pvc-outcome')).toContain('ঠেলা বন্ধ হতেই ব্লক থেমে গেল');
  expect(await text('.pvc-anno-layer')).not.toContain('ঠেলা ');
  expect(await fig.frame.locator('.pvc-anno', { hasText: 'সর্বোচ্চ' }).count()).toBe(0); // no stray old arrow after the stop
  expect(await text('.pvc-act')).toContain('ব্লকটি চাকায় তোলো');
  expect(await fig.frame.locator('[data-example="rolling"].next').count()).toBe(1);

  await fig.advance(300); // (a second tap this soon after the last would count as a double tap)
  // on wheels: nothing pushes at first, then about 1 N keeps it rolling
  await tap();
  await fig.advance(1800);
  expect(await fig.call('get')).toMatchObject({ stage: 'wheels', support: 'wheels', push: 0 });
  expect(await text('.pvc-act')).toContain('চাকার ব্লকটি ঠেলো');
  await tap();
  await fig.advance(1500);
  const roll = await fig.call('get');
  expect(roll.stage).toBe('roll');
  expect(roll.found.rolling).toBe(0.98);
  expect(await text('[data-example="rolling"] .pvc-ex-res')).toBe('১ নিউটন');
  expect(await text('[data-example="kinetic"]')).toContain('৭.৮ নিউটন'); // compare with the same box sliding
  await fig.frame.locator('.pvc-act').click(); // let go: the push is 0 and it stops in under half a second
  await fig.advance(600);
  const rolled = await fig.call('get');
  expect(rolled).toMatchObject({ stage: 'rolled', push: 0, friction: 0, speed: 0 });
  // The formulas explain the static limit separately from the current friction.
  await fig.frame.locator('[data-act="explain"]').click();
  await fig.frame.locator('[data-explainpage="formulas"]').click();
  const rule = await text('.tf-dialog');
  expect(rule).toContain('μ');
  expect(rule).toContain('≤');
  expect(rule).toContain('০.৫ × ১৯.৬ = ৯.৮');
  expect(rule).toContain('০.৪ × ১৯.৬ = ৭.৮');
  await fig.frame.locator('[data-act="explain-close"]').click();
  expect(await text('.pvc-act')).toContain('আবার দেখো');

  // a word of the row goes back to its part; home keeps what was found
  await fig.frame.locator('[data-example="static"]').click();
  await fig.advance(2500);
  expect(await fig.call('get')).toMatchObject({ stage: 'rest', support: 'floor', found: { static: 9.8, kinetic: 7.84, rolling: 0.98 } });

  // jumping to a stage at once (pictures)
  await fig.call('set', { stage: 'pull', pull: 6 });
  expect(await fig.call('get')).toMatchObject({ stage: 'pull', push: 6, friction: 6 });
  await fig.call('set', { stage: 'slide' });
  const jump = await fig.call('get');
  expect(jump.stage).toBe('slide');
  expect(jump.push).toBe(7.84);

  // the one GLB has the trolley under the block (block 0.12 m on a deck 0.056 m high), not a floating block
  const glb = await fig.call('export-glb', {});
  const info = await glbInfo(Buffer.from(glb.base64 ?? '', 'base64'));
  expect(info.size[1]).toBeGreaterThan(1.5);
  expect(info.size[1]).toBeLessThan(2);

  // the test: five questions, each on its own scene; the ring hides; the scene is locked; no number in the question
  // text that the picture shows; a second round comes in another order
  const round = async () => {
    const asked = [];
    for (let i = 0; i < 5; i++) {
      await fig.advance(1500);
      const opts = fig.frame.locator('.pvc-opt:not([disabled])');
      expect(await opts.count()).toBe(4);
      const q = await text('.pvc-q-text');
      asked.push(q.slice(0, 14));
      if (/^ব্লকটি (নড়ছে না|একই বেগে)/.test(q)) expect(q).not.toMatch(/[০-৯]/); // read the push off the gauge
      expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(0);
      await opts.first().click();
      await fig.advance(400);
      expect(((await text('.pvc-q-feedback')) || '').length).toBeGreaterThan(10);
      await fig.frame.locator('[data-act="q-next"]').click();
    }
    await fig.advance(500);
    return asked;
  };
  await fig.call('practice');
  const first = await round();
  expect(new Set(first).size).toBe(5);
  expect(await fig.frame.locator('.pvc-q-done .pvc-q-result').textContent()).toContain('৫টির মধ্যে');
  await fig.frame.locator('[data-act="q-again"]').click();
  expect((await round()).join('|')).not.toBe(first.join('|'));
  // leaving the test brings back what the student had found
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(300);
  expect((await fig.call('get')).found).toMatchObject({ static: 9.8, kinetic: 7.84, rolling: 0.98 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ stage: 'rest', found: { static: null, kinetic: null, rolling: null } });
  expect(log.errors).toEqual([]);
});

test('friction: human palms, trolley, pause and force balance share the live state', async ({ page }) => {
  const log = await preparePage(page);
  await page.setViewportSize({ width: 800, height: 500 });
  const fig = await openFigure(page, 'types-of-friction');
  for (const stage of ['pull', 'slide', 'roll']) {
    const state = await fig.call('set', { stage, pull: 6, paused: true, animate: false });
    const model = await fig.frame.evaluate(async () => {
      const { Vector3, Box3 } = await import('three');
      const root = /** @type {any} */ (window).figure.exportRoot();
      root.updateMatrixWorld(true);
      const hand = root.getObjectByName('HandNear').getWorldPosition(new Vector3());
      const box = root.getObjectByName('WoodenBlock').getWorldPosition(new Vector3());
      const a = root.getObjectByName('HumanAppliedForce'),
        b = root.getObjectByName('ContactFriction');
      let gauge = false;
      root.traverse((o) => {
        if (/gauge/i.test(o.name)) gauge = true;
      });
      return {
        hand: hand.toArray(),
        box: box.toArray(),
        handle: Boolean(root.getObjectByName('TrolleyHandle')),
        gauge,
        a: new Box3().setFromObject(a).getSize(new Vector3()).x,
        b: new Box3().setFromObject(b).getSize(new Vector3()).x,
      };
    });
    expect(model.gauge).toBe(false);
    expect(model.handle).toBe(stage === 'roll');
    expect(model.hand[0]).toBeCloseTo(model.box[0] - (stage === 'roll' ? 0.6 : 0.85 / 2 + 0.025), 2);
    expect(model.hand[1]).toBeCloseTo(stage === 'roll' ? 0.95 : 0.93, 2);
    expect(model.a).toBeCloseTo(model.b, 5);
    expect(state.netForce).toBe(0);
    const x = state.distance;
    await fig.advance(500);
    expect((await fig.call('get')).distance).toBe(x);
  }
  await fig.frame.locator('[data-act="pause"]').click();
  await fig.advance(400);
  const x = (await fig.call('get')).distance;
  await fig.frame.locator('[data-act="explain"]').click();
  await fig.advance(500);
  expect((await fig.call('get')).distance).toBe(x);
  await expect(fig.frame.locator('.tf-dialog')).toContainText('তলের বল');
  await fig.frame.locator('.tf-dialog').press('Escape');
  await fig.advance(400);
  expect((await fig.call('get')).distance).toBeGreaterThan(x);
  await fig.call('practice');
  await fig.advance(200);
  const before = await fig.call('get');
  await fig.call('set', { stage: 'rest', paused: false, view: '3d', home: true });
  expect(await fig.call('get')).toMatchObject({ stage: before.stage, mode: 'quiz', view: 'front' });
  expect(log.errors).toEqual([]);
});

test('friction: three human-push examples and formulas fit all six frames in both languages', async ({ page }) => {
  test.setTimeout(300000);
  const log = await preparePage(page);
  for (const lang of ['bn', 'en'])
    for (const [width, height] of [
      [390, 700],
      [390, 520],
      [844, 390],
      [640, 400],
      [800, 500],
      [1280, 800],
    ]) {
      await page.setViewportSize({ width, height });
      const fig = await openFigure(page, 'types-of-friction', { params: { lang } });
      for (const stage of ['rest', 'pull', 'slide', 'slid', 'wheels', 'roll', 'rolled']) {
        await fig.call('set', { stage, pull: 6, paused: true, animate: false });
        await fig.advance(100);
        const report = await fig.frame.evaluate(() => {
          const bad = [],
            labels = [];
          for (const e of document.querySelectorAll('.pvc-learn button,.tf-live,.tf-values>div,.pvc-rule,.pvc-anno')) {
            const cs = getComputedStyle(e);
            if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
            const r = e.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            if (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1 || e.scrollWidth > e.clientWidth + 1)
              bad.push(e.textContent);
            if (e.matches('.pvc-anno')) labels.push(r.toJSON());
          }
          const c = document.querySelector('.pvc-corner').getBoundingClientRect();
          const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          const overlap = labels.some((a, i) => hit(a, c) || labels.slice(i + 1).some((b) => hit(a, b)));
          return {
            bad,
            overlap,
            overflow: document.querySelector('.pvc-panel').scrollHeight - document.querySelector('.pvc-panel').clientHeight,
            stage: document.querySelector('.pvc-stage').getBoundingClientRect().height,
          };
        });
        expect(report, `${lang} ${width}x${height} ${stage}`).toMatchObject({ bad: [], overlap: false, overflow: 0 });
        expect(report.stage).toBeGreaterThan(150);
        if (width >= 800 && ['pull', 'slide', 'roll'].includes(stage)) {
          await expect(fig.frame.locator('.pvc-anno').filter({ hasText: /^ঠেলা |^Push / })).toBeVisible();
          await expect(fig.frame.locator('.pvc-anno').filter({ hasText: /^ঘর্ষণ |^Friction / })).toBeVisible();
        }
      }
      await fig.frame.locator('[data-act="explain"]').click();
      for (const tab of ['forces', 'formulas']) {
        await fig.frame.locator(`[data-explainpage="${tab}"]`).click();
        const r = await fig.frame.locator('.tf-dialog').evaluate((e) => {
          const r = e.getBoundingClientRect();
          return { inside: r.top >= 0 && r.bottom <= innerHeight + 1, overflow: e.scrollHeight - e.clientHeight };
        });
        expect(r, `${lang} ${width}x${height} ${tab}`).toEqual({ inside: true, overflow: 0 });
      }
      await fig.frame.locator('[data-act="explain-close"]').click();
    }
  expect(log.errors).toEqual([]);
});

test('friction: equal forces preserve existing motion and releasing the push stops it', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'types-of-friction');
  await fig.call('set', { stage: 'pull', pull: 7.84, paused: false });
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ push: 7.84, friction: 7.84, speed: 0, distance: 0, netForce: 0 });
  await fig.call('set', { stage: 'slide', paused: false });
  const before = await fig.call('get');
  await fig.advance(1000);
  const after = await fig.call('get');
  expect(after).toMatchObject({ push: 7.84, friction: 7.84, speed: before.speed, netForce: 0 });
  expect(after.distance - before.distance).toBeCloseTo(0.12, 2);
  await expect(fig.frame.locator('.tf-balance')).toContainText('একই বেগে');
  await expect(fig.frame.locator('.pvc-rule')).toContainText('আগে থেকেই চলছিল');
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(250);
  expect(await fig.call('get')).toMatchObject({ stage: 'slid', push: 0, speed: 0 });
  expect(log.errors).toEqual([]);
});
