// Uploads: the browser converts the files to one GLB and sends each file as a raw body; the commit makes the figure.
import { assetSummary } from '../../lib/assets.mjs';
import { commitUpload, receiveFile } from '../../lib/uploads.mjs';
import { json, readBody, readJson } from '../http.mjs';

export function register(router, { git, exportsReady }) {
  const toolsMissing = (res) => {
    if (exportsReady()) return false;
    json(res, 503, { error: 'Uploads need the dev tools on this server: run npm ci' });
    return true;
  };
  router.post('/api/uploads/:uploadId/commit', 'uploads:create', async ({ req, res, params, user }) => {
    if (toolsMissing(res)) return;
    const r = await commitUpload(params.uploadId, await readJson(req), { by: user.username, maintainers: [] });
    git.commit({ paths: [r.dir, '.github/CODEOWNERS'], message: `feat(${r.id}): model uploaded in the studio (${r.glb.triangles} triangles)`, user });
    json(res, 201, { ...r, asset: await assetSummary(r.id) });
  });
  router.put('/api/uploads/:uploadId/:name', 'uploads:create', async ({ req, res, params }) => {
    if (toolsMissing(res)) return;
    json(res, 200, await receiveFile(params.uploadId, params.name, await readBody(req, 60 * 1024 * 1024)));
  });
}
