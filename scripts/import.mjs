#!/usr/bin/env node
// Makes a model figure from 3D files, like the studio's "New 3D model" dialog (same converter, run in headless
// Chromium, then the same checks on the GLB).
//
//   npm run import -- heart.glb --slug human-heart --title "Human heart (মানুষের হৃৎপিণ্ড)" --page 112 --topic 6.3 \
//     --license CC-BY-4.0 --credit "Jane Doe (sketchfab.com/…)" [--url …] [--units m|cm|mm|in] [--up y|z] \
//     [--placement "…"] [--description "…"] [--book physics-9-10]
//   npm run import -- box.obj box.mtl checker.png …      several files (OBJ + MTL + textures, glTF + bin + textures)
//   npm run import -- model.zip …                        or one zip
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { CHROMIUM_ARGS } from './lib/export/driver.mjs';
import { DEFAULT_BOOK } from './lib/books.mjs';
import { ROOT } from './lib/paths.mjs';
import { serveStatic } from './lib/static-server.mjs';
import { commitUpload, LICENSES, receiveFile } from './lib/uploads.mjs';

const USAGE = `Usage: npm run import -- <file…> --slug <id> --title "<English> (<বাংলা>)" --page <n> --topic <t> --license <${LICENSES.join('|')}> --credit "<who>" [--url <link>] [--units m|cm|mm|in] [--up y|z] [--placement "…"] [--description "…"]`;

/** Converts files in the browser: { glb: Buffer, thumbnail: Buffer, stats, warnings }. */
export async function convertFiles(files, { units = 'm', up = 'y' } = {}) {
  const server = await serveStatic(ROOT);
  const browser = await chromium.launch({ args: CHROMIUM_ARGS });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${server.url}/test/converter.html`);
    await page.waitForFunction(() => /** @type {any} */ (window).converterReady, null, { timeout: 30000 });
    const payload = files.map((f) => ({ name: path.basename(f), base64: fs.readFileSync(f).toString('base64') }));
    const r = await page.evaluate(([fs_, opts]) => /** @type {any} */ (window).convert(fs_, opts), [payload, { units, up }]);
    return { glb: Buffer.from(r.glb, 'base64'), thumbnail: Buffer.from(r.thumbnail.split(',')[1], 'base64'), stats: r.stats, warnings: r.warnings };
  } finally {
    await browser.close();
    await server.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args.splice(i, 2)[1] : undefined;
  };
  const o = {
    id: opt('slug'),
    title: opt('title'),
    page: opt('page'),
    topic: opt('topic') || '',
    book: opt('book') || DEFAULT_BOOK,
    placement: opt('placement') || '',
    description: opt('description') || '',
    units: opt('units') || 'm',
    up: opt('up') || 'y',
    license: opt('license'),
    credit: opt('credit'),
    url: opt('url') || '',
  };
  const files = args.filter((a) => !a.startsWith('--'));
  if (!files.length || !o.id || !o.title || !o.license || !o.credit) {
    console.error(USAGE);
    process.exit(2);
  }
  for (const f of files) if (!fs.existsSync(f)) throw new Error(`no such file: ${f}`);
  console.log(`… converting ${files.map((f) => path.basename(f)).join(', ')}`);
  const r = await convertFiles(files, o);
  console.log(
    `  ${r.stats.format.toUpperCase()}: ${r.stats.size.map((v) => `${v} m`).join(' × ')}, ${r.stats.triangles} triangles, ${r.stats.materials} materials, ${r.stats.textures} textures`,
  );
  for (const w of r.warnings) console.log(`  ! ${w}`);

  const uploadId = crypto.randomBytes(10).toString('hex');
  const originals = [];
  for (const f of files) {
    const name = path
      .basename(f)
      .replace(/[^\w .()+-]/g, '_')
      .replace(/^[^\w]/, '_');
    await receiveFile(uploadId, name, fs.readFileSync(f));
    originals.push(name);
  }
  await receiveFile(uploadId, '_converted.glb', r.glb);
  await receiveFile(uploadId, '_thumbnail.png', r.thumbnail);
  let by = 'import';
  let maintainers = [];
  try {
    by = execFileSync('git', ['config', 'user.name'], { encoding: 'utf8' }).trim() || by;
    const gh = execFileSync('git', ['config', 'github.user'], { encoding: 'utf8' }).trim();
    if (gh) maintainers = [gh];
  } catch {}
  const page = o.page ? Number(o.page) : null;
  const done = await commitUpload(
    uploadId,
    {
      ...o,
      page,
      source: { license: o.license, credit: o.credit, url: o.url },
      glb: '_converted.glb',
      thumbnail: '_thumbnail.png',
      originals,
      stats: r.stats,
    },
    { by, maintainers },
  );
  console.log(
    `✓ ${done.dir}: model.glb ${(done.glb.bytes / 1024).toFixed(0)} KB, ${done.glb.triangles} triangles, ${done.glb.size.map((v) => `${v} m`).join(' × ')}`,
  );
  console.log(`  Next: npm run verify -- ${done.id}, then look at test-results/${done.id}/`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(`✗ ${err.message}`);
    process.exitCode = 1;
  });
}
