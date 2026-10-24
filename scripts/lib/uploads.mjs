// Uploaded 3D models becoming model figures (the studio's upload dialog and `npm run import`). The browser has
// already converted the files to one GLB (shared/lib/import/convert.js); here the GLB is checked (Khronos
// validator), cleaned, measured against the limits, and written as a new figure with its provenance. The original
// files are kept in data/uploads/<id>/ (backed up, not in git).
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { scaffoldAsset } from './scaffold.mjs';
import { assetDir, DATA_DIR, ROOT, SHARED_DIR, THUMBS_DIR } from './paths.mjs';
import { formatManifest } from './manifest/index.mjs';

export const UPLOAD_LIMITS = { file: 50 * 1024 * 1024, total: 120 * 1024 * 1024, glb: 10 * 1024 * 1024, triangles: 500_000 };
export const LICENSES = ['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'own-work', 'other'];
const UPLOAD_ID = /^[a-z0-9]{8,40}$/;
const FILE_NAME = /^[\w][\w .()+-]{0,120}$/;
const fail = (status, message) => Object.assign(new Error(message), { status });
const tmpDir = (uploadId) => path.join(DATA_DIR, 'uploads', 'tmp', uploadId);
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/** Stores one uploaded file (raw body) for a pending upload. */
export async function receiveFile(uploadId, name, buf) {
  if (!UPLOAD_ID.test(uploadId || '')) throw fail(400, 'Bad upload id');
  if (!FILE_NAME.test(name || '') || name.includes('..')) throw fail(400, `Bad file name "${name}"`);
  if (buf.length > UPLOAD_LIMITS.file) throw fail(413, `${name} is larger than ${UPLOAD_LIMITS.file / 1024 / 1024} MB`);
  const dir = tmpDir(uploadId);
  await fsp.mkdir(dir, { recursive: true });
  const used = (await fsp.readdir(dir)).reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0);
  if (used + buf.length > UPLOAD_LIMITS.total) throw fail(413, 'The upload is too large in total');
  await fsp.writeFile(path.join(dir, name), buf);
  return { name, bytes: buf.length };
}

/** Removes pending uploads older than a day (called when a new one commits). */
async function sweep() {
  const root = path.join(DATA_DIR, 'uploads', 'tmp');
  if (!fs.existsSync(root)) return;
  for (const d of await fsp.readdir(root)) {
    const p = path.join(root, d);
    if (Date.now() - (await fsp.stat(p)).mtimeMs > 24 * 3600 * 1000) await fsp.rm(p, { recursive: true, force: true });
  }
}

/**
 * Turns a pending upload into a model figure. `meta`: { id, title, book, page, topic, placement, description,
 * units, up, source: { license, credit, url }, glb: 'model.glb', thumbnail?: 'thumbnail.png', originals: [names],
 * stats }. `by`: who uploaded it; `maintainers`. Returns { id, dir, glb: { bytes, triangles, size, warnings } }.
 */
export async function commitUpload(uploadId, meta, { by = 'studio', maintainers = [] } = {}) {
  if (!UPLOAD_ID.test(uploadId || '')) throw fail(400, 'Bad upload id');
  const dir = tmpDir(uploadId);
  if (!fs.existsSync(dir)) throw fail(404, 'No such upload (it may have expired): upload the files again');
  const src = meta.source || {};
  if (!LICENSES.includes(src.license)) throw fail(400, `Say under which licence the model may be used (${LICENSES.join(', ')})`);
  if (!String(src.credit || '').trim()) throw fail(400, 'Say who made the model (credit)');
  const glbFile = path.join(dir, meta.glb || 'model.glb');
  if (!fs.existsSync(glbFile)) throw fail(400, 'The converted model.glb is missing');

  // tooling tier: only needed here
  const { glbInfo, optimizeGlb, validateGlb } = await import('./export/glb.mjs');
  const raw = await fsp.readFile(glbFile);
  if (raw.subarray(0, 4).toString('latin1') !== 'glTF') throw fail(400, 'model.glb is not a GLB file');
  const report = await validateGlb(raw);
  if (report.errors)
    throw fail(
      400,
      `The model is not valid glTF: ${report.messages
        .filter((m) => m.severity === 0)
        .slice(0, 5)
        .map((m) => `${m.code} ${m.pointer || ''}`)
        .join('; ')}`,
    );
  const glb = Buffer.from(await optimizeGlb(raw));
  const info = await glbInfo(glb);
  if (glb.length > UPLOAD_LIMITS.glb)
    throw fail(
      413,
      `The model is ${(glb.length / 1024 / 1024).toFixed(1)} MB after cleaning; the limit is ${UPLOAD_LIMITS.glb / 1024 / 1024} MB. Simplify it (fewer triangles, smaller textures).`,
    );
  if (info.triangles > UPLOAD_LIMITS.triangles)
    throw fail(413, `The model has ${info.triangles} triangles; the limit is ${UPLOAD_LIMITS.triangles}. Simplify it first.`);

  const r = await scaffoldAsset({
    id: meta.id,
    title: meta.title,
    type: 'model',
    book: meta.book,
    page: meta.page,
    topic: meta.topic,
    placement: meta.placement,
    maintainers,
  });
  try {
    await fsp.writeFile(path.join(r.dir, 'model.glb'), glb);
    const manifestFile = path.join(r.dir, 'asset.json');
    const manifest = JSON.parse(await fsp.readFile(manifestFile, 'utf8'));
    manifest.description =
      String(meta.description || '').trim() ||
      `3D model (${info.triangles.toLocaleString('en')} triangles), uploaded from ${meta.stats?.format?.toUpperCase() || 'a file'}.`;
    manifest.tags = ['model', 'upload'];
    await fsp.writeFile(manifestFile, formatManifest(manifest));
    const originals = [];
    const keep = path.join(DATA_DIR, 'uploads', meta.id);
    await fsp.mkdir(keep, { recursive: true });
    for (const name of meta.originals || []) {
      if (!FILE_NAME.test(name)) continue;
      const file = path.join(dir, name);
      if (!fs.existsSync(file)) continue;
      const buf = await fsp.readFile(file);
      originals.push({ name, bytes: buf.length, sha256: sha256(buf) });
      await fsp.copyFile(file, path.join(keep, name));
    }
    const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim() : null);
    const source = {
      license: src.license,
      credit: String(src.credit).trim(),
      url: String(src.url || '').trim() || null,
      originals,
      format: meta.stats?.format || null,
      import: { units: meta.units || 'm', up: meta.up || 'y' },
      converter: { kit: read(path.join(SHARED_DIR, 'lib/VERSION')), three: read(path.join(SHARED_DIR, 'vendor/three/VERSION')) },
      uploadedBy: by,
      uploadedAt: new Date().toISOString(),
    };
    await fsp.writeFile(path.join(r.dir, 'source.json'), `${JSON.stringify(source, null, 2)}\n`);
    const thumb = path.join(dir, meta.thumbnail || 'thumbnail.png');
    if (fs.existsSync(thumb)) {
      await fsp.mkdir(THUMBS_DIR, { recursive: true });
      await fsp.copyFile(thumb, path.join(THUMBS_DIR, `${meta.id}.png`));
    }
  } catch (err) {
    await fsp.rm(r.dir, { recursive: true, force: true }); // never leave half a figure
    throw err;
  }
  await fsp.rm(dir, { recursive: true, force: true });
  sweep().catch(() => {});
  return {
    id: meta.id,
    dir: path.relative(ROOT, r.dir),
    glb: { bytes: glb.length, triangles: info.triangles, size: info.size, warnings: report.warnings },
  };
}

/** Paths a commit of this upload touches (for the git writer). */
export const uploadPaths = (id) => [path.relative(ROOT, assetDir(id))];
