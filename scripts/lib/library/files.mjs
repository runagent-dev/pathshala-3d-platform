// A synchronous directory walk (the tool reads a few hundred small files; async buys nothing here).
import fs from 'node:fs';
import path from 'node:path';

/** Every file under `dir`, as paths relative to `base` (default `dir`), sorted. Missing folders give []. */
export function walkFilesSync(dir, base = dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkFilesSync(p, base));
    else if (ent.isFile()) out.push(path.relative(base, p));
  }
  return out.sort();
}
