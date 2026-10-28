// Builds the files to publish and keeps them in the cache folder, named by fingerprint, so a rerun (or a run that failed halfway)
// does not build again what it already has:
//
//   <cache>/figures/<id>/lab-<fp16>.html          the lab
//   <cache>/figures/<id>/lab-<fp16>.json          { libraries, warnings, bytes, gzipBytes, verified }
//   <cache>/figures/<id>/poster-<fp16>.webp       the poster
//   <cache>/figures/<id>/glb-<fp16>-<pose>.glb    one model per pose
//   <cache>/figures/<id>/video-<fp16>.mp4         only with --formats video
//   <cache>/libraries/<name>-<version>.js         the libraries a lab imports
//
// Every file is written to a temporary name and renamed, so the cache never holds a half-written file. Nothing here writes
// outside the cache folder.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { CHROMIUM_ARGS } from '../export/driver.mjs';
import { exportFigure } from '../export/exporter.mjs';
import { buildLibrary } from './build-libraries.mjs';
import { bundleLab } from './bundle-lab.mjs';

const fp16 = (h) => h.slice(0, 16);
const safe = (s) => String(s).replace(/[^A-Za-z0-9._-]+/g, '_');

function writeAtomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
}

export function figureCacheDir(cacheDir, id) {
  return path.join(cacheDir, 'figures', id);
}

/** The lab of a figure: { html (string), bytes, gzipBytes, libraries, warnings, errors, cached }. A lab with errors is not cached. */
export async function labFile(local, { cacheDir }) {
  const dir = figureCacheDir(cacheDir, local.id);
  const base = path.join(dir, `lab-${fp16(local.fp.lab)}`);
  if (fs.existsSync(`${base}.html`) && fs.existsSync(`${base}.json`)) {
    const meta = JSON.parse(fs.readFileSync(`${base}.json`, 'utf8'));
    return { html: fs.readFileSync(`${base}.html`, 'utf8'), ...meta, errors: [], cached: true, file: `${base}.html` };
  }
  const built = await bundleLab(local.id, { labId: local.labId, version: local.asset.version });
  if (!built.errors.length) {
    writeAtomic(`${base}.html`, built.html);
    writeAtomic(
      `${base}.json`,
      `${JSON.stringify({ libraries: built.libraries, warnings: built.warnings, bytes: built.bytes, gzipBytes: built.gzipBytes, verified: false }, null, 2)}\n`,
    );
  }
  return { ...built, cached: false, file: `${base}.html` };
}

export function markLabVerified(local, { cacheDir }) {
  const meta = path.join(figureCacheDir(cacheDir, local.id), `lab-${fp16(local.fp.lab)}.json`);
  if (!fs.existsSync(meta)) return;
  writeAtomic(meta, `${JSON.stringify({ ...JSON.parse(fs.readFileSync(meta, 'utf8')), verified: true }, null, 2)}\n`);
}

export const isLabVerified = (local, { cacheDir }) => {
  const meta = path.join(figureCacheDir(cacheDir, local.id), `lab-${fp16(local.fp.lab)}.json`);
  return fs.existsSync(meta) && JSON.parse(fs.readFileSync(meta, 'utf8')).verified === true;
};

/** A library module (three, an add-on) from the cache, or built. */
export async function libraryFile(specifier, { cacheDir, sharedDir }) {
  const lib = await buildLibrary(specifier, { sharedDir });
  const file = path.join(cacheDir, 'libraries', `${safe(specifier)}-${lib.version}.js`);
  if (!fs.existsSync(file) || !fs.readFileSync(file).equals(lib.bytes)) writeAtomic(file, lib.bytes);
  return { ...lib, file };
}

let sharedBrowser = null;
export async function exportBrowser() {
  sharedBrowser ??= await chromium.launch({ args: CHROMIUM_ARGS });
  return sharedBrowser;
}
export async function closeExportBrowser() {
  if (sharedBrowser) await sharedBrowser.close();
  sharedBrowser = null;
}

/**
 * Poster, models and (when asked) video of a figure, made by the same exporter as `npm run export`. Only the kinds in `kinds` are
 * made. Returns { poster?: { file, bytes }, video?: { file }, glb: { [pose]: { file } } } with files in the cache.
 * @param {{ id: string, fp: object }} local
 * @param {{ cacheDir: string, kinds: Set<'poster'|'glb'|'video'>, poses?: string[], onProgress?: (p: any) => void }} o
 */
export async function exportedFiles(local, { cacheDir, kinds, poses = [], onProgress }) {
  const dir = figureCacheDir(cacheDir, local.id);
  const target = {
    poster: path.join(dir, `poster-${fp16(local.fp.poster)}.webp`),
    video: path.join(dir, `video-${fp16(local.fp.video)}.mp4`),
    glb: (pose) => path.join(dir, `glb-${fp16(local.fp.glb)}-${safe(pose)}.glb`),
  };
  const result = { glb: {} };
  const need = new Set();
  if (kinds.has('poster')) fs.existsSync(target.poster) ? (result.poster = { file: target.poster }) : need.add('images');
  if (kinds.has('video')) fs.existsSync(target.video) ? (result.video = { file: target.video }) : need.add('video');
  if (kinds.has('glb')) {
    for (const pose of poses) fs.existsSync(target.glb(pose)) ? (result.glb[pose] = { file: target.glb(pose) }) : need.add('glb');
  }
  if (!need.size) return result;

  fs.mkdirSync(dir, { recursive: true });
  const out = fs.mkdtempSync(path.join(dir, 'export-'));
  try {
    const record = await exportFigure(local.id, { out: path.join(out, 'x'), formats: [...need], browser: await exportBrowser(), onProgress });
    const of = (name) => path.join(out, 'x', name);
    for (const f of record.files) {
      if (f.kind === 'glb' && kinds.has('glb') && poses.includes(f.pose)) {
        fs.copyFileSync(of(f.name), target.glb(f.pose));
        result.glb[f.pose] = { file: target.glb(f.pose) };
      } else if (f.name === 'poster-800x500.webp' && kinds.has('poster')) {
        fs.copyFileSync(of(f.name), target.poster);
        result.poster = { file: target.poster };
      } else if (f.kind === 'video' && kinds.has('video')) {
        fs.copyFileSync(of(f.name), target.video);
        result.video = { file: target.video };
      }
    }
    result.exportRecord = { commit: record.commit, tools: record.tools };
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
  if (kinds.has('poster') && !result.poster) throw new Error(`the exporter made no poster for ${local.id}`);
  for (const pose of kinds.has('glb') ? poses : []) if (!result.glb[pose]) throw new Error(`the exporter made no model "${pose}" for ${local.id}`);
  return result;
}

/** Where the work of a run is kept (a fresh scratch folder inside the cache, removed at the end of the run). */
export const scratchDir = (cacheDir) => {
  fs.mkdirSync(path.join(cacheDir, 'tmp'), { recursive: true });
  return fs.mkdtempSync(path.join(cacheDir, 'tmp', `${os.hostname()}-`));
};
