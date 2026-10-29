import fs from 'node:fs';

/** The settings the sync may take from `.env.library`: the library's write token and where to tell the Books server. */
export const ENV_FILE_NAME = '.env.library';
export const ENV_FILE_KEYS = ['LIBRARY_TOKEN', 'LIBRARY_SYNC_HOOK_URL', 'LIBRARY_SYNC_HOOK_TOKEN'];

/**
 * @param {string} text
 * @returns {Record<string, string>}
 *
 * `KEY=value` lines, `#` comments and blank lines ignored, an optional leading `export `, one pair of matching quotes around the value removed.
 * No variable expansion, no multi-line values: it is a list of settings, not a shell script.
 */
export function parseEnvFile(text) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2].trim();
    if (value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0]) value = value.slice(1, -1);
    out[m[1]] = value;
  }
  return out;
}

/**
 * @param {string} file
 * @param {Record<string, string | undefined>} [env] what to fill in (default: the process environment)
 * @param {string[]} [allowed] only these names are taken from the file
 * @returns {{ found: boolean, loaded: string[], ignored: string[], open: boolean }}
 *
 * Fills in what the shell has not set (the shell always wins) and says which names it took; it never returns or prints a value. `open` is true
 * when other users of this computer can read the file (it holds a token: `chmod 600`).
 */
export function loadEnvFile(file, env = process.env, allowed = ENV_FILE_KEYS) {
  let text;
  let mode = 0;
  try {
    text = fs.readFileSync(file, 'utf8');
    mode = fs.statSync(file).mode;
  } catch {
    return { found: false, loaded: [], ignored: [], open: false };
  }
  const loaded = [];
  const ignored = [];
  for (const [key, value] of Object.entries(parseEnvFile(text))) {
    if (!allowed.includes(key)) ignored.push(key);
    else if (value && !env[key]) {
      env[key] = value;
      loaded.push(key);
    }
  }
  return { found: true, loaded, ignored, open: process.platform !== 'win32' && (mode & 0o077) !== 0 };
}
