// Hashes that say "nothing this check depends on has changed", so CI can skip work it has already done.
//
//   testHash     a figure's browser tests: its files, the kit modules in its import closure (found by reading imports),
//                its asset.json, its own tests, and the test harness. Passing once with this hash passes again.
//   renderHash   a figure's pictures in the visual comparison: the same inputs without its tests, plus the renderer.
//
// A change to the library sync, the CI scripts or the docs is in neither, so it re-tests no figure. A change to one kit
// module re-tests exactly the figures that import it. Over-including only costs a test run; leaving something out could
// skip a test that mattered, so the lists below err on the side of including.
import fs from 'node:fs';
import path from 'node:path';
import { figureInputs, hashJson, sha256 } from '../library/fingerprint.mjs';
import { walkFilesSync } from '../library/files.mjs';

/** Files and folders (relative to the repo root) that decide how the browser tests behave. */
export const TEST_HARNESS = [
  'test/figures',
  'test/harness.html',
  'shared/lib/host.js',
  'playwright.config.mjs',
  'playwright.config.js',
  'playwright.config.ts',
  'package.json', // the test:figures command and its flags
  'package-lock.json',
  '.nvmrc',
  'scripts/dev.mjs',
  'scripts/studio',
  'scripts/lib/export',
  'scripts/lib/static-server.mjs',
  'scripts/lib/mime.mjs',
  'scripts/lib/assets.mjs',
  'scripts/lib/depgraph.mjs',
  'shared/fonts',
  'books',
  'schemas',
];

/**
 * What decides how the visual comparison draws a figure, in two parts: the code that draws (it runs from the checkout running
 * the comparison, also for the base side's pictures) and the files that are served with the figure (from the checkout drawn).
 */
export const RENDERER = [
  'scripts/visual.mjs',
  'scripts/lib/export',
  'scripts/lib/static-server.mjs',
  'scripts/lib/mime.mjs',
  'package-lock.json',
  '.nvmrc',
];
export const RENDER_SERVED = ['shared/fonts'];
export const RENDER_HARNESS = [...RENDERER, ...RENDER_SERVED];

/** The render harness for pictures of the checkout `root` drawn by the code in `rendererRoot` (the running checkout). */
export const renderHarness = (root, rendererRoot = root) => sha256(`${hashPaths(rendererRoot, RENDERER)}\n${hashPaths(root, RENDER_SERVED)}`);

/**
 * The machine the tests run on, beyond the files: the resolved Node version (`.nvmrc` says only "22") and, in GitHub Actions,
 * the runner image (system libraries). A pass on another setup is not a pass on this one.
 */
export const testEnvironment = () =>
  `${process.version} ${process.platform} ${process.arch} ${process.env.ImageOS ?? ''} ${process.env.ImageVersion ?? ''}`;

const readText = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : '');

/** One hash over a list of files and folders under `root`; those that do not exist count as empty. */
export function hashPaths(root, entries) {
  const lines = [];
  for (const entry of entries) {
    const abs = path.join(root, entry);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory())
      for (const rel of walkFilesSync(abs)) lines.push(`${entry}/${rel.split(path.sep).join('/')}\0${sha256(fs.readFileSync(path.join(abs, rel)))}`);
    else lines.push(`${entry}\0${sha256(fs.readFileSync(abs))}`);
  }
  return sha256(lines.sort().join('\n'));
}

function inputsOf(id, root) {
  const inputs = figureInputs(id, { assetsDir: path.join(root, 'assets'), sharedDir: path.join(root, 'shared') });
  return {
    own: inputs.own,
    shared: inputs.shared,
    manifest: inputs.manifest,
    three: readText(path.join(root, 'shared/vendor/three/VERSION')),
    kit: readText(path.join(root, 'shared/lib/VERSION')),
  };
}

/** The hash of everything a figure's browser tests depend on. */
export function testHash(id, { root, harness = hashPaths(root, TEST_HARNESS), environment = testEnvironment() }) {
  return hashJson({ kind: 'test', ...inputsOf(id, root), tests: hashPaths(path.join(root, 'assets', id), ['tests']), harness, environment });
}

/** The hash of everything a figure's pictures in the visual comparison depend on. */
export function renderHash(id, { root, harness = renderHarness(root) }) {
  return hashJson({ kind: 'render', ...inputsOf(id, root), harness });
}
