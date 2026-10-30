import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { explainChange, fingerprintFigure } from '../../scripts/lib/library/fingerprint.mjs';
import { tempDir } from '../helpers.mjs';

/**
 * A small repo: three figures and a kit of two modules.
 *   a imports kit x, b imports kit y, c imports both; every figure also has its own src/main.js
 */
function makeRepo() {
  const root = tempDir();
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  write('package.json', JSON.stringify({ devDependencies: { esbuild: '0.28.2', '@chalk-format/core': '0.1.2', '@playwright/test': '1.64.0' } }));
  write('shared/vendor/three/VERSION', 'three r185.1 (npm three@0.185.1)\n');
  write('shared/lib/VERSION', '1.3.0\n');
  write('shared/lib/x.js', 'export const x = 1;\n');
  write('shared/lib/y.js', 'export const y = 1;\n');
  write('shared/lib/unused.js', 'export const unused = 1;\n');
  const imports = { a: ['x'], b: ['y'], c: ['x', 'y'] };
  for (const [id, kit] of Object.entries(imports)) {
    write(
      `assets/${id}/asset.json`,
      JSON.stringify({
        id,
        version: '0.1.0',
        type: 'interactive',
        entry: 'index.html',
        book: 'physics-9-10',
        title: id,
        description: 'first',
        params: [],
        export: { glb: [{ name: 'default' }] },
      }),
    );
    write(
      `assets/${id}/index.html`,
      `<!doctype html><html><head><script type="importmap">{"imports":{"@shared/":"../../shared/lib/"}}</script></head><body><script type="module" src="./src/main.js"></script></body></html>`,
    );
    write(`assets/${id}/src/main.js`, `${kit.map((k) => `import { ${k} } from '@shared/${k}.js';`).join('\n')}\nconsole.log(${kit.join(', ')});\n`);
    write(`assets/${id}/NOTES.md`, 'notes');
  }
  const opts = { assetsDir: path.join(root, 'assets'), sharedDir: path.join(root, 'shared'), root };
  return { root, write, opts, fp: (id, extra = {}) => fingerprintFigure(id, { ...opts, ...extra }) };
}

const kinds = ['lab', 'glb', 'poster', 'sourceHash'];
const changedKinds = (a, b) => kinds.filter((k) => a[k] !== b[k]);

describe('library fingerprint', () => {
  it('is the same for the same inputs, wherever the repo is', () => {
    const one = makeRepo();
    const two = makeRepo();
    assert.deepEqual(one.fp('a').lab, two.fp('a').lab);
    assert.deepEqual(one.fp('a').sourceHash, two.fp('a').sourceHash);
    assert.equal(one.fp('a').problems.length, 0);
  });

  it('a change to a kit module rebuilds exactly the figures that import it', () => {
    const repo = makeRepo();
    const before = Object.fromEntries(['a', 'b', 'c'].map((id) => [id, repo.fp(id)]));
    repo.write('shared/lib/x.js', 'export const x = 2;\n');
    const after = Object.fromEntries(['a', 'b', 'c'].map((id) => [id, repo.fp(id)]));
    assert.deepEqual(changedKinds(before.a, after.a), kinds, 'a imports x');
    assert.deepEqual(changedKinds(before.c, after.c), kinds, 'c imports x');
    assert.deepEqual(changedKinds(before.b, after.b), [], 'b does not import x');
  });

  it('a kit module nobody imports changes nothing', () => {
    const repo = makeRepo();
    const before = repo.fp('a');
    repo.write('shared/lib/unused.js', 'export const unused = 2;\n');
    assert.deepEqual(changedKinds(before, repo.fp('a')), []);
  });

  it("a change to a figure's own file rebuilds only that figure", () => {
    const repo = makeRepo();
    const before = { a: repo.fp('a'), b: repo.fp('b') };
    repo.write('assets/a/src/main.js', `${fs.readFileSync(path.join(repo.root, 'assets/a/src/main.js'), 'utf8')}// edit\n`);
    assert.deepEqual(changedKinds(before.a, repo.fp('a')), kinds);
    assert.deepEqual(changedKinds(before.b, repo.fp('b')), []);
  });

  it('files that are not delivered (notes, reviews, tests, status) change nothing', () => {
    const repo = makeRepo();
    const before = repo.fp('a');
    repo.write('assets/a/NOTES.md', 'other notes');
    repo.write('assets/a/reviews/r1.json', '{}');
    repo.write('assets/a/tests/a.spec.mjs', '// test');
    repo.write('assets/a/status.json', '{"status":"approved"}');
    assert.deepEqual(changedKinds(before, repo.fp('a')), []);
  });

  it('a changed description changes the source hash only, not the lab or the exports', () => {
    const repo = makeRepo();
    const before = repo.fp('a');
    const file = path.join(repo.root, 'assets/a/asset.json');
    repo.write('assets/a/asset.json', JSON.stringify({ ...JSON.parse(fs.readFileSync(file, 'utf8')), description: 'second' }));
    assert.deepEqual(changedKinds(before, repo.fp('a')), ['sourceHash']);
  });

  it('a new version rebuilds the lab only (the models and pictures are the same files)', () => {
    const repo = makeRepo();
    const before = repo.fp('a');
    const file = path.join(repo.root, 'assets/a/asset.json');
    repo.write('assets/a/asset.json', JSON.stringify({ ...JSON.parse(fs.readFileSync(file, 'utf8')), version: '0.2.0' }));
    assert.deepEqual(changedKinds(before, repo.fp('a')), ['lab', 'sourceHash']);
  });

  it('the export settings rebuild the models and the poster, not the lab', () => {
    const repo = makeRepo();
    const before = repo.fp('a');
    const file = path.join(repo.root, 'assets/a/asset.json');
    repo.write(
      'assets/a/asset.json',
      JSON.stringify({ ...JSON.parse(fs.readFileSync(file, 'utf8')), export: { glb: [{ name: 'default' }, { name: 'open' }] } }),
    );
    assert.deepEqual(changedKinds(before, repo.fp('a')), ['glb', 'poster', 'sourceHash']);
  });

  it('a new esbuild rebuilds every lab, a new Playwright every model, and three.js everything', () => {
    const repo = makeRepo();
    const base = repo.fp('a');
    const withTools = (patch) => repo.fp('a', { tools: { ...base.tools, ...patch } });
    assert.deepEqual(changedKinds(base, withTools({ esbuild: '0.29.0' })), ['lab', 'sourceHash']);
    assert.deepEqual(changedKinds(base, withTools({ playwright: '1.70.0' })), ['glb', 'poster', 'sourceHash']);
    assert.deepEqual(changedKinds(base, withTools({ three: 'three r186' })), kinds);
    assert.deepEqual(changedKinds(base, withTools({ format: 2 })), kinds, 'a new library format rebuilds everything');
  });

  it('the vendored three.js is covered by its version, not by hashing its bytes', () => {
    const repo = makeRepo();
    repo.write('shared/vendor/three/three.module.min.js', 'x');
    const before = repo.fp('a');
    repo.write('shared/vendor/three/three.module.min.js', 'y');
    assert.deepEqual(changedKinds(before, repo.fp('a')), []);
    repo.write('shared/vendor/three/VERSION', 'three r186.0 (npm three@0.186.0)\n');
    assert.deepEqual(changedKinds(before, repo.fp('a')), kinds);
  });

  it('says which kit module changed', () => {
    const repo = makeRepo();
    const before = repo.fp('a');
    repo.write('shared/lib/x.js', 'export const x = 3;\n');
    repo.write('assets/a/src/main.js', 'import { x } from "@shared/x.js";\nconsole.log(x);\n');
    const reasons = explainChange(before, repo.fp('a'));
    assert.ok(reasons.includes('kit module shared/lib/x.js'), reasons.join('; '));
    assert.ok(reasons.includes('file src/main.js'), reasons.join('; '));
  });

  it('reports an import that does not resolve', () => {
    const repo = makeRepo();
    repo.write('assets/a/src/main.js', 'import "./missing.js";\n');
    assert.ok(repo.fp('a').problems.length > 0);
  });
});
