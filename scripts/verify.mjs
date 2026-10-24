#!/usr/bin/env node
// `npm run verify -- <id>`: the definition of done for one figure. Prints a checklist and fails if anything is
// red. Pictures go to test-results/<id>/ so a person (or an agent, with its image reader) can look at them.
//
//   1. npm run check with the release profile (warnings count)
//   2. README sections generated from asset.json are current (npm run docs)
//   3. the version was bumped if the figure's files changed (against origin/main)
//   4. browser tests: bridge contract, the six viewports, the figure's own tests
//   5. the packaged zip runs on its own, with every request outside it blocked
//   6. the GLB export is valid glTF (Khronos validator) and has a real size
//   7. pictures: the poster (1600×1000) and each viewport
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import { allFigures, runChecks } from './check/index.mjs';
import { staleReadmes } from './docs.mjs';
import { CHROMIUM_ARGS, inspectPng, openFigure, preparePage, readFigureManifest } from './lib/export/driver.mjs';
import { glbInfo, validateGlb } from './lib/export/glb.mjs';
import { packageAsset } from './lib/package.mjs';
import { ROOT } from './lib/paths.mjs';
import { serveStatic } from './lib/static-server.mjs';
import { VIEWPORTS } from '../test/figures/figures.mjs';

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const hasRef = (ref) => {
  try {
    git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`);
    return true;
  } catch {
    return false;
  }
};

/** Did the figure's deliverable files change against `base` without a version bump? */
function versionProblem(id, base) {
  const changed = git('diff', '--name-only', base, '--', `assets/${id}`)
    .split('\n')
    .concat(git('ls-files', '--others', '--exclude-standard', '--', `assets/${id}`).split('\n'))
    .filter((f) => f && !/\/(NOTES\.md|status\.json|reviews\/.*|reference\/.*|tests\/.*)$/.test(f));
  if (!changed.length) return null;
  let before;
  try {
    before = JSON.parse(git('show', `${base}:assets/${id}/asset.json`)).version;
  } catch {
    return null; // a new figure
  }
  const now = readFigureManifest(id).version;
  return before === now ? `files changed since ${base} (${changed.length}) but the version is still ${now}: bump it in asset.json` : null;
}

async function main() {
  const id = process.argv[2];
  if (!id || !allFigures().includes(id)) {
    console.error(`Usage: npm run verify -- <figure-id>   (figures: ${allFigures().join(', ')})`);
    process.exit(2);
  }
  const manifest = readFigureManifest(id);
  const out = path.join(ROOT, 'test-results', id);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const results = [];
  async function step(name, fn) {
    if (process.stdout.isTTY) process.stdout.write(`… ${name}\r`);
    try {
      const note = await fn();
      results.push({ name, ok: true, note });
      console.log(`✓ ${name}${note ? `  (${note})` : ''}`);
    } catch (err) {
      results.push({ name, ok: false, note: err.message });
      console.log(`✗ ${name}\n    ${String(err.message).split('\n').join('\n    ')}`);
    }
  }
  const isPage = /\.html?$/.test(manifest.entry || 'index.html');

  await step('npm run check (release profile)', async () => {
    const errors = (await runChecks({ ids: [id], profile: 'release' })).filter((r) => r.level === 'error');
    if (errors.length) throw new Error(errors.map((e) => `${e.file ? `${e.file}: ` : ''}${e.message}`).join('\n'));
  });
  await step('README sections match asset.json', async () => {
    if (staleReadmes([id]).length) throw new Error(`run: npm run docs -- ${id}`);
  });
  await step('version bumped for changed files', async () => {
    const base = hasRef('origin/main') ? 'origin/main' : null;
    if (!base) return 'skipped: no origin/main to compare with';
    const problem = versionProblem(id, base);
    if (problem) throw new Error(problem);
  });
  await step('browser tests (contract, six viewports, own tests)', async () => {
    const r = spawnSync('npx', ['playwright', 'test', '--reporter=line'], { cwd: ROOT, env: { ...process.env, FIGURES: id }, encoding: 'utf8' });
    const summary = (r.stdout.match(/\d+ (passed|failed)[^\n]*/g) || []).join(', ');
    if (r.status !== 0)
      throw new Error(`${summary || 'failed'}\n${(r.stdout.match(/^\s+\d+\) .*$/gm) || []).join('\n')}\nDetails: npx playwright show-report`);
    return summary;
  });

  const browser = await chromium.launch({ args: CHROMIUM_ARGS });
  const repo = await serveStatic(ROOT);
  try {
    await step('zip runs on its own, offline', async () => {
      const pkg = await packageAsset(id, { outDir: path.join(out, 'package') });
      if (!isPage) return `${pkg.files} files`;
      const server = await serveStatic(pkg.folder);
      const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
      try {
        const log = await preparePage(page);
        await openFigure(page, id, { base: server.url, path: `/${manifest.entry || 'index.html'}`, harness: false });
        const problems = [...log.errors, ...log.failed, ...log.external.map((u) => `blocked: ${u}`)];
        if (problems.length) throw new Error(problems.join('\n'));
        return `${pkg.files} files, ${(pkg.bytes / 1024).toFixed(0)} KB zip`;
      } finally {
        await page.close();
        await server.close();
      }
    });

    if (Array.isArray(manifest.export?.glb) || manifest.type === 'model') {
      await step('GLB is valid glTF with a real size', async () => {
        const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
        try {
          await preparePage(page);
          const fig = await openFigure(page, id, { base: repo.url });
          const glb = await fig.call('export-glb', {});
          const bytes = Buffer.from(glb.base64 ?? '', 'base64');
          const report = await validateGlb(bytes);
          if (report.errors)
            throw new Error(
              report.messages
                .filter((m) => m.severity === 0)
                .map((m) => `${m.code}: ${m.message} (${m.pointer})`)
                .join('\n'),
            );
          const info = await glbInfo(bytes);
          if (!info.size.some((v) => v > 0)) throw new Error('the model has no size');
          fs.writeFileSync(path.join(out, `${id}.glb`), bytes);
          return `${info.size.map((v) => `${v} m`).join(' × ')}, ${info.triangles} triangles, ${(bytes.length / 1024).toFixed(0)} KB, ${report.warnings} warnings`;
        } finally {
          await page.close();
        }
      });
    }

    if (isPage) {
      await step('pictures: poster and the six viewports', async () => {
        const params = manifest.export?.poster?.params || {};
        const shots = [
          { name: 'poster', viewport: { width: 800, height: 500 }, scale: 2 },
          ...VIEWPORTS.map((v) => ({ name: `${v.width}x${v.height}`, viewport: v, scale: 1 })),
        ];
        for (const s of shots) {
          const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.scale });
          const page = await ctx.newPage();
          try {
            await preparePage(page);
            const fig = await openFigure(page, id, { base: repo.url, params, harness: false });
            await fig.advance(1500);
            const png = await page.screenshot();
            if (inspectPng(`data:image/png;base64,${png.toString('base64')}`, PNG).blank) throw new Error(`${s.name} is blank`);
            fs.writeFileSync(path.join(out, `${s.name}.png`), png);
          } finally {
            await ctx.close();
          }
        }
        return `look at them in ${path.relative(ROOT, out)}/`;
      });
    }
  } finally {
    await browser.close();
    await repo.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(
    failed.length
      ? `\n✗ ${id}: ${failed.length} of ${results.length} checks failed.`
      : `\n✓ ${id} is done: every check passed. Now look at the pictures and check the wording against the book.`,
  );
  process.exitCode = failed.length ? 1 : 0;
}

main().catch((err) => {
  console.error(`✗ ${err.stack || err.message}`);
  process.exitCode = 1;
});
