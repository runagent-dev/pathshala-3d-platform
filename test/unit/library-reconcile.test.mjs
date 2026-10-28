import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { recordTags, tagValue } from '../../scripts/lib/library/manifest.mjs';
import { reconcile } from '../../scripts/lib/library/reconcile.mjs';
import { fakeLibrary } from '../library-fake.mjs';
import { tempDir } from '../helpers.mjs';

// the sync end to end against an in-memory library: labs only (the models and pictures need a browser; scenarios run those)
const FIGURES = ['screw-gauge', 'stopwatch'];
const options = (lib, cacheDir, over = {}) => ({
  library: 'http://library.test',
  token: 'dev-token',
  fetch: lib.fetch,
  formats: 'lab',
  verify: false,
  license: 'CC-BY-4.0',
  only: FIGURES,
  cacheDir,
  ...over,
});
const byId = (report) => Object.fromEntries(report.figures.map((f) => [f.id, f]));
const current = (lib, id, kind) => lib.current(id, kind);

describe('library sync, against an in-memory library', () => {
  it('a dry run changes nothing, however many times it is run', async () => {
    const lib = fakeLibrary();
    const cache = tempDir();
    const report = await reconcile(options(lib, cache));
    assert.equal(report.mode, 'dry-run');
    assert.equal(report.counts.new, 2);
    assert.deepEqual(lib.writes(), []);
    assert.equal(lib.items.size, 0);
  });

  it('the first apply publishes; a second is a no-op that makes no write at all', async () => {
    const lib = fakeLibrary();
    const cache = tempDir();
    const first = await reconcile(options(lib, cache, { apply: true }));
    assert.deepEqual(
      Object.values(byId(first)).map((f) => f.result),
      ['published', 'published'],
    );
    for (const id of FIGURES) {
      assert.equal(current(lib, id, 'manifest').length, 1, id);
      assert.equal(current(lib, id, 'lab').length, 1, id);
    }
    assert.ok(
      [...lib.items.values()].some((r) => tagValue(r, 'kind') === 'library'),
      'the libraries are published too',
    );

    lib.clearCalls();
    const second = await reconcile(options(lib, cache, { apply: true }));
    assert.equal(second.counts.unchanged, 2);
    assert.deepEqual(lib.writes(), [], 'a second run uploads and registers nothing');
  });

  it('the manifest is the last thing registered for a figure (the commit point)', async () => {
    const lib = fakeLibrary();
    await reconcile(options(lib, tempDir(), { apply: true, only: ['stopwatch'] }));
    // the fake library keeps the order items were put in it
    const kinds = [...lib.items.values()].filter((r) => tagValue(r, 'kind') !== 'library').map((r) => tagValue(r, 'kind'));
    assert.ok(kinds.includes('lab'));
    assert.equal(kinds.at(-1), 'manifest');
  });

  it('a changed figure republishes it as the new current and demotes the old; nothing is withdrawn', async () => {
    const lib = fakeLibrary();
    const cache = tempDir();
    await reconcile(options(lib, cache, { apply: true, only: ['stopwatch'] }));
    const before = current(lib, 'stopwatch', 'manifest')[0];
    // the same figure, as if its lab had changed: the library holds an older lab fingerprint
    for (const r of lib.items.values()) r.tags = r.tags.map((t) => (t.startsWith('fp-lab:') ? 'fp-lab:0000000000000000' : t));
    const report = await reconcile(options(lib, cache, { apply: true, only: ['stopwatch'] }));
    assert.equal(byId(report).stopwatch.category, 'changed');
    // the rebuilt lab has the same bytes here, so it is the same key: re-registered with the right fingerprint, not duplicated
    assert.equal(current(lib, 'stopwatch', 'lab').length, 1);
    assert.equal(current(lib, 'stopwatch', 'manifest').length, 1);
    assert.equal([...lib.items.values()].filter((r) => r.status === 'withdrawn').length, 0);
    assert.ok(before);
  });

  it('production publishes only approved figures, with a license, and says why it did not', async () => {
    const lib = fakeLibrary();
    const cache = tempDir();
    await assert.rejects(reconcile(options(lib, cache, { apply: true, tier: 'production', license: undefined })), /no license/);
    const report = await reconcile(options(lib, cache, { apply: true, tier: 'production' }));
    for (const f of report.figures) {
      assert.equal(f.category, 'blocked', f.id);
      assert.equal(f.result, 'blocked');
      assert.match(f.reasons.join(' '), /approved|uncommitted/);
    }
    assert.deepEqual(lib.writes(), []);
  });

  it('a figure removed from the repo is withdrawn only with --allow-withdraw, and refused while a book uses it', async () => {
    const lib = fakeLibrary();
    const cache = tempDir();
    const ghost = (id) => ({
      title: id,
      tags: recordTags({ kind: 'manifest', figure: id, figureVersion: '1.0.0', fp8: 'aaaaaaaa', state: 'current', published: '20260101T000000000Z' }),
    });
    const keys = {};
    for (const id of ['ghost-a', 'ghost-b']) keys[id] = lib.seed(ghost(id));

    let report = await reconcile({ ...options(lib, cache, { apply: true }), only: [] });
    assert.equal(byId(report)['ghost-a'].category, 'withdraw');
    assert.equal(byId(report)['ghost-a'].result, 'not-withdrawn');
    assert.equal(lib.items.get(keys['ghost-a']).status, 'available');

    lib.useBy(keys['ghost-b'], 'physics-book');
    report = await reconcile({ ...options(lib, cache, { apply: true, allowWithdraw: true }), only: [] });
    assert.equal(lib.items.get(keys['ghost-a']).status, 'withdrawn');
    assert.equal(byId(report)['ghost-b'].result, 'blocked');
    assert.match(byId(report)['ghost-b'].reasons.join(' '), /books still use it: physics-book/);
    assert.equal(lib.items.get(keys['ghost-b']).status, 'available');
  });

  it('more than three withdrawals need --confirm-withdraw', async () => {
    const lib = fakeLibrary();
    const cache = tempDir();
    const keys = [];
    for (const id of ['g1', 'g2', 'g3', 'g4'])
      keys.push(
        lib.seed({ tags: recordTags({ kind: 'manifest', figure: id, figureVersion: '1', fp8: 'aaaaaaaa', state: 'current', published: 'x' }) }),
      );
    let report = await reconcile({ ...options(lib, cache, { apply: true, allowWithdraw: true }), only: [] });
    assert.ok(keys.every((k) => lib.items.get(k).status === 'available'));
    assert.match(report.notes.join(' '), /--confirm-withdraw/);
    report = await reconcile({ ...options(lib, cache, { apply: true, allowWithdraw: true, confirmWithdraw: true }), only: [] });
    assert.ok(keys.every((k) => lib.items.get(k).status === 'withdrawn'));
    assert.equal(report.withdrawn.length, 4);
  });

  it('a selection of figures never plans a withdrawal', async () => {
    const lib = fakeLibrary();
    lib.seed({ tags: recordTags({ kind: 'manifest', figure: 'ghost', figureVersion: '1', fp8: 'aaaaaaaa', state: 'current', published: 'x' }) });
    const report = await reconcile(options(lib, tempDir()));
    assert.equal(report.counts.withdraw, 0);
  });

  it('an item someone withdrew by hand is reported as blocked, not retried, and the other figures go on', async () => {
    const lib = fakeLibrary();
    const cache = tempDir();
    await reconcile(options(lib, cache, { apply: true }));
    const lab = current(lib, 'screw-gauge', 'lab')[0];
    lab.status = 'withdrawn';
    const report = await reconcile(options(lib, cache, { apply: true }));
    assert.equal(byId(report)['screw-gauge'].category, 'repair');
    assert.equal(byId(report)['screw-gauge'].result, 'blocked');
    assert.match(byId(report)['screw-gauge'].reasons.join(' '), /withdrawn/);
    assert.equal(byId(report).stopwatch.result, 'unchanged');
  });

  it('a current item someone retagged as superseded is repaired', async () => {
    const lib = fakeLibrary();
    const cache = tempDir();
    await reconcile(options(lib, cache, { apply: true }));
    const manifest = current(lib, 'stopwatch', 'manifest')[0];
    manifest.tags = manifest.tags.map((t) => (t === 'state:current' ? 'state:superseded' : t));
    assert.equal(current(lib, 'stopwatch', 'manifest').length, 0);
    const report = await reconcile(options(lib, cache, { apply: true }));
    assert.equal(byId(report).stopwatch.category, 'repair');
    assert.equal(byId(report).stopwatch.result, 'published');
    assert.equal(current(lib, 'stopwatch', 'manifest').length, 1);
  });

  it('a run that dies partway converges on the next run, with one current manifest per figure', async () => {
    const lib = fakeLibrary();
    const cache = tempDir();
    let writes = 0;
    // "kill" the process after the fifth registration: every later request fails
    lib.onCall(({ method, path }) => {
      if (method === 'POST' && path === '/v1/assets') writes += 1;
      if (writes > 5) throw new Error('killed');
    });
    const dead = await reconcile(options(lib, cache, { apply: true }));
    assert.ok(dead.figures.some((f) => f.result === 'failed'));
    lib.onCall(() => {});
    const alive = await reconcile(options(lib, cache, { apply: true }));
    assert.ok(
      alive.figures.every((f) => ['published', 'unchanged'].includes(f.result)),
      JSON.stringify(alive.figures.map((f) => [f.id, f.result])),
    );
    for (const id of FIGURES) {
      assert.equal(current(lib, id, 'manifest').length, 1, `${id}: one current manifest`);
      assert.equal(current(lib, id, 'lab').length, 1, `${id}: one current lab`);
    }
    lib.clearCalls();
    assert.equal((await reconcile(options(lib, cache, { apply: true }))).counts.unchanged, 2);
    assert.deepEqual(lib.writes(), []);
  });

  it('refuses --apply without a library or a token, and an unknown figure', async () => {
    const lib = fakeLibrary();
    await assert.rejects(reconcile({ apply: true, cacheDir: tempDir() }), /--library/);
    await assert.rejects(reconcile({ apply: true, library: 'http://library.test', cacheDir: tempDir() }), /token/);
    await assert.rejects(reconcile(options(lib, tempDir(), { only: ['no-such-figure'] })), /no such figure/);
    await assert.rejects(reconcile(options(lib, tempDir(), { confirmWithdraw: true })), /--allow-withdraw/);
  });

  it('writes only inside the cache folder and the report', async () => {
    const lib = fakeLibrary();
    const cache = tempDir();
    const reportFile = path.join(tempDir(), 'out', 'report.json');
    await reconcile(options(lib, cache, { apply: true, reportPath: reportFile, only: ['stopwatch'] }));
    assert.ok(fs.existsSync(reportFile));
    assert.ok(fs.existsSync(path.join(cache, 'figures', 'stopwatch')));
    assert.equal(fs.existsSync(path.join(cache, 'sync.lock')), false, 'the lock is released');
  });

  it('refuses to run twice at once in the same cache', async () => {
    const lib = fakeLibrary();
    const cache = tempDir();
    const first = reconcile(options(lib, cache, { only: ['stopwatch'] }));
    await assert.rejects(reconcile(options(lib, cache, { only: ['stopwatch'] })), /another sync holds the lock/);
    await first;
  });
});
