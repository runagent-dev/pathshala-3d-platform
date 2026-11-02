// Newton's second law through the bridge (book pp75–76, topic 3.6): the handcart pushed for 2 s gains velocity
// evenly (a = F / m: 1 ms⁻² empty, 2 with two people, 0.5 with two sacks), rolls on at that velocity once let go,
// and the sacks at the end of the floor stop it; pushed back from the front it slows from 2 m/s to rest (a = −1).
// The clean panel: the acceleration under each word, the result line a = (v − u) ÷ t, the rule growing up to the
// book's law, the big numbered button offering the next example (and its ring on the cart, hidden while it moves and
// in the test). Every test question sets up its own scene; reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { planOf, EXAMPLES } from '../src/physics.js';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('newtons-second-law: F = ma for the handcart, and the direction of the change', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  // real time here (the slow default, its lead-in and holds are tested below)
  const fig = await openFigure(page, 'newtons-second-law', { params: { speed: '1' } });
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  const start = await fig.call('get');
  expect(start).toMatchObject({ example: 'base', phase: 'rest', speed: 0, distance: 0, mass: 100, next: { example: 'base', step: 1 } });
  // at rest, with no push, nothing happens however long we wait
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', speed: 0, distance: 0 });
  expect(await text('.pvc-rule')).toContain('একজন ১০০ নিউটন বলে ২ সেকেন্ড ঠেলবে');
  expect(await text('.pvc-act')).toContain('গাড়িটি ২ সেকেন্ড ঠেলো');
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(1);

  // the push: the velocity grows by 1 m/s every second while 100 N acts on 100 kg
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(1000);
  const mid = await fig.call('get');
  expect(mid.phase).toBe('push');
  expect(mid.force).toBe(100);
  expect(mid.acceleration).toBe(1);
  expect(mid.speed).toBeGreaterThan(0.9);
  expect(mid.speed).toBeLessThan(1.2);
  expect(await text('.pvc-rule')).toContain('বল যতক্ষণ কাজ করছে, বেগ ততক্ষণ বাড়ছে');
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(0); // no ring while it moves
  // the action keeps its words and its number while the push is on (no "again" in the middle of it)
  expect(await text('.pvc-act')).toContain('গাড়িটি ২ সেকেন্ড ঠেলো');
  expect(await text('.pvc-act')).not.toContain('আবার');
  // the arrows are labelled with their numbers (a is on the picture before the result line has it)
  expect(await text('.pvc-anno-layer')).toContain('a = ১ ms');
  expect(await text('.pvc-anno-layer')).toContain('F = ১০০ নিউটন');
  // the result line: the time to 0.1 s, the velocity from that time worked out as v = u + at
  expect(await text('.pvc-outcome')).toMatch(/^t = ১\.[০-৯] s: বেগ v = u \+ at = ০ \+ ১ × ১\.[০-৯] = ১\.[০-৯]০ m\/s$/);
  await fig.advance(1300);
  const after = await fig.call('get');
  expect(after).toMatchObject({ phase: 'coast', speed: 2, force: 0, acceleration: 0, measured: { u: 0, v: 2, t: 2, a: 1 }, results: { base: 1 } });
  expect(await text('.pvc-outcome')).toBe('a = (v − u) ÷ t = (২ − ০) ÷ ২ = ১ ms−2');
  expect(await text('[data-example="base"] .pvc-ex-res')).toBe('১ ms−2');
  expect(await text('.pvc-rule')).toContain('F = ma');
  expect(await text('.pvc-rule')).toContain('ভরবেগ ১০০ kg m/s');
  await fig.frame.locator('[data-act="maths"]').click();
  expect(await text('.ns-math-dialog')).toContain('Δp/Δt');
  expect(await text('.ns-math-dialog')).toContain('F = ১০০ N, m = ১০০ kg');
  await fig.frame.locator('[data-act="maths-close"]').click();
  // the push is over: the label where the force's arrow was says it is gone, so the velocity stays
  expect(await text('.pvc-anno-layer')).toContain('লব্ধি বল F = ০');
  // rolling on at 2 m/s (no force): 0.5 s later still 2 m/s
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ phase: 'coast', speed: 2 });
  // the big button offers the next word, ২ দ্বিগুণ বল
  expect((await fig.call('get')).next).toEqual({ example: 'force', step: 2 });
  expect(await text('.pvc-act')).toContain('এবার দুজনে মিলে ঠেলো');
  expect(await fig.frame.locator('[data-example="force"].next').count()).toBe(1);
  // the sacks stop it
  await fig.advance(2000);
  const stopped = await fig.call('get');
  expect(stopped.phase).toBe('stopped');
  expect(stopped.distance).toBeCloseTo(5.52, 2);
  expect(await text('.pvc-anno-layer')).toContain('বস্তা থামাল');

  // double the force: two people, 2 ms⁻²
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(900); // the second person steps up, then the push
  expect(await fig.call('get')).toMatchObject({ example: 'force', phase: 'push', force: 200, acceleration: 2 });
  await fig.advance(2200);
  expect((await fig.call('get')).results).toMatchObject({ base: 1, force: 2 });
  expect(await text('.pvc-rule')).toContain('বল দ্বিগুণ, ত্বরণও দ্বিগুণ');

  // double the mass, jumping to the end: 0.5 ms⁻²
  await fig.call('set', { example: 'mass', push: true, animate: false });
  const mass = await fig.call('get');
  expect(mass).toMatchObject({ example: 'mass', phase: 'stopped', mass: 200, results: { mass: 0.5 } });
  expect(await text('.pvc-rule')).toContain('ভর দ্বিগুণ, ত্বরণ অর্ধেক');

  // the force backward: from 2 m/s to rest in 2 s, a = −1; the momentum changes in the direction of the force
  await fig.call('set', { example: 'back', animate: false });
  await fig.call('set', { at: 3.3 });
  const brake = await fig.call('get');
  expect(brake.phase).toBe('brake');
  expect(brake.force).toBe(-100);
  expect(brake.acceleration).toBe(-1);
  expect(await text('.pvc-rule')).toContain('বল বাম দিকে, গাড়ি চলছে ডান দিকে');
  expect(await text('.pvc-anno-layer')).toContain('ভরবেগের পরিবর্তন'); // the green arrow, the way of the force
  await fig.advance(1800);
  const back = await fig.call('get');
  expect(back).toMatchObject({ phase: 'stopped', speed: 0, measured: { u: 2, v: 0, a: -1 } });
  expect(back.distance).toBeCloseTo(4.6, 2);
  // all four found: the book's law, word for word
  await fig.frame.locator('[data-act="maths"]').click();
  expect(await text('.ns-math-dialog')).toContain(
    'নিউটনের দ্বিতীয় সূত্র: বস্তুর ভরবেগের পরিবর্তনের হার তার উপর প্রযুক্ত বলের সমানুপাতিক এবং যেদিকে বল প্রয়োগ করা হয় ভরবেগের পরিবর্তনও সেদিকে ঘটে।',
  );
  await fig.frame.locator('[data-act="maths-close"]').click();
  expect(await text('[data-example="back"] .pvc-ex-res')).toBe('−১ ms−2');

  // the test: five questions, each on its own scene; the ring hides; tapping the cart is locked
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(6000);
    const opts = fig.frame.locator('.pvc-opt:not([disabled])');
    expect(await opts.count()).toBe(4);
    expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(0);
    await opts.first().click();
    await fig.advance(400);
    expect(((await text('.pvc-q-feedback')) || '').length).toBeGreaterThan(10);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  expect(await fig.frame.locator('.pvc-q-done .pvc-q-result').textContent()).toContain('৫টির মধ্যে');
  // leaving the test brings back what the student had found
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(300);
  expect((await fig.call('get')).results).toEqual({ base: 1, force: 2, mass: 0.5, back: -1 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ example: 'base', phase: 'rest', results: { base: null, force: null, mass: null, back: null } });
  // the direction example found first: the rule works the force out from the change of momentum
  await fig.call('set', { example: 'back', push: true, animate: false });
  expect(await text('.pvc-rule')).toContain('(০ − ২০০) ÷ ২ = −১০০ নিউটন');
  expect(await text('.pvc-outcome')).toBe('a = (v − u) ÷ t = (০ − ২) ÷ ২ = −১ ms−2');
  expect(log.errors).toEqual([]);
});

test('second law, slow: the arrows grow in, half speed, held at each whole second with the velocity stamped', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'newtons-second-law');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');
  expect(await fig.call('get')).toMatchObject({ playback: 0.5, phase: 'rest', time: 0 });
  expect(await text('.ns-clock')).toContain('সময় ২ গুণ ধীর');
  expect(await text('[data-act="speed"]')).toBe('ধীরে: ০.৫×');
  // the graph waits for the push; the rows say F, m and a now
  expect(await text('.ns-graph')).toContain('ঠেলো: রেখা আঁকা হবে');
  expect(await fig.frame.locator('.ns-graph .g-line').count()).toBe(0);

  // the lead-in (1.6 s): the force acts and its arrows grow in, the clock waits at 0
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ phase: 'push', time: 0, speed: 0, force: 100, acceleration: 1 });
  expect(await text('.pvc-anno-layer')).toContain('লব্ধি বল F = ১০০ নিউটন');
  expect(await text('.pvc-anno-layer')).toContain('ত্বরণ a = ১ ms');
  // half speed: 1 s of the run in 2 s
  await fig.advance(400 + 1000);
  expect((await fig.call('get')).time).toBeCloseTo(0.5, 1);
  // held at 1 s: the velocity 1 m/s stamped, the clock says so, the rule's velocities each second have 0 → 1
  await fig.advance(1500);
  let s = await fig.call('get');
  expect(s).toMatchObject({ phase: 'push', time: 1, speed: 1 });
  expect(s.held).toBeCloseTo(1, 6);
  expect(await text('.ns-clock')).toContain('t = ১.০ s');
  expect(await text('.ns-clock')).toContain('থামানো');
  expect(await text('.pvc-rule .ns-ladder')).toBe('০ → ১ m/s');
  expect(await text('.pvc-anno-layer')).toContain('১ s: v = ১ m/s');
  expect(await text('.pvc-outcome')).toBe('t = ১.০ s: বেগ v = u + at = ০ + ১ × ১.০ = ১.০০ m/s');
  // the graph: its line drawn to 1 s, one step of 1 s across and +1 up, the dot ringed while held
  expect(await fig.frame.locator('.ns-graph .g-line').count()).toBe(1);
  expect(await fig.frame.locator('.ns-graph .g-rise').count()).toBe(1);
  expect(await fig.frame.locator('.ns-graph .g-ring').count()).toBe(1);
  expect(await text('.ns-graph')).toContain('+১');
  expect(await text('.ns-row-F')).toContain('১০০ N');
  expect(await text('.ns-row-m')).toContain('১০০ kg');
  expect(await text('.ns-row-a')).toContain('= ১০০ ÷ ১০০');
  await fig.advance(500);
  expect((await fig.call('get')).time).toBe(1);
  // on again: 1.5 s of the run 1 s after the hold
  await fig.advance(1100);
  expect((await fig.call('get')).time).toBeCloseTo(1.5, 1);
  // held at the end of the push, the force still on the picture: 2 m/s, equal steps
  await fig.advance(1200);
  s = await fig.call('get');
  expect(s).toMatchObject({ phase: 'push', force: 100, speed: 2 });
  expect(s.held).toBeCloseTo(2, 6);
  expect(await text('.pvc-rule .ns-ladder')).toBe('০ → ১ → ২ m/s');
  expect(await text('.pvc-outcome')).toBe('t = ২.০ s: বেগ v = u + at = ০ + ১ × ২.০ = ২.০০ m/s');
  // then the result
  await fig.advance(1100);
  expect(await fig.call('get')).toMatchObject({ phase: 'coast', speed: 2, held: null, results: { base: 1 } });
  expect(await text('.pvc-outcome')).toBe('a = (v − u) ÷ t = (২ − ০) ÷ ২ = ১ ms−2');
  // rolling on: no force, no acceleration (empty bars), the graph keeps its two steps
  expect(await text('.ns-row-F')).toContain('০ N');
  expect(await fig.frame.locator('.ns-row-a .ns-fill').getAttribute('style')).toContain('width:0.0%');
  expect(await fig.frame.locator('.ns-graph .g-rise').count()).toBe(2);

  // real time, from the button: the run goes on from where it is, one run second per real second
  const before = (await fig.call('get')).time;
  await fig.frame.locator('[data-act="speed"]').click();
  expect(await text('[data-act="speed"]')).toBe('স্বাভাবিক: ১×');
  expect(await fig.frame.locator('[data-act="speed"]').getAttribute('aria-pressed')).toBe('false');
  await fig.advance(200);
  expect((await fig.call('get')).time - before).toBeGreaterThan(0.15);
  // and back with the S key
  await fig.frame.locator('.ns').first().press('s');
  expect((await fig.call('get')).playback).toBe(0.5);
  // the person in front: held as the push back starts (u = 2), then 1 and 0 m/s
  await fig.call('set', { example: 'back', push: true });
  await fig.advance(1600 + 4000 + 700);
  s = await fig.call('get');
  expect(s).toMatchObject({ phase: 'brake', force: -100 });
  expect(s.held).toBeCloseTo(2.3, 6);
  expect(await fig.frame.locator('.ns-ladder').count()).toBe(0);
  await fig.advance(2 * 1100 + 4000);
  expect(await text('.pvc-rule .ns-ladder')).toBe('২ → ১ → ০ m/s');
  // the first push's line stays, faint and tagged, under the line going down
  expect(await fig.frame.locator('.ns-graph .g-past').count()).toBe(1);
  expect(await text('.ns-graph')).toContain('a = ১');
  expect(await text('.ns-graph')).toContain('−১');
  expect(log.errors).toEqual([]);
});

test('second law: live 3D forces include the passenger, friction, support and the textbook derivation', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'newtons-second-law', { params: { example: 'force', diagram: '1', friction: '20', at: '1.2' } });
  let s = await fig.call('get');
  expect(s).toMatchObject({
    mass: 100,
    force: 180,
    acceleration: 1.8,
    friction: 20,
    diagram: true,
    forces: { F1: 100, F2: 100, friction: -20, net: 180 },
  });
  expect(s.forces.normal).toBeCloseTo(980);
  expect(s.forces.normal).toBe(s.forces.weight);
  const model = await fig.frame.evaluate(() => {
    const root = /** @type {any} */ (window).figure.exportRoot();
    return {
      child: Boolean(root.getObjectByName('ChildPassenger')),
      diagram: Boolean(root.getObjectByName('LiveFreeBodyDiagram')),
      forceMeshes: root.getObjectByName('Diagram_F1').children.length,
    };
  });
  expect(model).toEqual({ child: true, diagram: true, forceMeshes: 2 });
  await expect(fig.frame.locator('.ns-formula-values')).toContainText('১০০ + ১০০ − ২০');
  const humanPose = () =>
    fig.frame.evaluate(async () => {
      const { Vector3 } = await import('three');
      const model = /** @type {any} */ (window).figure.exportRoot();
      model.updateMatrixWorld(true);
      const person = model.getObjectByName('Pusher1');
      return {
        foot: person.getObjectByName('ShoeNear').getWorldPosition(new Vector3()).toArray(),
        hand: person.getObjectByName('HandNear').getWorldPosition(new Vector3()).toArray(),
        front: model.getObjectByName('CartBody').getWorldPosition(new Vector3()).x,
      };
    });
  await fig.call('set', { example: 'base', at: 0.5, paused: true, animate: false });
  const poseA = await humanPose();
  await fig.call('set', { at: 0.7, paused: true, animate: false });
  const poseB = await humanPose();
  expect(poseB.foot[0]).toBeCloseTo(poseA.foot[0], 4);
  expect(poseB.hand[0]).toBeCloseTo(poseB.front - 1.82, 4);
  expect(poseB.hand[1]).toBeCloseTo(0.88, 4);

  await fig.call('set', { at: 2.5, paused: true });
  s = await fig.call('get');
  expect(s).toMatchObject({ phase: 'coast', force: -20, acceleration: -0.2, forces: { F1: 0, F2: 0, friction: -20 } });
  const paused = s.time;
  await fig.advance(1000);
  expect((await fig.call('get')).time).toBe(paused);
  await fig.call('set', { paused: false });
  const formula = fig.frame.locator('[data-act="maths"]');
  await formula.focus();
  await fig.advance(250);
  await expect(formula).toBeFocused();
  await formula.press('Enter');
  await expect(fig.frame.locator('.ns-math-dialog')).toBeVisible();
  const time = (await fig.call('get')).time;
  await fig.advance(500);
  expect((await fig.call('get')).time).toBe(time);
  await expect(fig.frame.locator('.ns-math-dialog')).toContainText('গাড়ি ৮০ kg + শিশু ২০ kg');
  await expect(fig.frame.locator('.ns-math-dialog')).toContainText('Δp/Δt');
  await fig.frame.locator('.ns-math-dialog').press('Escape');
  await expect(fig.frame.locator('.ns-math-dialog')).not.toBeVisible();
  await fig.advance(300);
  expect((await fig.call('get')).time).toBeGreaterThan(time);
  await fig.call('practice');
  await fig.advance(300);
  expect(await fig.call('get')).toMatchObject({ mode: 'quiz', diagram: false, friction: 0 });
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(100);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', diagram: true, friction: 20 });
  await fig.call('set', { at: 1, paused: true, animate: false });
  await fig.frame.locator('[data-act="pause"]').click();
  await fig.advance(250);
  await fig.frame.locator('[data-act="pause"]').click();
  const held = (await fig.call('get')).time;
  await fig.advance(500);
  expect((await fig.call('get')).time).toBe(held);

  await fig.frame.locator('[data-act="friction"]').click();
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', friction: 0, results: { base: null, force: null, mass: null, back: null } });
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ example: 'base', diagram: false, friction: 0, mass: 100 });
  expect(log.errors).toEqual([]);
});

test('second law: motion, live diagrams and calculation sheet fit every required frame in both languages', async ({ page }) => {
  test.setTimeout(300000);
  const log = await preparePage(page);
  const plan = planOf({ ...EXAMPLES.force, friction: 20 }),
    stop = plan.segs.find((s) => s.kind === 'stop');
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
      const fig = await openFigure(page, 'newtons-second-law', { params: { lang } });
      for (const state of [
        { example: 'base', at: 0, diagram: false, friction: 0 },
        { example: 'force', at: 1.2, diagram: false, friction: 0 },
        { example: 'force', at: 1.2, diagram: true, friction: 20 },
        { example: 'force', at: 2.5, diagram: true, friction: 20 },
        { example: 'back', at: 3.3, diagram: true, friction: 20 },
        { example: 'mass', at: 12, diagram: true, friction: 20 },
        { example: 'force', at: stop.t0 + stop.dur / 2, diagram: true, friction: 20 },
      ]) {
        await fig.call('set', { ...state, paused: true, animate: false });
        await fig.advance(150);
        const report = await fig.frame.evaluate(() => {
          const bad = [];
          // kit 1.5.0: on landscape frames the panel sits beside the 3D and may scroll (its lines are checked for width)
          const side = innerWidth >= innerHeight && innerWidth >= 600;
          for (const e of document.querySelectorAll('.pvc-learn button,.ns-formula-values,.ns-formula-values>div,.pvc-outcome,.pvc-rule,.pvc-anno')) {
            const cs = getComputedStyle(e);
            if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
            const r = e.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            const low = r.bottom > innerHeight + 1 && !(side && e.closest('.pvc-panel'));
            if (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || low || e.scrollWidth > e.clientWidth + 1)
              bad.push({ text: e.textContent, right: r.right, bottom: r.bottom, overflow: e.scrollWidth - e.clientWidth });
          }
          const p = document.querySelector('.pvc-panel');
          return {
            bad,
            overflow: side ? 0 : p.scrollHeight - p.clientHeight,
            stage: document.querySelector('.pvc-stage').getBoundingClientRect().height,
          };
        });
        expect(report.bad, `${lang} ${width}×${height} ${JSON.stringify(state)}`).toEqual([]);
        expect(report.overflow).toBeLessThanOrEqual(1);
        expect(report.stage).toBeGreaterThan(150);
        if (state.diagram && state.example === 'force' && state.at === 1.2) {
          await expect(fig.frame.locator('.pvc-anno').filter({ hasText: /F1/ }), `${lang} ${width}x${height} F1`).toBeVisible();
          await expect(fig.frame.locator('.pvc-anno').filter({ hasText: /F2/ }), `${lang} ${width}x${height} F2`).toBeVisible();
          await expect(fig.frame.locator('.pvc-anno').filter({ hasText: /^N$|N =/ }), `${lang} ${width}x${height} N`).toBeVisible();
          await expect(fig.frame.locator('.pvc-anno').filter({ hasText: /^W$|W =/ }), `${lang} ${width}x${height} W`).toBeVisible();
        }
      }
      await fig.frame.locator('[data-act="maths"]').click();
      const sheet = await fig.frame.locator('.ns-math-dialog').evaluate((e) => {
        const r = e.getBoundingClientRect();
        return {
          inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1,
          overflow: e.scrollHeight - e.clientHeight,
        };
      });
      expect(sheet.inside).toBe(true);
      expect(sheet.overflow).toBeLessThanOrEqual(1);
      await fig.frame.locator('[data-act="maths-close"]').click();
    }
  expect(log.errors).toEqual([]);
});
