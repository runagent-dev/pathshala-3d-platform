import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { workOf } from '../../scripts/ci/library-work.mjs';
import { testHash, renderHash } from '../../scripts/lib/ci/figure-hashes.mjs';
import {
  figureOfSpec,
  harnessAffected,
  passedFigures,
  planRun,
  recordPassed,
  relevantFiles,
  templatesAffected,
} from '../../scripts/lib/ci/figure-tests.mjs';
import { tempDir } from '../helpers.mjs';

/** A small repo: figures a, b, c and a kit of x, y and an unused module (a imports x, b imports y, c imports both). */
function makeRepo() {
  const root = tempDir();
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  write('package-lock.json', '{}');
  write('shared/vendor/three/VERSION', 'three r185.1\n');
  write('shared/lib/VERSION', '1.3.0\n');
  write('shared/lib/x.js', 'export const x = 1;\n');
  write('shared/lib/y.js', 'export const y = 1;\n');
  write('shared/lib/unused.js', 'export const unused = 1;\n');
  write('test/figures/contract.spec.mjs', '// the generated tests\n');
  write('scripts/library-sync.mjs', '// the sync\n');
  const imports = { a: ['x'], b: ['y'], c: ['x', 'y'] };
  for (const [id, kit] of Object.entries(imports)) {
    write(`assets/${id}/asset.json`, JSON.stringify({ id, version: '0.1.0', type: 'interactive', entry: 'index.html', title: id, params: [] }));
    write(
      `assets/${id}/index.html`,
      '<!doctype html><html><head><script type="importmap">{"imports":{"@shared/":"../../shared/lib/"}}</script></head><body><script type="module" src="./src/main.js"></script></body></html>',
    );
    write(`assets/${id}/src/main.js`, `${kit.map((k) => `import { ${k} } from '@shared/${k}.js';`).join('\n')}\nconsole.log(${kit.join(', ')});\n`);
    write(`assets/${id}/tests/figure.spec.mjs`, '// its own test\n');
  }
  return { root, write, hashes: (fn = testHash) => Object.fromEntries(['a', 'b', 'c'].map((id) => [id, fn(id, { root })])) };
}

const changed = (before, after) => Object.keys(before).filter((id) => before[id] !== after[id]);

describe('figure hashes', () => {
  it('are the same for the same inputs, wherever the repo is', () => {
    assert.deepEqual(makeRepo().hashes(), makeRepo().hashes());
    assert.deepEqual(makeRepo().hashes(renderHash), makeRepo().hashes(renderHash));
  });

  it('change for a figure when its own file changes, and for no other', () => {
    const r = makeRepo();
    const before = r.hashes();
    r.write('assets/b/src/main.js', 'import { y } from "@shared/y.js";\nconsole.log(y, 2);\n');
    assert.deepEqual(changed(before, r.hashes()), ['b']);
  });

  it('change for the figures that import a kit module, and for no others', () => {
    const r = makeRepo();
    const before = r.hashes();
    r.write('shared/lib/x.js', 'export const x = 2;\n');
    assert.deepEqual(changed(before, r.hashes()), ['a', 'c']);
    assert.deepEqual(changed(r.hashes(renderHash), r.hashes(renderHash)), []);
  });

  it('do not change for a kit module nobody imports, the library sync, or a figure note', () => {
    const r = makeRepo();
    const before = r.hashes();
    r.write('shared/lib/unused.js', 'export const unused = 2;\n');
    r.write('scripts/library-sync.mjs', '// changed\n');
    r.write('assets/a/NOTES.md', 'notes');
    assert.deepEqual(changed(before, r.hashes()), []);
  });

  it('change for one figure when its own test changes, for every figure when the harness changes', () => {
    const r = makeRepo();
    const before = r.hashes();
    r.write('assets/c/tests/figure.spec.mjs', '// a stricter test\n');
    assert.deepEqual(changed(before, r.hashes()), ['c']);
    const mid = r.hashes();
    r.write('test/figures/contract.spec.mjs', '// the generated tests, changed\n');
    assert.deepEqual(changed(mid, r.hashes()), ['a', 'b', 'c']);
  });

  it("leave the pictures alone when only a figure's tests change", () => {
    const r = makeRepo();
    const before = r.hashes(renderHash);
    r.write('assets/a/tests/figure.spec.mjs', '// changed\n');
    assert.deepEqual(changed(before, r.hashes(renderHash)), []);
  });
});

describe('planning a run', () => {
  const all = (files) => (files.some((f) => /^(shared|scripts|templates|books|schemas)\//.test(f)) ? ['a', 'b', 'c'] : []);
  const only =
    (...ids) =>
    () =>
      ids;

  it('tests everything the change touches when there are no earlier results', () => {
    const r = makeRepo();
    const plan = planRun({
      root: r.root,
      ids: ['a', 'b', 'c'],
      changedFiles: ['shared/lib/x.js'],
      markersDir: path.join(r.root, 'markers'),
      touchedOf: all,
    });
    assert.deepEqual(plan.figures, ['a', 'b', 'c']);
    assert.equal(plan.warm, false);
  });

  it('leaves out figures that already passed with the same inputs', () => {
    const r = makeRepo();
    const markersDir = path.join(r.root, 'markers');
    recordPassed({ root: r.root, ids: ['a', 'b', 'c'], passed: ['a', 'c'], markersDir });
    const plan = planRun({ root: r.root, ids: ['a', 'b', 'c'], changedFiles: ['shared/lib/x.js'], markersDir, touchedOf: all });
    assert.deepEqual(plan.figures, ['b']);
    assert.equal(plan.skipped, 2);
    // a figure that changed since it passed is tested again
    r.write('assets/a/src/main.js', 'import { x } from "@shared/x.js";\nconsole.log(x, 2);\n');
    assert.deepEqual(planRun({ root: r.root, ids: ['a', 'b', 'c'], changedFiles: ['shared/lib/x.js'], markersDir, touchedOf: all }).figures, [
      'a',
      'b',
    ]);
  });

  it('tests every figure when the test harness, the browser config or the Node version changes (the markers still skip those that passed)', () => {
    const r = makeRepo();
    for (const f of ['test/figures/layout.spec.mjs', 'playwright.config.mjs', '.nvmrc', 'package-lock.json']) {
      assert.equal(harnessAffected([f]), true, f);
      const plan = planRun({ root: r.root, ids: ['a', 'b', 'c'], changedFiles: [f], markersDir: path.join(r.root, 'markers'), touchedOf: () => [] });
      assert.deepEqual(plan.figures, ['a', 'b', 'c'], f);
    }
    assert.equal(harnessAffected(['assets/a/src/main.js', 'docs/ci.md']), false);
  });

  it('never tests a figure the change does not touch', () => {
    const r = makeRepo();
    const plan = planRun({
      root: r.root,
      ids: ['a', 'b', 'c'],
      changedFiles: ['assets/b/src/main.js'],
      markersDir: path.join(r.root, 'markers'),
      touchedOf: only('b'),
    });
    assert.deepEqual(plan.figures, ['b']);
  });

  it('counts the library sync, the CI scripts and the studio notes as touching nothing', () => {
    const files = [
      'scripts/library-sync.mjs',
      'scripts/lib/library/plan.mjs',
      'scripts/ci/library-summary.mjs',
      'scripts/ci-figures.mjs',
      'scripts/visual.mjs',
      'assets/a/NOTES.md',
      'assets/a/reviews/r1.json',
    ];
    assert.deepEqual(relevantFiles(files), []);
    assert.equal(templatesAffected(files), false);
    assert.equal(templatesAffected(['shared/lib/x.js']), true);
    assert.equal(templatesAffected(['scripts/new-asset.mjs']), true);
    assert.equal(templatesAffected(['templates/model/index.html']), true);
  });
});

describe('remembering what passed', () => {
  const spec = (file, title, status) => ({ file, title, tests: [{ status }] });
  const report = {
    suites: [
      {
        file: 'test/figures/contract.spec.mjs',
        specs: [
          spec('test/figures/contract.spec.mjs', 'a: bridge contract', 'expected'),
          spec('test/figures/contract.spec.mjs', 'b: bridge contract', 'expected'),
        ],
      },
      {
        file: 'test/figures/layout.spec.mjs',
        suites: [
          {
            specs: [
              spec('test/figures/layout.spec.mjs', 'a: layout 390×700', 'expected'),
              spec('test/figures/layout.spec.mjs', 'b: layout 390×700', 'unexpected'),
            ],
          },
        ],
      },
      { file: 'assets/c/tests/figure.spec.mjs', specs: [spec('assets/c/tests/figure.spec.mjs', 'whatever the title says', 'expected')] },
    ],
  };

  it('finds the figure of a spec by its folder or by the title it starts with', () => {
    assert.equal(figureOfSpec({ file: 'assets/energy/tests/figure.spec.mjs', title: 'x' }), 'energy');
    assert.equal(figureOfSpec({ file: 'test/figures/layout.spec.mjs', title: 'newtons-third-law: layout 390×700' }), 'newtons-third-law');
    assert.equal(figureOfSpec({ file: 'test/browser/convert.spec.mjs', title: 'converts a model' }), null);
  });

  it('counts a figure as passed only when every one of its tests passed', () => {
    assert.deepEqual(passedFigures(report), ['a', 'c']);
  });

  it('does not count a figure whose tests were all skipped', () => {
    const skipped = { suites: [{ file: 'assets/d/tests/figure.spec.mjs', specs: [spec('assets/d/tests/figure.spec.mjs', 'd', 'skipped')] }] };
    assert.deepEqual(passedFigures(skipped), []);
  });

  it('writes a marker per passed figure and removes markers no figure has any more', () => {
    const r = makeRepo();
    const markersDir = path.join(r.root, 'markers');
    fs.mkdirSync(markersDir);
    fs.writeFileSync(path.join(markersDir, 'stale-hash'), '');
    const out = recordPassed({ root: r.root, ids: ['a', 'b', 'c'], passed: ['a', 'c'], markersDir });
    assert.deepEqual(out, { written: 2, pruned: 1 });
    assert.equal(fs.readdirSync(markersDir).length, 2);
    assert.deepEqual(recordPassed({ root: r.root, ids: ['a', 'b', 'c'], passed: ['a', 'c'], markersDir }), { written: 0, pruned: 0 });
  });
});

describe('what a library publish run needs', () => {
  const fig = (category, build) => ({ id: category, category, build });
  it('needs nothing when everything is unchanged', () => {
    assert.deepEqual(workOf({ figures: [fig('unchanged', { lab: true })] }), { work: false, browser: false, figures: 0 });
  });
  it('needs Chromium for a lab, a poster, a model or a manifest (which runs its lab in the sandbox), but not for a demotion alone', () => {
    assert.equal(workOf({ figures: [fig('new', { lab: true })] }).browser, true);
    assert.equal(workOf({ figures: [fig('repair', { glb: ['default'] })] }).browser, true);
    assert.equal(workOf({ figures: [fig('changed', { poster: true })] }).browser, true);
    assert.deepEqual(workOf({ figures: [fig('changed', { manifest: true, glb: [] })] }), { work: true, browser: true, figures: 1 });
    assert.deepEqual(workOf({ figures: [fig('repair', { manifest: false, glb: [] })] }), { work: true, browser: false, figures: 1 });
  });
  it('is work when a shared library is missing from the library, even with every figure unchanged', () => {
    assert.equal(workOf({ figures: [fig('unchanged', {})], libraries: { missing: ['three'] } }).work, true);
  });
  it('ci-figures makes every figure a candidate when the diff base is unknown (an all-zero "before")', () => {
    const markers = path.join(tempDir(), 'markers');
    const script = path.join(import.meta.dirname, '..', '..', 'scripts', 'ci-figures.mjs');
    const out = spawnSync(process.execPath, [script, '0000000000000000000000000000000000000000', '--markers', markers], { encoding: 'utf8' });
    assert.equal(out.status, 0, out.stderr);
    assert.match(out.stderr, /every figure is a candidate/);
    assert.match(out.stdout, /^figures=.+$/m);
    assert.match(out.stdout, /^templates=true$/m);
  });
  it('does not count blocked or withdrawn figures as work', () => {
    assert.equal(workOf({ figures: [fig('blocked', {}), fig('withdraw', {})] }).work, false);
  });
});
