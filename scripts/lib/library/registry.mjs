// The library server, as the sync sees it: a handful of calls from the registry API (@chalk-format spec 1.2, registry-api.md).
// Nothing else talks to the network. The base URL and the token come from the caller; this file never has a default address,
// so a run that forgot --library cannot reach any server by accident.
import { assetKeyAndSha256 } from '@chalk-format/core';
import { ORIGIN_TAG } from './manifest.mjs';

export class LibraryError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'LibraryError';
    this.status = status;
    this.code = code;
  }
}

/** @param {string} base  the library's address, e.g. http://127.0.0.1:4900  @param {{ token?: string, fetch?: typeof fetch }} [o] */
export function createLibrary(base, { token, fetch: f = globalThis.fetch.bind(globalThis) } = {}) {
  if (!base) throw new Error('no library address (--library)');
  // a token a header cannot carry (a line break, a space) would make fetch throw an error quoting the whole header: refuse it first
  if (token !== undefined && !/^[\x21-\x7e]+$/.test(token))
    throw new Error('the library token is not valid: it has spaces, line breaks or other characters a header cannot carry');
  const root = base.endsWith('/') ? base : `${base}/`;

  /** @param {string} path @param {{ method?: string, body?: object }} [init] @returns {Promise<any>} */
  async function call(path, { method = 'GET', body } = {}) {
    const headers = { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const res = await f(root + path, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    // an error message from the server is shown in logs: the token is never part of it, even if the server echoes it
    const clean = (text) => (token ? String(text).split(token).join('***') : String(text));
    if (!res.ok) {
      const said = clean(data?.error?.message || `HTTP ${res.status} for ${method} ${path}`);
      // a library with PUBLIC_READ=false wants a token for reading too: say which settings give one
      const hint =
        res.status === 401 && !token
          ? ' (the library needs a token, even to read: set LIBRARY_READ_TOKEN to a key with the reader role, or LIBRARY_TOKEN)'
          : res.status === 401
            ? ' (the library did not accept the token: is it revoked or mistyped?)'
            : res.status === 403
              ? ' (the token is not allowed to do this: reading needs the reader role, publishing author, withdrawing admin)'
              : '';
      throw new LibraryError(res.status, data?.error?.code || 'failed', `${said}${hint}`);
    }
    return data;
  }

  return {
    base: root,

    /** Every available item this tool has published: the whole state of the library, in a few pages. */
    async snapshot() {
      const items = [];
      let cursor;
      do {
        const q = new URLSearchParams({ tag: ORIGIN_TAG, limit: '100' });
        if (cursor) q.set('cursor', cursor);
        const page = await call(`v1/search?${q}`);
        items.push(...page.items);
        cursor = page.next;
      } while (cursor);
      return items;
    },

    /** Which of these keys are in the library (and available). */
    async check(keys) {
      const present = new Set();
      for (let i = 0; i < keys.length; i += 1000) {
        const r = await call('v1/assets/check', { method: 'POST', body: { keys: keys.slice(i, i + 1000) } });
        for (const k of r.present) present.add(k);
      }
      return present;
    },

    /**
     * Puts bytes in the library and registers them with their descriptive fields (title, tags, subject, license). The upload is
     * skipped when the library already has the bytes; the descriptive fields are always written, so tags stay current.
     * @returns {Promise<{ key: string, sha256: string, size: number, record: object, uploaded: boolean }>}
     */
    async publish(bytes, { type, filename, title, tags, subject, license, meta, poster }) {
      const { key, sha256 } = await assetKeyAndSha256(bytes);
      const size = bytes.byteLength;
      const u = await call('v1/uploads', { method: 'POST', body: { key, sha256, type, size, ...(filename ? { filename } : {}) } });
      let uploaded = false;
      if (!u.exists) {
        const put = await f(u.upload.url, { method: u.upload.method || 'PUT', headers: u.upload.headers || {}, body: bytes });
        if (!put.ok) throw new LibraryError(put.status, 'upload_failed', `upload of ${filename || key} failed: HTTP ${put.status}`);
        uploaded = true;
      }
      const record = await call('v1/assets', {
        method: 'POST',
        body: {
          key,
          sha256,
          type,
          size,
          ...(filename ? { filename } : {}),
          ...(title ? { title } : {}),
          ...(tags ? { tags } : {}),
          ...(subject ? { subject } : {}),
          ...(license ? { license } : {}),
          ...(meta ? { meta } : {}),
          ...(poster ? { poster } : {}),
        },
      });
      return { key, sha256, size, record, uploaded };
    },

    /** Changes the tags (and title) of an item already in the library; the bytes are not touched. */
    retag(record, tags, title) {
      return call('v1/assets', {
        method: 'POST',
        body: {
          key: record.key,
          sha256: record.sha256,
          type: record.type,
          size: record.size,
          tags,
          ...(title || record.title ? { title: title || record.title } : {}),
          ...(record.subject ? { subject: record.subject } : {}),
          ...(record.license ? { license: record.license } : {}),
        },
      });
    },

    get: (key) => call(`v1/assets/${encodeURIComponent(key)}`),

    /** Books that use this item (it must not be withdrawn while one does). */
    async books(key) {
      return (await call(`v1/assets/${encodeURIComponent(key)}/books`)).items;
    },

    /** Withdraws an item for good: its key can never be uploaded again (spec 1.2 §8). Needs an administrator's token. */
    withdraw(key, reason) {
      return call(`v1/assets/${encodeURIComponent(key)}/withdraw`, { method: 'POST', body: { reason } });
    },

    /** The bytes of an item, read through the library's own file store (for reading a manifest back). */
    async stores() {
      return (await call('v1/stores')).items;
    },
  };
}
