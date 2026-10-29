#!/usr/bin/env node
// Visual comparison: renders every figure from two versions of the repo on this machine and compares the pixels.
// No reference pictures are committed: the "before" pictures come from a git worktree of the base commit, so
// fonts and the GPU are the same on both sides.
//
//   npm run test:visual                         working tree vs origin/main (or HEAD when there is no remote)
//   npm run test:visual -- --base baseline-2026-10-24
//   npm run test:visual -- --figures screw-gauge,si-prefixes
//   npm run test:visual -- --changed            only figures whose inputs differ from the base (CI)
//
// A picture depends only on the figure's files, the kit modules it imports and the renderer (lib/ci/figure-hashes.mjs), so
// pictures are kept in .cache/visual-shots under that hash and drawn again only when it changes; --changed leaves out the
// figures whose hash is the same on both sides.
// A difference in a figure whose own files did not change (for example after a shared kit change) fails the run;
// differences in figures you changed are reported only. The report is test-results/visual/index.html.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { allFigures } from './check/index.mjs';
import { hashPaths, RENDER_HARNESS, renderHash } from './lib/ci/figure-hashes.mjs';
import { CHROMIUM_ARGS, openFigure, preparePage, readFigureManifest } from './lib/export/driver.mjs';
import { CACHE_DIR, ROOT } from './lib/paths.mjs';
import { serveStatic } from './lib/static-server.mjs';

export const VISUAL_VIEWPORTS = [
  { width: 390, height: 700 },
  { width: 1280, height: 800 },
];
const OUT = path.join(ROOT, 'test-results', 'visual');
const BASE_DIR = path.join(CACHE_DIR, 'visual-base');
const SHOT_DIR = path.join(CACHE_DIR, 'visual-shots');
const SETTLE_MS = 1500; // virtual time after "ready" before the picture

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const hasRef = (ref) => {
  try {
    git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`);
    return true;
  } catch {
    return false;
  }
};

/** Figures whose own folder differs between `base` and the working tree. */
function touchedFigures(base) {
  const files = new Set([...git('diff', '--name-only', base).split('\n'), ...git('ls-files', '--others', '--exclude-standard').split('\n')]);
  const ids = new Set();
  for (const f of files) {
    const m = /^assets\/([^/]+)\//.exec(f);
    if (m) ids.add(m[1]);
  }
  return ids;
}

async function shoot(browser, baseUrl, id, viewport) {
  const page = await browser.newPage({ viewport });
  try {
    const log = await preparePage(page);
    const params = readFigureManifest(id).export?.poster?.params || {};
    const fig = await openFigure(page, id, { base: baseUrl, params, harness: false });
    await fig.advance(SETTLE_MS);
    const png = await page.screenshot({ animations: 'disabled' });
    return { png, errors: [...log.errors, ...log.external.map((u) => `external: ${u}`)] };
  } finally {
    await page.close();
  }
}

/** The picture for a hash and size: from the saved ones, or drawn now and saved. Without a hash it is always drawn. */
async function shotFor(hash, draw, vp) {
  const file = hash ? path.join(SHOT_DIR, `${hash}-${vp.width}x${vp.height}.png`) : null;
  if (file && fs.existsSync(file)) return { png: fs.readFileSync(file), errors: [] };
  const shot = await draw();
  if (file && !shot.errors.length) {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    fs.writeFileSync(file, shot.png);
  }
  return shot;
}

/** A figure's render hash in a checkout, or null when it cannot be worked out (then it is always drawn). */
function hashOf(id, root, harness) {
  try {
    return renderHash(id, { root, harness });
  } catch {
    return null;
  }
}

function compare(a, b) {
  const A = PNG.sync.read(a);
  const B = PNG.sync.read(b);
  if (A.width !== B.width || A.height !== B.height) return { changed: Infinity, diff: null };
  const diff = new PNG({ width: A.width, height: A.height });
  const changed = pixelmatch(A.data, B.data, diff.data, A.width, A.height, { threshold: 0.1 });
  return { changed, diff: PNG.sync.write(diff) };
}

function report(rows, base) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const body = rows
    .map(
      (r) => `<section class="${r.status}"><h2>${esc(r.id)} · ${r.viewport} · ${esc(r.status)}${r.changed ? ` · ${r.changed} px` : ''}</h2>
${r.note ? `<p>${esc(r.note)}</p>` : ''}<div class="row">${['base', 'head', 'diff']
        .filter((k) => r[k])
        .map((k) => `<figure><img src="${r[k]}"><figcaption>${k}</figcaption></figure>`)
        .join('')}</div></section>`,
    )
    .join('\n');
  fs.writeFileSync(
    path.join(OUT, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>Visual comparison</title><style>body{font:14px system-ui;margin:24px}
.row{display:flex;gap:12px;flex-wrap:wrap}img{max-width:420px;border:1px solid #ccc}section{margin-bottom:28px}
.fail h2{color:#b00020}.changed h2{color:#a15c00}.same h2{color:#1b7a3a}</style><h1>Visual comparison against ${esc(base)}</h1>\n${body}`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const base = opt('base') || (hasRef('origin/main') ? 'origin/main' : 'HEAD');
  if (!hasRef(base)) throw new Error(`unknown base "${base}"`);
  const changedOnly = args.includes('--changed');
  const only = opt('figures')?.split(',').filter(Boolean);
  const figures = only || allFigures();

  if (fs.existsSync(BASE_DIR)) git('worktree', 'remove', '--force', BASE_DIR);
  git('worktree', 'add', '--detach', BASE_DIR, base);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const [before, after] = await Promise.all([serveStatic(BASE_DIR), serveStatic(ROOT)]);
  const browser = await chromium.launch({ args: CHROMIUM_ARGS });
  const touched = touchedFigures(base);
  const harnessHead = hashPaths(ROOT, RENDER_HARNESS);
  const harnessBase = hashPaths(BASE_DIR, RENDER_HARNESS);
  const rows = [];
  let skipped = 0;
  try {
    for (const id of figures) {
      const inBase = fs.existsSync(path.join(BASE_DIR, 'assets', id, 'asset.json'));
      const headHash = hashOf(id, ROOT, harnessHead);
      const baseHash = inBase ? hashOf(id, BASE_DIR, harnessBase) : null;
      if (changedOnly && inBase && headHash && headHash === baseHash) {
        skipped++;
        continue;
      }
      for (const vp of VISUAL_VIEWPORTS) {
        const viewport = `${vp.width}x${vp.height}`;
        const name = `${id}-${viewport}`;
        const head = await shotFor(headHash, () => shoot(browser, after.url, id, vp), vp);
        fs.writeFileSync(path.join(OUT, `${name}-head.png`), head.png);
        if (!inBase) {
          rows.push({ id, viewport, status: 'new', head: `${name}-head.png`, note: `not in ${base}` });
          continue;
        }
        const old = await shotFor(baseHash, () => shoot(browser, before.url, id, vp), vp);
        fs.writeFileSync(path.join(OUT, `${name}-base.png`), old.png);
        const { changed, diff } = compare(old.png, head.png);
        if (diff && changed) fs.writeFileSync(path.join(OUT, `${name}-diff.png`), diff);
        const status = !changed ? 'same' : touched.has(id) ? 'changed' : 'fail';
        const errors = [...new Set([...old.errors, ...head.errors])];
        rows.push({
          id,
          viewport,
          status,
          changed: Number.isFinite(changed) ? changed : 'size differs',
          base: `${name}-base.png`,
          head: `${name}-head.png`,
          diff: changed && diff ? `${name}-diff.png` : null,
          note: errors.length ? errors.join('; ') : status === 'fail' ? "this figure's files did not change, but its pictures did" : '',
        });
        console.log(`${status === 'same' ? '✓' : status === 'changed' ? '~' : '✗'} ${name}: ${status}${changed ? ` (${changed} px)` : ''}`);
      }
    }
  } finally {
    await browser.close();
    await Promise.all([before.close(), after.close()]);
    git('worktree', 'remove', '--force', BASE_DIR);
  }
  if (changedOnly) console.log(`\n${skipped} figure(s) left out: the same inputs on both sides, so the same pictures.`);
  report(rows, base);
  const failed = rows.filter((r) => r.status === 'fail');
  console.log(`\nReport: ${path.relative(ROOT, path.join(OUT, 'index.html'))}`);
  if (failed.length) {
    console.log(`✗ ${failed.length} picture(s) changed in figures whose own files did not change.`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(`✗ ${err.message}`);
    process.exitCode = 1;
  });
}
