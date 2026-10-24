#!/usr/bin/env node
// Pathshala 3D dev server: static files, the dashboard API and live reload. No dependencies.
//
//   npm run dev                      → http://127.0.0.1:4800 (+ Tailscale address if this machine has one)
//   npm run dev:public               → every address of this machine, behind a username/password
//   PORT=5000 HOST=0.0.0.0 npm run dev
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  ROOT, ASSETS_DIR, SHARED_DIR, ID_RE, STATUSES,
  listAssets, assetSummary, assetDir, readManifest, writeManifest,
} from './lib/assets.mjs';
import { packageAsset } from './lib/package.mjs';
import { scaffoldAsset } from './lib/scaffold.mjs';
import { AUTH_FILE, loadCredentials, createBasicAuth } from './lib/auth.mjs';
import { readReviews, addReview, updateReview, deleteReview } from './lib/reviews.mjs';

const PORT = Number(process.env.PORT || 4800);
const PUBLIC = process.argv.includes('--public') || process.env.PUBLIC === '1';
const TAILSCALE_RE = /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./;

function defaultHosts() {
  const hosts = ['127.0.0.1'];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      // Tailscale (100.64.0.0/10) is private to the user's devices, so it's safe to expose by default.
      if (a.family === 'IPv4' && TAILSCALE_RE.test(a.address)) hosts.push(a.address);
    }
  }
  return hosts;
}
const HOSTS = process.env.HOST ? process.env.HOST.split(',').map((h) => h.trim()) : PUBLIC ? ['0.0.0.0'] : defaultHosts();

// The API can write files, so anything reachable beyond this machine and Tailscale needs a password.
const isPrivateHost = (h) => h === 'localhost' || h === '::1' || h.startsWith('127.') || TAILSCALE_RE.test(h);
const credentials = PUBLIC || !HOSTS.every(isPrivateHost) ? loadCredentials() : null;
const checkAuth = credentials ? createBasicAuth(credentials) : null;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.hdr': 'application/octet-stream',
  '.ktx2': 'image/ktx2',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.zip': 'application/zip',
};

// ── live reload ────────────────────────────────────────────────────────────────
const sseClients = new Set();
function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) res.write(msg);
}

const META_FILES = new Set(['asset.json', 'NOTES.md', 'thumbnail.png']);
const queued = new Map();
let flushTimer = null;
function queue(key, event, data) {
  queued.set(key, [event, data]);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    for (const [event, data] of queued.values()) broadcast(event, data);
    queued.clear();
  }, 120);
}

function watch(dir, scope) {
  if (!fs.existsSync(dir)) return;
  fs.watch(dir, { recursive: true }, (_type, file) => {
    if (!file) return;
    const rel = file.split(path.sep).join('/');
    if (rel.split('/').some((p) => p.startsWith('.')) || rel.endsWith('~')) return;
    if (scope === 'assets') {
      const [id, ...rest] = rel.split('/');
      if (!ID_RE.test(id)) return;
      const name = rest.join('/');
      if (!name || META_FILES.has(name) || name.startsWith('reviews/')) queue(`meta:${id}`, 'meta', { id }); // never reloads the preview
      else if (!name.startsWith('exports/')) queue(`reload:${id}`, 'reload', { scope: 'asset', id, file: name });
    } else {
      queue(`reload:${scope}`, 'reload', { scope, file: rel });
    }
  });
}
watch(ASSETS_DIR, 'assets');
watch(SHARED_DIR, 'shared');
watch(path.join(ROOT, 'dashboard'), 'dashboard');

// Injected into asset pages opened directly (outside the dashboard) so they reload on save too.
const RELOAD_SNIPPET = `<script>(()=>{if(window.top!==window)return;const es=new EventSource('/__dev/events');
es.addEventListener('reload',e=>{const d=JSON.parse(e.data);if(d.scope==='shared'||location.pathname.startsWith('/assets/'+d.id+'/'))location.reload();});})();</script>`;

// ── helpers ────────────────────────────────────────────────────────────────────
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}
const json = (res, status, data) => send(res, status, JSON.stringify(data), { 'Content-Type': MIME['.json'] });

async function readBody(req, limit = 60 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Object.assign(new Error('Body too large'), { status: 413 });
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

function decodeImage(buf, contentType) {
  if ((contentType || '').startsWith('image/')) return buf;
  const m = /^data:image\/\w+;base64,(.+)$/s.exec(buf.toString('utf8'));
  if (!m) throw Object.assign(new Error('Expected a PNG body or data URL'), { status: 400 });
  return Buffer.from(m[1], 'base64');
}

const EDITABLE_FIELDS = ['title', 'status', 'description', 'subject', 'chapter', 'page', 'topic', 'placement', 'grade', 'tags', 'order', 'version'];

// ── API ────────────────────────────────────────────────────────────────────────
// Reviewers may read assets and read/add reviews; everything else is for the owner.
function reviewerMay(req, resource, id, sub, rest) {
  if (resource === 'me') return true;
  if (resource !== 'assets') return false;
  if (req.method === 'GET' && (!sub || sub === 'reviews')) return true;
  return sub === 'reviews' && req.method === 'POST' && rest.length === 0;
}

async function api(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean).slice(1); // drop "api"
  const [resource, id, sub, ...rest] = parts;
  if (req.role === 'reviewer' && !reviewerMay(req, resource, id, sub, rest)) {
    return json(res, 403, { error: 'Reviewers can look at the figures and add reviews, but not change them.' });
  }
  if (resource === 'me') return json(res, 200, { role: req.role });
  if (resource !== 'assets') return json(res, 404, { error: 'Not found' });

  if (!id) {
    if (req.method === 'GET') return json(res, 200, { assets: await listAssets(), statuses: STATUSES });
    if (req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
      const r = await scaffoldAsset(body);
      return json(res, 201, await assetSummary(r.id));
    }
  }
  if (!ID_RE.test(id) || !fs.existsSync(path.join(ASSETS_DIR, id, 'asset.json'))) {
    return json(res, 404, { error: `No asset "${id}"` });
  }
  const dir = assetDir(id);

  if (!sub) {
    if (req.method === 'GET') {
      const readme = path.join(dir, 'README.md');
      return json(res, 200, {
        ...(await assetSummary(id)),
        readme: fs.existsSync(readme) ? await fsp.readFile(readme, 'utf8') : '',
      });
    }
    if (req.method === 'PATCH') {
      const patch = JSON.parse((await readBody(req)).toString('utf8') || '{}');
      const manifest = await readManifest(id);
      for (const k of EDITABLE_FIELDS) if (k in patch) manifest[k] = patch[k];
      if (manifest.status && !STATUSES.includes(manifest.status)) return json(res, 400, { error: 'Bad status' });
      manifest.updated = new Date().toISOString().slice(0, 10);
      await writeManifest(id, manifest);
      return json(res, 200, await assetSummary(id));
    }
  }

  if (sub === 'reviews') {
    const [rid] = rest;
    if (!rid && req.method === 'GET') return json(res, 200, { reviews: await readReviews(id) });
    if (!rid && req.method === 'POST') {
      const body = JSON.parse((await readBody(req, 8 * 1024 * 1024)).toString('utf8') || '{}');
      return json(res, 201, await addReview(id, body));
    }
    if (rid && req.method === 'PATCH') {
      const body = JSON.parse((await readBody(req, 64 * 1024)).toString('utf8') || '{}');
      return json(res, 200, await updateReview(id, rid, body));
    }
    if (rid && req.method === 'DELETE') return json(res, 200, await deleteReview(id, rid));
  }

  if (sub === 'notes') {
    const file = path.join(dir, 'NOTES.md');
    if (req.method === 'GET') return send(res, 200, fs.existsSync(file) ? await fsp.readFile(file) : '', { 'Content-Type': MIME['.md'] });
    if (req.method === 'PUT') {
      await fsp.writeFile(file, await readBody(req, 2 * 1024 * 1024));
      return json(res, 200, { ok: true, savedAt: Date.now() });
    }
  }

  if (sub === 'thumbnail' && req.method === 'PUT') {
    const png = decodeImage(await readBody(req), req.headers['content-type']);
    await fsp.writeFile(path.join(dir, 'thumbnail.png'), png);
    return json(res, 200, { ok: true, bytes: png.length });
  }

  if (sub === 'exports' && req.method === 'PUT') {
    const name = rest.join('/');
    if (!/^[\w.-]+\.(glb|gltf|png|jpg|json)$/.test(name)) return json(res, 400, { error: 'Bad file name' });
    await fsp.mkdir(path.join(dir, 'exports'), { recursive: true });
    const buf = await readBody(req);
    await fsp.writeFile(path.join(dir, 'exports', name), buf);
    return json(res, 200, { ok: true, url: `/assets/${id}/exports/${name}`, bytes: buf.length });
  }

  if (sub === 'package' && req.method === 'POST') {
    return json(res, 200, await packageAsset(id));
  }

  return json(res, 405, { error: 'Method not allowed' });
}

// ── static ─────────────────────────────────────────────────────────────────────
async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') return send(res, 302, '', { Location: '/dashboard/' });
  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) return send(res, 403, 'Forbidden');
  if (path.relative(ROOT, file).split(path.sep).some((p) => p.startsWith('.') || p === 'node_modules' || p === 'scripts')) {
    return send(res, 404, 'Not found');
  }
  if (req.role === 'reviewer' && path.basename(file) === 'NOTES.md') return send(res, 404, 'Not found'); // the owner's own notes

  let target = file;
  let stat = await fsp.stat(target).catch(() => null);
  if (stat?.isDirectory()) {
    if (!pathname.endsWith('/')) return send(res, 301, '', { Location: pathname + '/' + url.search });
    target = path.join(target, 'index.html');
    stat = await fsp.stat(target).catch(() => null);
  }
  if (!stat?.isFile()) return send(res, 404, 'Not found');

  const ext = path.extname(target).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  if (ext === '.html' && (pathname.startsWith('/assets/') || pathname.startsWith('/shared/viewer/'))) {
    const html = (await fsp.readFile(target, 'utf8')).replace(/<\/body>/i, `${RELOAD_SNIPPET}</body>`);
    return send(res, 200, html, { 'Content-Type': type });
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
  fs.createReadStream(target).pipe(res);
}

async function handler(req, res) {
  req.role = checkAuth ? checkAuth(req, res) : 'owner';
  if (!req.role) return;
  const url = new URL(req.url, 'http://local');
  try {
    if (url.pathname === '/__dev/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write('retry: 1000\n\n');
      sseClients.add(res);
      const ping = setInterval(() => res.write(': ping\n\n'), 25000);
      req.on('close', () => {
        clearInterval(ping);
        sseClients.delete(res);
      });
      return;
    }
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    return await serveStatic(req, res, url);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) json(res, err.status || 500, { error: String(err.message || err) });
    else res.end();
  }
}

// For 0.0.0.0, list the addresses people actually use: public ones, Tailscale, loopback (not Docker bridges).
function displayAddresses(host) {
  if (host !== '0.0.0.0') return [host];
  const lan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
  const all = Object.values(os.networkInterfaces()).flat().filter((a) => a?.family === 'IPv4' && !lan.test(a.address));
  return all.map((a) => a.address).sort((a, b) => a.startsWith('127.') - b.startsWith('127.'));
}

for (const host of HOSTS) {
  http
    .createServer(handler)
    .listen(PORT, host, () => {
      for (const addr of displayAddresses(host)) console.log(`  Pathshala 3D studio → http://${addr}:${PORT}/`);
    })
    .on('error', (err) => console.error(`  Could not listen on ${host}:${PORT}: ${err.message}`));
}
if (credentials) {
  const where = { env: 'STUDIO_USER / STUDIO_PASS', file: path.relative(ROOT, AUTH_FILE), new: `${path.relative(ROOT, AUTH_FILE)} (new)` };
  console.log(`  Login: ${credentials.user} / ${credentials.pass}   [${where[credentials.source]}; not needed from this machine]`);
  if (credentials.reviewer) console.log(`  Reviewer login: ${credentials.reviewer.user} / ${credentials.reviewer.pass}   (can look and add reviews only)`);
}
