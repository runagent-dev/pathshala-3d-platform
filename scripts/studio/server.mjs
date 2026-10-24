// The studio server: accounts, the API, static files, live updates, export jobs and the git writer, put together.
// Used by scripts/dev.mjs (development) and scripts/studio.mjs (production). Node built-ins only.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { freeBytes } from '../lib/fsutil.mjs';
import { createGitWriter } from '../lib/gitwriter.mjs';
import { createJobs } from '../lib/jobs.mjs';
import { ASSETS_DIR, EXPORTS_DIR, ID_RE, ROOT, SHARED_DIR } from '../lib/paths.mjs';
import { MIN_FREE_BYTES } from '../lib/release.mjs';
import { createAccounts } from './accounts.mjs';
import { createAuth } from './auth.mjs';
import { json, send } from './http.mjs';
import { createLive } from './live.mjs';
import { createRouter } from './router.mjs';
import { createStatic } from './static.mjs';
import * as exportsRoutes from './routes/exports.mjs';
import * as figureRoutes from './routes/figures.mjs';
import * as reviewRoutes from './routes/reviews.mjs';
import * as systemRoutes from './routes/system.mjs';
import * as uploadRoutes from './routes/uploads.mjs';

/** After a pull: new server code means a restart (production: reinstall tools if the lockfile changed, then exit). */
function onPulled(config, files) {
  if (!files.length) return;
  console.log(`  git: pulled ${files.length} changed file(s)`);
  if (!files.some((f) => f.startsWith('scripts/') || f === 'package.json' || f === 'package-lock.json')) return;
  if (config.mode !== 'production') return console.log('  git: the studio code changed; restart the studio to use it');
  if (files.includes('package-lock.json')) execFileSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: ROOT, stdio: 'inherit' });
  console.log('  git: the studio code changed; exiting so the service manager restarts it');
  setTimeout(() => process.exit(0), 500);
}

export function createStudio(config, { log = console.log } = {}) {
  const accounts = createAccounts();
  const created = config.login === 'none' ? [] : accounts.bootstrap({ legacyFile: config.legacyAuthFile });
  const auth = createAuth({ accounts, login: config.login, trustProxy: config.trustProxy });
  const live = createLive({ assetsDir: ASSETS_DIR, sharedDir: SHARED_DIR, dashboardDir: path.join(ROOT, 'dashboard') });
  const git = createGitWriter({ enabled: config.gitCommits, onChange: (s) => live.broadcast('git', s), log: (m) => console.error(`  git: ${m}`) });
  const exportsReady = () => fs.existsSync(path.join(ROOT, 'node_modules', '@playwright', 'test'));
  const jobs = createJobs({
    onChange: (job) => live.broadcast('job', job),
    figureExists: (id) => ID_RE.test(id) && fs.existsSync(path.join(ASSETS_DIR, id, 'asset.json')),
    freeBytes: () => freeBytes(ROOT),
    minFree: MIN_FREE_BYTES,
    command: config.jobsCommand, // tests replace the exporter
  });
  config.onPulled = (files) => onPulled(config, files);
  const ctx = { config, accounts, git, jobs, live, exportsReady, rel: (p) => path.relative(ROOT, p) };
  const router = createRouter();
  for (const m of [systemRoutes, figureRoutes, reviewRoutes, exportsRoutes, uploadRoutes]) m.register(router, ctx);
  const statics = createStatic({ root: ROOT, exportsDir: EXPORTS_DIR });

  async function handler(req, res) {
    const url = new URL(req.url, 'http://local');
    try {
      const user = auth.authenticate(req);
      if (url.pathname.startsWith('/api/')) {
        if (await auth.routes(req, res, url)) return;
        if (!auth.sameOrigin(req)) return json(res, 403, { error: 'Changes must come from the studio page itself' });
        if (await router.handle(req, res, url, user)) return;
        return json(res, user ? 404 : 401, { error: user ? 'Not found' : 'Please log in' });
      }
      if (url.pathname === '/__dev/events') return user ? live.handle(req, res) : json(res, 401, { error: 'Please log in' });
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
      if ((await statics.serve(res, url, user)) !== false) return;
      // A page that needs a login: browsers go to the login page, scripts get 401.
      if (String(req.headers.accept || '').includes('text/html'))
        return send(res, 302, '', { Location: `/login/?next=${encodeURIComponent(url.pathname + url.search)}` });
      send(res, 401, 'Please log in', { 'WWW-Authenticate': 'Basic realm="Pathshala 3D Studio", charset="UTF-8"' });
    } catch (err) {
      if (!err.status || err.status >= 500) console.error(err); // 4xx are the client's mistake, answered below
      if (!res.headersSent) json(res, err.status || 500, { error: String(err.message || err) });
      else res.end();
    }
  }

  const servers = config.hosts.map(() => http.createServer(handler));
  return {
    accounts,
    git,
    jobs,
    created,
    /** Starts listening; resolves to the URLs. */
    async listen() {
      const urls = [];
      for (const [i, host] of config.hosts.entries()) {
        await new Promise((resolve) => {
          servers[i].once('error', (err) => {
            console.error(`  Could not listen on ${host}:${config.port}: ${err.message}`);
            resolve();
          });
          servers[i].listen(config.port, host, () => {
            const { port } = /** @type {import('node:net').AddressInfo} */ (servers[i].address());
            for (const addr of displayAddresses(host)) urls.push(`http://${addr.includes(':') ? `[${addr}]` : addr}:${port}/`);
            resolve();
          });
        });
      }
      if (config.gitSync) git.start(config.syncSeconds * 1000);
      return urls;
    },
    async close() {
      jobs.stop();
      live.close();
      await git.stop();
      await Promise.all(servers.map((s) => new Promise((r) => (s.listening ? s.close(() => r()) : r()))));
      for (const s of servers) s.closeAllConnections?.();
    },
    log,
  };
}

// For 0.0.0.0, list the addresses people actually use: public ones, Tailscale, loopback (not Docker bridges).
function displayAddresses(host) {
  if (host !== '0.0.0.0') return [host];
  const lan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((a) => a?.family === 'IPv4' && !lan.test(a.address))
    .map((a) => a.address)
    .sort((a, b) => Number(a.startsWith('127.')) - Number(b.startsWith('127.')));
}

/** Starts a studio and prints how to reach it (and any login it created). */
export async function startStudio(config) {
  const studio = createStudio(config);
  for (const url of await studio.listen()) console.log(`  Pathshala 3D studio → ${url}`);
  const what = { none: 'no login (private addresses only)', remote: 'login for everyone but this machine', all: 'login for everyone' };
  console.log(
    `  ${config.mode} mode · ${what[config.login]} · studio edits ${config.gitCommits ? `committed to git${config.gitSync ? ' and synced' : ''}` : 'not committed'}`,
  );
  for (const c of studio.created) {
    console.log(
      c.password
        ? `  New admin login: ${c.username} / ${c.password}   (shown once; add people with npm run user)`
        : `  Login ${c.username} (${c.role}) moved from ${c.from} to data/users.json`,
    );
  }
  const stop = async () => {
    await studio.close();
    process.exit(0);
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
  return studio;
}
