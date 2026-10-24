// What the figure loads: only its own folder and shared/, through the import map, never from the internet.
import fs from 'node:fs';
import path from 'node:path';
import { figureGraph, stripJsComments } from '../../lib/depgraph.mjs';
import { walkFiles } from '../../lib/fsutil.mjs';
import { ROOT } from '../../lib/paths.mjs';

const STANDARD_MAP = {
  three: '../../shared/vendor/three/three.module.min.js',
  'three/addons/': '../../shared/vendor/three/addons/',
  '@shared/': '../../shared/lib/',
};

export default {
  name: 'imports',
  scope: 'figure',
  async run({ dir, manifest }) {
    const entry = manifest?.entry || 'index.html';
    if (!/\.html?$/i.test(entry)) return [];
    const out = [];
    const { problems } = figureGraph(dir, entry);
    for (const p of problems) out.push({ level: 'error', file: path.relative(dir, path.join(ROOT, p.file)), message: p.message });

    const html = fs.existsSync(path.join(dir, entry)) ? fs.readFileSync(path.join(dir, entry), 'utf8') : '';
    const map = /<script\s+type="importmap">([\s\S]*?)<\/script>/i.exec(html);
    if (map) {
      try {
        const imports = JSON.parse(map[1]).imports || {};
        for (const [k, v] of Object.entries(STANDARD_MAP)) {
          if (imports[k] !== v) out.push({ level: 'error', file: entry, message: `the import map must map "${k}" to "${v}" (like every figure)` });
        }
      } catch (err) {
        out.push({ level: 'error', file: entry, message: `the import map is not valid JSON: ${err.message}` });
      }
    }
    for (const rel of (await walkFiles(dir)).filter((f) => /\.m?js$/.test(f) && !f.startsWith('tests'))) {
      const code = stripJsComments(fs.readFileSync(path.join(dir, rel), 'utf8'));
      if (/\beval\s*\(|\bnew\s+Function\s*\(/.test(code)) out.push({ level: 'error', file: rel, message: 'uses eval / new Function' });
    }
    return out;
  },
};
