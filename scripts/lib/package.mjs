// Turns assets/<id>/ into a self-contained folder + zip in dist/ that another developer can drop into the book.
//
// In the repo, assets reach shared code through "../../shared/..." (usually only in the import map),
// so every asset runs from any static server rooted at the repo. Packaging copies shared/ inside the
// asset and rewrites those paths to "./shared/...", so the zip works on its own.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { assetDir, readManifest, walkFiles, DEV_ONLY_FILES, DEV_ONLY_DIRS, SHARED_DIR, DIST_DIR } from './assets.mjs';
import { zipDirectory } from './zip.mjs';

const TEXT_EXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.md']);

async function copyFile(src, dst) {
  await fsp.mkdir(path.dirname(dst), { recursive: true });
  await fsp.copyFile(src, dst);
}

async function copyTree(src, dst, filter = () => true) {
  for (const rel of await walkFiles(src)) {
    if (filter(rel)) await copyFile(path.join(src, rel), path.join(dst, rel));
  }
}

function rewriteSharedPaths(text, depth) {
  // A file `depth` folders below the asset root reached shared/ via ../ x (depth + 2).
  const from = '../'.repeat(depth + 2) + 'shared/';
  const to = depth === 0 ? './shared/' : '../'.repeat(depth) + 'shared/';
  return text.split(from).join(to);
}

export async function packageAsset(id, { zip = true } = {}) {
  const src = assetDir(id);
  const manifest = await readManifest(id);
  const exclude = new Set([...(manifest.packageExclude || [])]);
  const out = path.join(DIST_DIR, id);

  await fsp.rm(out, { recursive: true, force: true });
  await fsp.mkdir(out, { recursive: true });

  const files = (await walkFiles(src)).filter((rel) => {
    const base = path.basename(rel);
    return !DEV_ONLY_FILES.has(base) && !DEV_ONLY_DIRS.has(rel.split(path.sep)[0]) && !exclude.has(rel);
  });

  let usesShared = false;
  for (const rel of files) {
    const from = path.join(src, rel);
    const to = path.join(out, rel);
    if (TEXT_EXT.has(path.extname(rel))) {
      const depth = rel.split(path.sep).length - 1;
      const text = await fsp.readFile(from, 'utf8');
      const rewritten = rewriteSharedPaths(text, depth);
      if (rewritten !== text) usesShared = true;
      await fsp.mkdir(path.dirname(to), { recursive: true });
      await fsp.writeFile(to, rewritten);
    } else {
      await copyFile(from, to);
    }
  }

  if (usesShared) {
    // Ship the shared pieces assets use: vendor libs, helpers, fonts. (Not the dev-only model viewer.)
    await copyTree(path.join(SHARED_DIR, 'vendor'), path.join(out, 'shared', 'vendor'));
    await copyTree(path.join(SHARED_DIR, 'lib'), path.join(out, 'shared', 'lib'));
    await copyTree(path.join(SHARED_DIR, 'fonts'), path.join(out, 'shared', 'fonts'));
  }

  const stamp = {
    id,
    title: manifest.title,
    page: manifest.page ?? null,
    topic: manifest.topic || '',
    placement: manifest.placement || '',
    version: manifest.version || '0.0.0',
    type: manifest.type || 'interactive',
    entry: manifest.entry || (manifest.type === 'model' ? 'model.glb' : 'index.html'),
    packagedAt: new Date().toISOString(),
    three: fs.existsSync(path.join(SHARED_DIR, 'vendor/three/VERSION'))
      ? (await fsp.readFile(path.join(SHARED_DIR, 'vendor/three/VERSION'), 'utf8')).trim()
      : undefined,
  };
  await fsp.writeFile(path.join(out, 'PACKAGE.json'), JSON.stringify(stamp, null, 2) + '\n');

  let zipFile = null;
  let bytes = 0;
  if (zip) {
    zipFile = path.join(DIST_DIR, `${id}-v${stamp.version}.zip`);
    await zipDirectory(out, zipFile, id);
    bytes = (await fsp.stat(zipFile)).size;
  }
  return {
    id,
    folder: out,
    zip: zipFile,
    zipUrl: zipFile ? `/dist/${path.basename(zipFile)}` : null,
    bytes,
    files: (await walkFiles(out)).length,
  };
}
