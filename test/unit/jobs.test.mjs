// The studio's job queue, with a stand-in exporter (a tiny node script printing the exporter's JSON lines).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { createJobs } from '../../scripts/lib/jobs.mjs';
import { tempDir } from '../helpers.mjs';

const FAKE = `
const [mode] = process.argv.slice(1);
const say = (o) => console.log(JSON.stringify(o));
say({ type: 'progress', id: 'x', step: 'zip', done: 0, total: 1 });
if (mode === 'fail') { say({ type: 'error', id: 'x', message: 'boom' }); process.exit(1); }
setTimeout(() => { say({ type: 'done', id: 'x', out: 'exports/_preview/x', record: { files: [{ name: 'x.zip', bytes: 3 }], commit: 'abc' } }); }, mode === 'slow' ? 5000 : 20);
`;
const until = async (fn, ms = 5000) => {
  for (const start = Date.now(); Date.now() - start < ms; ) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error('timed out');
};

describe('jobs', () => {
  const make = (dir = tempDir()) => {
    const seen = [];
    const jobs = createJobs({
      dir,
      command: (job) => ['-e', FAKE, job.formats[0] === 'video' ? 'slow' : job.formats[0] === 'images' ? 'fail' : 'ok'],
      onChange: (j) => seen.push(j.status),
    });
    return { jobs, seen, dir };
  };

  it('runs an export and records the result', async () => {
    const { jobs, seen } = make();
    const job = jobs.add({ figure: 'x', formats: ['zip'] });
    await until(() => jobs.get(job.id).status === 'done');
    assert.deepEqual(jobs.get(job.id).result.files, [{ name: 'x.zip', bytes: 3 }]);
    assert.ok(seen.includes('running'));
  });

  it('reports a failure with the exporter message', async () => {
    const { jobs } = make();
    const job = jobs.add({ figure: 'x', formats: ['images'] });
    await until(() => jobs.get(job.id).status === 'failed');
    assert.equal(jobs.get(job.id).error, 'boom');
  });

  it('runs one at a time, returns the waiting job for the same figure, and cancels', async () => {
    const { jobs } = make();
    const slow = jobs.add({ figure: 'a', formats: ['video'] });
    const next = jobs.add({ figure: 'b', formats: ['zip'] });
    assert.equal(jobs.add({ figure: 'b', formats: ['zip'] }).id, next.id);
    await until(() => jobs.get(slow.id).status === 'running');
    assert.equal(jobs.get(next.id).status, 'queued');
    jobs.cancel(next.id);
    assert.equal(jobs.get(next.id).status, 'cancelled');
    assert.equal(jobs.get(slow.id).status, 'running'); // cancelling a waiting job leaves the running one alone
    jobs.cancel(slow.id);
    await until(() => jobs.get(slow.id).status === 'cancelled');
  });

  it('marks jobs that were running when the studio stopped as failed', () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, 'old.json'), JSON.stringify({ id: 'old', figure: 'x', status: 'running', createdAt: '2026-01-01T00:00:00Z' }));
    const { jobs } = make(dir);
    assert.equal(jobs.get('old').status, 'failed');
  });

  it('refuses unknown formats and figures', () => {
    const jobs = createJobs({ dir: tempDir(), figureExists: (id) => id === 'x', command: () => ['-e', ''] });
    assert.throws(() => jobs.add({ figure: 'x', formats: ['gif'] }), { status: 400 });
    assert.throws(() => jobs.add({ figure: 'nope', formats: ['zip'] }), { status: 404 });
  });
});
