import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { READ_TOKEN_ENV, pickToken, reconcile } from '../../scripts/lib/library/reconcile.mjs';
import { createLibrary } from '../../scripts/lib/library/registry.mjs';
import { tempDir } from '../helpers.mjs';
import { fakeLibrary } from '../library-fake.mjs';

// Which token a run sends, and what it says when the library wants one (a library with PUBLIC_READ=false needs a token to be read).
const WRITE = 'clk_write_key_never_printed';
const READ = 'clk_read_key_never_printed';

describe('pickToken', () => {
  it('a dry run reads with the write token, else the read token, else none', () => {
    assert.deepEqual(pickToken({ tokenEnv: 'LIBRARY_TOKEN', env: { LIBRARY_TOKEN: WRITE, [READ_TOKEN_ENV]: READ } }), {
      token: WRITE,
      source: 'LIBRARY_TOKEN',
    });
    assert.deepEqual(pickToken({ tokenEnv: 'LIBRARY_TOKEN', env: { [READ_TOKEN_ENV]: READ } }), { token: READ, source: READ_TOKEN_ENV });
    assert.deepEqual(pickToken({ tokenEnv: 'LIBRARY_TOKEN', env: {} }), { token: undefined, source: null });
  });
  it('an empty or blank variable counts as not set (a secret a pull request from a fork does not get is empty)', () => {
    assert.deepEqual(pickToken({ tokenEnv: 'LIBRARY_TOKEN', env: { LIBRARY_TOKEN: '', [READ_TOKEN_ENV]: `  ${READ}\n` } }), {
      token: READ,
      source: READ_TOKEN_ENV,
    });
    assert.deepEqual(pickToken({ tokenEnv: 'LIBRARY_TOKEN', env: { [READ_TOKEN_ENV]: '  ' } }), { token: undefined, source: null });
  });
  it('an --apply never publishes with the read token, not even when it is named', () => {
    assert.deepEqual(pickToken({ tokenEnv: 'LIBRARY_TOKEN', apply: true, env: { [READ_TOKEN_ENV]: READ } }), { token: undefined, source: null });
    assert.throws(
      () => pickToken({ tokenEnv: READ_TOKEN_ENV, apply: true, env: { [READ_TOKEN_ENV]: READ } }),
      /cannot publish with LIBRARY_READ_TOKEN/,
    );
    // a dry run may name it
    assert.deepEqual(pickToken({ tokenEnv: READ_TOKEN_ENV, env: { [READ_TOKEN_ENV]: READ } }), { token: READ, source: READ_TOKEN_ENV });
  });
});

describe('a library that needs a token to be read', () => {
  it('a dry run reads it with LIBRARY_READ_TOKEN, sent on every request', async () => {
    const lib = fakeLibrary({ token: READ });
    const report = await reconcile({
      library: 'http://library.test',
      tokenEnv: 'LIBRARY_TOKEN',
      env: { [READ_TOKEN_ENV]: READ },
      fetch: lib.fetch,
      formats: 'lab',
      verify: false,
      only: ['stopwatch'],
      cacheDir: tempDir(),
    });
    assert.equal(report.mode, 'dry-run');
    assert.ok(lib.auths.length > 0);
    assert.ok(lib.auths.every((a) => a === `Bearer ${READ}`));
    assert.deepEqual(lib.writes(), []);
    assert.equal(JSON.stringify(report).includes(READ), false, 'the report never holds the token');
  });

  it('without a token, says which setting gives one', async () => {
    const lib = fakeLibrary({ token: READ });
    await assert.rejects(createLibrary('http://library.test', { fetch: lib.fetch }).snapshot(), (/** @type {any} */ err) => {
      assert.equal(err.status, 401);
      assert.match(err.message, /LIBRARY_READ_TOKEN/);
      return true;
    });
  });

  it('refuses a token a header cannot carry before sending anything, without printing it', async () => {
    const lib = fakeLibrary({ token: READ });
    const bad = `${READ}\nsecond-line`;
    assert.throws(
      () => createLibrary('http://library.test', { token: bad, fetch: lib.fetch }),
      (/** @type {any} */ err) => {
        assert.match(err.message, /not valid/);
        assert.equal(err.message.includes(READ), false);
        return true;
      },
    );
    assert.deepEqual(lib.auths, []);
  });

  it('with a wrong token, says so and never prints it', async () => {
    const lib = fakeLibrary({ token: READ });
    await assert.rejects(createLibrary('http://library.test', { token: WRITE, fetch: lib.fetch }).snapshot(), (/** @type {any} */ err) => {
      assert.match(err.message, /did not accept the token/);
      assert.equal(err.message.includes(WRITE), false);
      return true;
    });
  });
});
