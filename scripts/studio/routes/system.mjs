// Who am I, the books, the server's health, and git (status, sync now, and the webhook that asks for a pull).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadBooks } from '../../lib/books.mjs';
import { freeBytes } from '../../lib/fsutil.mjs';
import { ROOT } from '../../lib/paths.mjs';
import { json, readBody } from '../http.mjs';
import { allowed } from '../policy.mjs';

const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const started = Date.now();

export function register(router, { git, jobs, config, exportsReady }) {
  router.get('/api/me', 'me:read', ({ res, user }) =>
    json(res, 200, { role: user.role, user, mode: config.mode, login: config.login, git: allowed(user.role, 'git:read') ? git.status() : undefined }),
  );
  router.get('/api/books', 'books:read', ({ res }) => json(res, 200, { books: loadBooks() }));

  // Health: public answer is just "ok"; logged-in makers get the details (for the dashboard and monitoring).
  router.get('/api/health', null, ({ res, user }) => {
    const free = freeBytes(ROOT);
    const g = git.status();
    const ok = free > 2 * 1024 ** 3 && !g.rescue;
    if (!user || !allowed(user.role, 'git:read')) return json(res, ok ? 200 : 503, { ok });
    json(res, ok ? 200 : 503, {
      ok,
      version: VERSION,
      mode: config.mode,
      uptimeSeconds: Math.round((Date.now() - started) / 1000),
      diskFreeGB: +(free / 1024 ** 3).toFixed(1),
      exports: exportsReady(),
      jobs: jobs.list({ limit: 100 }).filter((j) => j.status === 'queued' || j.status === 'running').length,
      git: g,
    });
  });

  router.get('/api/git', 'git:read', ({ res }) => json(res, 200, git.status()));
  router.post('/api/git/sync', 'git:sync', async ({ res }) => json(res, 200, { pulled: await git.sync(), git: git.status() }));

  // A push to the remote (e.g. a merged pull request) asks the studio to pull now. GitHub signs the body with the
  // shared secret (X-Hub-Signature-256); other hosts can send X-Pathshala-Token with the secret itself.
  router.post('/api/hooks/git', null, async ({ req, res }) => {
    const secret = config.webhookSecret;
    if (!secret) return json(res, 404, { error: 'Not found' });
    const body = await readBody(req, 1024 * 1024);
    const sig = String(req.headers['x-hub-signature-256'] || '');
    const expected = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
    const token = String(req.headers['x-pathshala-token'] || '');
    const good = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    if (!(sig && good(sig, expected)) && !(token && good(token, secret))) return json(res, 401, { error: 'Bad signature' });
    git.sync().then((pulled) => config.onPulled?.(pulled));
    json(res, 202, { ok: true });
  });
}
