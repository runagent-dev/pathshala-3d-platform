import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { loadBooks } from '../../scripts/lib/books.mjs';
import { formatManifest, stringifyJson, validateManifest } from '../../scripts/lib/manifest/index.mjs';
import { validateSchema } from '../../scripts/lib/manifest/schema.mjs';
import { migrate } from '../../scripts/migrate/manifest-v2.mjs';
import { staleFiles } from '../../scripts/generate.mjs';
import { ROOT, readJson } from '../helpers.mjs';

const figures = fs.readdirSync(path.join(ROOT, 'assets')).filter((id) => fs.existsSync(path.join(ROOT, 'assets', id, 'asset.json')));
const books = loadBooks();
const load = (id) => readJson(path.join(ROOT, 'assets', id, 'asset.json'));
const paths = (problems) => problems.map((p) => p.path);

describe('asset.json files in the repo', () => {
  for (const id of figures) {
    it(`${id} is valid`, () => {
      const { errors } = validateManifest(load(id), { folder: id, books, dir: path.join(ROOT, 'assets', id) });
      assert.deepEqual(errors, []);
    });
    it(`${id} is in canonical format`, () => {
      const text = fs.readFileSync(path.join(ROOT, 'assets', id, 'asset.json'), 'utf8');
      assert.equal(formatManifest(JSON.parse(text)), text);
    });
  }
  it('schemas/asset.schema.json is up to date', () => assert.deepEqual(staleFiles(), []));
});

describe('validateManifest', () => {
  const base = load('screw-gauge');
  const check = (patch, ctx = {}) => validateManifest({ ...base, ...patch }, { folder: 'screw-gauge', books, ...ctx });

  it('accepts a minimal manifest, with warnings for what is still missing', () => {
    const m = { schemaVersion: 2, id: 'x', title: 'X', type: 'interactive', entry: 'index.html', version: '0.1.0', book: 'physics-9-10' };
    const { errors, warnings } = validateManifest(m, { folder: 'x', books });
    assert.deepEqual(errors, []);
    assert.deepEqual(paths(warnings).sort(), ['description', 'export.glb', 'maintainers', 'page', 'placement', 'topic']);
  });
  it('release profile turns warnings into errors', () => {
    const { errors, warnings } = validateManifest({ ...base, maintainers: [] }, { folder: 'screw-gauge', books, profile: 'release' });
    assert.ok(paths(errors).includes('maintainers'));
    assert.deepEqual(warnings, []);
  });
  it('rejects a bad id, version, page and topic', () => {
    assert.ok(paths(check({ id: 'Screw Gauge' }).errors).includes('id'));
    assert.ok(paths(check({ version: '1.0' }).errors).includes('version'));
    assert.ok(paths(check({ page: '21' }).errors).includes('page'));
    assert.ok(paths(check({ page: 0 }).errors).includes('page'));
    assert.ok(paths(check({ topic: '1.6a' }).errors).includes('topic'));
  });
  it('requires the id to be the folder name and the book to exist', () => {
    assert.ok(paths(check({}, { folder: 'other' }).errors).includes('id'));
    assert.ok(paths(check({ book: 'chemistry-9-10' }).errors).includes('book'));
  });
  it('checks that the entry file exists when given the folder', () => {
    assert.deepEqual(check({}, { dir: path.join(ROOT, 'assets', 'screw-gauge') }).errors, []);
    assert.ok(paths(check({ entry: 'missing.html' }, { dir: path.join(ROOT, 'assets', 'screw-gauge') }).errors).includes('entry'));
  });
  it('rejects unknown fields (v1 leftovers)', () => {
    assert.ok(check({ subject: 'Physics' }).errors.some((e) => e.message.includes('unknown field')));
  });
  it('checks params: duplicates, select options and defaults', () => {
    const dup = check({ params: [...base.params, { name: 'lang', type: 'text' }] });
    assert.ok(dup.errors.some((e) => e.message.includes('declared twice')));
    const badDefault = check({ params: [{ name: 'x', type: 'select', options: ['a', ['b', 'B']], default: 'c' }] });
    assert.ok(paths(badDefault.errors).includes('params[0].default'));
    const okDefault = check({ params: [{ name: 'x', type: 'select', options: ['a', ['b', 'B']], default: 'b' }] });
    assert.deepEqual(okDefault.errors, []);
    assert.ok(paths(check({ params: [{ name: 'x', type: 'boolean', default: 'yes' }] }).errors).includes('params[0].default'));
  });
  it('checks the export block', () => {
    assert.deepEqual(
      check({ export: { glb: [{ name: 'default' }, { name: 'open', setup: [{ command: 'set', payload: { gap: 5 } }] }] } }).errors,
      [],
    );
    assert.deepEqual(check({ export: { glb: { skip: 'the animation spans 40 orders of magnitude' } } }).errors, []);
    assert.ok(check({ export: { glb: { skip: 'no' } } }).errors.length);
    assert.ok(check({ export: { glb: [{ name: 'a' }, { name: 'a' }] } }).errors.some((e) => e.message.includes('used twice')));
    assert.ok(paths(check({ export: { video: { kind: 'script', seconds: 5 } } }).errors).includes('export.video.script'));
    const order = check({
      export: {
        video: {
          kind: 'script',
          seconds: 5,
          script: [
            { at: 2, command: 'set' },
            { at: 1, command: 'set' },
          ],
        },
      },
    });
    assert.ok(order.errors.some((e) => e.message.includes('time order')));
  });
});

describe('validateSchema (JSON Schema subset)', () => {
  const schema = {
    type: 'object',
    properties: { a: { $ref: '#/$defs/a' }, m: { type: 'object', additionalProperties: { type: 'string' } } },
    $defs: {
      a: {
        oneOf: [
          { type: 'array', items: { type: 'integer' } },
          { type: 'object', required: ['skip'], properties: { skip: { type: 'string' } } },
        ],
      },
    },
  };
  it('follows $ref and oneOf, reporting the branch of the matching type', () => {
    assert.deepEqual(validateSchema(schema, { a: [1, 2] }), []);
    assert.deepEqual(validateSchema(schema, { a: { skip: 'x' } }), []);
    assert.deepEqual(paths(validateSchema(schema, { a: [1, 'x'] })), ['a[1]']);
    assert.match(validateSchema(schema, { a: {} })[0].message, /missing "skip"/);
  });
  it('applies an additionalProperties schema', () => {
    assert.deepEqual(paths(validateSchema(schema, { m: { k: 1 } })), ['m.k']);
  });
});

describe('formatManifest', () => {
  it('orders keys canonically and is idempotent', () => {
    const text = formatManifest({ version: '1.0.0', id: 'x', schemaVersion: 2, custom: true, $schema: 's' });
    assert.deepEqual(Object.keys(JSON.parse(text)), ['$schema', 'schemaVersion', 'id', 'version', 'custom']);
    assert.equal(formatManifest(JSON.parse(text)), text);
  });
  it('writes short arrays and objects on one line', () => {
    assert.equal(stringifyJson({ a: [1, 2], b: { c: 'd' } }), '{\n  "a": [1, 2],\n  "b": { "c": "d" }\n}');
    const long = stringifyJson({ a: Array.from({ length: 40 }, (_, i) => `item-${i}`) });
    assert.ok(long.includes('\n    "item-0",'));
  });
});

describe('migration to v2', () => {
  const v1 = {
    id: 'screw-gauge',
    title: 'Screw gauge',
    type: 'interactive',
    entry: 'index.html',
    status: 'review',
    version: '0.1.0',
    subject: 'Physics',
    chapter: 'Measurement',
    page: '21',
    topic: '1.6.1',
    grade: '9–10',
    updated: '2026-10-24',
  };
  it('adds the v2 fields and drops the v1 ones', () => {
    const m = migrate(v1, { id: 'screw-gauge' });
    assert.equal(m.schemaVersion, 2);
    assert.equal(m.book, 'physics-9-10');
    assert.equal(m.page, 21);
    assert.equal(m.units, 'mm');
    for (const k of ['subject', 'chapter', 'grade', 'updated', 'status']) assert.ok(!(k in m), k);
    assert.deepEqual(validateManifest(m, { folder: 'screw-gauge', books }).errors, []);
  });
  it('is idempotent', () => {
    const once = formatManifest(migrate(v1, { id: 'screw-gauge' }));
    assert.equal(formatManifest(migrate(JSON.parse(once), { id: 'screw-gauge' })), once);
  });
});
