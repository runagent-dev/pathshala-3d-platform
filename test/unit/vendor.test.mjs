// shared/vendor/three must be exactly the pinned npm release (npm run vendor:three writes it).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { it } from 'node:test';
import { plan } from '../../scripts/vendor-three.mjs';
import { ROOT } from '../helpers.mjs';

it('shared/vendor/three matches the three package in package.json', () => {
  const { files, versionText } = plan();
  const out = path.join(ROOT, 'shared', 'vendor', 'three');
  for (const [rel, src] of files)
    assert.ok(fs.readFileSync(path.join(out, rel)).equals(fs.readFileSync(src)), `${rel} differs from npm: run npm run vendor:three`);
  assert.equal(fs.readFileSync(path.join(out, 'VERSION'), 'utf8'), versionText);
});
