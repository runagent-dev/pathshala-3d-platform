// Reading and writing asset folders. An asset is any folder in assets/ that has an asset.json.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { ROOT, ASSETS_DIR, SHARED_DIR, DIST_DIR, TEMPLATES_DIR, THUMBS_DIR, ID_RE, assetDir } from './paths.mjs';
import { writeFileAtomic, walkFiles } from './fsutil.mjs';
import { formatManifest } from './manifest/index.mjs';
import { readStatus, STATUSES } from './status.mjs';
import { loadBooks, findBook, chapterOf, bookRef, bookIndex } from './books.mjs';
import { reviewCounts } from './reviews.mjs';

export { ROOT, ASSETS_DIR, SHARED_DIR, DIST_DIR, TEMPLATES_DIR, THUMBS_DIR, ID_RE, STATUSES, assetDir, walkFiles, writeFileAtomic };

// Files that belong to our workflow, not to the deliverable.
export const DEV_ONLY_FILES = new Set(['NOTES.md', 'status.json', 'thumbnail.png']);
// reviews: reviewer feedback (in git, never packaged). exports: GLBs and pictures made in the studio
// (not in git). reference: book-page screenshots for the developer. tests: figure-specific tests.
export const DEV_ONLY_DIRS = new Set(['reviews', 'exports', 'reference', 'tests']);

export async function readManifest(id) {
  const raw = await fsp.readFile(path.join(assetDir(id), 'asset.json'), 'utf8');
  return JSON.parse(raw);
}

export async function writeManifest(id, manifest) {
  await writeFileAtomic(path.join(assetDir(id), 'asset.json'), formatManifest(manifest));
}

export function entryUrl(id, manifest) {
  if (manifest.type === 'model' && /\.(glb|gltf)$/i.test(manifest.entry || 'model.glb')) {
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
      } else if (!DEV_ONLY_FILES.has(ent.name)) {
        newest = Math.max(newest, (await fsp.stat(p)).mtimeMs);
      }
    }
  };
  await walk(dir);
  return newest;
}

/** The studio's thumbnail for a figure: a local capture (not in git), or an old committed thumbnail.png. */
export function thumbnailFile(id) {
  const cached = path.join(THUMBS_DIR, `${id}.png`);
  if (fs.existsSync(cached)) return cached;
  const legacy = path.join(assetDir(id), 'thumbnail.png');
  return fs.existsSync(legacy) ? legacy : null;
}

export async function assetSummary(id) {
  const dir = assetDir(id);
  const manifest = await readManifest(id);
  const thumb = thumbnailFile(id);
  const thumbStat = thumb ? await fsp.stat(thumb) : null;
  const notes = path.join(dir, 'NOTES.md');
  const notesText = fs.existsSync(notes) ? await fsp.readFile(notes, 'utf8') : '';
  const status = fs.existsSync(path.join(dir, 'status.json')) ? (await readStatus(id)).status : manifest.status || 'idea';
  const book = manifest.book ? findBook(manifest.book) : null;
  const chapter = chapterOf(book, manifest.topic);
  return {
    ...manifest,
    id,
    status,
    url: `/assets/${id}/`,
    entryUrl: entryUrl(id, manifest),
    ref: bookRef(manifest),
    bookTitle: book?.title || null,
    chapter: chapter ? { number: chapter.number, title: chapter.title } : null,
    thumbnail: thumbStat ? `/api/assets/${id}/thumbnail?v=${Math.round(thumbStat.mtimeMs)}` : null,
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
  const books = loadBooks();
  return out.sort((a, b) => bookOrder(a, b, books));
}

/**
 * Book order: book (as listed in books.json), then page, then topic (1.6 before 1.10), then `order`, then id.
 * Figures without a page go last within their book.
 */
export function bookOrder(a, b, books = loadBooks()) {
  const bi = (x) => (x.book ? bookIndex(x.book, books) : books.length + 1);
  const page = (x) => (Number.isFinite(+x.page) && x.page !== '' && x.page != null ? +x.page : Infinity);
  const topic = (x) => String(x.topic || '').split('.').map((n) => +n || 0);
  if (bi(a) !== bi(b)) return bi(a) - bi(b);
  if (page(a) !== page(b)) return page(a) - page(b);
  const ta = topic(a);
  const tb = topic(b);
  for (let i = 0; i < Math.max(ta.length, tb.length); i++) if ((ta[i] || 0) !== (tb[i] || 0)) return (ta[i] || 0) - (tb[i] || 0);
  return (a.order ?? 999) - (b.order ?? 999) || a.id.localeCompare(b.id);
}
