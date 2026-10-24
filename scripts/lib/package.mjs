// Turns assets/<id>/ into a self-contained folder + zip in dist/ that another developer can drop into the book.
//
// In the repo, assets reach shared code through "../../shared/..." (usually only in the import map),
// so every asset runs from any static server rooted at the repo. Packaging copies the shared files the figure
// actually loads (found by depgraph.mjs, with their licences) inside the folder and rewrites those paths to
// "./shared/...", so the zip works on its own. The same commit always gives byte-identical zips.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { ROOT, assetDir, readManifest, walkFiles, DEV_ONLY_FILES, DEV_ONLY_DIRS, SHARED_DIR, DIST_DIR } from './assets.mjs';
import { figureGraph, licenceFiles } from './depgraph.mjs';
import { gitInfo, sourceDateEpoch } from './git.mjs';
import { bookRef } from './books.mjs';
import { zipDirectory } from './zip.mjs';

const TEXT_EXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.md']);
// Always shipped: the book's side of the postMessage protocol (the embed snippet in the README imports it).
const ALWAYS_SHARED = ['lib/host.js'];

function rewriteSharedPaths(text, depth) {
  // A file `depth` folders below the asset root reached shared/ via ../ x (depth + 2).
  const from = `${'../'.repeat(depth + 2)}shared/`;
  const to = depth === 0 ? './shared/' : `${'../'.repeat(depth)}shared/`;
  return text.split(from).join(to);
}

const readText = async (file) => (fs.existsSync(file) ? (await fsp.readFile(file, 'utf8')).trim() : undefined);

/** The files of a figure that go into its package: its folder minus dev-only files, plus the shared files it loads. */
export async function packageFiles(id, manifest) {
  const src = assetDir(id);
  const exclude = new Set(manifest.packageExclude || []);
  const own = (await walkFiles(src)).filter((rel) => {
    const base = path.basename(rel);
    return !DEV_ONLY_FILES.has(base) && !DEV_ONLY_DIRS.has(rel.split(path.sep)[0]) && !exclude.has(rel) && !rel.endsWith('.tmp');
  });
  const entry = manifest.entry || (manifest.type === 'model' ? 'model.glb' : 'index.html');
  if (!/\.html?$/i.test(entry)) return { own, shared: [] };

  const { files, problems } = figureGraph(src, entry);
  if (problems.length) {
    throw Object.assign(new Error(`Can't package ${id}:\n${problems.map((p) => `  ${p.file}: ${p.message}`).join('\n')}`), { status: 400, problems });
  }
  const shared = new Set([...files].filter((f) => f.startsWith(SHARED_DIR + path.sep)));
  for (const rel of ALWAYS_SHARED) shared.add(path.join(SHARED_DIR, rel));
  for (const f of licenceFiles(shared)) shared.add(f);
  return { own, shared: [...shared].map((f) => path.relative(SHARED_DIR, f)).sort() };
}

export async function packageAsset(id, { zip = true, outDir = DIST_DIR } = {}) {
  const src = assetDir(id);
  const manifest = await readManifest(id);
  const out = path.join(outDir, id);
  const { own, shared } = await packageFiles(id, manifest);

  await fsp.rm(out, { recursive: true, force: true });
  await fsp.mkdir(out, { recursive: true });

  const copy = async (from, to, depth) => {
    await fsp.mkdir(path.dirname(to), { recursive: true });
    if (TEXT_EXT.has(path.extname(from))) await fsp.writeFile(to, rewriteSharedPaths(await fsp.readFile(from, 'utf8'), depth));
    else await fsp.copyFile(from, to);
  };
  for (const rel of own) await copy(path.join(src, rel), path.join(out, rel), rel.split(path.sep).length - 1);
  for (const rel of shared) {
    const to = path.join(out, 'shared', rel);
    await fsp.mkdir(path.dirname(to), { recursive: true });
    await fsp.copyFile(path.join(SHARED_DIR, rel), to);
  }

  const epoch = sourceDateEpoch();
  const git = gitInfo([path.relative(ROOT, src), 'shared']);
  const stamp = {
    id,
    title: manifest.title,
    version: manifest.version || '0.0.0',
    type: manifest.type || 'interactive',
    entry: manifest.entry || (manifest.type === 'model' ? 'model.glb' : 'index.html'),
    book: manifest.book || null,
    page: manifest.page ?? null,
    topic: manifest.topic || '',
    ref: bookRef(manifest),
    placement: manifest.placement || '',
    packagedAt: new Date(epoch * 1000).toISOString(),
    commit: git?.commit || null,
    ...(git?.dirty ? { uncommitted: true } : {}),
    kit: await readText(path.join(SHARED_DIR, 'lib/VERSION')),
    three: await readText(path.join(SHARED_DIR, 'vendor/three/VERSION')),
  };
  await fsp.writeFile(path.join(out, 'PACKAGE.json'), `${JSON.stringify(stamp, null, 2)}\n`);

  let zipFile = null;
  let bytes = 0;
  if (zip) {
    zipFile = path.join(outDir, `${id}-v${stamp.version}.zip`);
    await zipDirectory(out, zipFile, id, { mtime: new Date(epoch * 1000) });
    bytes = (await fsp.stat(zipFile)).size;
  }
  return {
    id,
    folder: out,
    zip: zipFile,
    zipUrl: zipFile && outDir === DIST_DIR ? `/dist/${path.basename(zipFile)}` : null,
    bytes,
    files: (await walkFiles(out)).length,
    uncommitted: Boolean(git?.dirty),
  };
}
