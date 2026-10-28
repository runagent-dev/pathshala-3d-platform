import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { assetKey } from '@chalk-format/core';
import { buildLibrary, CatalogMismatch } from '../../scripts/lib/library/build-libraries.mjs';
import { catalogHash, diffCatalogs, libraryPreflight, loadCatalog, validateCatalog } from '../../scripts/lib/library/catalog.mjs';
import { fingerprintFigure, toolVersions } from '../../scripts/lib/library/fingerprint.mjs';
import { tempDir } from '../helpers.mjs';

const catalog = loadCatalog();
const clone = () => structuredClone(catalog);

describe('the pinned catalog of shared lab libraries', () => {
  it('is valid: one three.js version, asset keys, three included', () => {
    assert.deepEqual(validateCatalog(catalog), []);
    assert.equal(catalog.source.repo, 'runagent-dev/chalk-format');
    assert.match(catalog.source.commit, /^[0-9a-f]{40}$/);
  });

  it('is refused when it is not usable', () => {
    const mixed = clone();
    mixed.libraries[1].version = '0.184.0';
    assert.match(validateCatalog(mixed).join(), /different three\.js versions/);
    const badKey = clone();
    badKey.libraries[0].key = 'sha256:abc';
    assert.match(validateCatalog(badKey).join(), /is not an asset key/);
    const noCore = clone();
    noCore.libraries = noCore.libraries.filter((l) => l.specifier !== 'three');
    assert.match(validateCatalog(noCore).join(), /no "three" core/);
    const foreign = clone();
    foreign.libraries.push({ specifier: 'lodash', version: '0.185.1', key: foreign.libraries[0].key });
    assert.match(validateCatalog(foreign).join(), /only three and three\/addons/);
  });

  it('has a hash that follows what it says, not how it is written', () => {
    const reordered = clone();
    reordered.libraries.reverse();
    reordered.source.ref = 'somewhere-else';
    assert.equal(catalogHash(reordered), catalogHash(catalog));
    const changed = clone();
    changed.libraries[0].key = 'c1:aaaaaaaaaaaaaaaaaaaaaaaaaa';
    assert.notEqual(catalogHash(changed), catalogHash(catalog));
  });

  it('shows a changed key, an added and a removed library', () => {
    const next = clone();
    next.libraries[0].key = 'c1:aaaaaaaaaaaaaaaaaaaaaaaaaa';
    next.libraries.pop();
    next.libraries.push({ specifier: 'three/addons/utils/BufferGeometryUtils.js', version: '0.185.1', key: 'c1:bbbbbbbbbbbbbbbbbbbbbbbbbb' });
    const lines = diffCatalogs(catalog, next);
    assert.equal(lines.length, 3);
    assert.ok(lines.some((l) => l.startsWith('~ three ')));
    assert.ok(lines.some((l) => l.startsWith('+ three/addons/utils/BufferGeometryUtils.js')));
    assert.ok(lines.some((l) => l.startsWith('- three/addons/renderers/CSS2DRenderer.js')));
    assert.deepEqual(diffCatalogs(catalog, clone()), []);
  });
});

describe("the libraries are chalk-format's bytes", () => {
  it("every catalog library builds to the catalog key and size (one esbuild-catalog, chalk-format's recipe)", async () => {
    for (const lib of catalog.libraries) {
      const built = await buildLibrary(lib.specifier);
      assert.equal(built.key, lib.key, lib.specifier);
      assert.equal(built.bytes.byteLength, lib.size, lib.specifier);
      assert.equal(built.version, lib.version);
      assert.equal(built.origin, 'shared');
      assert.equal(await assetKey(built.bytes), lib.key);
    }
  });

  it('an add-on the catalog does not list is built the same way and called extra', async () => {
    const built = await buildLibrary('three/addons/utils/BufferGeometryUtils.js');
    assert.equal(built.origin, 'extra');
    assert.equal(built.version, catalog.libraries[0].version);
    assert.ok(!catalog.libraries.some((l) => l.key === built.key));
    assert.match(built.bytes.toString('utf8'), /^\/\/|^import|^var|^export|^const|^function|^\(/);
  });

  it("a build that is not the catalog's bytes stops, with the cause and the fix", async () => {
    const wrong = clone();
    wrong.libraries[0].key = 'c1:aaaaaaaaaaaaaaaaaaaaaaaaaa';
    await assert.rejects(buildLibrary('three', { catalog: wrong }), (err) => {
      assert.ok(err instanceof CatalogMismatch);
      assert.match(err.message, /three built to c1:\w+ but the catalog pins c1:aaaaaaaaaaaaaaaaaaaaaaaaaa/);
      assert.match(err.message, /three 0\.185\.1 and esbuild 0\.25\.12/);
      assert.match(err.message, /npm install --save-exact three@0\.185\.1 esbuild-catalog@npm:esbuild@0\.25\.12/);
      assert.match(err.message, /--libraries own/);
      return true;
    });
  });

  it('a catalog of another three.js version stops with a one-line fix', async () => {
    const other = clone();
    for (const l of other.libraries) l.version = '0.190.0';
    await assert.rejects(
      buildLibrary('three', { catalog: other }),
      /three 0\.185\.1 is installed but the catalog is of three 0\.190\.0: run `npm install --save-exact three@0\.190\.0`/,
    );
  });

  it('--libraries own keeps the old, unshared build', async () => {
    const own = await buildLibrary('three', { libraries: 'own' });
    assert.equal(own.origin, 'own');
    assert.notEqual(own.key, catalog.libraries[0].key);
    await assert.rejects(buildLibrary('lodash', { libraries: 'own' }), /no vendored library/);
    await assert.rejects(buildLibrary('lodash'), /no library "lodash"/);
  });
});

describe('this repo against the catalog', () => {
  it('has the same three.js (package.json, the vendored copy, the installed package)', () => {
    assert.deepEqual(libraryPreflight({ catalog }), []);
  });

  it('says in one line what to do when three.js is another version', () => {
    const root = tempDir();
    fs.mkdirSync(path.join(root, 'shared/vendor/three'), { recursive: true });
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ devDependencies: { three: '0.184.0' } }));
    fs.writeFileSync(path.join(root, 'shared/vendor/three/VERSION'), 'three r184 (npm three@0.184.0)\n');
    const problems = libraryPreflight({ root, catalog });
    assert.equal(problems.length, 2);
    for (const p of problems) assert.ok(!p.includes('\n'));
    assert.match(
      problems[0],
      /package\.json has three 0\.184\.0 but the pinned catalog is three 0\.185\.1: run `npm install --save-exact three@0\.185\.1 && npm run vendor:three`/,
    );
    assert.match(problems[1], /shared\/vendor\/three is three 0\.184\.0/);
  });
});

describe('fingerprints and the catalog', () => {
  it('a lab is rebuilt when the catalog changes, and when the libraries are own; the other kinds are not', () => {
    const tools = toolVersions();
    assert.equal(tools.libraries, `catalog:${catalogHash(catalog)}`);
    assert.equal(toolVersions(undefined, { libraries: 'own' }).libraries, 'own');
    const a = fingerprintFigure('screw-gauge', { tools });
    const moved = fingerprintFigure('screw-gauge', { tools: { ...tools, libraries: 'catalog:0123456789abcdef' } });
    const own = fingerprintFigure('screw-gauge', { tools: toolVersions(undefined, { libraries: 'own' }) });
    assert.notEqual(a.lab, moved.lab);
    assert.notEqual(a.lab, own.lab);
    for (const kind of ['glb', 'poster', 'video']) {
      assert.equal(a[kind], moved[kind], kind);
      assert.equal(a[kind], own[kind], kind);
    }
  });
});
