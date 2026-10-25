// Screenshots of a figure at chosen sizes and states (temporary helper; copy docs/agents/shot.mjs into <your worktree>/scripts/ as
// .shot-tmp.mjs, never commit it). Needs your own dev server: PORT=<yours> HOST=127.0.0.1 node scripts/dev.mjs
//
//   node scripts/.shot-tmp.mjs <id> <port> <out-prefix> <w>x<h>[,<w>x<h>…] [params-json] [steps-json]
//
// params: URL parameters (the driver adds shadow=0&sound=0&coach=0&seed=1; pass {"coach":"1"} to see pointers).
// steps: a list run in order before the picture:
//   {"…": …}                 → fig.call('set', that object)
//   {"$cmd": "practice"}     → fig.call('practice')  (any bridge command, optional "payload")
//   {"$click": "<selector>"} → click inside the figure
//   {"$wait": 1500}          → advance the virtual clock (ms)
// The page runs on a virtual clock: nothing moves unless time is advanced. A picture is taken after 1.5 s more.
import { chromium } from '@playwright/test';
import { CHROMIUM_ARGS, openFigure, preparePage } from './lib/export/driver.mjs';

const [id, port, out, sizes, params = '{}', steps = ''] = process.argv.slice(2);
const browser = await chromium.launch({ args: CHROMIUM_ARGS });
for (const size of sizes.split(',')) {
  const [w, h] = size.split('x').map(Number);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const log = await preparePage(page);
  const fig = await openFigure(page, id, { base: `http://127.0.0.1:${port}`, params: JSON.parse(params) });
  const frame = page.frames().find((f) => f.url().includes(`/assets/${id}/`));
  if (steps)
    for (const step of JSON.parse(steps)) {
      if (step.$cmd) await fig.call(step.$cmd, step.payload || {});
      else if (step.$click) await frame.locator(step.$click).first().click();
      else if (step.$wait) await fig.advance(step.$wait);
      else await fig.call('set', step);
    }
  await fig.advance(1500);
  await (await frame.frameElement()).screenshot({ path: `${out}-${size}.png` });
  if (log.errors.length) console.log(size, 'errors:', log.errors);
  await page.close();
}
await browser.close();
