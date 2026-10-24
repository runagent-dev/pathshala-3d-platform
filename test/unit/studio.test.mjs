// The studio server in production mode (everyone logs in), on a free port, with temporary figures and data.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { copyFigure, tempDir } from '../helpers.mjs';

const assets = tempDir({ inRepo: true });
const data = tempDir();
process.env.PATHSHALA_ASSETS_DIR = assets;
process.env.PATHSHALA_DATA_DIR = data;
for (const id of ['screw-gauge', 'si-prefixes']) copyFigure(id, assets);
fs.writeFileSync(path.join(assets, 'si-prefixes', 'status.json'), JSON.stringify({ status: 'in-progress', history: [] }));
const { createStudio } = await import('../../scripts/studio/server.mjs');

const SECRET = 'webhook-secret-for-tests';
const config = {
  mode: 'production',
  port: 0,
  hosts: ['127.0.0.1'],
  login: 'all',
  gitCommits: false,
  gitSync: false,
  syncSeconds: 60,
  trustProxy: [],
  webhookSecret: SECRET,
  legacyAuthFile: path.join(data, 'none.json'),
  jobsCommand: () => ['-e', 'console.log(JSON.stringify({ type: "error", message: "the exporter is not run in tests" }))'], // never the real exporter
};
let studio;
let base;
let adminPassword;

/** fetch with a cookie jar per "person". */
function person(cookie = '') {
  const jar = { cookie };
  /**
   * @param {string} p
   * @param {{ method?: string, body?: any, headers?: Record<string, string>, origin?: boolean }} [options]
   */
  const call = async (p, { method = 'GET', body, headers = {}, origin = true } = {}) => {
    /** @type {Record<string, string>} */
    const h = { ...headers };
    if (jar.cookie) h.cookie = jar.cookie;
    if (origin && method !== 'GET') h.origin = base;
    if (body !== undefined && typeof body !== 'string') h['content-type'] = 'application/json';
    const res = await fetch(base + p, {
      method,
      headers: h,
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      redirect: 'manual',
    });
    const set = res.headers.get('set-cookie');
    if (set) jar.cookie = set.split(';')[0];
    const type = res.headers.get('content-type') || '';
    return { status: res.status, headers: res.headers, body: type.includes('json') ? await res.json() : await res.text() };
  };
  call.login = async (username, password) => call('/api/login', { method: 'POST', body: { username, password } });
  return call;
}

before(async () => {
  studio = createStudio(config, { log: () => {} });
  const [url] = await studio.listen();
  base = url.replace(/\/$/, '');
  adminPassword = studio.created.find((c) => c.role === 'admin')?.password;
  studio.accounts.addUser({ username: 'rahim', name: 'Rahim', role: 'reviewer', password: 'reviewer-password' });
  studio.accounts.addUser({ username: 'karim', name: 'Karim', role: 'contributor', password: 'contributor-password' });
});
after(() => studio.close());

describe('studio: logging in', () => {
  it('a new production studio creates an admin with a generated password', () => {
    assert.match(adminPassword, /^[a-z2-9]{4}(-[a-z2-9]{4}){3}$/);
  });
  it('without a login: the API says 401, pages go to /login/, figure files are public', async () => {
    const anon = person();
    assert.equal((await anon('/api/assets')).status, 401);
    const page = await anon('/dashboard/', { headers: { accept: 'text/html' } });
    assert.equal(page.status, 302);
    assert.match(page.headers.get('location'), /^\/login\/\?next=/);
    const fig = await anon('/assets/screw-gauge/index.html');
    assert.equal(fig.status, 200);
    assert.equal(fig.headers.get('access-control-allow-origin'), '*');
    assert.ok(!String(fig.body).includes('EventSource'), 'no live-reload snippet for the public');
    assert.equal((await anon('/shared/lib/stage.js')).status, 200);
    assert.equal((await anon('/login/')).status, 200);
  });
  it('dev-only figure files are not public', async () => {
    const anon = person();
    for (const p of [
      '/assets/screw-gauge/NOTES.md',
      '/assets/screw-gauge/status.json',
      '/assets/screw-gauge/reviews/x.json',
      '/assets/screw-gauge/tests/reading.spec.mjs',
    ]) {
      assert.equal((await anon(p)).status, 401, p);
    }
  });
  it('logs in with a cookie and out again', async () => {
    const admin = person();
    assert.equal((await admin.login('admin', 'wrong')).status, 401);
    assert.equal((await admin.login('admin', adminPassword)).status, 200);
    assert.equal((await admin('/api/me')).body.role, 'admin');
    await admin('/api/logout', { method: 'POST' });
    assert.equal((await admin('/api/me')).status, 401);
  });
  it('accepts HTTP Basic for scripts', async () => {
    const basic = person();
    const auth = { authorization: `Basic ${Buffer.from('karim:contributor-password').toString('base64')}` };
    assert.equal((await basic('/api/me', { headers: auth })).body.role, 'contributor');
  });
  it('invites: the link sets a password once', async () => {
    const { invite } = studio.accounts.addUser({ username: 'nadia', role: 'reviewer' });
    const p = person();
    assert.equal((await p('/api/invite', { method: 'POST', body: { username: 'nadia', token: invite, password: 'short' } })).status, 400);
    assert.equal(
      (await p('/api/invite', { method: 'POST', body: { username: 'nadia', token: invite, password: 'a-long-new-password' } })).status,
      200,
    );
    assert.equal((await p('/api/me')).body.user.username, 'nadia');
    assert.equal(
      (await person()('/api/invite', { method: 'POST', body: { username: 'nadia', token: invite, password: 'another-password' } })).status,
      400,
    );
  });
  it('refuses a change with the cookie that does not come from the studio page (CSRF)', async () => {
    const admin = person();
    await admin.login('admin', adminPassword);
    const forged = await admin('/api/assets/screw-gauge', { method: 'PATCH', body: { description: 'x' }, origin: false });
    assert.equal(forged.status, 403);
    const evil = await admin('/api/assets/screw-gauge', {
      method: 'PATCH',
      body: { description: 'x' },
      origin: false,
      headers: { origin: 'http://evil.example' },
    });
    assert.equal(evil.status, 403);
    assert.equal((await admin('/api/assets/screw-gauge', { method: 'PATCH', body: { description: 'Edited in a test.' } })).status, 200);
  });
});

describe('studio: what each role may do', () => {
  const reviewer = person();
  const contributor = person();
  const admin = person();
  before(async () => {
    await reviewer.login('rahim', 'reviewer-password');
    await contributor.login('karim', 'contributor-password');
    await admin.login('admin', adminPassword);
    await admin('/api/assets/screw-gauge/status', { method: 'PUT', body: { status: 'review' } });
  });

  it('reviewers see only figures in review, and write reviews under their own name', async () => {
    const list = (await reviewer('/api/assets')).body.assets.map((a) => a.id);
    assert.deepEqual(list, ['screw-gauge']);
    assert.equal((await reviewer('/api/assets/si-prefixes')).status, 404);
    const r = await reviewer('/api/assets/screw-gauge/reviews', { method: 'POST', body: { author: 'Someone else', text: 'ভালো' } });
    assert.equal(r.status, 201);
    assert.equal(r.body.author, 'Rahim');
  });
  it('reviewers cannot change figures, read notes, manage reviews or see exports', async () => {
    assert.equal((await reviewer('/api/assets/screw-gauge', { method: 'PATCH', body: { title: 'x' } })).status, 403);
    assert.equal((await reviewer('/api/assets/screw-gauge/notes')).status, 403);
    assert.equal((await reviewer('/api/assets/screw-gauge/status', { method: 'PUT', body: { status: 'approved' } })).status, 403);
    const [first] = (await reviewer('/api/assets/screw-gauge/reviews')).body.reviews;
    assert.equal((await reviewer(`/api/assets/screw-gauge/reviews/${first.id}`, { method: 'PATCH', body: { status: 'done' } })).status, 403);
    assert.equal((await reviewer('/api/assets/screw-gauge/exports')).status, 403);
    assert.equal((await reviewer('/assets/screw-gauge/NOTES.md')).status, 404);
  });
  it('contributors edit and move figures up to review, but do not approve or release', async () => {
    assert.equal((await contributor('/api/assets/si-prefixes/notes')).status, 200);
    assert.equal((await contributor('/api/assets/si-prefixes/status', { method: 'PUT', body: { status: 'review' } })).status, 200);
    assert.equal((await contributor('/api/assets/si-prefixes/status', { method: 'PUT', body: { status: 'approved' } })).status, 403);
    const release = await contributor('/api/assets/si-prefixes/exports', { method: 'POST', body: { formats: ['zip'], official: true } });
    assert.equal(release.status, 403);
  });
  it('admins approve; a release of uncommitted work is refused with the reason', async () => {
    assert.equal((await admin('/api/assets/si-prefixes/status', { method: 'PUT', body: { status: 'approved' } })).status, 200);
    const release = await admin('/api/assets/si-prefixes/exports', { method: 'POST', body: { formats: ['zip'], official: true } });
    assert.equal(release.status, 409);
  });
  it('the status history records who set it', () => {
    const s = JSON.parse(fs.readFileSync(path.join(assets, 'si-prefixes', 'status.json'), 'utf8'));
    assert.deepEqual(
      s.history.map((h) => [h.status, h.by]),
      [
        ['review', 'karim'],
        ['approved', 'admin'],
      ],
    );
  });
});

describe('studio: protection', () => {
  it('locks out an address after 20 wrong passwords', async () => {
    const p = person();
    for (let i = 0; i < 20; i++) await p.login('karim', 'wrong');
    assert.equal((await p.login('karim', 'contributor-password')).status, 429);
  });
  it('the git webhook needs the secret', async () => {
    const body = JSON.stringify({ ref: 'refs/heads/main' });
    const p = person();
    assert.equal((await p('/api/hooks/git', { method: 'POST', body, origin: false, headers: { 'x-hub-signature-256': 'sha256=00' } })).status, 401);
    const sig = `sha256=${crypto.createHmac('sha256', SECRET).update(body).digest('hex')}`;
    assert.equal((await p('/api/hooks/git', { method: 'POST', body, origin: false, headers: { 'x-hub-signature-256': sig } })).status, 202);
  });
  it('health says ok to anyone, details to makers', async () => {
    const anon = await person()('/api/health');
    assert.deepEqual(Object.keys(anon.body), ['ok']);
  });
});

describe('studio: accounts on disk', () => {
  it('keeps users.json private to the server account (0600) and changes in order', async () => {
    const { createAccounts } = await import('../../scripts/studio/accounts.mjs');
    const dir = tempDir();
    const a = createAccounts({ dir });
    a.addUser({ username: 'zed', role: 'reviewer', password: 'a-long-password' });
    a.setRole('zed', 'contributor');
    assert.equal(a.find('zed').role, 'contributor');
    assert.equal(fs.statSync(path.join(dir, 'users.json')).mode & 0o777, 0o600);
    assert.ok(!fs.readFileSync(path.join(dir, 'users.json'), 'utf8').includes('a-long-password'));
  });
});

describe('studio: proxy addresses', () => {
  it('matches exact addresses and IPv4 ranges', async () => {
    const { addressIn } = await import('../../scripts/studio/auth.mjs');
    assert.ok(addressIn('10.0.1.7', ['10.0.1.0/24']));
    assert.ok(addressIn('::ffff:127.0.0.1', ['127.0.0.1']));
    assert.ok(!addressIn('10.0.2.7', ['10.0.1.0/24']));
    assert.ok(!addressIn('192.168.1.1', ['127.0.0.1', '10.0.0.0/8']));
  });
});
