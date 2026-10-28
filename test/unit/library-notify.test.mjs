import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { ROOT } from '../../scripts/lib/paths.mjs';
import { announceSync, changesOf, checkHookUrl, decide, postNotification } from '../../scripts/lib/library/notify.mjs';
import { tempDir } from '../helpers.mjs';

const TOKEN = 'sekret-token-do-not-print-0123456789';
const noSleep = async () => {};
const portOf = (server) => {
  const a = server.address();
  return typeof a === 'object' && a ? a.port : 0;
};

// a stand-in for the Books server: answers from a script, records what it was asked
function booksServer() {
  const calls = [];
  let script = [{ status: 200, body: { ok: true, applied: 3, review: 1, failed: 0, books: 2 } }];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      calls.push({ method: req.method, url: req.url, headers: req.headers, body: raw ? JSON.parse(raw) : null });
      const step = script.length > 1 ? script.shift() : script[0];
      if (step.drop) return req.socket.destroy();
      res.writeHead(step.status, { 'content-type': 'application/json', ...(step.headers ?? {}) });
      res.end(typeof step.body === 'string' ? step.body : JSON.stringify(step.body ?? {}));
    });
  });
  return {
    calls,
    answer: (...steps) => {
      script = steps;
      calls.length = 0;
    },
    start: () => new Promise((r) => server.listen(0, '127.0.0.1', () => r(`http://127.0.0.1:${portOf(server)}/hook`))),
    stop: () => new Promise((r) => server.close(r)),
  };
}

const production = (over = {}) => ({
  mode: 'apply',
  tier: 'production',
  figures: [
    { id: 'a', result: 'published' },
    { id: 'b', result: 'unchanged' },
    { id: 'c', result: 'withdrawn' },
  ],
  libraries: { missing: [] },
  ...over,
});
const capture = () => {
  const lines = [];
  return { lines, log: (l) => lines.push(l), text: () => lines.join('\n') };
};

describe('what counts as a change', () => {
  it('counts published and withdrawn figures, and repaired libraries make it a change', () => {
    assert.deepEqual(changesOf(production()), { published: 1, withdrawn: 1, changed: true });
    assert.equal(changesOf({ figures: [{ result: 'unchanged' }], libraries: { missing: [] } }).changed, false);
    assert.equal(changesOf({ figures: [], libraries: { missing: ['three'] } }).changed, true);
    assert.equal(changesOf({ figures: [{ result: 'failed' }, { result: 'blocked' }] }).changed, false);
  });
});

describe('when to notify', () => {
  it('only after a production apply that changed something', () => {
    assert.equal(decide(production()).send, true);
    assert.equal(decide(production({ mode: 'dry-run' })).send, false);
    assert.equal(decide(production({ tier: 'staging' })).send, false);
    assert.equal(decide(production({ figures: [{ result: 'unchanged' }] })).send, false);
  });
  it('--notify forces it when nothing changed, but never on a dry run or staging', () => {
    const none = production({ figures: [{ result: 'unchanged' }] });
    assert.equal(decide(none, { notify: true }).send, true);
    assert.equal(decide({ ...none, mode: 'dry-run' }, { notify: true }).send, false);
    assert.match(decide({ ...none, mode: 'dry-run' }, { notify: true }).why, /dry run/);
    assert.equal(decide({ ...none, tier: 'staging' }, { notify: true }).send, false);
  });
  it('--no-notify never', () => assert.equal(decide(production(), { noNotify: true }).send, false));
});

describe('the endpoint', () => {
  it('is https, or http on this computer only', () => {
    assert.equal(checkHookUrl('https://books.example.org/api/hook').ok, true);
    assert.equal(checkHookUrl('http://127.0.0.1:9/hook').ok, true);
    assert.equal(checkHookUrl('http://localhost:9/hook').ok, true);
    assert.equal(checkHookUrl('http://books.example.org/hook').ok, false);
    assert.equal(checkHookUrl('http://127.0.0.1.evil.example/hook').ok, false);
    assert.equal(checkHookUrl('ftp://127.0.0.1/hook').ok, false);
    assert.equal(checkHookUrl('not a url').ok, false);
  });
});

describe('telling the Books server', () => {
  const books = booksServer();
  let url;
  before(async () => {
    url = await books.start();
  });
  after(() => books.stop());
  const env = (over = {}) => ({ LIBRARY_SYNC_HOOK_URL: url, LIBRARY_SYNC_HOOK_TOKEN: TOKEN, ...over });
  const run = (over = {}) => {
    const out = capture();
    const cacheDir = tempDir();
    return announceSync({
      report: production(),
      env: env(),
      log: out.log,
      sleep: noSleep,
      cacheDir,
      now: () => new Date('2026-11-01T10:00:00Z'),
      ...over,
    }).then((r) => ({ r, out, cacheDir }));
  };

  it('is silent apart from one line when not configured', async () => {
    const { r, out } = await run({ env: {} });
    assert.equal(r.sent, false);
    assert.deepEqual(out.lines, ['Books notification: not configured (LIBRARY_SYNC_HOOK_URL)']);
  });

  it('says plainly when only one of the two settings is given, and sends nothing', async () => {
    books.answer({ status: 200 });
    for (const only of [{ LIBRARY_SYNC_HOOK_URL: url }, { LIBRARY_SYNC_HOOK_TOKEN: TOKEN }]) {
      const { r, out } = await run({ env: only });
      assert.equal(r.sent, false);
      assert.match(out.text(), /both LIBRARY_SYNC_HOOK_URL and LIBRARY_SYNC_HOOK_TOKEN must be set/);
      assert.match(out.text(), /The sync itself is fine/);
      assert.doesNotMatch(out.text(), new RegExp(TOKEN));
    }
    assert.equal(books.calls.length, 0);
  });

  it('sends the documented request and reports the result (200)', async () => {
    books.answer({ status: 200, body: { ok: true, applied: 3, review: 1, failed: 0, books: 2 } });
    const { r, out, cacheDir } = await run();
    assert.equal(r.ok, true);
    assert.equal(books.calls.length, 1);
    const [call] = books.calls;
    assert.equal(call.method, 'POST');
    assert.equal(call.headers.authorization, `Bearer ${TOKEN}`);
    assert.equal(call.headers['content-type'], 'application/json');
    assert.deepEqual(call.body, { tier: 'production', syncedAt: '2026-11-01T10:00:00.000Z', published: 1, withdrawn: 1 });
    assert.deepEqual(out.lines, ['Books updated: 3 applied, 1 need review, 0 failed']);
    const saved = JSON.parse(fs.readFileSync(path.join(cacheDir, 'last-notification.json'), 'utf8'));
    assert.equal(saved.ok, true);
    assert.equal(saved.status, 200);
    assert.doesNotMatch(JSON.stringify(saved), new RegExp(TOKEN));
  });

  it('409: an update is already running; no retry, how to repeat it', async () => {
    books.answer({ status: 409, body: { error: 'an update is running' } });
    const { r, out } = await run();
    assert.equal(r.ok, false);
    assert.equal(books.calls.length, 1);
    assert.match(out.text(), /already running/);
    assert.match(out.text(), /already in progress/);
    assert.match(out.text(), /npm run library:sync -- --notify/);
    assert.match(out.lines.at(-1), /^Books were NOT notified; run: npm run library:sync -- --notify$/);
  });

  it('401: prints the status, the error and a hint, no retry', async () => {
    books.answer({ status: 401, body: { error: 'bad token' } });
    const { r, out } = await run();
    assert.equal(r.ok, false);
    assert.equal(r.status, 401);
    assert.equal(books.calls.length, 1);
    assert.match(out.text(), /answered 401: bad token \(check LIBRARY_SYNC_HOOK_TOKEN\)/);
    assert.match(out.lines.at(-1), /Books were NOT notified/);
  });

  it('truncates a long error and never prints the token, even when the server echoes it', async () => {
    books.answer({ status: 500, body: { error: `boom ${TOKEN} ${'x'.repeat(500)}` } });
    const { out } = await run();
    assert.doesNotMatch(out.text(), new RegExp(TOKEN));
    assert.match(out.text(), /boom \*\*\*/);
    const line = out.lines.find((l) => /answered 500/.test(l));
    assert.ok(line.length < 330, `the error text was cut (${line.length} characters)`);
  });

  it('503 then 200: retried, and succeeds', async () => {
    books.answer({ status: 503, body: { error: 'starting' } }, { status: 200, body: { ok: true, applied: 1, review: 0, failed: 0, books: 1 } });
    const waits = [];
    const { r, out } = await run({ sleep: async (ms) => waits.push(ms) });
    assert.equal(r.ok, true);
    assert.equal(books.calls.length, 2);
    assert.equal(waits.length, 1);
    assert.match(out.text(), /answered 503; trying again/);
    assert.match(out.lines.at(-1), /^Books updated: 1 applied/);
  });

  it('503 every time: two retries, then it gives up with the repeat hint', async () => {
    books.answer({ status: 503, body: { error: 'not set up' } });
    const { r, out } = await run();
    assert.equal(r.ok, false);
    assert.equal(books.calls.length, 3);
    assert.match(out.text(), /answered 503: not set up/);
    assert.match(out.lines.at(-1), /Books were NOT notified/);
  });

  it('a dropped connection is retried, then reported (and the token stays out of it)', async () => {
    books.answer({ drop: true });
    const { r, out } = await run();
    assert.equal(r.ok, false);
    assert.equal(r.outcome, 'unreachable');
    assert.equal(books.calls.length, 3);
    assert.match(out.text(), /could not reach the server/);
    assert.doesNotMatch(out.text(), new RegExp(TOKEN));
  });

  it('nothing listening: reported, not thrown', async () => {
    const { r, out } = await run({ env: env({ LIBRARY_SYNC_HOOK_URL: 'http://127.0.0.1:1/hook' }) });
    assert.equal(r.ok, false);
    assert.match(out.text(), /could not reach the server/);
    assert.match(out.lines.at(-1), /Books were NOT notified/);
  });

  it('refuses a redirect instead of following it with the token', async () => {
    books.answer({ status: 302, headers: { location: 'http://127.0.0.1:1/elsewhere' }, body: {} });
    const { r, out } = await run();
    assert.equal(r.ok, false);
    assert.equal(r.outcome, 'redirect');
    assert.equal(books.calls.length, 1);
    assert.match(out.text(), /redirect, which is refused/);
  });

  it('refuses plain http to another host without sending anything', async () => {
    books.answer({ status: 200 });
    const { r, out } = await run({ env: env({ LIBRARY_SYNC_HOOK_URL: 'http://books.example.org/hook' }) });
    assert.equal(r.sent, false);
    assert.equal(books.calls.length, 0);
    assert.match(out.text(), /must be an https address/);
    assert.match(out.lines.at(-1), /Books were NOT notified/);
  });

  it('gives up with a clear message when the server does not answer in time', async () => {
    const slow = http.createServer(() => {});
    await new Promise((r) => slow.listen(0, '127.0.0.1', () => r(undefined)));
    try {
      const out = capture();
      const r = await postNotification({
        url: `http://127.0.0.1:${portOf(slow)}/hook`,
        token: TOKEN,
        body: {},
        timeoutMs: 150,
        log: out.log,
        sleep: noSleep,
      });
      assert.equal(r.outcome, 'timeout');
      assert.match(out.text(), /no answer within/);
    } finally {
      slow.closeAllConnections();
      await new Promise((r) => slow.close(r));
    }
  });

  it('dry runs, staging, no change and --no-notify send nothing; --notify sends when nothing changed', async () => {
    books.answer({ status: 200, body: { ok: true, applied: 0, review: 0, failed: 0, books: 0 } });
    for (const report of [production({ mode: 'dry-run' }), production({ tier: 'staging' }), production({ figures: [{ result: 'unchanged' }] })]) {
      assert.equal((await run({ report })).r.sent, false);
    }
    assert.equal((await run({ flags: { noNotify: true } })).r.sent, false);
    assert.equal(books.calls.length, 0);
    const forced = await run({ report: production({ figures: [{ result: 'unchanged' }] }), flags: { notify: true } });
    assert.equal(forced.r.ok, true);
    assert.equal(books.calls.length, 1);
    assert.deepEqual(books.calls[0].body.published, 0);
  });

  it('never throws, whatever goes wrong', async () => {
    const out = capture();
    const r = await announceSync({
      report: production(),
      env: env(),
      log: out.log,
      sleep: noSleep,
      fetch: () => Promise.reject(new TypeError(`broke with ${TOKEN}`)),
    });
    assert.equal(r.sent === true || r.sent === false, true);
    assert.doesNotMatch(out.text(), new RegExp(TOKEN));
    const r2 = await announceSync({ report: null, env: env(), log: out.log });
    assert.equal(r2.sent, false);
  });
});

describe('library:sync as a program', () => {
  it('a dry run with --notify sends nothing, says why, keeps the exit code and never prints the token', async () => {
    const books = booksServer();
    const url = await books.start();
    try {
      const cache = tempDir();
      const run = spawnSync(
        process.execPath,
        [path.join(ROOT, 'scripts/library-sync.mjs'), '--only', 'screw-gauge', '--formats', 'lab', '--no-verify', '--cache-dir', cache, '--notify'],
        {
          cwd: ROOT,
          env: { ...process.env, LIBRARY_SYNC_HOOK_URL: url, LIBRARY_SYNC_HOOK_TOKEN: TOKEN },
          encoding: 'utf8',
          timeout: 120_000,
        },
      );
      const all = `${run.stdout}\n${run.stderr}`;
      assert.equal(run.status, 0, all);
      assert.equal(books.calls.length, 0);
      assert.match(all, /Books notification: not notifying: this was a dry run/);
      assert.doesNotMatch(all, new RegExp(TOKEN));
    } finally {
      await books.stop();
    }
  });

  it('refuses --notify together with --no-notify', () => {
    const run = spawnSync(process.execPath, [path.join(ROOT, 'scripts/library-sync.mjs'), '--notify', '--no-notify'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /cannot be used together/);
  });
});
