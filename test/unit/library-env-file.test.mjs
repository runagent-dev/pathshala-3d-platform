import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { ENV_FILE_KEYS, loadEnvFile, parseEnvFile } from '../../scripts/lib/library/env-file.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'envfile-'));

describe('env file', () => {
  it('reads KEY=value lines, comments, export, quotes; nothing is expanded', () => {
    const got = parseEnvFile(
      [
        '# a comment',
        '',
        'LIBRARY_TOKEN=abc123',
        'export LIBRARY_SYNC_HOOK_URL="https://x.example/hook"',
        "A='q q'",
        'B=$HOME',
        'bad line',
        '  C = spaced  ',
      ].join('\n'),
    );
    assert.deepEqual(got, { LIBRARY_TOKEN: 'abc123', LIBRARY_SYNC_HOOK_URL: 'https://x.example/hook', A: 'q q', B: '$HOME', C: 'spaced' });
  });

  it('fills in only what the shell has not set, only allowed names, and never returns a value', () => {
    const dir = tmp();
    const file = path.join(dir, '.env.library');
    fs.writeFileSync(
      file,
      'LIBRARY_TOKEN=from-file\nLIBRARY_SYNC_HOOK_URL=https://h.example/hook\nPATH=/evil\nEMPTY_ONE=\nLIBRARY_SYNC_HOOK_TOKEN=\n',
      { mode: 0o600 },
    );
    const env = { LIBRARY_SYNC_HOOK_URL: 'https://from-shell.example/hook' };
    const r = loadEnvFile(file, env);
    assert.deepEqual(r.loaded, ['LIBRARY_TOKEN']);
    assert.deepEqual(r.ignored.sort(), ['EMPTY_ONE', 'PATH']);
    assert.equal(env.LIBRARY_TOKEN, 'from-file');
    assert.equal(env.LIBRARY_SYNC_HOOK_URL, 'https://from-shell.example/hook');
    assert.equal(env.PATH, undefined);
    assert.equal(r.open, false);
    assert.ok(!JSON.stringify(r).includes('from-file'));
    assert.deepEqual(ENV_FILE_KEYS, ['LIBRARY_TOKEN', 'LIBRARY_READ_TOKEN', 'LIBRARY_SYNC_HOOK_URL', 'LIBRARY_SYNC_HOOK_TOKEN']);
  });

  it('a missing file is fine, and a file others can read is reported', () => {
    const dir = tmp();
    assert.deepEqual(loadEnvFile(path.join(dir, 'nope'), {}), { found: false, loaded: [], ignored: [], open: false });
    const file = path.join(dir, '.env.library');
    fs.writeFileSync(file, 'LIBRARY_TOKEN=x\n');
    fs.chmodSync(file, 0o644);
    assert.equal(loadEnvFile(file, {}).open, process.platform !== 'win32');
  });
});
