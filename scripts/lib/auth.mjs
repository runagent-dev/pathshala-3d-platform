// Passwords for the dev server when it is reachable from outside this machine (`npm run dev:public`).
// HTTP Basic auth: the browser asks once and remembers it for the tab, iframes and live reload included.
// Two logins: the owner (everything) and reviewers (look at the figures and add reviews, nothing else).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.mjs';

export const AUTH_FILE = path.join(ROOT, '.studio-auth.json'); // git-ignored; dotfiles are never served

// No look-alike characters (0/O, 1/l/I), so the password is easy to type from a phone.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

function generatePassword(groups = 4, size = 4) {
  const bytes = crypto.randomBytes(groups * size);
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]);
  return Array.from({ length: groups }, (_, i) => chars.slice(i * size, (i + 1) * size).join('')).join('-');
}

/**
 * Owner: STUDIO_USER / STUDIO_PASS from the environment, else `.studio-auth.json`, else new ones saved there.
 * Reviewer: STUDIO_REVIEW_USER / STUDIO_REVIEW_PASS, else `reviewer` in the same file (created if missing).
 */
export function loadCredentials() {
  const saved = fs.existsSync(AUTH_FILE) ? JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')) : {};
  let changed = false;
  if (!saved.user || !saved.pass) {
    Object.assign(saved, { user: 'pathshala', pass: generatePassword() });
    changed = true;
  }
  if (!saved.reviewer?.user || !saved.reviewer?.pass) {
    saved.reviewer = { user: 'review', pass: generatePassword() };
    changed = true;
  }
  if (changed) fs.writeFileSync(AUTH_FILE, `${JSON.stringify(saved, null, 2)}\n`, { mode: 0o600 });
  const env = process.env;
  const owner = env.STUDIO_USER && env.STUDIO_PASS ? { user: env.STUDIO_USER, pass: env.STUDIO_PASS } : { user: saved.user, pass: saved.pass };
  const reviewer = env.STUDIO_REVIEW_USER && env.STUDIO_REVIEW_PASS ? { user: env.STUDIO_REVIEW_USER, pass: env.STUDIO_REVIEW_PASS } : saved.reviewer;
  return { ...owner, reviewer, source: env.STUDIO_USER ? 'env' : changed ? 'new' : 'file' };
}

const isLoopback = (addr = '') => addr === '::1' || addr.startsWith('127.') || addr.startsWith('::ffff:127.');
const digest = (s) => crypto.createHash('sha256').update(s).digest();

/**
 * Returns `check(req, res)`: 'owner' or 'reviewer' when the request may continue; otherwise false, and it has
 * already answered 401/429. Requests from this machine (SSH tunnel, scripts) count as the owner.
 */
export function createBasicAuth({ user, pass, reviewer }, { maxFailures = 20, windowMs = 15 * 60 * 1000 } = {}) {
  const expected = digest(`${user}:${pass}`);
  const expectedReviewer = reviewer ? digest(`${reviewer.user}:${reviewer.pass}`) : null;
  const failures = new Map(); // ip → { count, since }

  return function check(req, res) {
    const ip = req.socket.remoteAddress;
    if (isLoopback(ip)) return 'owner';

    const now = Date.now();
    const f = failures.get(ip);
    if (f && now - f.since > windowMs) failures.delete(ip);
    if (failures.get(ip)?.count >= maxFailures) {
      res.writeHead(429, { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': String(Math.ceil(windowMs / 1000)) });
      res.end('Too many wrong passwords. Try again in 15 minutes.');
      return false;
    }

    const header = req.headers.authorization || '';
    if (header.startsWith('Basic ')) {
      const given = digest(Buffer.from(header.slice(6), 'base64').toString('utf8'));
      const role = crypto.timingSafeEqual(given, expected)
        ? 'owner'
        : expectedReviewer && crypto.timingSafeEqual(given, expectedReviewer)
          ? 'reviewer'
          : null;
      if (role) {
        failures.delete(ip);
        return role;
      }
      const entry = failures.get(ip) || { count: 0, since: now };
      entry.count += 1;
      failures.set(ip, entry);
    }
    res.writeHead(401, {
      'WWW-Authenticate': 'Basic realm="Pathshala 3D Studio", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end('Pathshala 3D Studio: login required.');
    return false;
  };
}
