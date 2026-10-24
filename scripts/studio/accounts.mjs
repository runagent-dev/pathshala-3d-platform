// Studio accounts and sessions, kept in data/ (never in git): users.json and sessions.json.
// Passwords are stored as scrypt hashes; new users get a one-time invite link to set their own password.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { writeFileAtomicSync } from '../lib/fsutil.mjs';
import { DATA_DIR, ROOT } from '../lib/paths.mjs';
import { ROLES } from './policy.mjs';

export const USERNAME_RE = /^[a-z][a-z0-9._-]{1,31}$/;
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const SESSION_DAYS = 30;
const INVITE_DAYS = 7;
const fail = (status, message) => Object.assign(new Error(message), { status });
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const [kind, N, r, p, salt, hash] = String(stored || '').split('$');
  if (kind !== 'scrypt') return false;
  const want = Buffer.from(hash, 'base64');
  const got = crypto.scryptSync(String(password), Buffer.from(salt, 'base64'), want.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return crypto.timingSafeEqual(got, want);
}

/** A password that is easy to type and read out: xxxx-xxxx-xxxx-xxxx without look-alike letters. */
export function generatePassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(16);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length])
    .join('')
    .replace(/(.{4})(?=.)/g, '$1-');
}

export function createAccounts({ dir = DATA_DIR } = {}) {
  const usersFile = path.join(dir, 'users.json');
  const sessionsFile = path.join(dir, 'sessions.json');
  fs.mkdirSync(dir, { recursive: true });
  const read = (file, fallback) => {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return fallback;
    }
  };
  let users = read(usersFile, { users: [] }).users;
  const sessions = read(sessionsFile, { sessions: {} }).sessions;
  // Written synchronously: every read reloads users.json (the CLI may have changed it), so a write must be done first.
  // Owner-only (0600): password hashes and session hashes.
  const saveUsers = () => writeFileAtomicSync(usersFile, `${JSON.stringify({ users }, null, 2)}\n`, { mode: 0o600 });
  const saveSessions = () => writeFileAtomicSync(sessionsFile, `${JSON.stringify({ sessions }, null, 2)}\n`, { mode: 0o600 });
  const reload = () => {
    users = read(usersFile, { users: [] }).users;
  };
  const find = (username) => users.find((u) => u.username === username);
  const pub = (u) => u && { username: u.username, name: u.name || u.username, email: u.email || null, role: u.role };

  function addUser({ username, name = '', email = '', role, password = null }) {
    if (!USERNAME_RE.test(username || '')) throw fail(400, 'Usernames are lowercase letters, digits and . _ - (2–32 characters)');
    if (!ROLES.includes(role)) throw fail(400, `Role must be one of ${ROLES.join(', ')}`);
    if (find(username)) throw fail(409, `${username} already exists`);
    const user = {
      username,
      name,
      email,
      role,
      hash: password ? hashPassword(password) : null,
      disabled: false,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    const token = password ? null : setInvite(user);
    saveUsers();
    return { user: pub(user), invite: token };
  }

  function setInvite(user) {
    const token = crypto.randomBytes(24).toString('base64url');
    user.invite = { hash: sha256(token), expires: new Date(Date.now() + INVITE_DAYS * 864e5).toISOString() };
    return token;
  }

  return {
    get users() {
      reload();
      return users.map(pub);
    },
    count: () => users.length,
    find: (username) => pub(find(username)),
    addUser,
    /** A new invite link token (also unlocks a forgotten password). */
    invite(username) {
      reload();
      const u = find(username);
      if (!u) throw fail(404, `No user ${username}`);
      const token = setInvite(u);
      saveUsers();
      return token;
    },
    setRole(username, role) {
      reload();
      const u = find(username);
      if (!u) throw fail(404, `No user ${username}`);
      if (!ROLES.includes(role)) throw fail(400, `Role must be one of ${ROLES.join(', ')}`);
      u.role = role;
      saveUsers();
    },
    setDisabled(username, disabled) {
      reload();
      const u = find(username);
      if (!u) throw fail(404, `No user ${username}`);
      u.disabled = Boolean(disabled);
      for (const [k, s] of Object.entries(sessions)) if (s.username === username) delete sessions[k];
      saveUsers();
      saveSessions();
    },
    setPassword(username, password) {
      reload();
      const u = find(username);
      if (!u) throw fail(404, `No user ${username}`);
      u.hash = hashPassword(password);
      delete u.invite;
      saveUsers();
    },
    /** The user for a username and password, or null. */
    check(username, password) {
      reload();
      const u = find(String(username || '').toLowerCase());
      if (!u || u.disabled || !u.hash) {
        verifyPassword('x', hashFor.dummy); // same work either way: no timing hint whether the user exists
        return null;
      }
      return verifyPassword(password, u.hash) ? pub(u) : null;
    },
    /** Sets a password from an invite; returns the user. */
    acceptInvite(username, token, password) {
      reload();
      const u = find(username);
      if (!u?.invite || u.disabled) throw fail(400, 'This invite link is not valid (ask for a new one)');
      if (Date.parse(u.invite.expires) < Date.now()) throw fail(400, 'This invite link has expired (ask for a new one)');
      if (!crypto.timingSafeEqual(Buffer.from(sha256(token)), Buffer.from(u.invite.hash)))
        throw fail(400, 'This invite link is not valid (ask for a new one)');
      if (String(password || '').length < 10) throw fail(400, 'Choose a password of at least 10 characters');
      u.hash = hashPassword(password);
      delete u.invite;
      saveUsers();
      return pub(u);
    },
    /** A new session; returns the cookie value. Only its hash is stored. */
    openSession(username) {
      const id = crypto.randomBytes(32).toString('base64url');
      sessions[sha256(id)] = { username, created: new Date().toISOString(), expires: new Date(Date.now() + SESSION_DAYS * 864e5).toISOString() };
      for (const [k, s] of Object.entries(sessions)) if (Date.parse(s.expires) < Date.now()) delete sessions[k];
      saveSessions();
      return id;
    },
    session(id) {
      if (!id) return null;
      const s = sessions[sha256(id)];
      if (!s || Date.parse(s.expires) < Date.now()) return null;
      reload();
      const u = find(s.username);
      return u && !u.disabled ? pub(u) : null;
    },
    closeSession(id) {
      if (id && sessions[sha256(id)]) {
        delete sessions[sha256(id)];
        saveSessions();
      }
    },
    /**
     * First start of a studio that needs logins: users from the old .studio-auth.json (owner → admin, reviewer),
     * or STUDIO_USER/STUDIO_PASS, or a new admin with a generated password (returned so it can be printed once).
     */
    bootstrap({ env = process.env, legacyFile = path.join(ROOT, '.studio-auth.json') } = {}) {
      reload();
      const created = [];
      if (env.STUDIO_USER && env.STUDIO_PASS) {
        const name = env.STUDIO_USER.toLowerCase();
        if (find(name)) this.setPassword(name, env.STUDIO_PASS);
        else addUser({ username: name, role: 'admin', password: env.STUDIO_PASS });
      }
      if (users.length) return created;
      const legacy = read(legacyFile, null);
      if (legacy?.user && legacy?.pass) {
        addUser({ username: legacy.user, role: 'admin', password: legacy.pass });
        created.push({ username: legacy.user, role: 'admin', from: path.basename(legacyFile) });
        if (legacy.reviewer?.user && legacy.reviewer?.pass) {
          addUser({ username: legacy.reviewer.user, role: 'reviewer', password: legacy.reviewer.pass });
          created.push({ username: legacy.reviewer.user, role: 'reviewer', from: path.basename(legacyFile) });
        }
        return created;
      }
      const password = generatePassword();
      addUser({ username: 'admin', role: 'admin', password });
      created.push({ username: 'admin', role: 'admin', password });
      return created;
    },
  };
}
const hashFor = { dummy: hashPassword('dummy-password') };
