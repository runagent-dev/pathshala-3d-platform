// One sync at a time per cache folder: two runs publishing at once could each demote what the other just made current.
// The lock is a file made with the "create, fail if it exists" flag. A lock left by a run that died (its process is gone, on
// this machine) is taken over; one held by a live process, or by another machine, is respected. Taking over is serialised by a
// takeover guard (`<lock>.takeover.<n>`, see takeOver): only its holder removes a lock that is not its own.
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
// an unreadable (damaged) takeover guard this old is counted as dead
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

/** The takeover guards of a lock, `<lock>.takeover.<n>`, highest number first. */
const guardsOf = (file) => {
  const base = `${path.basename(file)}.takeover.`;
  return fs
    .readdirSync(path.dirname(file))
    .filter((n) => n.startsWith(base) && /^\d+$/.test(n.slice(base.length)))
    .map((n) => Number(n.slice(base.length)))
    .sort((x, y) => y - x);
};

/**
 * Removes the stale lock `judged` (null: an old unreadable one) while holding a takeover guard; throws LockedError when another
 * run is taking it over.
 *
 * Guards are numbered, `<lock>.takeover.<n>`, and nobody ever removes another run's guard. A run takes the number after the
 * highest guard there is, and only when that guard's run is gone (on this machine); a live one, however slow, is waited for.
 * A guard is made complete in one step (written to a file of its own, then hard-linked to its name, which fails if the name
 * exists), so two runs that find the same dead guard race for the same next number and exactly one gets it. A run removes its
 * own guard when it is done; guards of runs that died stay behind as small files.
 */
export function takeOver(file, judged) {
  const guards = guardsOf(file);
  const top = guards[0];
  if (top !== undefined) {
    const at = `${file}.takeover.${top}`;
    const { holder } = readLock(at);
    const age = Date.now() - (fs.statSync(at, { throwIfNoEntry: false })?.mtimeMs ?? Date.now());
    // a guard is never half-written (see below); an unreadable one is damaged, and counted as dead once it is old
    const dead = holder ? holder.host === os.hostname() && !alive(holder.pid) : age > GUARD_STALE_MS;
    if (!dead) {
      throw new LockedError(
        holder && holder.host !== os.hostname()
          ? `another machine (${holder.host}) is taking over the stale lock ${file}; delete ${at} if you are sure it is dead`
          : `another sync is taking over the stale lock ${file} right now; try again in a moment`,
        null,
      );
    }
  }
  const guard = `${file}.takeover.${(top ?? 0) + 1}`;
  const mine = { pid: process.pid, host: os.hostname(), startedAt: `${new Date().toISOString()} ${Math.random()}` };
  const draft = `${guard}.${process.pid}.draft`;
  fs.writeFileSync(draft, `${JSON.stringify(mine)}\n`);
  try {
    fs.linkSync(draft, guard);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    throw new LockedError(`another sync is taking over the stale lock ${file} right now; try again in a moment`, null);
  } finally {
    fs.rmSync(draft, { force: true });
  }
  try {
    const now = readLock(file);
    // an unreadable lock is removed only while it is still old: a new one another run has just created is unreadable too
    const old = Date.now() - (fs.statSync(file, { throwIfNoEntry: false })?.mtimeMs ?? Date.now()) >= UNREADABLE_GRACE_MS;
    if (now.exists && sameLock(judged, now.holder) && (judged || old)) fs.rmSync(file, { force: true });
    // otherwise it is gone or someone else's by now: the next "create" decides
  } finally {
    if (sameLock(mine, readLock(guard).holder)) fs.rmSync(guard, { force: true });
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
