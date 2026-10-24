// Where things are. Imported by every other module, so it imports nothing of ours.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// PATHSHALA_ASSETS_DIR points the tools at another folder of figures (tests use a temporary one).
export const ASSETS_DIR = process.env.PATHSHALA_ASSETS_DIR ? path.resolve(process.env.PATHSHALA_ASSETS_DIR) : path.join(ROOT, 'assets');
export const SHARED_DIR = path.join(ROOT, 'shared');
export const DIST_DIR = path.join(ROOT, 'dist');
export const TEMPLATES_DIR = path.join(ROOT, 'templates');
export const CACHE_DIR = path.join(ROOT, '.cache');
export const THUMBS_DIR = path.join(CACHE_DIR, 'thumbs');

export const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function assetDir(id) {
  if (!ID_RE.test(id)) throw new Error(`Invalid asset id "${id}"`);
  return path.join(ASSETS_DIR, id);
}
