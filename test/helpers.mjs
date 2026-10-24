// Helpers for unit tests.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..');

/**
 * A fresh temporary folder, removed when the test process ends. `inRepo` puts it at the top of the repo (as
 * .tmp-test-…, git-ignored), at the same depth as assets/, so figures copied into it still reach ../../shared/.
 */
export function tempDir({ inRepo = false } = {}) {
  const dir = fs.mkdtempSync(inRepo ? path.join(ROOT, '.tmp-test-') : path.join(os.tmpdir(), 'pathshala-test-'));
  process.on('exit', () => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Copies a figure from assets/ into `dir` (for tests that change files). */
export function copyFigure(id, dir) {
  fs.cpSync(path.join(ROOT, 'assets', id), path.join(dir, id), { recursive: true });
  return path.join(dir, id);
}

export const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
