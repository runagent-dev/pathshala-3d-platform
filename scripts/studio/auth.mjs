// Who is asking. A session cookie (after logging in on /login/), or HTTP Basic with a studio account (for scripts),
// or, only where configured, no login at all: `npm run dev` on this computer's private addresses, and requests
// from the machine itself in `npm run dev:public`. In production (`npm run studio`, behind a proxy) everyone logs in.
import { cookies, httpError, json, readJson } from './http.mjs';

export const COOKIE = 'pathshala_session';
const DEV_USER = { username: 'local', name: 'This computer', email: null, role: 'admin' };
const isLoopback = (addr = '') => addr === '::1' || addr.startsWith('127.') || addr.startsWith('::ffff:127.');

/** Does `addr` match an entry of `list`: an exact address, or an IPv4 range like 10.0.1.0/24? */
export function addressIn(addr, list) {
  const ip = String(addr || '').replace(/^::ffff:/, '');
  const v4 = (s) => s.split('.').reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;
  return list.some((entry) => {
    if (!entry.includes('/')) return entry === ip;
    const [net, bits] = entry.split('/');
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip) || !/^\d+\.\d+\.\d+\.\d+$/.test(net)) return false;
    const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0;
    return (v4(ip) & mask) === (v4(net) & mask);
  });
}

/** Limits wrong passwords per address: `max` failures within `windowMs` locks the address out for the rest of it. */
export function createLimiter({ max = 20, windowMs = 15 * 60 * 1000 } = {}) {
  const failures = new Map();
  return {
    blocked(ip) {
      const f = failures.get(ip);
      if (f && Date.now() - f.since > windowMs) failures.delete(ip);
      return (failures.get(ip)?.count || 0) >= max;
    },
    fail(ip) {
      const f = failures.get(ip) || { count: 0, since: Date.now() };
      f.count++;
      failures.set(ip, f);
    },
    clear: (ip) => failures.delete(ip),
  };
}

/**
 * @param {{ accounts: any, login: 'none' | 'remote' | 'all', trustProxy?: string[] }} options
 *   login: none = nobody logs in (dev on private addresses); remote = everyone but this machine; all = everyone
 */
export function createAuth({ accounts, login, trustProxy = [] }) {
  const limiter = createLimiter();
  const trusted = (addr) => addressIn(addr, trustProxy);
  const clientIp = (req) => {
    const addr = req.socket.remoteAddress || '';
    const fwd = req.headers['x-forwarded-for'];
    return trusted(addr) && fwd ? String(fwd).split(',')[0].trim() : addr;
  };
  const isHttps = (req) => Boolean(req.socket.encrypted) || (trusted(req.socket.remoteAddress) && req.headers['x-forwarded-proto'] === 'https');

  function cookieHeader(req, value, maxAgeDays) {
    return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.round(maxAgeDays * 86400)}${isHttps(req) ? '; Secure' : ''}`;
  }

  /** The user for this request, or null. Sets req.authVia ('open' | 'cookie' | 'basic'). */
  function authenticate(req) {
    if (login === 'none' || (login === 'remote' && isLoopback(req.socket.remoteAddress) && !req.headers['x-forwarded-for'])) {
      req.authVia = 'open';
      return DEV_USER;
    }
    const session = accounts.session(cookies(req)[COOKIE]);
    if (session) {
      req.authVia = 'cookie';
      return session;
    }
    const header = String(req.headers.authorization || '');
    if (header.startsWith('Basic ')) {
      const ip = clientIp(req);
      if (limiter.blocked(ip)) throw httpError(429, 'Too many wrong passwords. Try again in 15 minutes.');
      const text = Buffer.from(header.slice(6), 'base64').toString('utf8');
      const i = text.indexOf(':');
      const user = i > 0 ? accounts.check(text.slice(0, i), text.slice(i + 1)) : null;
      if (user) {
        limiter.clear(ip);
        req.authVia = 'basic';
        return user;
      }
      limiter.fail(ip);
    }
    return null;
  }

  /**
   * Cross-site request forgery: a change made with the session cookie must come from the studio's own pages
   * (same Origin, or Sec-Fetch-Site same-origin). Basic auth and open mode have no ambient cookie to abuse.
   */
  function sameOrigin(req) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.authVia !== 'cookie') return true;
    const origin = req.headers.origin;
    if (origin) return origin === `${isHttps(req) ? 'https' : 'http'}://${req.headers.host}`;
    return req.headers['sec-fetch-site'] === 'same-origin';
  }

  /** POST /api/login, /api/logout, /api/invite. Returns true when handled. */
  async function routes(req, res, url) {
    if (req.method !== 'POST') return false;
    if (url.pathname === '/api/login') {
      const ip = clientIp(req);
      if (limiter.blocked(ip)) return json(res, 429, { error: 'Too many wrong passwords. Try again in 15 minutes.' }), true;
      const { username, password } = await readJson(req, 4096);
      const user = accounts.check(username, password);
      if (!user) {
        limiter.fail(ip);
        return json(res, 401, { error: 'Wrong username or password' }), true;
      }
      limiter.clear(ip);
      return json(res, 200, { user }, { 'Set-Cookie': cookieHeader(req, accounts.openSession(user.username), 30) }), true;
    }
    if (url.pathname === '/api/logout') {
      accounts.closeSession(cookies(req)[COOKIE]);
      return json(res, 200, { ok: true }, { 'Set-Cookie': cookieHeader(req, '', 0) }), true;
    }
    if (url.pathname === '/api/invite') {
      const ip = clientIp(req);
      if (limiter.blocked(ip)) return json(res, 429, { error: 'Too many tries. Try again in 15 minutes.' }), true;
      const { username, token, password } = await readJson(req, 4096);
      try {
        const user = accounts.acceptInvite(String(username || ''), String(token || ''), password);
        return json(res, 200, { user }, { 'Set-Cookie': cookieHeader(req, accounts.openSession(user.username), 30) }), true;
      } catch (err) {
        limiter.fail(ip);
        throw err;
      }
    }
    return false;
  }

  return { authenticate, sameOrigin, routes, clientIp };
}
