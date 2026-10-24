// Server side of uploads: a converted GLB becomes a model figure with its provenance, and bad uploads are refused.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { ROOT, readJson, tempDir } from '../helpers.mjs';

const assets = tempDir({ inRepo: true });
const data = tempDir();
process.env.PATHSHALA_ASSETS_DIR = assets;
process.env.PATHSHALA_DATA_DIR = data;
const { commitUpload, receiveFile } = await import('../../scripts/lib/uploads.mjs');
const GLB = fs.readFileSync(path.join(ROOT, 'templates', 'model', 'model.glb'));
const META = (id) => ({
  id,
  title: 'Cube (ঘনক)',
  book: 'physics-9-10',
  page: 40,
  topic: '3.1',
  placement: 'test',
  source: { license: 'CC0-1.0', credit: 'tests' },
  glb: '_converted.glb',
  originals: ['cube.stl'],
  stats: { format: 'stl' },
});

describe('uploads', () => {
  it('makes a model figure with model.glb, source.json and the original kept aside', async () => {
    await receiveFile('upload000001', 'cube.stl', Buffer.from('solid x\nendsolid x\n'));
    await receiveFile('upload000001', '_converted.glb', GLB);
    const r = await commitUpload('upload000001', META('up-cube'), { by: 'tests' });
    const dir = path.join(assets, 'up-cube');
    assert.equal(r.glb.triangles, 12);
    assert.deepEqual(r.glb.size, [0.1, 0.1, 0.1]);
    assert.equal(readJson(path.join(dir, 'asset.json')).type, 'model');
    const source = readJson(path.join(dir, 'source.json'));
    assert.equal(source.license, 'CC0-1.0');
    assert.equal(source.originals[0].name, 'cube.stl');
    assert.ok(fs.existsSync(path.join(data, 'uploads', 'up-cube', 'cube.stl')));
    assert.ok(!fs.existsSync(path.join(data, 'uploads', 'tmp', 'upload000001')));
  });

  it('refuses a missing licence or credit, a bad GLB, and an id that exists', async () => {
    await receiveFile('upload000002', '_converted.glb', GLB);
    await assert.rejects(commitUpload('upload000002', { ...META('up-a'), source: { credit: 'x' } }), { status: 400 });
    await assert.rejects(commitUpload('upload000002', { ...META('up-a'), source: { license: 'CC0-1.0', credit: ' ' } }), { status: 400 });
    await receiveFile('upload000003', '_converted.glb', Buffer.from('not a glb at all'));
    await assert.rejects(commitUpload('upload000003', META('up-b')), { status: 400 });
    await receiveFile('upload000004', '_converted.glb', GLB);
    await assert.rejects(commitUpload('upload000004', META('up-cube')), /already exists/);
    assert.ok(!fs.existsSync(path.join(assets, 'up-a')) && !fs.existsSync(path.join(assets, 'up-b')));
  });

  it('refuses bad ids and file names', async () => {
    await assert.rejects(receiveFile('../etc', 'x.glb', GLB), { status: 400 });
    await assert.rejects(receiveFile('upload000005', '../x.glb', GLB), { status: 400 });
    await assert.rejects(commitUpload('nosuchupload1', META('up-c')), { status: 404 });
  });
});
