import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { LockedError, acquireLock } from '../../scripts/lib/library/lock.mjs';
import { tempDir } from '../helpers.mjs';

const lockFile = () => path.join(tempDir(), 'cache', 'sync.lock');

describe('library sync lock', () => {
  it('takes the lock, writes who holds it, and releases it', () => {
    const file = lockFile();
    const lock = acquireLock(file, { tier: 'staging' });
    const held = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(held.pid, process.pid);
    assert.equal(held.tier, 'staging');
    lock.release();
    assert.equal(fs.existsSync(file), false);
  });

  it('refuses a second run while the first is alive', () => {
    const file = lockFile();
    const lock = acquireLock(file);
    assert.throws(
      () => acquireLock(file),
      (err) => err instanceof LockedError && /another sync holds the lock/.test(err.message) && err.holder.pid === process.pid,
    );
    lock.release();
    acquireLock(file).release();
  });

  it('takes over a lock left by a process that is gone', async () => {
    const file = lockFile();
    const child = spawn(process.execPath, ['-e', ''], { stdio: 'ignore' });
    await new Promise((resolve) => child.on('exit', resolve));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ pid: child.pid, host: os.hostname(), startedAt: '2026-01-01T00:00:00.000Z' }));
    const lock = acquireLock(file);
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).pid, process.pid);
    lock.release();
  });

  it('respects a lock held on another machine, whatever its pid', () => {
    const file = lockFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ pid: 1, host: 'another-machine', startedAt: '2026-01-01T00:00:00.000Z' }));
    assert.throws(() => acquireLock(file), LockedError);
  });

  it('does not remove a lock that is no longer its own', () => {
    const file = lockFile();
    const lock = acquireLock(file);
    fs.writeFileSync(file, JSON.stringify({ pid: process.pid, host: os.hostname(), startedAt: 'someone-else' }));
    lock.release();
    assert.equal(fs.existsSync(file), true);
  });

  it('only one of several that start together gets it', async () => {
    const file = lockFile();
    const script = `import { acquireLock } from ${JSON.stringify(new URL('../../scripts/lib/library/lock.mjs', import.meta.url).href)};
      try { acquireLock(${JSON.stringify(file)}); await new Promise((r) => setTimeout(r, 600)); process.exit(10); } catch { process.exit(11); }`;
    const run = () =>
      new Promise((resolve) => {
        const c = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: 'ignore' });
        c.on('exit', resolve);
      });
    const codes = await Promise.all([run(), run(), run(), run()]);
    assert.equal(codes.filter((c) => c === 10).length, 1, `codes ${codes}`);
  });
});
