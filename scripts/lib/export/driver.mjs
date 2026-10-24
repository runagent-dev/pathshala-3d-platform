// Drives a figure in a Playwright page with virtual time: used by the figure tests, the exporter and the visual
// comparison, so all three see the figure the same way. Takes a Playwright `page`; does not import Playwright.
//
//   const log = await preparePage(page);
//   const fig = await openFigure(page, 'screw-gauge', { base, params: { view: '3d' } });
//   await fig.call('set', { value: 5.2 });
//   await fig.advance(500);
//   const png = await fig.call('capture', { width: 800, height: 500 });
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS_DIR } from '../paths.mjs';

export const VIRTUAL_TIME = fs.readFileSync(new URL('./virtual-time.js', import.meta.url), 'utf8');

/** URL parameters for repeatable runs: no shadows (slow in software), no sound, no first-use pointers, seed 1. */
export const TEST_PARAMS = { shadow: '0', sound: '0', coach: '0', seed: '1' };

/** Chromium flags for WebGL without a GPU (SwiftShader). */
export const CHROMIUM_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export function readFigureManifest(id) {
  return JSON.parse(fs.readFileSync(path.join(ASSETS_DIR, id, 'asset.json'), 'utf8'));
}

/** Path of a figure's page with URL parameters, e.g. /assets/screw-gauge/index.html?shadow=0. */
export function figurePath(id, params = {}) {
  const entry = readFigureManifest(id).entry || 'index.html';
  const qs = new URLSearchParams(params).toString();
  return `/assets/${id}/${entry}${qs ? `?${qs}` : ''}`;
}

/**
 * Installs virtual time in every frame, blocks requests that leave this machine, and records problems:
 * returns { errors: [...], external: [...], failed: [...] } which fills in as the page runs.
 */
export async function preparePage(page, { virtualTime = true } = {}) {
  const hard = [];
  const aborted = new Map(); // url → reason; a load the browser aborted is fine if the same file also loaded
  const finished = new Set();
  const log = {
    errors: [],
    external: [],
    get failed() {
      return [...hard, ...[...aborted].filter(([url]) => !finished.has(url)).map(([url, why]) => `${url} (${why})`)];
    },
  };
  if (virtualTime) await page.addInitScript({ content: VIRTUAL_TIME });
  page.on('pageerror', (err) => log.errors.push(`page error: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') log.errors.push(`console: ${msg.text()}`);
  });
  page.on('requestfinished', (req) => finished.add(req.url()));
  page.on('requestfailed', (req) => {
    const reason = req.failure()?.errorText || '';
    if (log.external.includes(req.url())) return; // blocked on purpose, reported as external
    if (/ERR_ABORTED/.test(reason)) aborted.set(req.url(), reason);
    else hard.push(`${req.url()} (${reason})`);
  });
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.protocol === 'data:' || url.protocol === 'blob:') return route.continue();
    log.external.push(url.href);
    return route.abort('blockedbyclient');
  });
  return log;
}

/**
 * Opens a figure and waits until it is ready (fonts loaded, `ready` emitted). With `harness` (default) the figure
 * runs in an iframe of test/harness.html, so bridge commands work (`call`); without, it is the page itself (for
 * layout checks). `path` opens another copy of the page instead (the packaged zip, served from its own folder).
 * Returns { frame, ready, advance(ms, frameMs), call(type, payload) }.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 * @param {{ base?: string, path?: string, params?: Record<string, string>, harness?: boolean, readyWithin?: number, frameMs?: number }} [options]
 */
export async function openFigure(page, id, { base = '', path, params = {}, harness = true, readyWithin = 20000, frameMs = 50 } = {}) {
  // `path` opens another copy of the page (e.g. the packaged zip served from its own folder)
  const query = new URLSearchParams({ ...TEST_PARAMS, ...params }).toString();
  const src = path ? `${path}?${query}` : figurePath(id, { ...TEST_PARAMS, ...params });
  if (harness) await page.goto(`${base}/test/harness.html?src=${encodeURIComponent(src)}`);
  else await page.goto(`${base}${src}`);
  const frame = harness ? await waitForFrame(page, path ? path.split('?')[0] : `/assets/${id}/`) : page.mainFrame();
  await frame.waitForFunction(() => window.__vt && document.readyState === 'complete', null, { polling: 100 });
  await frame.evaluate(() => document.fonts.ready.then(() => undefined));

  const advance = (ms, step = frameMs) => frame.evaluate(([m, s]) => window.__vt.advance(m, s), [ms, step]);
  let waited = 0;
  while (!(await frame.evaluate(() => window.__vt.ready))) {
    if (waited >= readyWithin) throw new Error(`${id} did not emit "ready" within ${readyWithin} ms of (virtual) time`);
    await advance(100);
    waited += 100;
  }
  const ready = await frame.evaluate(() => window.__vt.ready);

  /** Sends a bridge command and keeps time moving until the answer arrives (animations may run first). */
  async function call(type, payload = {}, { within = 30000 } = {}) {
    if (!harness) throw new Error('call() needs the harness');
    const ticket = await page.evaluate(([t, p]) => window.harness.start(t, p), [type, payload]);
    for (let spent = 0; ; spent += 100) {
      const state = await page.evaluate((k) => window.harness.state(k), ticket);
      if (state.done) {
        if (state.error) throw new Error(`${type}: ${state.error}`);
        return state.value;
      }
      if (spent >= within) throw new Error(`${type} did not answer within ${within} ms of (virtual) time`);
      await advance(100);
    }
  }
  return { frame, ready, advance, call };
}

async function waitForFrame(page, fragment, timeout = 30000) {
  const start = Date.now();
  for (;;) {
    const frame = page.frames().find((f) => f.url().includes(fragment));
    if (frame) return frame;
    if (Date.now() - start > timeout) throw new Error(`the figure frame (${fragment}) never appeared`);
    await page.waitForTimeout(50);
  }
}

/** Decodes a PNG data URL into { width, height } and whether it is a single flat colour (blank). */
export function inspectPng(dataUrl, PNG) {
  const buf = Buffer.from(String(dataUrl).replace(/^data:image\/png;base64,/, ''), 'base64');
  const png = PNG.sync.read(buf);
  const { data } = png;
  let blank = true;
  for (let i = 4; i < data.length && blank; i += 4 * 97) {
    if (Math.abs(data[i] - data[0]) + Math.abs(data[i + 1] - data[1]) + Math.abs(data[i + 2] - data[2]) > 24) blank = false;
  }
  return { width: png.width, height: png.height, blank, bytes: buf.length };
}
