// Reviewer feedback for each asset, kept next to it in assets/<id>/reviews/, one file per review so reviews
// written at the same time (or on different machines) never conflict in git:
//   <rid>.json            { id, author, text, createdAt, status: 'open'|'done', image?, context?, reply?, repliedAt?, updatedAt? }
//   <rid>.webp|png|jpg    optional picture of what the reviewer was looking at
// An older reviews.json (one array) is still read; a review in it moves to its own file when it is changed.
// Dev only: the packager never ships the reviews/ folder.
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { assetDir } from './paths.mjs';
import { writeFileAtomic } from './fsutil.mjs';

const RID_RE = /^[a-z0-9]{6,32}$/;
const LEGACY = 'reviews.json';
const MAX_IMAGE = 1024 * 1024; // the studio sends a WebP of at most 1280 px, well under this
const IMAGE_TYPES = { png: 'png', jpeg: 'jpg', webp: 'webp' };

const dirOf = (id) => path.join(assetDir(id), 'reviews');
const fileOf = (id, rid) => path.join(dirOf(id), `${rid}.json`);
const fail = (status, message) => Object.assign(new Error(message), { status });
const format = (review) => `${JSON.stringify(review, null, 2)}\n`;

// One write at a time per asset, so two reviewers sending at once don't overwrite each other.
const queues = new Map();
function serial(id, fn) {
  const next = (queues.get(id) || Promise.resolve()).then(fn, fn);
  queues.set(
    id,
    next.catch(() => {}),
  );
  return next;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fsp.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function readLegacy(id) {
  const list = await readJson(path.join(dirOf(id), LEGACY), []);
  return Array.isArray(list) ? list.filter((r) => r && RID_RE.test(r.id || '')) : [];
}

async function writeLegacy(id, list) {
  const file = path.join(dirOf(id), LEGACY);
  if (list.length) await writeFileAtomic(file, `${JSON.stringify(list, null, 2)}\n`);
  else await fsp.rm(file, { force: true });
}

/** All reviews of an asset, oldest first. */
export async function readReviews(id) {
  const dir = dirOf(id);
  if (!fs.existsSync(dir)) return [];
  const byId = new Map();
  for (const r of await readLegacy(id)) byId.set(r.id, r);
  for (const name of await fsp.readdir(dir)) {
    const rid = name.replace(/\.json$/, '');
    if (name === LEGACY || !name.endsWith('.json') || !RID_RE.test(rid)) continue;
    const r = await readJson(path.join(dir, name), null);
    if (r && r.id === rid) byId.set(rid, r);
  }
  return [...byId.values()].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || a.id.localeCompare(b.id));
}

export async function reviewCounts(id) {
  const list = await readReviews(id);
  return { open: list.filter((r) => r.status !== 'done').length, total: list.length };
}

const clean = (s, max) =>
  String(s ?? '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, max);

/** Small JSON only (frame size, URL params, the figure's state). */
function cleanContext(ctx) {
  if (!ctx || typeof ctx !== 'object') return null;
  const json = JSON.stringify(ctx);
  if (json.length <= 4000) return JSON.parse(json);
  const { frame, params } = ctx;
  return { frame, params, note: 'state left out (too large)' };
}

/**
 * @param {string} id
 * @param {{ author?: string, text?: string, image?: string | null, context?: object | null }} [review]
 */
export function addReview(id, { author, text, image, context } = {}) {
  return serial(id, async () => {
    const name = clean(author, 60);
    const body = clean(text, 4000);
    if (!name) throw fail(400, 'Please give your name');
    if (!body) throw fail(400, 'Please write your feedback');
    const rid = `${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
    await fsp.mkdir(dirOf(id), { recursive: true });
    let picture = null;
    if (image) {
      const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(image));
      if (!m) throw fail(400, 'The picture must be a PNG, JPEG or WebP');
      const buf = Buffer.from(m[2], 'base64');
      if (buf.length > MAX_IMAGE) throw fail(413, 'The picture is too large (max 1 MB)');
      picture = `reviews/${rid}.${IMAGE_TYPES[m[1]]}`;
      await fsp.writeFile(path.join(assetDir(id), picture), buf);
    }
    const review = {
      id: rid,
      author: name,
      text: body,
      createdAt: new Date().toISOString(),
      status: 'open',
      image: picture,
      context: cleanContext(context),
    };
    await writeFileAtomic(fileOf(id, rid), format(review));
    return review;
  });
}

/** Finds a review; one still in the old reviews.json is moved to its own file first. */
async function take(id, rid) {
  if (!RID_RE.test(rid || '')) throw fail(404, 'No such review');
  const own = await readJson(fileOf(id, rid), null);
  if (own) return own;
  const legacy = await readLegacy(id);
  const r = legacy.find((x) => x.id === rid);
  if (!r) throw fail(404, 'No such review');
  await writeFileAtomic(fileOf(id, rid), format(r));
  await writeLegacy(
    id,
    legacy.filter((x) => x.id !== rid),
  );
  return r;
}

/**
 * @param {string} id
 * @param {string} rid
 * @param {{ status?: 'open' | 'done', reply?: string }} [change]
 */
export function updateReview(id, rid, { status, reply } = {}) {
  return serial(id, async () => {
    const r = await take(id, rid);
    if (status !== undefined) {
      if (!['open', 'done'].includes(status)) throw fail(400, 'Status must be open or done');
      r.status = status;
    }
    if (reply !== undefined) {
      r.reply = clean(reply, 2000) || undefined;
      r.repliedAt = r.reply ? new Date().toISOString() : undefined;
    }
    r.updatedAt = new Date().toISOString();
    await writeFileAtomic(fileOf(id, rid), format(r));
    return r;
  });
}

export function deleteReview(id, rid) {
  return serial(id, async () => {
    const r = await take(id, rid);
    await fsp.rm(fileOf(id, rid), { force: true });
    if (r.image && /^reviews\/[a-z0-9]+\.(png|jpg|webp)$/.test(r.image)) await fsp.rm(path.join(assetDir(id), r.image), { force: true });
    return { ok: true, id: rid };
  });
}
