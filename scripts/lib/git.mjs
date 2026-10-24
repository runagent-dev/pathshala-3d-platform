// Facts from git for stamps and exports: the commit, its time, and whether files have uncommitted changes.
// Everything returns null outside a git checkout, so the tools still work from a plain copy.
import { execFileSync } from 'node:child_process';
import { ROOT } from './paths.mjs';

const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/** { commit, time (unix seconds), dirty } for HEAD; `dirty` is about `paths` (or the whole tree). */
export function gitInfo(paths = []) {
  try {
    const commit = git(['rev-parse', 'HEAD']);
    const time = Number(git(['log', '-1', '--format=%ct', 'HEAD']));
    const dirty = git(['status', '--porcelain', '--', ...paths]).length > 0;
    return { commit, time, dirty };
  } catch {
    return null;
  }
}

/** Is the file committed (tracked) in this checkout? Ignored and new files are not. */
export function isTracked(file) {
  try {
    git(['ls-files', '--error-unmatch', '--', file]);
    return true;
  } catch {
    return false;
  }
}

/** Files changed compared with `base` (committed, staged and unstaged), relative to the repo root. */
export function changedFiles(base = 'HEAD') {
  try {
    const out = new Set();
    for (const args of [
      ['diff', '--name-only', base],
      ['diff', '--name-only', '--cached'],
      ['ls-files', '--others', '--exclude-standard'],
    ]) {
      for (const f of git(args).split('\n')) if (f) out.add(f);
    }
    return [...out];
  } catch {
    return null;
  }
}

/**
 * The time to stamp builds with, so the same commit always gives the same bytes: SOURCE_DATE_EPOCH if set
 * (the reproducible-builds convention), else the commit time, else 1980-01-01 (the earliest zip date).
 */
export function sourceDateEpoch() {
  if (process.env.SOURCE_DATE_EPOCH) return Number(process.env.SOURCE_DATE_EPOCH);
  return gitInfo()?.time ?? 315532800;
}
