// A figure's review status lives in assets/<id>/status.json, apart from asset.json: the studio changes the
// status while contributors change asset.json in their pull requests, so keeping them in separate files means
// the two never conflict. Only the studio (and the scaffolder, once) writes this file.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { assetDir } from './paths.mjs';
import { writeFileAtomic } from './fsutil.mjs';

export const STATUSES = ['idea', 'in-progress', 'review', 'changes', 'approved'];
export const STATUS_FILE = 'status.json';

/** { status, history: [{ status, by, at, version }] }; a figure without the file counts as an idea. */
export async function readStatus(id) {
  const file = path.join(assetDir(id), STATUS_FILE);
  if (!fs.existsSync(file)) return { status: 'idea', history: [] };
  const data = JSON.parse(await fsp.readFile(file, 'utf8'));
  return { status: STATUSES.includes(data.status) ? data.status : 'idea', history: Array.isArray(data.history) ? data.history : [] };
}

export function statusRecord(status, { by = 'studio', version = null, at = new Date().toISOString() } = {}) {
  if (!STATUSES.includes(status)) throw Object.assign(new Error(`Unknown status "${status}" (use ${STATUSES.join(', ')})`), { status: 400 });
  return { status, by, at, version };
}

export const formatStatus = (data) => `${JSON.stringify(data, null, 2)}\n`;

/** Sets the status and appends it to the history. */
export async function writeStatus(id, status, meta = {}) {
  const current = await readStatus(id);
  const entry = statusRecord(status, meta);
  const next = { status, history: [...current.history, entry] };
  await writeFileAtomic(path.join(assetDir(id), STATUS_FILE), formatStatus(next));
  return next;
}
