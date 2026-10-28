// One sync at a time per cache folder: two runs publishing at once could each demote what the other just made current.
// The lock is a file made with the "create, fail if it exists" flag. A lock left by a run that died (its process is gone, on
// this machine) is taken over; one held by a live process, or by another machine, is respected.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export class LockedError extends Error {
  constructor(message, holder) {
    super(message);
    this.name = 'LockedError';
    this.holder = holder;
  }
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
};

/** Takes the lock or throws LockedError. Returns { release() }. `info` (tier, library, ...) is written for whoever finds the lock. */
export function acquireLock(file, info = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const mine = { pid: process.pid, host: os.hostname(), startedAt: new Date().toISOString(), ...info };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const fd = fs.openSync(file, 'wx');
      fs.writeSync(fd, `${JSON.stringify(mine, null, 2)}\n`);
      fs.closeSync(fd);
      return {
        holder: mine,
        release() {
          try {
            const now = JSON.parse(fs.readFileSync(file, 'utf8'));
            if (now.pid === mine.pid && now.startedAt === mine.startedAt) fs.rmSync(file, { force: true });
          } catch {
            // already gone
          }
        },
      };
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      let holder = null;
      try {
        holder = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {
        // unreadable: a lock being written right now, or damaged. Treated as held for a moment, then as stale.
      }
      const sameHost = holder?.host === os.hostname();
      if (holder && (!sameHost || alive(holder.pid))) {
        throw new LockedError(
          `another sync holds the lock (pid ${holder.pid} on ${holder.host}, started ${holder.startedAt}); wait for it, or delete ${file} if you are sure it is dead`,
          holder,
        );
      }
      fs.rmSync(file, { force: true }); // stale: its process is gone
    }
  }
  throw new LockedError(`could not take the lock ${file}`, null);
}
