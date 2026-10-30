// An in-memory library server for tests: the endpoints of the registry API the sync uses (registry-api.md), with the behaviour
// the real server has that matters here: a withdrawn key is gone for good (410 on upload and register), search lists only
// available items, tags are replaced when the same key is registered again. `fetch` is what the sync gets instead of the network.
import crypto from 'node:crypto';

const c1 = (sha) => `c1:${sha.slice(0, 25).replace(/[^a-z2-7]/g, 'a')}a`;

/** @param {{ token?: string }} [o] token: the library needs it for every request, reading too (PUBLIC_READ=false) */
export function fakeLibrary({ token } = {}) {
  const items = new Map(); // key → record
  const bytes = new Map(); // upload ticket → { key }
  const books = new Map(); // key → [bookId]
  const calls = [];
  const auths = []; // the Authorization header of every request, in order
  let tickets = 0;
  /** @type {((call: { method: string, path: string }) => void) | null} */
  let hook = null;

  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  const err = (status, code, message) => json(status, { error: { code, message } });

  async function fetch(url, init = {}) {
    const u = new URL(url);
    const method = init.method || 'GET';
    const path = u.pathname;
    calls.push({ method, path });
    hook?.({ method, path });
    const auth = new Headers(init.headers).get('authorization');
    auths.push(auth);
    if (token && path.startsWith('/v1/') && !path.startsWith('/v1/upload/') && auth !== `Bearer ${token}`)
      return err(401, 'unauthorized', 'a token is needed');
    const body = init.body && typeof init.body === 'string' ? JSON.parse(init.body) : null;

    if (method === 'GET' && path === '/v1/search') {
      const tags = u.searchParams.getAll('tag');
      const all = [...items.values()].filter((r) => r.status === 'available' && tags.every((t) => r.tags.includes(t)));
      const offset = Number(u.searchParams.get('cursor') || 0);
      const limit = Number(u.searchParams.get('limit') || 30);
      const page = all.slice(offset, offset + limit);
      return json(200, all.length > offset + limit ? { items: page, next: String(offset + limit) } : { items: page });
    }
    if (method === 'POST' && path === '/v1/assets/check') {
      const have = new Set([...items.values()].filter((r) => r.status === 'available').map((r) => r.key));
      return json(200, { present: body.keys.filter((k) => have.has(k)), missing: body.keys.filter((k) => !have.has(k)) });
    }
    if (method === 'POST' && path === '/v1/uploads') {
      const existing = items.get(body.key);
      if (existing?.status === 'withdrawn') return err(410, 'gone', 'this asset was withdrawn');
      if (existing?.status === 'available') return json(200, { exists: true, asset: existing });
      const ticket = `t${++tickets}`;
      bytes.set(ticket, body);
      items.set(body.key, { ...body, tags: [], status: 'pending', createdAt: new Date().toISOString() });
      return json(200, {
        upload: { url: `http://library.test/v1/upload/${ticket}`, method: 'PUT', headers: {}, expiresAt: '2099-01-01T00:00:00Z' },
        store: 'library',
      });
    }
    if (method === 'PUT' && path.startsWith('/v1/upload/')) return new Response(null, { status: 200 });
    if (method === 'POST' && path === '/v1/assets') {
      const row = items.get(body.key);
      if (row?.status === 'withdrawn') return err(410, 'gone', 'this asset was withdrawn');
      if (!row) return err(409, 'conflict', 'nothing was uploaded for this key');
      Object.assign(row, { ...body, status: 'available', createdAt: row.createdAt });
      return json(200, row);
    }
    const asset = /^\/v1\/assets\/([^/]+)$/.exec(path);
    if (method === 'GET' && asset)
      return items.has(decodeURIComponent(asset[1])) ? json(200, items.get(decodeURIComponent(asset[1]))) : err(404, 'not_found', 'no such asset');
    const used = /^\/v1\/assets\/([^/]+)\/books$/.exec(path);
    if (method === 'GET' && used)
      return json(200, { items: (books.get(decodeURIComponent(used[1])) || []).map((bookId) => ({ bookId, updatedAt: '2026-01-01T00:00:00Z' })) });
    const withdraw = /^\/v1\/assets\/([^/]+)\/withdraw$/.exec(path);
    if (method === 'POST' && withdraw) {
      const row = items.get(decodeURIComponent(withdraw[1]));
      if (!row) return err(404, 'not_found', 'no such asset');
      row.status = 'withdrawn';
      return json(200, { key: row.key, status: 'withdrawn' });
    }
    if (method === 'GET' && path === '/v1/stores') return json(200, { items: [] });
    return err(404, 'not_found', `${method} ${path}`);
  }

  return {
    fetch,
    items,
    calls,
    auths,
    /** Mutating requests so far (what a no-op run must not make). */
    writes: () => calls.filter((c) => c.method !== 'GET' && !(c.method === 'POST' && c.path === '/v1/assets/check')),
    clearCalls: () => calls.splice(0),
    onCall: (fn) => {
      hook = fn;
    },
    /** Puts a record in the library as if an earlier sync (or a person) had. */
    seed(record) {
      const sha = crypto.createHash('sha256').update(JSON.stringify(record)).digest('hex');
      const key = record.key || c1(sha);
      items.set(key, { key, sha256: sha, size: 1, type: 'x', status: 'available', createdAt: new Date().toISOString(), ...record });
      return key;
    },
    useBy: (key, bookId) => books.set(key, [...(books.get(key) || []), bookId]),
    current: (figure, kind) =>
      [...items.values()].filter(
        (r) => r.status === 'available' && r.tags.includes(`figure:${figure}`) && r.tags.includes(`kind:${kind}`) && r.tags.includes('state:current'),
      ),
  };
}
