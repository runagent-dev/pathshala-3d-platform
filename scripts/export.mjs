#!/usr/bin/env node
// Exports figures for the book developers: zip, pictures, GLB and video (see scripts/lib/export/exporter.mjs).
//
//   npm run export -- screw-gauge                         preview export of the working tree → exports/_preview/<id>/
//   npm run export -- screw-gauge --formats all           …with video (slow: about a second per frame)
//   npm run export -- --all --formats zip,glb
//   npm run export -- screw-gauge --official              release: needs status "approved", no uncommitted changes and a
//                                                         new version; writes exports/<book>/<id>/<version>/, tags
//                                                         <id>@v<version> and updates exports/<book>/index.json
//   npm run export -- screw-gauge --ref <commit|tag>      export a commit (built in a clean git worktree)
//
// --json prints progress as JSON lines (used by the studio). PATHSHALA_EXPORTS_DIR moves the exports folder.
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { allFigures } from './check/index.mjs';
import { readFigureManifest } from './lib/export/driver.mjs';
import { DEFAULT_FORMATS, FORMATS, exportFigure } from './lib/export/exporter.mjs';
import { CACHE_DIR, EXPORTS_DIR, ROOT } from './lib/paths.mjs';
import { releaseProblem, releaseTag } from './lib/release.mjs';

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function parseArgs(argv) {
  const args = [...argv];
  const opt = (name) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args.splice(i, 2)[1] : undefined;
  };
  const formats = opt('formats');
  const o = { ref: opt('ref'), out: opt('out'), formats: formats === 'all' ? FORMATS : formats ? formats.split(',') : DEFAULT_FORMATS };
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  o.official = flags.has('--official');
  o.json = flags.has('--json');
  o.ids = flags.has('--all') ? allFigures() : args.filter((a) => !a.startsWith('--'));
  return o;
}

function updateCatalog(record) {
  const file = path.join(EXPORTS_DIR, record.book, 'index.json');
  const catalog = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { book: record.book, figures: {} };
  catalog.updated = record.exportedAt;
  catalog.figures[record.id] = {
    title: record.title,
    version: record.version,
    type: record.type,
    page: record.page,
    topic: record.topic,
    ref: record.ref,
    placement: record.placement,
    path: `${record.id}/${record.version}/`,
    files: record.files.map((f) => f.name),
    commit: record.commit,
  };
  catalog.figures = Object.fromEntries(Object.entries(catalog.figures).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
}

/** Exports a commit: a clean worktree at `ref` runs its own exporter, writing into this checkout's exports folder. */
async function exportRef(ref, opts) {
  const sha = git('rev-parse', '--verify', `${ref}^{commit}`);
  const dir = path.join(CACHE_DIR, 'build', sha.slice(0, 12));
  if (fs.existsSync(dir)) git('worktree', 'remove', '--force', dir);
  git('worktree', 'add', '--detach', dir, sha);
  try {
    if (!fs.existsSync(path.join(dir, 'scripts', 'export.mjs'))) throw new Error(`${ref} is older than the exporter; export it from a newer commit`);
    fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'));
    const args = ['scripts/export.mjs', ...opts.ids, '--formats', opts.formats.join(',')];
    if (opts.official) args.push('--official');
    if (opts.json) args.push('--json');
    const code = await new Promise((resolve) => {
      const p = spawn('node', args, { cwd: dir, stdio: 'inherit', env: { ...process.env, PATHSHALA_EXPORTS_DIR: EXPORTS_DIR } });
      p.on('close', resolve);
    });
    if (code !== 0) throw new Error(`exporting ${ref} failed`);
  } finally {
    git('worktree', 'remove', '--force', dir);
  }
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!o.ids.length) {
    console.log('Usage: npm run export -- <id…|--all> [--formats zip,images,glb,video|all] [--official] [--ref <commit>] [--json]');
    process.exit(2);
  }
  for (const id of o.ids) if (!allFigures().includes(id)) throw new Error(`no figure "${id}"`);
  if (o.ref) return exportRef(o.ref, o);

  const say = o.json ? (obj) => console.log(JSON.stringify(obj)) : () => {};
  let failed = 0;
  for (const id of o.ids) {
    const manifest = readFigureManifest(id);
    if (o.official) {
      const problem = await releaseProblem(id);
      if (problem) {
        failed++;
        say({ type: 'error', id, message: problem });
        if (!o.json) console.error(`✗ ${id}: ${problem}`);
        continue;
      }
    }
    const out = o.out
      ? path.resolve(o.out, id)
      : o.official
        ? path.join(EXPORTS_DIR, manifest.book, id, manifest.version)
        : path.join(EXPORTS_DIR, '_preview', id);
    const started = Date.now();
    let last = '';
    try {
      const record = await exportFigure(id, {
        out,
        formats: o.formats,
        official: o.official,
        onProgress: (p) => {
          say({ type: 'progress', ...p });
          const line = `… ${id}: ${p.step} ${p.done}/${p.total}`;
          if (!o.json && process.stdout.isTTY && line !== last) process.stdout.write(`${(last = line)}\r`);
        },
      });
      if (o.official) {
        git('tag', '-a', releaseTag(id, manifest.version), '-m', `${record.title} ${manifest.version} (${record.ref})`);
        const latest = path.join(EXPORTS_DIR, manifest.book, id, 'latest');
        fs.rmSync(latest, { force: true });
        fs.symlinkSync(manifest.version, latest);
        updateCatalog(record);
      }
      say({ type: 'done', id, out: path.relative(ROOT, out), record });
      if (!o.json) {
        console.log(
          `✓ ${id} v${manifest.version}${o.official ? ` (release, tagged ${releaseTag(id, manifest.version)})` : ''} in ${((Date.now() - started) / 1000).toFixed(0)} s → ${path.relative(ROOT, out)}/`,
        );
        for (const f of record.files) console.log(`    ${String(f.name).padEnd(28)} ${(Number(f.bytes) / 1024).toFixed(0).padStart(6)} KB`);
      }
    } catch (err) {
      failed++;
      say({ type: 'error', id, message: err.message });
      if (!o.json) console.error(`✗ ${id}: ${err.message}`);
    }
  }
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(`✗ ${err.message}`);
    process.exitCode = 1;
  });
}
