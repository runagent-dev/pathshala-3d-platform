// Where things are. Imported by every other module, so it imports nothing of ours.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// PATHSHALA_ASSETS_DIR points the tools at another folder of figures (tests use a temporary one).
export const ASSETS_DIR = process.env.PATHSHALA_ASSETS_DIR ? path.resolve(process.env.PATHSHALA_ASSETS_DIR) : path.join(ROOT, 'assets');
/** False when the tools work on another folder of figures: then files generated for the repo are left alone. */
export const REAL_ASSETS = !process.env.PATHSHALA_ASSETS_DIR;
export const SHARED_DIR = path.join(ROOT, 'shared');
export const DIST_DIR = path.join(ROOT, 'dist');
export const TEMPLATES_DIR = path.join(ROOT, 'templates');
export const CACHE_DIR = path.join(ROOT, '.cache');
// Outside git: studio state (users, sessions, jobs, original uploads) and export outputs. Both can be moved.
export const DATA_DIR = process.env.PATHSHALA_DATA_DIR ? path.resolve(process.env.PATHSHALA_DATA_DIR) : path.join(ROOT, 'data');
export const EXPORTS_DIR = process.env.PATHSHALA_EXPORTS_DIR ? path.resolve(process.env.PATHSHALA_EXPORTS_DIR) : path.join(ROOT, 'exports');
export const THUMBS_DIR = path.join(CACHE_DIR, 'thumbs');

export const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function assetDir(id) {
  if (!ID_RE.test(id)) throw new Error(`Invalid asset id "${id}"`);
  return path.join(ASSETS_DIR, id);
}
