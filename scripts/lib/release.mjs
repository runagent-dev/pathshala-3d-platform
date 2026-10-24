// When a figure may be released (an official export), and how releases are named. Node built-ins only: the studio
// asks this before queueing a release.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { gitInfo } from './git.mjs';
import { assetDir, ROOT } from './paths.mjs';
import { readStatus } from './status.mjs';

export const MIN_FREE_BYTES = 10 * 1024 ** 3; // exports refuse to start with less free disk than this
export const releaseTag = (id, version) => `${id}@v${version}`;

function tagExists(tag) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Why `id` can't be released now (approved status, committed files, a new version), or null. */
export async function releaseProblem(id) {
  const manifest = JSON.parse(fs.readFileSync(path.join(assetDir(id), 'asset.json'), 'utf8'));
  const { status } = await readStatus(id);
  if (status !== 'approved') return `${id} is "${status}"; only approved figures are released`;
  const info = gitInfo([`assets/${id}`, 'shared']);
  if (!info) return 'not a git checkout';
  if (info.dirty) return `${id} or shared/ has uncommitted changes: commit them first (a release is built from a commit)`;
  if (tagExists(releaseTag(id, manifest.version))) return `${releaseTag(id, manifest.version)} already exists: bump the version for a new release`;
  return null;
}
