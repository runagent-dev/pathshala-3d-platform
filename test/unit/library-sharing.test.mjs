import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { assetKey, createLesson, isLabObject, labManifestSchema, labObjectFromManifest, packLesson, unpackLesson } from '@chalk-format/core';
import JSZip from 'jszip';
import { buildLibrary } from '../../scripts/lib/library/build-libraries.mjs';
import { loadCatalog } from '../../scripts/lib/library/catalog.mjs';
import { bundleLab } from '../../scripts/lib/library/bundle-lab.mjs';
import { labId, labManifest, validateLabManifest } from '../../scripts/lib/library/manifest.mjs';
import { ROOT, readJson } from '../helpers.mjs';

// A book that holds a lab made with chalk-format's tools and one made here must carry ONE copy of three.js.
// The chalk-format side is a copy of its examples/labs/screw-gauge (chalk-format PR 22, commit 9176639): the lab html and manifest.
const catalog = loadCatalog();
const threeKey = catalog.libraries.find((l) => l.specifier === 'three').key;
const fixture = (name) => path.join(ROOT, 'test', 'fixtures', name);
const enc = (s) => new TextEncoder().encode(s);

async function hereLab(id) {
  const asset = readJson(path.join(ROOT, 'assets', id, 'asset.json'));
  const book = { subject: 'physics', classes: ['9', '10'] };
  const built = await bundleLab(id, { labId: labId('physics', id), version: asset.version });
  assert.deepEqual(built.errors, []);
  const html = enc(built.html);
  const libraries = [];
  const bytes = new Map([[await assetKey(html), { type: 'text/html', bytes: html }]]);
  for (const specifier of built.libraries) {
    const lib = await buildLibrary(specifier);
    bytes.set(lib.key, { type: 'text/javascript', bytes: lib.bytes });
    libraries.push({ specifier, version: lib.version, asset: lib.key });
  }
  const manifest = labManifest({
    asset,
    book,
    version: asset.version,
    fp8: '0'.repeat(8),
    keys: { entry: await assetKey(html), libraries },
    license: 'CC-BY-4.0',
  });
  assert.deepEqual(validateLabManifest(manifest), []);
  return { manifest, bytes, libraries };
}

describe('labs from both worlds in one book', () => {
  it('the three.js library is in the book once, under the catalog key', async () => {
    const here = await hereLab('stopwatch');
    const there = labManifestSchema.parse(JSON.parse(fs.readFileSync(fixture('chalk-format-screw-gauge.lab.json'), 'utf8')));
    const thereHtml = fs.readFileSync(fixture('chalk-format-screw-gauge.html'));
    assert.equal(await assetKey(thereHtml), there.entry, "the fixture is chalk-format's lab, unchanged");

    // both labs name the same three.js: the catalog's
    assert.equal(here.libraries.find((l) => l.specifier === 'three').asset, threeKey);
    assert.equal(there.libraries.find((l) => l.specifier === 'three').asset, threeKey);
    assert.equal(here.libraries.find((l) => l.specifier === 'three').version, there.libraries.find((l) => l.specifier === 'three').version);
    // and so does the add-on they have in common
    const orbit = 'three/addons/controls/OrbitControls.js';
    assert.equal(here.libraries.find((l) => l.specifier === orbit)?.asset, there.libraries.find((l) => l.specifier === orbit).asset);

    const lesson = createLesson('Both worlds');
    lesson.locale = 'bn';
    lesson.pages = [
      {
        id: 'p1',
        title: 'Both',
        background: { type: 'blank' },
        objects: [
          labObjectFromManifest(labManifestSchema.parse(here.manifest), { id: 'lab-here', x: 10, y: 10, locale: 'bn' }),
          labObjectFromManifest(there, { id: 'lab-there', x: 10, y: 600, locale: 'bn' }),
        ],
      },
    ];
    const assets = new Map(here.bytes);
    assets.set(there.entry, { type: 'text/html', bytes: thereHtml });
    for (const l of there.libraries) {
      const lib = await buildLibrary(l.specifier); // chalk-format's libraries are the catalog's, so the bytes are the same bytes
      assets.set(lib.key, { type: 'text/javascript', bytes: lib.bytes });
      assert.equal(lib.key, l.asset, `${l.specifier}: the key chalk-format's lab names`);
    }

    const file = await packLesson(lesson, assets);
    const zip = await JSZip.loadAsync(file);
    const inZip = Object.keys(zip.files).filter((f) => !f.endsWith('/') && f.includes(threeKey.replace('c1:', '')));
    assert.equal(inZip.length, 1, `three.js is stored once in the .chalk (${inZip.join(', ')})`);

    const opened = await unpackLesson(file);
    assert.deepEqual(opened.missingAssetIds, []);
    const labs = opened.lesson.pages[0].objects.filter(isLabObject).map((o) => o.lab);
    assert.deepEqual(
      labs.map((l) => l.libraries.find((x) => x.specifier === 'three').asset),
      [threeKey, threeKey],
    );
    assert.ok(opened.assets.has(threeKey));
    const bytes = opened.assets.get(threeKey).bytes;
    assert.equal(await assetKey(bytes), threeKey, 'a reader verifies the bytes against the key');
    // every key either lab names is in the book, and nothing is in it twice
    const named = new Set(labs.flatMap((l) => [l.entry, ...l.libraries.map((x) => x.asset)]));
    for (const k of named) assert.ok(opened.assets.has(k), k);
  });
});
