// One sync at a time per cache folder: two runs publishing at once could each demote what the other just made current.
// The lock is a file made with the "create, fail if it exists" flag. A lock left by a run that died (its process is gone, on
// this machine) is taken over; one held by a live process, or by another machine, is respected. Taking over is serialised by a
// second file, `<lock>.takeover`, made the same way: only its holder removes a lock that is not its own.
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
// the takeover takes milliseconds; a guard this old was left by a run that died inside it
const GUARD_STALE_MS = 30_000;

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
};

const sameLock = (a, b) => (a ? b?.pid === a.pid && b?.startedAt === a.startedAt && b?.host === a.host : b === null);

const readLock = (file) => {
  try {
    return { exists: true, holder: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (err) {
    return { exists: err.code !== 'ENOENT', holder: null };
  }
};

/** Removes the stale lock `judged` (null: an old unreadable one) while holding `<file>.takeover`; throws LockedError when another run is taking it over. */
export function takeOver(file, judged) {
  const guard = `${file}.takeover`;
  let fd;
  try {
    fd = fs.openSync(guard, 'wx');
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    const age = Date.now() - (fs.statSync(guard, { throwIfNoEntry: false })?.mtimeMs ?? Date.now());
    // its run died inside the takeover (a window of milliseconds); the next attempt takes the guard. Two runs clearing the same
    // dead guard at once could both enter, which needs a crash inside that window and then two runs starting together.
    if (age > GUARD_STALE_MS) fs.rmSync(guard, { force: true });
    throw new LockedError(`another sync is taking over the stale lock ${file} right now; try again in a moment`, null);
  }
  try {
    fs.writeSync(fd, `${process.pid}\n`);
    fs.closeSync(fd);
    const now = readLock(file);
    // an unreadable lock is removed only while it is still old: a new one another run has just created is unreadable too
    const old = Date.now() - (fs.statSync(file, { throwIfNoEntry: false })?.mtimeMs ?? Date.now()) >= UNREADABLE_GRACE_MS;
    if (now.exists && sameLock(judged, now.holder) && (judged || old)) fs.rmSync(file, { force: true });
    // otherwise it is gone or someone else's by now: the next "create" decides
  } finally {
    fs.rmSync(guard, { force: true });
  }
}

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
      // stale: its process is gone. Only the run holding the takeover guard may remove a lock, and it removes it only if it is
      // still the one judged stale. Nobody else ever removes a lock but its live owner, so between that check and the removal
      // the file cannot become someone else's: no path is left vacant while a live lock is moved, as a rename-aside would.
      takeOver(file, holder);
    }
  }
  throw new LockedError(`could not take the lock ${file}`, null);
}
