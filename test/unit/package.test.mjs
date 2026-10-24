import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { packageAsset } from '../../scripts/lib/package.mjs';
import { tempDir } from '../helpers.mjs';

const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

describe('packageAsset', () => {
  const out = tempDir();

  it('builds byte-identical zips from the same commit', async () => {
    const a = await packageAsset('screw-gauge', { outDir: path.join(out, 'a') });
    const b = await packageAsset('screw-gauge', { outDir: path.join(out, 'b') });
    assert.equal(sha(a.zip), sha(b.zip));
  });

  it('ships the figure, the shared files it loads, host.js and the licences, but no dev-only files', async () => {
    const r = await packageAsset('screw-gauge', { outDir: path.join(out, 'c') });
    const has = (rel) => fs.existsSync(path.join(r.folder, rel));
    for (const rel of [
      'index.html',
      'src/main.js',
      'PACKAGE.json',
      'shared/lib/stage.js',
      'shared/lib/host.js',
      'shared/vendor/three/LICENSE',
      'shared/fonts/noto-sans-bengali/OFL.txt',
      'shared/lib/VERSION',
    ]) {
      assert.ok(has(rel), rel);
    }
    for (const rel of ['NOTES.md', 'status.json', 'reviews', 'thumbnail.png', 'shared/viewer', 'shared/vendor/three/addons/loaders/GLTFLoader.js'])
      assert.ok(!has(rel), rel);
  });

  it('rewrites ../../shared/ to ./shared/', async () => {
    const r = await packageAsset('screw-gauge', { outDir: path.join(out, 'd') });
    const html = fs.readFileSync(path.join(r.folder, 'index.html'), 'utf8');
    assert.ok(html.includes('./shared/vendor/three/three.module.min.js'));
    assert.ok(!html.includes('../../shared/'));
  });

  it('stamps PACKAGE.json with the book reference, versions and commit', async () => {
    const r = await packageAsset('screw-gauge', { outDir: path.join(out, 'e') });
    const stamp = JSON.parse(fs.readFileSync(path.join(r.folder, 'PACKAGE.json'), 'utf8'));
    assert.equal(stamp.ref, 'physics-9-10 › 1.6.1 › p21');
    assert.match(stamp.kit, /^\d+\.\d+\.\d+$/);
    assert.match(stamp.three, /r185/);
    assert.match(stamp.commit, /^[0-9a-f]{40}$/);
  });

  it('writes a valid zip', async () => {
    const r = await packageAsset('si-prefixes', { outDir: path.join(out, 'f') });
    const listing = execFileSync('unzip', ['-l', r.zip], { encoding: 'utf8' });
    assert.ok(listing.includes('si-prefixes/index.html'));
    execFileSync('unzip', ['-tq', r.zip]); // throws on a CRC or structure error
  });
});
