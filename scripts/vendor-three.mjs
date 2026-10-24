#!/usr/bin/env node
// Copies three.js into shared/vendor/three/ from the pinned npm package (devDependency "three"), so the vendored
// files are exactly a published release, never hand-edited.
//
//   npm run vendor:three              copy the build, LICENSE and the addons listed in ADDONS.json
//   npm run vendor:three -- --check   only compare (exit 1 if the vendored files differ from the package)
//
// shared/vendor/three/ADDONS.json lists the addons figures and the studio use (paths under examples/jsm/); the
// files those addons import are added automatically. To upgrade three: bump "three" in package.json (and
// @types/three), npm install, npm run vendor:three, then run the visual comparison across all figures.
import fs from 'node:fs';
import path from 'node:path';
import { jsSpecifiers } from './lib/depgraph.mjs';
import { ROOT, SHARED_DIR } from './lib/paths.mjs';

const PKG = path.join(ROOT, 'node_modules', 'three');
const OUT = path.join(SHARED_DIR, 'vendor', 'three');
const ADDONS_FILE = path.join(OUT, 'ADDONS.json');
const KEEP = new Set(['ADDONS.json']);

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

/** { relative path in shared/vendor/three → absolute source path } for the build, LICENSE and addons. */
export function plan() {
  if (!fs.existsSync(path.join(PKG, 'package.json'))) fail('node_modules/three is missing: run npm ci first');
  const version = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')).version;
  const files = new Map([
    ['three.module.min.js', path.join(PKG, 'build', 'three.module.min.js')],
    ['three.core.min.js', path.join(PKG, 'build', 'three.core.min.js')],
    ['LICENSE', path.join(PKG, 'LICENSE')],
  ]);
  const jsm = path.join(PKG, 'examples', 'jsm');
  const queue = [...JSON.parse(fs.readFileSync(ADDONS_FILE, 'utf8')).addons];
  while (queue.length) {
    const rel = queue.shift();
    const key = `addons/${rel}`;
    if (files.has(key)) continue;
    const src = path.join(jsm, rel);
    if (!fs.existsSync(src)) fail(`addon ${rel} is not in three@${version} (examples/jsm/${rel})`);
    files.set(key, src);
    for (const { spec } of jsSpecifiers(fs.readFileSync(src, 'utf8'))) {
      if (spec.startsWith('three/addons/')) queue.push(spec.slice('three/addons/'.length));
      else if (spec.startsWith('.')) queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec)));
    }
  }
  const [major, minor] = version.split('.').map(Number);
  return { version, files, versionText: `three r${minor}${major ? `.${major}` : ''}.${version.split('.')[2]} (npm three@${version})\n` };
}

function vendoredFiles(dir = OUT, base = OUT) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...vendoredFiles(p, base));
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  const { version, files, versionText } = plan();
  const differences = [];
  for (const [rel, src] of files) {
    const dst = path.join(OUT, rel);
    const same = fs.existsSync(dst) && Buffer.compare(fs.readFileSync(dst), fs.readFileSync(src)) === 0;
    if (same) continue;
    differences.push(`${fs.existsSync(dst) ? 'changed' : 'missing'}: ${rel}`);
    if (!check) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    }
  }
  const versionFile = path.join(OUT, 'VERSION');
  if (!fs.existsSync(versionFile) || fs.readFileSync(versionFile, 'utf8') !== versionText) {
    differences.push('changed: VERSION');
    if (!check) fs.writeFileSync(versionFile, versionText);
  }
  for (const rel of vendoredFiles()) {
    if (files.has(rel) || rel === 'VERSION' || KEEP.has(rel)) continue;
    differences.push(`extra: ${rel}`);
    if (!check) fs.rmSync(path.join(OUT, rel));
  }
  if (check) {
    if (differences.length) fail(`shared/vendor/three differs from three@${version}:\n  ${differences.join('\n  ')}\nRun npm run vendor:three.`);
    console.log(`✓ shared/vendor/three matches three@${version} (${files.size} files)`);
  } else {
    console.log(
      differences.length
        ? `✓ updated shared/vendor/three from three@${version}:\n  ${differences.join('\n  ')}`
        : `✓ shared/vendor/three already matches three@${version}`,
    );
  }
}
