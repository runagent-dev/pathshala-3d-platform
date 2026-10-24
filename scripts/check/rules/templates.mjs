// The templates make valid figures: their asset.json (with the placeholders filled in) passes the contract.
import fs from 'node:fs';
import path from 'node:path';
import { loadBooks } from '../../lib/books.mjs';
import { validateManifest } from '../../lib/manifest/index.mjs';
import { TEMPLATES_DIR } from '../../lib/paths.mjs';

export default {
  name: 'templates',
  scope: 'repo',
  run() {
    const out = [];
    for (const name of fs.existsSync(TEMPLATES_DIR) ? fs.readdirSync(TEMPLATES_DIR).sort() : []) {
      const file = path.join(TEMPLATES_DIR, name, 'asset.json');
      if (!fs.existsSync(file)) continue;
      const text = fs
        .readFileSync(file, 'utf8')
        .replace(/\{\{id\}\}/g, 'template-check')
        .replace(/\{\{\w+\}\}/g, 'Template');
      let manifest;
      try {
        manifest = JSON.parse(text);
      } catch (err) {
        out.push({ level: 'error', file: `templates/${name}/asset.json`, message: `not valid JSON: ${err.message}` });
        continue;
      }
      for (const e of validateManifest(manifest, { folder: 'template-check', books: loadBooks() }).errors) {
        out.push({ level: 'error', file: `templates/${name}/asset.json`, message: `${e.path}: ${e.message}` });
      }
    }
    return out;
  },
};
