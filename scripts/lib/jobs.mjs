// Background jobs of the studio (exports): one at a time, each in its own child process (a crash there can't take
// the studio down), kept as JSON files in data/jobs/ so a restart loses nothing: jobs that were running are marked
// failed, queued ones start again.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { writeFileAtomic } from './fsutil.mjs';
import { DATA_DIR, ROOT } from './paths.mjs';

const KEEP = 200; // finished jobs kept on disk
const FORMATS = ['zip', 'images', 'glb', 'video'];
const fail = (status, message) => Object.assign(new Error(message), { status });

/**
 * createJobs({ onChange(job), figureExists(id), freeBytes(), minFree }) → { add, cancel, list, get, stop }
 * Each job: { id, kind: 'export', figure, formats, official, by, status: queued|running|done|failed|cancelled,
 * progress: { step, done, total }, createdAt, startedAt, finishedAt, result, error, log }.
 *
 * @param {{ onChange?: (job: any) => void, figureExists?: (id: string) => boolean, freeBytes?: () => number, minFree?: number,
 *           dir?: string, command?: (job: any) => string[] }} [options]  command: replaces the exporter (tests)
 */
export function createJobs({
  onChange = () => {},
  figureExists = () => true,
  freeBytes = () => Infinity,
  minFree = 0,
  dir = path.join(DATA_DIR, 'jobs'),
  command,
} = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const jobs = new Map();
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    try {
      const job = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
      if (job.status === 'running')
        Object.assign(job, { status: 'failed', error: 'the studio restarted while this was running', finishedAt: new Date().toISOString() });
      jobs.set(job.id, job);
    } catch {}
  }
  let running = null;
  let seq = 0;
  let lastSave = 0;

  function save(job, { force = true } = {}) {
    onChange(job);
    if (!force && Date.now() - lastSave < 1000) return;
    lastSave = Date.now();
    writeFileAtomic(path.join(dir, `${job.id}.json`), `${JSON.stringify(job, null, 2)}\n`).catch(() => {});
  }

  function prune() {
    const finished = [...jobs.values()]
      .filter((j) => !['queued', 'running'].includes(j.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    for (const j of finished.slice(KEEP)) {
      jobs.delete(j.id);
      fs.rmSync(path.join(dir, `${j.id}.json`), { force: true });
    }
  }

  function finish(job, status, extra = {}) {
    Object.assign(job, { status, finishedAt: new Date().toISOString(), ...extra });
    save(job);
    if (running?.job === job) running = null;
    prune();
    setImmediate(pump);
  }

  function start(job) {
    if (freeBytes() < minFree) return finish(job, 'failed', { error: 'not enough free disk space for an export' });
    const args = command
      ? command(job)
      : ['scripts/export.mjs', job.figure, '--formats', job.formats.join(','), '--json', ...(job.official ? ['--official'] : [])];
    const [cmd, cmdArgs] = process.platform === 'win32' || command ? [process.execPath, args] : ['nice', ['-n', '10', process.execPath, ...args]];
    Object.assign(job, { status: 'running', startedAt: new Date().toISOString(), progress: null });
    save(job);
    const child = spawn(cmd, cmdArgs, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    running = { job, child };
    let buffer = '';
    let outcome = null;
    child.stdout.on('data', (d) => {
      buffer += d;
      let nl = buffer.indexOf('\n');
      while (nl >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        nl = buffer.indexOf('\n');
        if (!line.startsWith('{')) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.type === 'progress') {
            job.progress = { step: msg.step, done: msg.done, total: msg.total };
            save(job, { force: false });
          } else if (msg.type === 'done')
            outcome = {
              ok: true,
              result: { out: msg.out, files: msg.record.files.map((f) => ({ name: f.name, bytes: f.bytes })), commit: msg.record.commit },
            };
          else if (msg.type === 'error') outcome = { ok: false, error: msg.message };
        } catch {}
      }
    });
    child.stderr.on('data', (d) => (job.log = `${job.log || ''}${d}`.slice(-4000)));
    child.on('error', (err) => finish(job, 'failed', { error: `could not start the exporter: ${err.message}` }));
    child.on('close', (code, signal) => {
      if (job.status !== 'running') return;
      if (job.cancelRequested) return finish(job, 'cancelled');
      if (code === 0 && outcome?.ok) return finish(job, 'done', { result: outcome.result });
      finish(job, 'failed', { error: outcome?.error || `the exporter stopped (${signal || `exit ${code}`})` });
    });
  }

  function pump() {
    if (running) return;
    const next = [...jobs.values()].filter((j) => j.status === 'queued').sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (next) start(next);
  }

  setImmediate(pump);

  return {
    /** Queues an export; the same figure already waiting or running returns that job instead. */
    add({ figure, formats = ['zip', 'images', 'glb'], official = false, by = 'owner' }) {
      if (!figureExists(figure)) throw fail(404, `No figure "${figure}"`);
      const bad = [].concat(formats).filter((f) => !FORMATS.includes(f));
      if (!formats.length || bad.length) throw fail(400, `formats must be some of ${FORMATS.join(', ')}`);
      const same = [...jobs.values()].find((j) => j.figure === figure && ['queued', 'running'].includes(j.status));
      if (same) return same;
      const job = {
        id: `${Date.now().toString(36)}${(seq++).toString(36).padStart(2, '0')}`,
        kind: 'export',
        figure,
        formats: [...formats],
        official: Boolean(official),
        by,
        status: 'queued',
        progress: null,
        createdAt: new Date().toISOString(),
      };
      jobs.set(job.id, job);
      save(job);
      setImmediate(pump);
      return job;
    },
    cancel(id) {
      const job = jobs.get(id);
      if (!job) throw fail(404, 'No such job');
      if (job.status === 'queued') finish(job, 'cancelled');
      else if (job.status === 'running') {
        job.cancelRequested = true;
        running?.child.kill('SIGTERM');
      }
      return job;
    },
    get: (id) => jobs.get(id) || null,
    /** @param {{ figure?: string, limit?: number }} [filter] */
    list({ figure, limit = 20 } = {}) {
      return [...jobs.values()]
        .filter((j) => !figure || j.figure === figure)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    },
    /** For tests and shutdown: stop the running job. */
    stop() {
      running?.child.kill('SIGTERM');
    },
  };
}
