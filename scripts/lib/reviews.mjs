// Reviewer feedback for each asset, kept next to it in assets/<id>/reviews/:
//   reviews.json   [{ id, author, text, createdAt, status: 'open'|'done', image?, context?, reply?, repliedAt? }]
//   <id>.png|jpg   optional picture of what the reviewer was looking at
// Dev only: the packager never ships the reviews/ folder.
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { assetDir } from './paths.mjs';

const dirOf = (id) => path.join(assetDir(id), 'reviews');
const fileOf = (id) => path.join(dirOf(id), 'reviews.json');
const fail = (status, message) => Object.assign(new Error(message), { status });

// One write at a time per asset, so two reviewers sending at once don't overwrite each other.
const queues = new Map();
function serial(id, fn) {
  const next = (queues.get(id) || Promise.resolve()).then(fn, fn);
  queues.set(id, next.catch(() => {}));
  return next;
}

export async function readReviews(id) {
  const file = fileOf(id);
  if (!fs.existsSync(file)) return [];
  try {
    const list = JSON.parse(await fsp.readFile(file, 'utf8'));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeReviews(id, list) {
  await fsp.mkdir(dirOf(id), { recursive: true });
  const tmp = `${fileOf(id)}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(list, null, 2) + '\n');
  await fsp.rename(tmp, fileOf(id));
}

export async function reviewCounts(id) {
  const list = await readReviews(id);
  return { open: list.filter((r) => r.status !== 'done').length, total: list.length };
}

const clean = (s, max) => String(s ?? '').replace(/\r\n?/g, '\n').trim().slice(0, max);

/** Small JSON only (frame size, URL params, the figure's state). */
function cleanContext(ctx) {
  if (!ctx || typeof ctx !== 'object') return null;
  const json = JSON.stringify(ctx);
  if (json.length <= 4000) return JSON.parse(json);
  const { frame, params } = ctx;
  return { frame, params, note: 'state left out (too large)' };
}

export function addReview(id, { author, text, image, context } = {}) {
  return serial(id, async () => {
    const name = clean(author, 60);
    const body = clean(text, 4000);
    if (!name) throw fail(400, 'Please give your name');
    if (!body) throw fail(400, 'Please write your feedback');
    const rid = `${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
    let picture = null;
    if (image) {
      const m = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(String(image));
      if (!m) throw fail(400, 'The picture must be a PNG or JPEG');
      const buf = Buffer.from(m[2], 'base64');
      if (buf.length > 4 * 1024 * 1024) throw fail(413, 'The picture is too large (max 4 MB)');
      picture = `reviews/${rid}.${m[1] === 'jpeg' ? 'jpg' : 'png'}`;
      await fsp.mkdir(dirOf(id), { recursive: true });
      await fsp.writeFile(path.join(assetDir(id), picture), buf);
    }
    const review = { id: rid, author: name, text: body, createdAt: new Date().toISOString(), status: 'open', image: picture, context: cleanContext(context) };
    const list = await readReviews(id);
    list.push(review);
    await writeReviews(id, list);
    return review;
  });
}

export function updateReview(id, rid, { status, reply } = {}) {
  return serial(id, async () => {
    const list = await readReviews(id);
    const r = list.find((x) => x.id === rid);
    if (!r) throw fail(404, 'No such review');
    if (status !== undefined) {
      if (!['open', 'done'].includes(status)) throw fail(400, 'Status must be open or done');
      r.status = status;
    }
    if (reply !== undefined) {
      r.reply = clean(reply, 2000) || undefined;
      r.repliedAt = r.reply ? new Date().toISOString() : undefined;
    }
    r.updatedAt = new Date().toISOString();
    await writeReviews(id, list);
    return r;
  });
}

export function deleteReview(id, rid) {
  return serial(id, async () => {
    const list = await readReviews(id);
    const i = list.findIndex((x) => x.id === rid);
    if (i < 0) throw fail(404, 'No such review');
    const [r] = list.splice(i, 1);
    if (r.image) await fsp.rm(path.join(assetDir(id), r.image), { force: true });
    await writeReviews(id, list);
    return { ok: true };
  });
}
