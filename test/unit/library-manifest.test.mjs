import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { checkLabParams, labObjectFromManifest, labParams } from '@chalk-format/core';
import { loadBooks } from '../../scripts/lib/books.mjs';
import {
  ORIGIN_TAG,
  defaultParams,
  labId,
  labManifest,
  paramsSchema,
  publishedVersion,
  recordTags,
  resolveLicense,
  splitTitle,
  tagValue,
  validateLabManifest,
} from '../../scripts/lib/library/manifest.mjs';
import { ROOT } from '../helpers.mjs';

const KEY = (c) => `c1:${c.repeat(25)}a`;
const keys = { entry: KEY('a'), poster: KEY('b'), libraries: [{ specifier: 'three', version: '0.185.1', asset: KEY('c') }] };
const book = loadBooks().find((b) => b.id === 'physics-9-10');
const figureIds = fs.readdirSync(path.join(ROOT, 'assets')).filter((id) => fs.existsSync(path.join(ROOT, 'assets', id, 'asset.json')));
const asset = (id) => JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', id, 'asset.json'), 'utf8'));
/** @returns {any} */
const build = (id, over = {}) =>
  labManifest({ asset: asset(id), book, version: asset(id).version, fp8: 'abcd1234', keys, license: 'CC-BY-4.0', ...over });

describe('lab manifest from asset.json', () => {
  it('names the lab org.pathshalax.<subject>.<slug>', () => {
    assert.equal(labId('physics', 'screw-gauge'), 'org.pathshalax.physics.screw-gauge');
    assert.equal(labId('Physics', 'Screw Gauge'), 'org.pathshalax.physics.screw-gauge');
    assert.throws(() => labId('', 'x'));
  });

  it('splits "English (বাংলা)" into the two languages', () => {
    assert.deepEqual(splitTitle('Screw gauge (স্ক্রু-গেইজ)'), { en: 'Screw gauge', bn: 'স্ক্রু-গেইজ' });
    assert.deepEqual(splitTitle('Force: contact and non-contact (বল: স্পর্শ ও অস্পর্শ বল)'), {
      en: 'Force: contact and non-contact',
      bn: 'বল: স্পর্শ ও অস্পর্শ বল',
    });
    assert.equal(splitTitle('Plain title'), 'Plain title');
    assert.equal(splitTitle('Speed (m/s)'), 'Speed (m/s)', 'a bracket without Bangla is part of the title');
  });

  it('turns asset.json params into a JSON Schema of the right types', () => {
    const schema = paramsSchema([
      {
        name: 'lang',
        label: 'Language',
        type: 'select',
        options: [
          ['bn', 'বাংলা'],
          ['en', 'English'],
        ],
        default: 'bn',
      },
      { name: 'coach', label: 'Pointers', type: 'boolean', default: '1' },
      { name: 'shadow', type: 'boolean', default: '0' },
      { name: 'value', type: 'number', default: '3.47', help: 'mm' },
      { name: 'size', type: 'number', default: '' },
      { name: 'things', type: 'text', default: '' },
      { name: 'kind', type: 'select', options: ['a', 'b'], default: 'a' },
    ]);
    assert.equal(schema.type, 'object');
    assert.deepEqual(schema.properties.lang, { type: 'string', title: 'Language', enum: ['bn', 'en'], default: 'bn' });
    assert.deepEqual(schema.properties.coach, { type: 'boolean', title: 'Pointers', default: true });
    assert.equal(schema.properties.shadow.default, false);
    assert.deepEqual(schema.properties.value, { type: 'number', description: 'mm', default: 3.47 });
    assert.equal('default' in schema.properties.size, false, 'an empty number has no default');
    assert.deepEqual(schema.properties.things, { type: 'string', default: '' });
    assert.deepEqual(schema.properties.kind.enum, ['a', 'b'], 'options may be plain values');
  });

  it('gives the same bytes for the same figure (no dates, no paths)', () => {
    const one = JSON.stringify(build('screw-gauge'));
    const two = JSON.stringify(build('screw-gauge'));
    assert.equal(one, two);
    assert.doesNotMatch(one, /\d{4}-\d{2}-\d{2}T/);
    assert.doesNotMatch(one, new RegExp(ROOT.replace(/[/\\]/g, '.')));
  });

  it('carries the figure, book placement and models in the x-pathshala block', () => {
    const m = build('screw-gauge', { glb: [{ pose: 'default', asset: KEY('d') }] });
    assert.equal(m.id, 'org.pathshalax.physics.screw-gauge');
    assert.equal(m.subject, 'physics');
    assert.deepEqual(m.classes, ['9', '10']);
    assert.equal(m.license, 'CC-BY-4.0');
    assert.deepEqual(m.capabilities, [], 'phase 1 declares no state or progress');
    assert.equal(m['x-pathshala'].figure, 'screw-gauge');
    assert.equal(m['x-pathshala'].page, 21);
    assert.equal(m['x-pathshala'].topic, '1.6.1');
    assert.deepEqual(m['x-pathshala'].glb, [{ pose: 'default', asset: KEY('d') }]);
    assert.deepEqual(m.authors, asset('screw-gauge').maintainers);
  });

  it('leaves the license out when there is none, instead of inventing one', () => {
    assert.equal('license' in build('screw-gauge', { license: null }), false);
  });

  it('every figure in the repo converts to a manifest a Chalk reader accepts', () => {
    assert.ok(figureIds.length >= 30, 'the repo has its figures');
    for (const id of figureIds) {
      const m = build(id);
      assert.deepEqual(validateLabManifest(m), [], id);
      // and a book designer placing the lab with its defaults gets valid settings (the reader's own check)
      assert.deepEqual(checkLabParams(m, labParams(m)), [], id);
      const placed = /** @type {any} */ (labObjectFromManifest(m, { id: 'o1', x: 0, y: 0, locale: 'en' }));
      assert.equal(placed.lab.id, m.id);
    }
  });

  it("the settings a designer picks round trip: a setting is valid when it is one of the figure's own options", () => {
    const m = build('screw-gauge');
    assert.deepEqual(checkLabParams(m, { lang: 'en', value: 7.05, object: 'wire', coach: false }), []);
    assert.match(checkLabParams(m, { lang: 'fr' })[0], /lang/);
    assert.match(checkLabParams(m, { nope: 1 })[0], /not a setting/);
  });

  it('refuses a manifest without keys or with a bad version', () => {
    assert.ok(validateLabManifest(build('screw-gauge', { keys: { ...keys, entry: 'nope' } })).length > 0);
    assert.ok(validateLabManifest({ ...build('screw-gauge'), version: '' }).length > 0);
    assert.ok(validateLabManifest({ ...build('screw-gauge'), format: 'other' }).length > 0);
  });

  it('knows the default settings', () => {
    const m = build('screw-gauge');
    assert.equal(defaultParams(m).value, 3.47);
    assert.equal(defaultParams(m).lang, 'bn');
  });
});

describe('license', () => {
  it('production refuses to publish without one; staging warns', () => {
    assert.match(resolveLicense({ tier: 'production' }).problems[0], /no license/);
    const staging = resolveLicense({ tier: 'staging' });
    assert.deepEqual(staging.problems, []);
    assert.equal(staging.warnings.length, 1);
  });

  it('the command line beats the config file; both must be SPDX', () => {
    assert.equal(resolveLicense({ cli: 'MIT', config: 'CC-BY-4.0', tier: 'production' }).license, 'MIT');
    assert.equal(resolveLicense({ config: 'CC-BY-4.0', tier: 'production' }).license, 'CC-BY-4.0');
    assert.equal(resolveLicense({ cli: 'Apache-2.0 OR MIT', tier: 'production' }).problems.length, 0);
    assert.equal(resolveLicense({ cli: 'LicenseRef-pathshala', tier: 'production' }).problems.length, 0);
    assert.match(resolveLicense({ cli: 'all rights reserved!', tier: 'staging' }).problems[0], /SPDX/);
  });
});

describe('versions and tags', () => {
  it('publishes the repo version, or version+fingerprint for work that did not bump it', () => {
    assert.equal(publishedVersion('0.2.3', 'abcd1234'), '0.2.3');
    assert.equal(publishedVersion('0.2.3', 'abcd1234', { unbumped: true }), '0.2.3+abcd1234');
  });

  it('tags every item so the next run can find it with an exact tag', () => {
    const tags = recordTags({
      kind: 'glb',
      figure: 'screw-gauge',
      figureVersion: '0.2.3',
      page: 21,
      topic: '1.6.1',
      book: 'physics-9-10',
      subject: 'physics',
      license: 'CC-BY-4.0',
      fp8: 'abcd1234',
      fingerprints: { lab: 'a'.repeat(64), glb: 'b'.repeat(64) },
      commit: 'f'.repeat(40),
      pose: 'wire',
      state: 'current',
      published: '20260101T000000000Z',
    });
    assert.ok(tags.includes(ORIGIN_TAG));
    for (const t of [
      'kind:glb',
      'figure:screw-gauge',
      'figure-version:0.2.3',
      'page:21',
      'topic:1.6.1',
      'physics',
      'license:CC-BY-4.0',
      'source:abcd1234',
      'pose:wire',
      'state:current',
    ]) {
      assert.ok(tags.includes(t), `missing ${t}`);
    }
    assert.ok(tags.includes(`fp-lab:${'a'.repeat(16)}`));
    assert.ok(tags.includes(`commit:${'f'.repeat(12)}`));
    assert.equal(tagValue({ tags }, 'pose'), 'wire');
    assert.equal(tagValue({ tags }, 'nothing'), undefined);
  });
});
