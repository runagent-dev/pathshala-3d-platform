import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, mock } from 'node:test';
import { LockedError, acquireLock, takeOver } from '../../scripts/lib/library/lock.mjs';
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

  it('respects a lock file that is still empty (another run has just made it), but takes over an old damaged one', () => {
    const file = lockFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '');
    assert.throws(() => acquireLock(file), LockedError);
    const old = new Date(Date.now() - 60_000);
    fs.utimesSync(file, old, old);
    acquireLock(file).release();
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

  it('a takeover removes only the lock it judged stale, never one that changed since', () => {
    const file = lockFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const dead = { pid: 999999, host: os.hostname(), startedAt: 'dead' };
    const live = { pid: process.pid, host: os.hostname(), startedAt: 'live' };
    fs.writeFileSync(file, JSON.stringify(live));
    takeOver(file, dead);
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).startedAt, 'live');
    fs.writeFileSync(file, JSON.stringify(dead));
    takeOver(file, dead);
    assert.equal(fs.existsSync(file), false);
    assert.equal(fs.existsSync(`${file}.takeover`), false);
  });

  it('a takeover of a damaged lock leaves a new, still empty one alone', () => {
    const file = lockFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '');
    takeOver(file, null);
    assert.equal(fs.existsSync(file), true);
    const old = new Date(Date.now() - 60_000);
    fs.utimesSync(file, old, old);
    takeOver(file, null);
    assert.equal(fs.existsSync(file), false);
  });

  it('waits for another takeover in progress, however old, and clears a guard whose run is gone', async () => {
    const file = lockFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const dead = { pid: 999999, host: os.hostname(), startedAt: 'dead' };
    fs.writeFileSync(file, JSON.stringify(dead));
    const guard = `${file}.takeover`;
    const old = new Date(Date.now() - 60_000);
    // a live (if slow) run holds the guard: never cleared for its age
    fs.writeFileSync(guard, JSON.stringify({ pid: process.pid, host: os.hostname(), startedAt: 'slow' }));
    fs.utimesSync(guard, old, old);
    assert.throws(() => takeOver(file, dead), LockedError);
    assert.equal(fs.existsSync(guard), true);
    assert.equal(fs.existsSync(file), true);
    // its run is gone: cleared, and the next attempt takes over
    const child = spawn(process.execPath, ['-e', ''], { stdio: 'ignore' });
    await new Promise((resolve) => child.on('exit', resolve));
    fs.writeFileSync(guard, JSON.stringify({ pid: child.pid, host: os.hostname(), startedAt: 'died' }));
    assert.throws(() => takeOver(file, dead), LockedError);
    assert.equal(fs.existsSync(guard), false);
    takeOver(file, dead);
    assert.equal(fs.existsSync(file), false);
    // an unreadable guard: respected while new, cleared once old
    fs.writeFileSync(file, JSON.stringify(dead));
    fs.writeFileSync(guard, '');
    assert.throws(() => takeOver(file, dead), LockedError);
    assert.equal(fs.existsSync(guard), true);
    fs.utimesSync(guard, old, old);
    assert.throws(() => takeOver(file, dead), LockedError);
    assert.equal(fs.existsSync(guard), false);
  });

  it('does not remove a guard that is no longer its own', () => {
    const file = lockFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    // simulated: the lock read happens, then someone else's guard is found in place of ours
    const guard = `${file}.takeover`;
    const other = { pid: process.pid, host: os.hostname(), startedAt: 'other' };
    const realRead = fs.readFileSync;
    const spy = mock.method(fs, 'readFileSync', (/** @type {any} */ f, /** @type {any} */ opts) => {
      if (f === guard) fs.writeFileSync(guard, JSON.stringify(other));
      return realRead(f, opts);
    });
    try {
      takeOver(file, { pid: 999999, host: os.hostname(), startedAt: 'dead' });
    } finally {
      spy.mock.restore();
    }
    assert.equal(JSON.parse(fs.readFileSync(guard, 'utf8')).startedAt, 'other');
  });

  it('only one of several that find the same stale lock gets it', async () => {
    const file = lockFile();
    for (let round = 0; round < 5; round++) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify({ pid: 999999, host: os.hostname(), startedAt: `dead-${round}` }));
      const script = `import { acquireLock } from ${JSON.stringify(new URL('../../scripts/lib/library/lock.mjs', import.meta.url).href)};
        try { acquireLock(${JSON.stringify(file)}); await new Promise((r) => setTimeout(r, 600)); process.exit(10); } catch { process.exit(11); }`;
      const run = () =>
        new Promise((resolve) => {
          const c = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: 'ignore' });
          c.on('exit', resolve);
        });
      const codes = await Promise.all([run(), run(), run(), run()]);
      assert.ok(codes.filter((c) => c === 10).length <= 1, `round ${round}: codes ${codes}`);
      fs.rmSync(file, { force: true });
    }
  });
});
