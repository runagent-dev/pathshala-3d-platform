// library-sync.config.json (optional, at the repo root; the tool only reads it). Anything on the command line wins.
//
//   { "license": "CC-BY-4.0",
//     "formats": ["lab", "poster", "glb"],
//     "size": { "width": 800, "height": 500, "minWidth": 390, "minHeight": 390 } }
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../paths.mjs';

export const CONFIG_FILE = path.join(ROOT, 'library-sync.config.json');
export const ALL_FORMATS = ['lab', 'poster', 'glb', 'video'];
export const DEFAULT_FORMATS = ['lab', 'poster', 'glb'];

export function loadConfig(file = CONFIG_FILE) {
  if (!fs.existsSync(file)) return {};
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`${path.basename(file)} is not valid JSON: ${err.message}`);
  }
  const bad = Object.keys(data).filter((k) => !['license', 'formats', 'size', 'tier'].includes(k));
  if (bad.length) throw new Error(`${path.basename(file)}: unknown key(s) ${bad.join(', ')} (use license, formats, size)`);
  return data;
}

/** "lab,glb" → Set(['lab','glb']); throws for an unknown name. */
export function parseFormats(value) {
  const list = Array.isArray(value)
    ? value
    : String(value)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  const unknown = list.filter((f) => !ALL_FORMATS.includes(f));
  if (unknown.length) throw new Error(`unknown format(s): ${unknown.join(', ')} (use ${ALL_FORMATS.join(', ')})`);
  return new Set(list);
}
