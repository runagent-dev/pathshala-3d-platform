#!/usr/bin/env node
// Moves asset.json files (figures and templates) to schema version 2. Safe to run again: a v2 file is only
// re-formatted. Prints what it would change; pass --write to change the files.
//
//   node scripts/migrate/manifest-v2.mjs            # dry run
//   node scripts/migrate/manifest-v2.mjs --write
//
// v1 → v2:
//   + $schema, schemaVersion 2, book ("physics-9-10"), maintainers [], units (from UNITS below or none)
//   − subject, chapter, grade (the book says these), updated (git says this)
//   status → assets/<id>/status.json (only the studio changes it from now on)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ASSETS_DIR, TEMPLATES_DIR } from '../lib/paths.mjs';
import { formatManifest, SCHEMA_REF, SCHEMA_VERSION } from '../lib/manifest/index.mjs';
import { STATUSES, formatStatus, statusRecord } from '../lib/status.mjs';
import { DEFAULT_BOOK } from '../lib/books.mjs';

const WRITE = process.argv.includes('--write');

// The 3D unit each figure was built in (GLB exports are scaled to metres from this).
const UNITS = { 'vernier-caliper': 'mm', 'screw-gauge': 'mm', 'si-prefixes': 'm' };
// What already exists to export: the caliper has an export-glb command; the rest is added with the exporter.
const EXPORT = {
  'vernier-caliper': { poster: { params: { coach: '0' } }, glb: [{ name: 'default' }] },
};
const DROPPED = ['subject', 'chapter', 'grade', 'updated', 'status'];

export function migrate(m, { id } = {}) {
  const out = { $schema: SCHEMA_REF, ...m, schemaVersion: SCHEMA_VERSION };
  if (!out.book) out.book = DEFAULT_BOOK;
  if (!Array.isArray(out.maintainers)) out.maintainers = [];
  if (!out.units && UNITS[id]) out.units = UNITS[id];
  if (!out.export && EXPORT[id]) out.export = EXPORT[id];
  if (typeof out.page === 'string') out.page = out.page.trim() === '' ? null : Number(out.page);
  if (out.topic == null) out.topic = '';
  for (const k of DROPPED) delete out[k];
  return out;
}

function targets() {
  const list = [];
  for (const [base, kind] of [[ASSETS_DIR, 'asset'], [TEMPLATES_DIR, 'template']]) {
    if (!fs.existsSync(base)) continue;
    for (const name of fs.readdirSync(base).sort()) {
      const file = path.join(base, name, 'asset.json');
      if (fs.existsSync(file)) list.push({ file, dir: path.dirname(file), id: name, kind });
    }
  }
  return list;
}

function run() {
  let changes = 0;
  for (const t of targets()) {
    const before = fs.readFileSync(t.file, 'utf8');
    const old = JSON.parse(before);
    const next = formatManifest(migrate(old, { id: t.id }));
    const rel = path.relative(ROOT, t.file);
    const statusFile = path.join(t.dir, 'status.json');
    const needsStatus = t.kind === 'asset' && !fs.existsSync(statusFile);

    if (next !== before) {
      changes++;
      const removed = DROPPED.filter((k) => k in old);
      console.log(`${WRITE ? '✓' : '→'} ${rel}: schema ${old.schemaVersion || 1} → ${SCHEMA_VERSION}${removed.length ? ` (dropped ${removed.join(', ')})` : ''}`);
      if (WRITE) fs.writeFileSync(t.file, next);
    }
    if (needsStatus) {
      changes++;
      const status = STATUSES.includes(old.status) ? old.status : 'idea';
      const at = /^\d{4}-\d{2}-\d{2}$/.test(old.updated || '') ? `${old.updated}T00:00:00.000Z` : new Date().toISOString();
      const data = { status, history: [statusRecord(status, { by: 'migration', version: old.version || null, at })] };
      console.log(`${WRITE ? '✓' : '→'} ${path.relative(ROOT, statusFile)}: status "${status}"`);
      if (WRITE) fs.writeFileSync(statusFile, formatStatus(data));
    }
  }
  if (!changes) console.log('Nothing to migrate: every asset.json is on schema version 2.');
  else if (!WRITE) console.log('\nDry run. Run again with --write to apply.');
}

if (import.meta.url === `file://${process.argv[1]}`) run();
