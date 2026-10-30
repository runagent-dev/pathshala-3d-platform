// Runs a built lab in a reference reader (harness/host-harness.js) in headless Chromium and checks what a reader needs:
//
//   starts       the lab says hello and the host answers init; the figure's "ready" reaches the host (the poster would hide)
//   sandbox      the frame is `sandbox="allow-scripts"` with the lab CSP; no request leaves the lab; no CSP violation, no error
//   settings     the designer's settings (init.params) reach the figure: the URL query the figure reads, and its own state
//   visibility   while the host says "hidden" the lab draws no frames; when visible again it does
//   reset        the host's "start over" calls the figure's reset
//   picture      the frame is not blank
//
// What it does NOT check: a figure's teaching content, touch input, the figure on real phones, the Chalk reader's own UI
// (it uses the host code of @chalk-format/core, not the reader), or labs that use the `state` / `progress` capabilities
// (the build declares none).
import path from 'node:path';
import { chromium } from '@playwright/test';
import * as esbuild from 'esbuild';
import { PNG } from 'pngjs';
import { CHROMIUM_ARGS, inspectPng } from '../export/driver.mjs';
import { ROOT } from '../paths.mjs';

let harnessCode = null;

async function harnessBundle() {
  if (harnessCode) return harnessCode;
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, 'scripts', 'lib', 'library', 'harness', 'host-harness.js')],
    bundle: true,
    write: false,
    format: 'iife',
    target: 'es2022',
    platform: 'browser',
    logLevel: 'silent',
    nodePaths: [path.join(ROOT, 'node_modules')],
  });
  harnessCode = result.outputFiles[0].text;
  return harnessCode;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {{ html: string, libraries: Array<{ specifier: string, bytes: Uint8Array }>, lab: { id: string, version: string, entry?: string, params?: Record<string, unknown> },
 *           stateProbe?: { param: string, stateKey: string }, locale?: string, browser?: import('@playwright/test').Browser }} options
 * @returns {Promise<{ ok: boolean, checks: Array<{ name: string, ok: boolean, detail?: string }> }>}
 */
export async function verifyLab({ html, libraries, lab, stateProbe, locale = 'bn', browser: given }) {
  const browser = given || (await chromium.launch({ args: CHROMIUM_ARGS }));
  const checks = [];
  const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), ...(detail ? { detail: String(detail) } : {}) });
  const context = await browser.newContext({ viewport: { width: 900, height: 600 } });
  const page = await context.newPage();
  const problems = [];
  const requests = [];
  page.on('pageerror', (e) => problems.push(`error: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console: ${m.text()}`);
  });
  // nothing may leave the page: every request is refused and noted. The harness page is a made-up localhost address (a secure
  // context, as a reader's page is: crypto.randomUUID needs one), answered here, never fetched.
  const HARNESS_URL = 'http://localhost:4999/';
  await page.route('**/*', (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  await page.route(HARNESS_URL, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body style="margin:0"></body></html>' }),
  );
  try {
    await page.goto(HARNESS_URL);
    await page.addScriptTag({ content: await harnessBundle() });
    const mount = await page.evaluate(({ html, libraries, lab, locale }) => window.__mountLab({ html, libraries, lab, locale }), {
      html,
      libraries: libraries.map((l) => ({ specifier: l.specifier, base64: Buffer.from(l.bytes).toString('base64') })),
      lab,
      locale,
    });
    check('the lab says hello and the host answers init', true, `granted: ${mount.granted.join(', ') || 'none'}`);
    const ready = await page
      .waitForFunction(() => window.__labTest.events.includes('ready'), null, { timeout: 30000 })
      .then(() => true)
      .catch(() => false);
    check(
      'the figure is ready (the reader would hide the poster)',
      ready,
      ready ? '' : `host errors: ${await page.evaluate(() => window.__labTest.errors.join('; '))}`,
    );

    const frame = page.frames().find((f) => f !== page.mainFrame());
    if (!frame) throw new Error('the lab frame is missing');
    const attrs = await page.evaluate(() => ({
      sandbox: window.__labTest.frame.getAttribute('sandbox'),
      csp: /Content-Security-Policy/i.test(window.__labTest.frame.srcdoc),
    }));
    check('sandbox="allow-scripts" and the lab CSP', attrs.sandbox === 'allow-scripts' && attrs.csp, `${attrs.sandbox}`);

    // settings
    const search = await frame.evaluate(() => globalThis.__pathshalaLab?.search ?? null);
    // an empty setting is left out of the query (the figure's own default applies)
    const expected = Object.entries(lab.params || {})
      .filter(([, v]) => v !== '' && v !== undefined && v !== null)
      .map(([k]) => k);
    check(
      "the designer's settings reach the figure",
      expected.every((k) => String(search || '').includes(`${k}=`)),
      `query: ${search || '(none)'}`,
    );
    if (stateProbe) {
      await sleep(500);
      const state = await frame.evaluate(() => globalThis.__pathshalaLab?.commands?.get?.());
      const want = lab.params?.[stateProbe.param];
      const got = state?.[stateProbe.stateKey];
      check(
        `the figure's own state follows the setting (${stateProbe.param})`,
        Number(got) === Number(want) || got === want,
        `wanted ${want}, state has ${got}`,
      );
    }

    // visibility
    const ticks = () =>
      frame.evaluate(
        () =>
          new Promise((resolve) => {
            // software rendering is slow (about 1 frame per second with shadows): look for two seconds
            let n = 0;
            const stop = performance.now() + 2000;
            const loop = () => {
              n += 1;
              if (performance.now() < stop) requestAnimationFrame(loop);
              else resolve(n);
            };
            requestAnimationFrame(loop);
            setTimeout(() => resolve(n), 2600);
          }),
      );
    await page.evaluate(() => window.__setVisible(false));
    await sleep(100);
    const hiddenTicks = await ticks();
    await page.evaluate(() => window.__setVisible(true));
    await sleep(100);
    const visibleTicks = await ticks();
    check(
      'no frames are drawn while the host says hidden, and they resume when visible',
      hiddenTicks === 0 && visibleTicks >= 1,
      `hidden: ${hiddenTicks} frames, visible: ${visibleTicks}`,
    );

    // reset
    await frame.evaluate(() => {
      const c = globalThis.__pathshalaLab?.commands;
      if (c?.reset) {
        const original = c.reset;
        globalThis.__resetCalls = 0;
        c.reset = (...a) => ((globalThis.__resetCalls += 1), original(...a));
      }
    });
    await page.evaluate(() => window.__resetLab());
    await sleep(300);
    const resets = await frame.evaluate(() => globalThis.__resetCalls ?? -1);
    check(
      "the host's start over calls the figure's reset",
      resets >= 1 || resets === -1,
      resets === -1 ? 'the figure has no reset command' : `${resets} call(s)`,
    );

    // picture
    await sleep(500);
    const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 800, height: 500 } });
    const info = inspectPng(`data:image/png;base64,${shot.toString('base64')}`, PNG);
    check('the picture is not blank', !info.blank, '');

    check(
      'no request leaves the lab',
      requests.filter((u) => /^https?:|^file:/.test(u)).length === 0,
      requests
        .filter((u) => /^https?:|^file:/.test(u))
        .slice(0, 3)
        .join(', '),
    );
    check('no errors or CSP violations', problems.length === 0, problems.slice(0, 3).join(' | '));
  } catch (err) {
    check('the verification ran to the end', false, err.message);
  } finally {
    await context.close();
    if (!given) await browser.close();
  }
  return { ok: checks.every((c) => c.ok), checks };
}
