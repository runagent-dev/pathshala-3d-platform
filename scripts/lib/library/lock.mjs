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

const UNREADABLE_GRACE_MS = 10_000;

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
        // unreadable: a lock being written right now (held for a grace period), or damaged (then taken over).
      }
      const sameHost = holder?.host === os.hostname();
      // an unreadable lock may be one another process has just created and not yet filled in: it is stale only once it is old
      const fresh = !holder && Date.now() - (fs.statSync(file, { throwIfNoEntry: false })?.mtimeMs ?? 0) < UNREADABLE_GRACE_MS;
      if (fresh) throw new LockedError(`another sync is taking the lock ${file} right now; try again in a moment`, null);
      if (holder && (!sameHost || alive(holder.pid))) {
        throw new LockedError(
          `another sync holds the lock (pid ${holder.pid} on ${holder.host}, started ${holder.startedAt}); wait for it, or delete ${file} if you are sure it is dead`,
          holder,
        );
      }
      // stale: its process is gone. Moved aside (not deleted) so that two contenders cannot both delete a lock that a third has
      // just taken: if what was moved is not the lock judged stale, it is put back and this run backs off.
      const aside = `${file}.stale-${process.pid}`;
      try {
        fs.renameSync(file, aside);
      } catch {
        continue; // someone else already took it over: try the "create" again
      }
      let moved = null;
      try {
        moved = JSON.parse(fs.readFileSync(aside, 'utf8'));
      } catch {
        // still unreadable: the damaged one we meant to remove
      }
      const same = holder ? moved?.pid === holder.pid && moved?.startedAt === holder.startedAt : moved === null;
      if (!same) {
        try {
          fs.linkSync(aside, file);
        } catch {
          // another run has made a new lock since: that one stands, and this copy is dropped
        }
        fs.rmSync(aside, { force: true });
        throw new LockedError(`another sync took the lock ${file} while it was being cleared; try again in a moment`, moved);
      }
      fs.rmSync(aside, { force: true });
    }
  }
  throw new LockedError(`could not take the lock ${file}`, null);
}
