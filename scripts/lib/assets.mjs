// Reading and writing asset folders. An asset is any folder in assets/ that has an asset.json.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviewCounts } from './reviews.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ASSETS_DIR = path.join(ROOT, 'assets');
export const SHARED_DIR = path.join(ROOT, 'shared');
export const DIST_DIR = path.join(ROOT, 'dist');
export const TEMPLATES_DIR = path.join(ROOT, 'templates');

export const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const STATUSES = ['idea', 'in-progress', 'review', 'changes', 'approved'];

// Files that belong to our workflow, not to the deliverable.
export const DEV_ONLY_FILES = new Set(['NOTES.md']);
export const DEV_ONLY_DIRS = new Set(['reviews']); // reviewer feedback: stays in the repo, never packaged

export function assetDir(id) {
  if (!ID_RE.test(id)) throw new Error(`Invalid asset id "${id}"`);
  return path.join(ASSETS_DIR, id);
}

export async function readManifest(id) {
  const raw = await fsp.readFile(path.join(assetDir(id), 'asset.json'), 'utf8');
  return JSON.parse(raw);
}

export async function writeManifest(id, manifest) {
  const file = path.join(assetDir(id), 'asset.json');
  await fsp.writeFile(file, JSON.stringify(manifest, null, 2) + '\n');
}

export function entryUrl(id, manifest) {
  if (manifest.type === 'model') {
    const src = `/assets/${id}/${manifest.entry || 'model.glb'}`;
    return `/shared/viewer/index.html?src=${encodeURIComponent(src)}`;
  }
  return `/assets/${id}/${manifest.entry || 'index.html'}`;
}

async function newestMtime(dir) {
  let newest = 0;
  const walk = async (d) => {
    for (const ent of await fsp.readdir(d, { withFileTypes: true })) {
      if (ent.name.startsWith('.')) continue;
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) {
        if (d !== dir || !DEV_ONLY_DIRS.has(ent.name)) await walk(p);
      }
      else if (!DEV_ONLY_FILES.has(ent.name) && ent.name !== 'thumbnail.png') {
        newest = Math.max(newest, (await fsp.stat(p)).mtimeMs);
      }
    }
  };
  await walk(dir);
  return newest;
}

export async function assetSummary(id) {
  const dir = assetDir(id);
  const manifest = await readManifest(id);
  const thumb = path.join(dir, 'thumbnail.png');
  const notes = path.join(dir, 'NOTES.md');
  const thumbStat = fs.existsSync(thumb) ? await fsp.stat(thumb) : null;
  const notesText = fs.existsSync(notes) ? await fsp.readFile(notes, 'utf8') : '';
  return {
    ...manifest,
    id,
    url: `/assets/${id}/`,
    entryUrl: entryUrl(id, manifest),
    thumbnail: thumbStat ? `/assets/${id}/thumbnail.png?v=${Math.round(thumbStat.mtimeMs)}` : null,
    notesLength: notesText.trim().length,
    reviews: await reviewCounts(id),
    updatedAt: await newestMtime(dir),
  };
}

export async function listAssets() {
  if (!fs.existsSync(ASSETS_DIR)) return [];
  const out = [];
  for (const ent of await fsp.readdir(ASSETS_DIR, { withFileTypes: true })) {
    if (!ent.isDirectory() || !ID_RE.test(ent.name)) continue;
    if (!fs.existsSync(path.join(ASSETS_DIR, ent.name, 'asset.json'))) continue;
    try {
      out.push(await assetSummary(ent.name));
    } catch (err) {
      out.push({ id: ent.name, title: ent.name, error: String(err.message || err) });
    }
  }
  return out.sort(bookOrder);
}

/** Book order: page, then topic (1.6 before 1.10), then `order`, then id. Assets without a page go last. */
export function bookOrder(a, b) {
  const page = (x) => (Number.isFinite(+x.page) && x.page !== '' && x.page != null ? +x.page : Infinity);
  const topic = (x) => String(x.topic || '').split('.').map((n) => +n || 0);
  if (page(a) !== page(b)) return page(a) - page(b);
  const ta = topic(a);
  const tb = topic(b);
  for (let i = 0; i < Math.max(ta.length, tb.length); i++) if ((ta[i] || 0) !== (tb[i] || 0)) return (ta[i] || 0) - (tb[i] || 0);
  return (a.order ?? 999) - (b.order ?? 999) || a.id.localeCompare(b.id);
}

export async function walkFiles(dir, base = dir) {
  const files = [];
  for (const ent of await fsp.readdir(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) files.push(...(await walkFiles(p, base)));
    else files.push(path.relative(base, p));
  }
  return files.sort();
}
