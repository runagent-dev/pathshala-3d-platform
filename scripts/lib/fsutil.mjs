// File helpers shared by the studio and the scripts.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

/** Write to a temporary file next to the target, then rename: readers never see half a file. */
export async function writeFileAtomic(file, data) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fsp.writeFile(tmp, data);
    await fsp.rename(tmp, file);
  } catch (err) {
    await fsp.rm(tmp, { force: true });
    throw err;
  }
}

/** writeFileAtomic, synchronously: for small files that are read back at once (accounts, sessions). */
export function writeFileAtomicSync(file, data, { mode = 0o644 } = {}) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tmp, data, { mode });
    fs.renameSync(tmp, file);
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
}

/** Free bytes on the disk that holds `dir`. */
export function freeBytes(dir) {
  const s = fs.statfsSync(dir);
  return s.bavail * s.bsize;
}

/** Sorted relative paths of every file below `dir` (dot-files and dot-folders skipped). */
export async function walkFiles(dir, base = dir) {
  const files = [];
  for (const ent of await fsp.readdir(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) files.push(...(await walkFiles(p, base)));
    else files.push(path.relative(base, p));
  }
  return files.sort();
}
