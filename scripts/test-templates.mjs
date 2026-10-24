#!/usr/bin/env node
// `npm run test:templates`: makes a figure from every template (as `npm run new` would), runs `npm run check` and
// the browser tests on it, then removes it. Keeps the templates working as the kit and the rules change.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS_DIR, ROOT, TEMPLATES_DIR } from './lib/paths.mjs';
import { scaffoldAsset } from './lib/scaffold.mjs';

const types = fs.readdirSync(TEMPLATES_DIR).filter((t) => fs.existsSync(path.join(TEMPLATES_DIR, t, 'asset.json')));
const ids = types.map((t) => `zz-tmpl-${t}`);
const run = (cmd, args, env = {}) => spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...env } }).status === 0;
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
  for (const id of ids) fs.rmSync(path.join(ASSETS_DIR, id), { recursive: true, force: true });
}
console.log(ok ? '\n✓ every template makes a working figure' : '\n✗ a template is broken (see above)');
process.exitCode = ok ? 0 : 1;
