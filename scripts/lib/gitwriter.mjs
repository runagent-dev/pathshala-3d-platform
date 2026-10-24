// The studio as a git client: every change made in the studio (reviews, status, notes, figure details, uploads)
// becomes a commit, authored by the person who made it; when the checkout has a remote, the studio pulls and
// pushes in the background. One operation at a time (a queue), so commits never interleave.
//
// If a pull cannot be rebased cleanly, nothing is lost: the studio's commits are pushed to a branch
// studio/rescue-<time>, and (only when the checkout has no uncommitted changes) the checkout is reset to the
// remote; the dashboard shows a banner until someone merges the rescue branch.
import { execFile } from 'node:child_process';
import { ROOT } from './paths.mjs';

const COMMITTER = ['-c', 'user.name=Pathshala Studio', '-c', 'user.email=studio@pathshala.local'];

/**
 * @param {{ root?: string, enabled?: boolean, remote?: string, branch?: string, onChange?: (state: any) => void, log?: (msg: string) => void }} [options]
 */
export function createGitWriter({ root = ROOT, enabled = true, remote = 'origin', branch = 'main', onChange = () => {}, log = () => {} } = {}) {
  const run = (args) =>
    new Promise((resolve, reject) => {
      execFile('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) reject(Object.assign(new Error(String(stderr || err.message).trim()), { code: err.code }));
        else resolve(stdout.trim());
      });
    });
  const state = { enabled, available: false, remote: null, ahead: 0, behind: 0, lastSync: null, lastCommit: null, lastError: null, rescue: null };
  /** @type {Promise<unknown>} */
  let chain = Promise.resolve();
  /**
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  const enqueue = (fn) => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => {});
    return /** @type {Promise<T>} */ (next);
  };
  const changed = () => onChange({ ...state });
  const later = new Map();
  let timer = null;

  const ready = (async () => {
    if (!enabled) return;
    try {
      state.available = (await run(['rev-parse', '--is-inside-work-tree'])) === 'true';
      state.remote = (await run(['remote'])).split('\n').includes(remote) ? remote : null;
    } catch {
      state.available = false;
    }
    changed();
  })();

  /**
   * Commits exactly `paths` (relative to the repo) as `user`. Resolves to the commit id, or null if nothing changed.
   * @param {{ paths: string[], message: string, user?: { username: string, name?: string, email?: string | null, role?: string } | null, trailers?: Record<string, string> }} args
   * @returns {Promise<string | null>}
   */
  function commit({ paths, message, user, trailers = {} }) {
    return enqueue(async () => {
      await ready;
      if (!state.enabled || !state.available || !paths.length) return null;
      try {
        await run(['add', '-A', '--', ...paths]);
        const staged = await run(['diff', '--cached', '--name-only', '--', ...paths]);
        if (!staged) return null;
        const who = user
          ? `${user.name || user.username} <${user.email || `${user.username}@studio.local`}>`
          : 'Pathshala Studio <studio@pathshala.local>';
        const lines = Object.entries({ 'Studio-User': user?.username, 'Studio-Role': user?.role, ...trailers })
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`);
        await run([
          ...COMMITTER,
          'commit',
          '--no-verify',
          '-q',
          '--author',
          who,
          '-m',
          message,
          ...(lines.length ? ['-m', lines.join('\n')] : []),
          '--',
          ...paths,
        ]);
        state.lastCommit = await run(['rev-parse', 'HEAD']);
        state.lastError = null;
        changed();
        return state.lastCommit;
      } catch (err) {
        state.lastError = `commit failed: ${err.message}`;
        log(state.lastError);
        changed();
        return null;
      }
    });
  }

  /** Commits after `ms` of quiet (notes are saved as people type). */
  function commitLater(key, args, ms = 60_000) {
    clearTimeout(later.get(key)?.timer);
    later.set(key, { args, timer: setTimeout(() => (later.delete(key), commit(args)), ms) });
  }
  async function flush() {
    const pending = [...later.values()];
    later.clear();
    for (const p of pending) {
      clearTimeout(p.timer);
      await commit(p.args);
    }
  }

  /** Pull (rebase) and push. Returns the files the pull changed. */
  async function sync() {
    await flush();
    return enqueue(async () => {
      await ready;
      if (!state.enabled || !state.available || !state.remote) return [];
      const upstream = `${state.remote}/${branch}`;
      try {
        await run(['fetch', '--quiet', state.remote, branch]);
        const before = await run(['rev-parse', 'HEAD']);
        const [behind, ahead] = (await run(['rev-list', '--left-right', '--count', `${upstream}...HEAD`])).split(/\s+/).map(Number);
        let pulled = [];
        if (behind) {
          try {
            await run(['-c', 'rebase.autoStash=true', ...COMMITTER, 'rebase', '--quiet', upstream]);
          } catch (err) {
            await run(['rebase', '--abort']).catch(() => {});
            await rescue(upstream, err);
            return [];
          }
          pulled = (await run(['diff', '--name-only', before, 'HEAD'])).split('\n').filter(Boolean);
        }
        if (ahead || behind) await run(['push', '--quiet', '--follow-tags', state.remote, `HEAD:${branch}`]);
        const [b2, a2] = (await run(['rev-list', '--left-right', '--count', `${upstream}...HEAD`])).split(/\s+/).map(Number);
        Object.assign(state, { behind: b2, ahead: a2, lastSync: new Date().toISOString(), lastError: null });
        changed();
        return pulled;
      } catch (err) {
        state.lastError = `sync failed: ${err.message}`;
        log(state.lastError);
        changed();
        return [];
      }
    });
  }

  async function rescue(upstream, err) {
    const name = `studio/rescue-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    await run(['branch', name, 'HEAD']);
    await run(['push', '--quiet', state.remote, `${name}:${name}`]).catch(() => {});
    const dirty = await run(['status', '--porcelain', '--untracked-files=no']);
    if (!dirty) await run(['reset', '--quiet', '--hard', upstream]);
    state.rescue = { branch: name, at: new Date().toISOString(), reset: !dirty, reason: err.message.split('\n')[0] };
    state.lastError = dirty
      ? `the remote changed the same files; studio commits are saved on ${name}. The checkout has uncommitted changes, so it was not reset: sort it out by hand.`
      : `the remote changed the same files; studio commits are saved on ${name} (merge it by hand).`;
    log(state.lastError);
    changed();
  }

  return {
    ready,
    commit,
    commitLater,
    flush,
    sync,
    status: () => ({ ...state }),
    /** Pulls and pushes every `ms` while the studio runs. */
    start(ms = 60_000) {
      timer = setInterval(() => sync(), ms);
      timer.unref?.();
    },
    async stop() {
      clearInterval(timer);
      await flush();
    },
  };
}
