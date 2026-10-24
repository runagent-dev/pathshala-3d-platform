// Exports and the job queue: what has been exported, queueing a preview or a release, following and cancelling jobs.
import { readManifest } from '../../lib/assets.mjs';
import { listExports } from '../../lib/exports.mjs';
import { releaseProblem } from '../../lib/release.mjs';
import { httpError, json, readJson } from '../http.mjs';
import { allowed } from '../policy.mjs';
import { figure } from './figures.mjs';

export function register(router, { jobs, exportsReady }) {
  router.get('/api/assets/:id/exports', 'exports:read', async ({ res, params, user }) => {
    await figure(params.id, user);
    const manifest = await readManifest(params.id);
    json(res, 200, { ready: exportsReady(), ...listExports(params.id, manifest.book), jobs: jobs.list({ figure: params.id, limit: 5 }) });
  });
  router.post('/api/assets/:id/exports', 'exports:preview', async ({ req, res, params, user }) => {
    await figure(params.id, user);
    if (!exportsReady())
      return json(res, 503, { error: 'Exports need the dev tools on this server: run npm ci (and npx playwright install chromium)' });
    const { formats, official = false } = await readJson(req, 4096);
    if (official) {
      if (!allowed(user.role, 'exports:release')) throw httpError(403, 'Only an admin can release a figure');
      const problem = await releaseProblem(params.id);
      if (problem) return json(res, 409, { error: problem });
    }
    json(res, 202, jobs.add({ figure: params.id, formats, official, by: user.username }));
  });
  router.get('/api/jobs', 'jobs:read', ({ res }) => json(res, 200, { jobs: jobs.list({ limit: 50 }) }));
  router.get('/api/jobs/:jid', 'jobs:read', ({ res, params }) => {
    const job = jobs.get(params.jid);
    if (!job) throw httpError(404, 'No such job');
    json(res, 200, job);
  });
  router.delete('/api/jobs/:jid', 'jobs:cancel', ({ res, params }) => json(res, 200, jobs.cancel(params.jid)));
}
