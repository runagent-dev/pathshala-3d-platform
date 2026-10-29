import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { ROOT } from '../../scripts/lib/paths.mjs';
import { offenders, summarize } from '../../scripts/ci/library-summary.mjs';
import { tempDir } from '../helpers.mjs';

const report = {
  mode: 'dry-run',
  tier: 'production',
  library: 'https://library.example',
  commit: '0123456789abcdef',
  counts: { new: 1, changed: 1, repair: 0, unchanged: 1, withdraw: 0, blocked: 1 },
  figures: [
    { id: 'a-new', category: 'new', version: '0.1.0', reasons: ['the lab is not in the library'], result: 'planned' },
    { id: 'b-same', category: 'unchanged', version: '1.0.0', reasons: [], result: 'planned' },
    { id: 'c-blocked', category: 'blocked', version: '1.0.0', reasons: ['changed under the same version'], result: 'planned' },
    { id: 'd-changed', category: 'changed', version: '1.1.0', reasons: ['a | b'], result: 'failed', error: 'boom' },
  ],
  notes: ['a note'],
};

describe('library-summary', () => {
  it('lists what is not unchanged, with the reason, and escapes table pipes', () => {
    const md = summarize(report, { heading: 'Library plan', failOn: ['blocked'] });
    assert.match(md, /### Library plan/);
    assert.match(md, /\*\*1\*\* new/);
    assert.match(md, /`a-new` \| 0\.1\.0 \| new/);
    assert.doesNotMatch(md, /b-same/);
    assert.match(md, /`d-changed`.*boom/);
    assert.match(md, /\*\*Fails:\*\* `c-blocked` \(blocked\)/);
    assert.match(md, /- a note/);
  });

  it('says so when everything is unchanged', () => {
    const md = summarize({ ...report, figures: [report.figures[1]], counts: { unchanged: 1 } });
    assert.match(md, /already in the library, unchanged/);
  });

  it('picks figures by category or result', () => {
    assert.deepEqual(
      offenders(report, ['blocked']).map((f) => f.id),
      ['c-blocked'],
    );
    assert.deepEqual(
      offenders(report, ['failed']).map((f) => f.id),
      ['d-changed'],
    );
    assert.deepEqual(
      offenders(report, ['blocked', 'failed']).map((f) => f.id),
      ['c-blocked', 'd-changed'],
    );
    assert.deepEqual(offenders(report, []), []);
  });

  it('exits 1 on an offender, 0 without, 2 on a bad file', () => {
    const dir = tempDir('library-summary');
    const file = path.join(dir, 'report.json');
    fs.writeFileSync(file, JSON.stringify(report));
    const run = (...args) => spawnSync(process.execPath, [path.join(ROOT, 'scripts/ci/library-summary.mjs'), ...args], { encoding: 'utf8' });
    assert.equal(run(file, '--fail-on', 'blocked,failed').status, 1);
    assert.equal(run(file, '--fail-on', 'withdraw').status, 0);
    assert.equal(run(path.join(dir, 'missing.json')).status, 2);
  });
});
