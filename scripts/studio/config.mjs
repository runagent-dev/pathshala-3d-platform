// How the studio runs, from the command line and the environment.
//
//   mode dev         `npm run dev`: this computer (and its Tailscale address); nobody logs in
//                    `npm run dev:public`: every address; everyone but this machine logs in; studio edits are committed
//   mode production  `npm run studio`: behind a reverse proxy (TLS), 127.0.0.1 only; everyone logs in; edits are
//                    committed and the checkout is synced with its remote
//
// Environment: PORT, HOST (comma-separated), PUBLIC=1, TRUST_PROXY (addresses of the proxy, comma-separated),
// PATHSHALA_GIT=0|1 (commit studio edits), PATHSHALA_GIT_SYNC=0 (no pull/push), PATHSHALA_GIT_SYNC_SECONDS,
// PATHSHALA_WEBHOOK_SECRET (enables POST /api/hooks/git), PATHSHALA_DATA_DIR, PATHSHALA_EXPORTS_DIR.
import os from 'node:os';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';

const TAILSCALE_RE = /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./;
export const isPrivateHost = (h) => h === 'localhost' || h === '::1' || h.startsWith('127.') || TAILSCALE_RE.test(h);

function defaultHosts() {
  const hosts = ['127.0.0.1'];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === 'IPv4' && TAILSCALE_RE.test(a.address)) hosts.push(a.address); // private to the owner's devices
  }
  return hosts;
}

const list = (s) =>
  String(s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

/** @param {{ argv?: string[], env?: Record<string, string | undefined>, mode?: 'dev' | 'production' }} [options] */
export function loadConfig({ argv = process.argv.slice(2), env = process.env, mode = 'dev' } = {}) {
  const isPublic = argv.includes('--public') || env.PUBLIC === '1';
  const hosts = env.HOST ? list(env.HOST) : mode === 'production' ? ['127.0.0.1'] : isPublic ? ['0.0.0.0'] : defaultHosts();
  const login = mode === 'production' ? 'all' : isPublic || !hosts.every(isPrivateHost) ? 'remote' : 'none';
  const gitCommits = env.PATHSHALA_GIT ? env.PATHSHALA_GIT === '1' : mode === 'production' || isPublic;
  return {
    mode,
    port: Number(env.PORT ?? 4800),
    hosts,
    isPublic,
    login,
    gitCommits,
    gitSync: gitCommits && env.PATHSHALA_GIT_SYNC !== '0',
    syncSeconds: Number(env.PATHSHALA_GIT_SYNC_SECONDS || 60),
    trustProxy: list(env.TRUST_PROXY ?? (mode === 'production' ? '127.0.0.1,::1' : '')),
    webhookSecret: env.PATHSHALA_WEBHOOK_SECRET || null,
    legacyAuthFile: path.join(ROOT, '.studio-auth.json'), // logins of the old studio, moved into data/users.json once
  };
}
