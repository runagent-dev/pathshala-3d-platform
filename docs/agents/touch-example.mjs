// EXAMPLE touch test in a phone browser, written for the stopwatch figure (assets/stopwatch). Copy docs/agents/touch-example.mjs into
// <your worktree>/scripts/.touch-tmp.mjs (never commit it) and rewrite the figure-specific part for your figure:
// every 3D thing the student taps or drags, every panel button, the test, all done with a finger.
//
//   node scripts/.touch-tmp.mjs <id> <port> <out-prefix>
//
// What it checks, at 390×700 and 844×390, pixel ratio 3, touch only:
//   - the first-use hand (coach) appears on the 3D object, and tapping where it points works;
//   - each panel button is big enough and works by touch;
//   - the 3D view keeps its size while the student uses it (no layout jumps in portrait);
//   - the test (পরীক্ষা) works by touch;
//   - the page never scrolls or zooms; no console errors.
// Tips learned the hard way:
//   - The driver turns the coach off by default; this passes coach: '1'.
//   - The page runs on a virtual clock: animation frames run only inside fig.advance(). Take pictures after
//     fig.advance(50), or you may catch a canvas that was just resized and not drawn yet.
//   - To find where a 3D part is on screen, use the coach's ring (.pvc-coach-ring) or expose nothing and compute
//     from a mirrored/known position; do not add test-only API to the figure.
//   - A drag by touch: page.touchscreen has only tap(); for drags dispatch pointer events in the frame, e.g.
//     frame.locator('.pvc-canvas').dispatchEvent('pointerdown', { pointerType: 'touch', clientX, clientY, isPrimary: true, pointerId: 7 })
//     then 'pointermove' steps and 'pointerup' (advance the clock a little between them).
import { chromium } from '@playwright/test';
import { CHROMIUM_ARGS, openFigure, preparePage } from './lib/export/driver.mjs';

const [id, port, out] = process.argv.slice(2);
const browser = await chromium.launch({ args: CHROMIUM_ARGS });
const problems = [];
const ok = (cond, what) => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${what}`);
  if (!cond) problems.push(what);
};

for (const [w, h] of [
  [390, 700],
  [844, 390],
]) {
  console.log(`${id} ${w}×${h} (touch, DPR 3)`);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  const log = await preparePage(page);
  const fig = await openFigure(page, id, { base: `http://127.0.0.1:${port}`, params: { coach: '1' } });
  const frame = page.frames().find((f) => f.url().includes(`/assets/${id}/`));
  const box = await (await frame.frameElement()).boundingBox();
  const get = () => fig.call('get');
  const tapAt = async (x, y) => {
    await page.touchscreen.tap(box.x + x, box.y + y);
    await fig.advance(100);
  };
  const tapEl = async (selector) => {
    const b = await frame.locator(selector).first().boundingBox();
    if (!b) throw new Error(`no ${selector}`);
    ok(b.width >= 40 && b.height >= 32, `${selector} is big enough for a finger (${Math.round(b.width)}×${Math.round(b.height)})`);
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await fig.advance(100);
  };
  const until = async (fn, ms = 8000) => {
    for (let t = 0; t < ms; t += 100) {
      if (await fn(await get())) return true;
      await fig.advance(100);
    }
    return false;
  };
  const coachSpot = async () => {
    const r = await frame.locator('.pvc-coach-ring').boundingBox();
    const c = await frame.locator('.pvc-canvas canvas').first().boundingBox();
    return r && c ? { x: r.x + r.width / 2 - box.x, y: r.y + r.height / 2 - box.y, canvasW: c.width, canvasX: c.x - box.x } : null;
  };
  const stageH = async () => (await frame.locator('.pvc-canvas canvas').first().boundingBox()).height;

  await fig.advance(2600);
  const h0 = await stageH();
  await fig.advance(50);
  await page.screenshot({ path: `${out}-coach-${w}x${h}.png` });
  const spot = await coachSpot();
  ok(Boolean(spot), 'the first-use hand shows on the 3D object');

  // ── figure-specific part (the stopwatch's): replace with your figure's actions ──
  if (spot) {
    await tapAt(spot.x, spot.y);
    ok((await get()).running === true, 'a tap on the 3D start button starts it');
    await fig.advance(1500);
    await tapAt(spot.x, spot.y);
    const s1 = await get();
    ok(!s1.running && s1.time > 1.4 && s1.time < 1.8, `a second tap stops it (${s1.time} s)`);
  }
  await tapEl('[data-act="startstop"]');
  await fig.advance(1000);
  await tapEl('[data-act="startstop"]');
  await tapEl('[data-act="reset"]');
  ok((await get()).time === 0, 'the panel reset button resets it');
  await tapEl('[data-act="lamp"]');
  ok(await until((s) => s.lamp?.phase === 'on'), 'the lamp lights');
  // ── end of the figure-specific part ──

  const h1 = await stageH();
  ok(Math.abs(h1 - h0) < 1, `the 3D view kept its size while using it (${Math.round(h0)} → ${Math.round(h1)} px)`);

  // the test, by touch
  await tapEl('[data-mode="quiz"]');
  await fig.advance(3000);
  await tapEl('.pvc-opt[data-q="2"]');
  await fig.advance(500);
  ok((await frame.locator('.pvc-q-feedback').getAttribute('data-tone')) !== '', 'an answer by touch is marked');
  await fig.advance(50);
  await page.screenshot({ path: `${out}-quiz-${w}x${h}.png` });
  await tapEl('[data-act="q-next"]');
  await fig.advance(3000);

  const view = await frame.evaluate(() => ({
    scrollX: document.scrollingElement.scrollLeft,
    scrollY: document.scrollingElement.scrollTop,
    wide: document.documentElement.scrollWidth - innerWidth,
    tall: document.documentElement.scrollHeight - innerHeight,
    scale: visualViewport.scale,
  }));
  ok(
    view.scrollX === 0 && view.scrollY === 0 && view.wide <= 0 && view.tall <= 0 && view.scale === 1,
    `the page did not scroll or zoom (${JSON.stringify(view)})`,
  );
  ok(log.errors.length === 0, `no console errors ${log.errors.join(' | ')}`);
  await ctx.close();
}
await browser.close();
console.log(problems.length ? `\n${problems.length} problem(s)` : '\nall touch checks passed');
process.exit(problems.length ? 1 : 0);
