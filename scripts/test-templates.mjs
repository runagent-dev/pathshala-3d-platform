#!/usr/bin/env node
// `npm run test:templates`: makes a figure from every template (as `npm run new` would), runs `npm run check` and
// the browser tests on it, then removes it. Keeps the templates working as the kit and the rules change.
//
// Scaffolding also rewrites the generated files (CODEOWNERS lists every figure), and the repo check needs them
// current while the temporary figures exist. So they are saved first and put back afterwards, even when a test
// fails or the run is interrupted: the repo is left as it was found.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generatedFiles } from './generate.mjs';
import { ASSETS_DIR, ROOT, TEMPLATES_DIR } from './lib/paths.mjs';
import { scaffoldAsset } from './lib/scaffold.mjs';

const types = fs.readdirSync(TEMPLATES_DIR).filter((t) => fs.existsSync(path.join(TEMPLATES_DIR, t, 'asset.json')));
const ids = types.map((t) => `zz-tmpl-${t}`);
const run = (cmd, args, env = {}) => spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...env } }).status === 0;
/** `git status` of the generated files' folders, or null outside a git checkout. */
const gitStatus = () => {
  const r = spawnSync('git', ['status', '--porcelain', '--', '.github', 'schemas'], { cwd: ROOT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout : null;
};

const saved = generatedFiles().map((g) => ({ file: g.file, content: fs.existsSync(g.file) ? fs.readFileSync(g.file) : null }));
const statusBefore = gitStatus();
function cleanUp() {
  for (const id of ids) fs.rmSync(path.join(ASSETS_DIR, id), { recursive: true, force: true });
  for (const { file, content } of saved) {
    if (content === null) fs.rmSync(file, { force: true });
    else if (!fs.existsSync(file) || !fs.readFileSync(file).equals(content)) fs.writeFileSync(file, content);
  }
}
// Ctrl-C or a CI timeout: the browser tests stop, then this still cleans up.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    cleanUp();
    process.exit(128 + os.constants.signals[signal]);
  });
}

let ok = true;
try {
  for (const [i, type] of types.entries()) {
    fs.rmSync(path.join(ASSETS_DIR, ids[i]), { recursive: true, force: true });
    await scaffoldAsset({
      id: ids[i],
      title: `Template check: ${type}`,
      type,
      page: 1,
      topic: '1.1',
      placement: 'Template check.',
      maintainers: ['pathshala'],
    });
    console.log(`✓ made ${ids[i]} from templates/${type}`);
  }
  ok = run('node', ['scripts/check/index.mjs', ...ids]) && ok;
  ok = run('npx', ['playwright', 'test', '--reporter=line'], { FIGURES: ids.join(',') }) && ok;
} finally {
  cleanUp();
}
console.log(ok ? '\n✓ every template makes a working figure' : '\n✗ a template is broken (see above)');
// Its own check: the generated files are as they were before the run (git status of their folders unchanged).
const statusAfter = gitStatus();
const restored = statusAfter === statusBefore;
if (!restored) console.error(`✗ the run left generated files changed (git status --porcelain .github schemas):\n${statusAfter}`);
process.exitCode = ok && restored ? 0 : 1;
