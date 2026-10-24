// Figures: list, details, create, edit asset.json fields, status, notes, thumbnail, package.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {
  STATUSES,
  THUMBS_DIR,
  assetDir,
  assetSummary,
  listAssets,
  readManifest,
  thumbnailFile,
  writeFileAtomic,
  writeManifest,
} from '../../lib/assets.mjs';
import { loadBooks } from '../../lib/books.mjs';
import { validateManifest } from '../../lib/manifest/index.mjs';
import { packageAsset } from '../../lib/package.mjs';
import { ASSETS_DIR, ID_RE } from '../../lib/paths.mjs';
import { scaffoldAsset } from '../../lib/scaffold.mjs';
import { writeStatus } from '../../lib/status.mjs';
import { decodeImage, httpError, json, readBody, readJson, send } from '../http.mjs';
import { REVIEWER_STATUSES, STATUS_RIGHTS } from '../policy.mjs';
import { MIME } from '../../lib/mime.mjs';

// What the studio may change in asset.json. Status is not here: it lives in status.json (PUT …/status).
const EDITABLE_FIELDS = ['title', 'description', 'book', 'page', 'topic', 'placement', 'order', 'tags', 'version', 'maintainers', 'units'];

/** The figure folder for a request, or a 404. Reviewers only see figures that are ready to be looked at. */
export async function figure(id, user) {
  if (!ID_RE.test(id) || !fs.existsSync(path.join(ASSETS_DIR, id, 'asset.json'))) throw httpError(404, `No figure "${id}"`);
  if (user.role === 'reviewer' && !REVIEWER_STATUSES.includes((await assetSummary(id)).status)) throw httpError(404, `No figure "${id}"`);
  return assetDir(id);
}

export function register(router, { git, live, rel }) {
  router.get('/api/assets', 'figures:read', async ({ res, user }) => {
    let assets = await listAssets();
    if (user.role === 'reviewer') assets = assets.filter((a) => REVIEWER_STATUSES.includes(a.status));
    json(res, 200, { assets, statuses: STATUSES, books: loadBooks() });
  });

  router.post('/api/assets', 'figures:create', async ({ req, res, user }) => {
    const body = await readJson(req);
    const r = await scaffoldAsset({ ...body, maintainers: body.maintainers || [] });
    git.commit({ paths: [rel(r.dir), '.github/CODEOWNERS'], message: `feat(${r.id}): new figure from the studio`, user });
    json(res, 201, await assetSummary(r.id));
  });

  router.get('/api/assets/:id', 'figures:read', async ({ res, params, user }) => {
    const dir = await figure(params.id, user);
    const readme = path.join(dir, 'README.md');
    json(res, 200, { ...(await assetSummary(params.id)), readme: fs.existsSync(readme) ? await fsp.readFile(readme, 'utf8') : '' });
  });

  router.patch('/api/assets/:id', 'figures:edit', async ({ req, res, params, user }) => {
    const dir = await figure(params.id, user);
    const patch = await readJson(req);
    const unknown = Object.keys(patch).filter((k) => !EDITABLE_FIELDS.includes(k));
    if (unknown.length) return json(res, 400, { error: `These fields can't be changed here: ${unknown.join(', ')}` });
    const manifest = { ...(await readManifest(params.id)), ...patch };
    for (const [k, v] of Object.entries(patch)) if (v === undefined) delete manifest[k];
    const { errors } = validateManifest(manifest, { folder: params.id, books: loadBooks(), dir });
    if (errors.length) return json(res, 400, { error: errors.map((e) => `${e.path}: ${e.message}`).join('; '), problems: errors });
    await writeManifest(params.id, manifest);
    git.commit({ paths: [rel(path.join(dir, 'asset.json'))], message: `chore(${params.id}): ${Object.keys(patch).join(', ')} (studio)`, user });
    json(res, 200, await assetSummary(params.id));
  });

  router.put('/api/assets/:id/status', 'status:set', async ({ req, res, params, user }) => {
    const dir = await figure(params.id, user);
    const { status } = await readJson(req, 4096);
    if (STATUSES.includes(status) && !STATUS_RIGHTS[user.role].includes(status)) throw httpError(403, `Only an admin can set "${status}"`);
    const manifest = await readManifest(params.id);
    await writeStatus(params.id, status, { by: user.username, version: manifest.version || null });
    git.commit({ paths: [rel(path.join(dir, 'status.json'))], message: `chore(${params.id}): status ${status} (v${manifest.version})`, user });
    json(res, 200, await assetSummary(params.id));
  });

  router.get('/api/assets/:id/notes', 'notes:read', async ({ res, params, user }) => {
    const file = path.join(await figure(params.id, user), 'NOTES.md');
    send(res, 200, fs.existsSync(file) ? await fsp.readFile(file) : '', { 'Content-Type': MIME['.md'] });
  });
  router.put('/api/assets/:id/notes', 'notes:write', async ({ req, res, params, user }) => {
    const file = path.join(await figure(params.id, user), 'NOTES.md');
    await writeFileAtomic(file, await readBody(req, 2 * 1024 * 1024));
    git.commitLater(`notes:${params.id}`, { paths: [rel(file)], message: `docs(${params.id}): notes (studio)`, user }); // people type: one commit per pause
    json(res, 200, { ok: true, savedAt: Date.now() });
  });

  // Thumbnails are the studio's own captures, kept in .cache/thumbs/ (not in git).
  router.get('/api/assets/:id/thumbnail', 'figures:read', async ({ res, params, user }) => {
    await figure(params.id, user);
    const file = thumbnailFile(params.id);
    if (!file) return json(res, 404, { error: 'No thumbnail yet' });
    send(res, 200, await fsp.readFile(file), { 'Content-Type': 'image/png' });
  });
  router.put('/api/assets/:id/thumbnail', 'thumbnails:write', async ({ req, res, params, user }) => {
    await figure(params.id, user);
    const png = decodeImage(await readBody(req, 8 * 1024 * 1024), req.headers['content-type']);
    if (png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return json(res, 400, { error: 'A thumbnail must be a PNG' });
    await fsp.mkdir(THUMBS_DIR, { recursive: true });
    await writeFileAtomic(path.join(THUMBS_DIR, `${params.id}.png`), png);
    live.queue(`meta:${params.id}`, 'meta', { id: params.id });
    json(res, 200, { ok: true, bytes: png.length });
  });

  router.post('/api/assets/:id/package', 'package:build', async ({ res, params, user }) => {
    await figure(params.id, user);
    json(res, 200, await packageAsset(params.id));
  });
}
