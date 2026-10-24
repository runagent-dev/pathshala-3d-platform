#!/usr/bin/env node
// One-time setup of a fresh clone: `npm run setup`.
//   - installs the pinned dev tools (npm ci) if they are missing
//   - turns on the git hooks (.githooks/) and the blame ignore list
//   - downloads the Chromium build Playwright uses (skip with --no-browser)
//   - checks for ffmpeg (needed only to export video)
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/paths.mjs';

const run = (cmd, args) => spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' }).status === 0;
const quiet = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};
let ok = true;
/** Prints one result; a failed optional step is a warning (!) and does not fail setup. */
const step = (good, text, hint = '', { optional = false } = {}) => {
  console.log(`${good ? '✓' : optional ? '!' : '✗'} ${text}${!good && hint ? `\n    ${hint}` : ''}`);
  if (!optional) ok &&= good;
};

const major = Number(process.versions.node.split('.')[0]);
step(major >= 22, `Node ${process.versions.node}`, 'Pathshala 3D needs Node 22 or newer (see .nvmrc).');

if (!fs.existsSync(path.join(ROOT, 'node_modules', '.bin', 'playwright'))) {
  console.log('… installing the dev tools (npm ci)');
  step(run('npm', ['ci', '--no-audit', '--no-fund']), 'dev tools installed');
} else step(true, 'dev tools already installed');

if (quiet('git', ['rev-parse', '--is-inside-work-tree']) === 'true') {
  quiet('git', ['config', 'core.hooksPath', '.githooks']);
  quiet('git', ['config', 'blame.ignoreRevsFile', '.git-blame-ignore-revs']);
  step(quiet('git', ['config', 'core.hooksPath']) === '.githooks', 'git hooks on (check before commit, tests before push)');
  const gh = quiet('git', ['config', 'github.user']);
  step(
    Boolean(gh),
    gh ? `GitHub username: ${gh} (new figures list you as maintainer)` : 'GitHub username not set',
    'Run: git config --global github.user <your-github-name>',
    { optional: true },
  );
} else step(false, 'not a git checkout', 'Clone the repository with git to get hooks and history.');

if (!process.argv.includes('--no-browser')) {
  console.log('… downloading the Chromium build Playwright uses (once, ~170 MB)');
  step(run('npx', ['playwright', 'install', 'chromium']), 'Chromium for tests and exports');
}

const ffmpeg = quiet('ffmpeg', ['-version']);
step(
  Boolean(ffmpeg),
  ffmpeg ? ffmpeg.split('\n')[0] : 'ffmpeg not found',
  'Install ffmpeg to export videos (apt install ffmpeg / brew install ffmpeg). Everything else works without it.',
  { optional: true },
);

console.log(ok ? '\nReady. Start the studio with: npm run dev' : '\nSome steps need attention (see above).');
process.exitCode = ok ? 0 : 1;
