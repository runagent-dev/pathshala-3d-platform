// asset.json: valid against the contract, in canonical format; status.json well formed.
import fs from 'node:fs';
import path from 'node:path';
import { formatManifest, validateManifest } from '../../lib/manifest/index.mjs';
import { STATUSES } from '../../lib/status.mjs';

export default {
  name: 'manifest',
  scope: 'figure',
  run({ id, dir, manifest, manifestText, books, profile }) {
    if (!manifest) return [{ level: 'error', message: `asset.json is not valid JSON: ${manifestText.error}` }];
    const out = [];
    const { errors, warnings } = validateManifest(manifest, { folder: id, books, dir, profile });
    for (const e of errors) out.push({ level: 'error', file: 'asset.json', message: `${e.path}: ${e.message}` });
    for (const w of warnings) out.push({ level: 'warning', file: 'asset.json', message: `${w.path}: ${w.message}` });
    if (!errors.length && formatManifest(manifest) !== manifestText.text) {
      out.push({
        level: 'error',
        file: 'asset.json',
        message: 'not in canonical format: run `npm run check -- --fix`',
        fix: () => fs.writeFileSync(path.join(dir, 'asset.json'), formatManifest(manifest)),
      });
    }
    const statusFile = path.join(dir, 'status.json');
    if (fs.existsSync(statusFile)) {
      try {
        const s = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        if (!STATUSES.includes(s.status)) out.push({ level: 'error', file: 'status.json', message: `unknown status "${s.status}"` });
        if (!Array.isArray(s.history)) out.push({ level: 'error', file: 'status.json', message: 'history must be a list' });
      } catch (err) {
        out.push({ level: 'error', file: 'status.json', message: `not valid JSON: ${err.message}` });
      }
    }
    return out;
  },
};
