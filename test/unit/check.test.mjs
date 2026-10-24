// `npm run check` rules, against broken copies of a real figure in a temporary assets folder.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { copyFigure, tempDir } from '../helpers.mjs';

const assets = tempDir({ inRepo: true });
process.env.PATHSHALA_ASSETS_DIR = assets;
const { runChecks, figuresTouched } = await import('../../scripts/check/index.mjs');

/** A fresh copy of screw-gauge under a new id, changed by `edit(dir)`; returns the figure's results. */
async function broken(id, edit, opts = {}) {
  const dir = path.join(assets, id);
  fs.cpSync(path.join(assets, '_base'), dir, { recursive: true });
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'asset.json'), 'utf8'));
  m.id = id;
  fs.writeFileSync(path.join(dir, 'asset.json'), `${JSON.stringify(m, null, 2)}\n`);
  await runChecks({ ids: [id], repo: false, fix: true }); // canonical format first
  edit(dir);
  return (await runChecks({ ids: [id], repo: false, ...opts })).filter((r) => r.level === 'error');
}
const edit = (dir, rel, fn) => fs.writeFileSync(path.join(dir, rel), fn(fs.readFileSync(path.join(dir, rel), 'utf8')));
const rules = (results) => [...new Set(results.map((r) => r.rule))].sort();

fs.renameSync(copyFigure('screw-gauge', assets), path.join(assets, '_base'));

describe('check rules', () => {
  it('a copy of a good figure has no errors', async () => {
    const errors = await broken('good-copy', (dir) => edit(dir, 'src/main.js', (s) => s.replaceAll("'screw-gauge'", "'good-copy'")));
    assert.deepEqual(errors, []);
  });

  it('contract: the bridge must use the folder name and the manifest version', async () => {
    const errors = await broken('bad-bridge', (dir) => edit(dir, 'src/app.js', (s) => s.replace("VERSION = '0.1.0'", "VERSION = '0.0.9'")));
    assert.deepEqual(rules(errors), ['contract']);
    assert.ok(errors.some((e) => e.message.includes('the bridge says asset "screw-gauge"')));
    assert.ok(errors.some((e) => e.message.includes('VERSION is "0.0.9"')));
  });

  it('i18n: keys must match and Bangla stays out of the code', async () => {
    const errors = await broken('bad-i18n', (dir) => {
      edit(dir, 'src/main.js', (s) => s.replaceAll("'screw-gauge'", "'bad-i18n'"));
      edit(dir, 'src/i18n.js', (s) => s.replace("title: 'Screw gauge',", ''));
      edit(dir, 'src/app.js', (s) => `${s}\nexport const LABEL = 'স্কেল';\n`);
    });
    assert.deepEqual(rules(errors), ['i18n']);
    assert.ok(errors.some((e) => e.message.includes('no English for: title')));
    assert.ok(errors.some((e) => e.message.startsWith('Bangla text in code')));
  });

  it('imports: no internet, no missing files, the standard import map', async () => {
    const errors = await broken('bad-imports', (dir) => {
      edit(dir, 'src/main.js', (s) => `import 'https://cdn.example/x.js';\nimport './nope.js';\n${s.replaceAll("'screw-gauge'", "'bad-imports'")}`);
      edit(dir, 'index.html', (s) => s.replace('../../shared/lib/"', '../../shared/"'));
    });
    assert.deepEqual(rules(errors), ['imports']);
    assert.ok(errors.some((e) => e.message.includes('from the internet')));
    assert.ok(errors.some((e) => e.message.includes('does not exist')));
    assert.ok(errors.some((e) => e.message.includes('import map must map "@shared/"')));
  });

  it('files: required files and size budgets', async () => {
    const errors = await broken('bad-files', (dir) => {
      edit(dir, 'src/main.js', (s) => s.replaceAll("'screw-gauge'", "'bad-files'"));
      fs.rmSync(path.join(dir, 'README.md'));
      fs.writeFileSync(path.join(dir, 'big.bin'), Buffer.alloc(6 * 1024 * 1024));
    });
    assert.deepEqual(rules(errors), ['files']);
    assert.equal(errors.length, 2);
  });

  it('manifest: invalid values and non-canonical formatting; --fix reformats', async () => {
    const errors = await broken('bad-manifest', (dir) => {
      edit(dir, 'src/main.js', (s) => s.replaceAll("'screw-gauge'", "'bad-manifest'"));
      edit(dir, 'asset.json', (s) => s.replace('"topic": "1.6.1"', '"topic": "one"'));
    });
    assert.deepEqual(rules(errors), ['manifest']);
    const dir = path.join(assets, 'bad-manifest');
    edit(dir, 'asset.json', (s) => JSON.stringify(JSON.parse(s.replace('"topic": "one"', '"topic": "1.6.1"'))));
    assert.ok((await runChecks({ ids: ['bad-manifest'], repo: false })).some((r) => r.message.includes('canonical format')));
    await runChecks({ ids: ['bad-manifest'], repo: false, fix: true });
    assert.deepEqual(
      (await runChecks({ ids: ['bad-manifest'], repo: false })).filter((r) => r.level === 'error'),
      [],
    );
  });

  it('release profile fails on warnings', async () => {
    const errors = await broken('release', (dir) => edit(dir, 'src/main.js', (s) => s.replaceAll("'screw-gauge'", "'release'")), {
      profile: 'release',
    });
    assert.ok(errors.some((e) => e.message.startsWith('maintainers')));
  });
});

describe('figuresTouched', () => {
  it('maps changed paths to figures, and shared changes to all figures', () => {
    assert.deepEqual(figuresTouched(['assets/good-copy/src/app.js', 'README.md']), ['good-copy']);
    assert.ok(figuresTouched(['shared/lib/stage.js']).length > 3);
  });
});
