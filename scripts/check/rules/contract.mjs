// The figure's bridge calls itself by its folder name and reports the manifest's version.
import fs from 'node:fs';
import path from 'node:path';
import { stripJsComments } from '../../lib/depgraph.mjs';

export default {
  name: 'contract',
  scope: 'figure',
  run({ id, dir, manifest }) {
    if (!manifest || manifest.type === 'model') return [];
    const out = [];
    const main = path.join(dir, 'src', 'main.js');
    if (fs.existsSync(main)) {
      const code = stripJsComments(fs.readFileSync(main, 'utf8'));
      for (const m of code.matchAll(/\basset:\s*(['"])([^'"]+)\1/g)) {
        if (m[2] !== id && m[2] !== '{{id}}')
          out.push({ level: 'error', file: 'src/main.js', message: `the bridge says asset "${m[2]}"; it must be "${id}"` });
      }
    }
    for (const rel of ['src/app.js', 'src/main.js']) {
      const file = path.join(dir, rel);
      if (!fs.existsSync(file)) continue;
      const m = /export\s+const\s+VERSION\s*=\s*(['"])([^'"]+)\1/.exec(fs.readFileSync(file, 'utf8'));
      if (m && m[2] !== manifest.version)
        out.push({ level: 'error', file: rel, message: `VERSION is "${m[2]}" but asset.json says "${manifest.version}"` });
    }
    return out;
  },
};
