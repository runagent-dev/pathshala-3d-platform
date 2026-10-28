// Telling the Books server that the library changed (docs/library-sync.md, "Telling the Books server").
//
// After a production sync that changed the library, one POST asks the Books server to bring the labs and models in books up to the new versions
// (it does this synchronously and answers when done). Nothing here can fail a sync: the library is already updated by then, so every problem
// is a printed line and a hint to repeat it with `npm run library:sync -- --notify`. The token comes from the environment only and is never
// printed, not even when the server echoes it back.
import fs from 'node:fs';
import path from 'node:path';

export const HOOK_URL_ENV = 'LIBRARY_SYNC_HOOK_URL';
export const HOOK_TOKEN_ENV = 'LIBRARY_SYNC_HOOK_TOKEN';
export const NOTIFY_TIMEOUT_MS = 10 * 60 * 1000;
const RETRIES = 2;
/** More changed figures than this (a first full publish): the server is asked to update everything instead of naming them. */
export const MAX_FIGURES = 200;
const FIGURE_ID = /^[a-z0-9][a-z0-9._-]{0,120}$/;
const BACKOFF_MS = [2_000, 6_000];
const RETRY_STATUSES = new Set([502, 503, 504]);
const REPEAT = 'Books were NOT notified; run: npm run library:sync -- --notify';

/** What a sync changed, as numbers: figures published, figures withdrawn, and whether anything at all (libraries repaired too) changed. */
export function changesOf(report) {
  const figures = report?.figures ?? [];
  const published = figures.filter((f) => f.result === 'published').length;
  const withdrawn = figures.filter((f) => f.result === 'withdrawn').length;
  const repairedLibraries = report?.libraries?.missing?.length ?? 0;
  return { published, withdrawn, changed: published + withdrawn + repairedLibraries > 0 };
}

/**
 * @param {any} report
 * @param {{ forced?: boolean }} [o] `forced`: the notification was asked for with --notify, which is always a full run
 * @returns {{ figures: string[] | null, skipped: string[] }}
 *
 * Which figures the server should update: the ids (the slug the library tags its items with, `figure:<id>`) of every figure this sync published
 * or withdrew, unique and sorted. `null` = all of them: forced, a report that cannot say, or more than MAX_FIGURES. An id that is not a plausible
 * figure id is left out and returned in `skipped`. A sync that only repaired libraries gives an empty list (nothing to update in books).
 */
export function figuresOf(report, { forced = false } = {}) {
  if (forced || !Array.isArray(report?.figures)) return { figures: null, skipped: [] };
  const ids = new Set();
  const skipped = new Set();
  for (const f of report.figures) {
    if (f?.result !== 'published' && f?.result !== 'withdrawn') continue;
    if (typeof f.id === 'string' && FIGURE_ID.test(f.id)) ids.add(f.id);
    else skipped.add(String(f?.id));
  }
  if (ids.size > MAX_FIGURES) return { figures: null, skipped: [...skipped].sort() };
  return { figures: [...ids].sort(), skipped: [...skipped].sort() };
}

/** "(figures: a, b, c, d, e +2 more)" or "(all figures)", for the line a person reads. */
export function scopeText(figures) {
  if (!figures) return '(all figures)';
  if (!figures.length) return '(no figures)';
  const shown = figures.slice(0, 5).join(', ');
  return `(figures: ${shown}${figures.length > 5 ? ` +${figures.length - 5} more` : ''})`;
}

/**
 * @param {any} report
 * @param {{ notify?: boolean, noNotify?: boolean }} [flags]
 * @returns {{ send: boolean, why: string, published: number, withdrawn: number, figures: string[] | null, skipped: string[] }}
 *
 * Whether to notify: only after a real (not dry-run, not --check) write to the PRODUCTION tier, and only when something changed, unless
 * `notify` forces it. `why` is a line for a person when the answer is no for a reason they may not expect (only given with --notify).
 */
export function decide(report, { notify = false, noNotify = false } = {}) {
  const no = (why = '') => ({ send: false, why, published: 0, withdrawn: 0, figures: null, skipped: [] });
  if (noNotify) return no();
  if (report?.mode !== 'apply') return no(notify ? 'not notifying: this was a dry run' : '');
  if (report?.tier !== 'production') return no(notify ? `not notifying: the tier was ${report?.tier}, only production is announced` : '');
  const c = changesOf(report);
  if (!c.changed && !notify) return no();
  return { send: true, why: '', published: c.published, withdrawn: c.withdrawn, ...figuresOf(report, { forced: notify }) };
}

/** The endpoint, or a reason it is refused: https only, except this computer (for tests). */
export function checkHookUrl(text) {
  let url;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, why: `${HOOK_URL_ENV} is not a URL` };
  }
  const local = url.hostname === '127.0.0.1' || url.hostname === 'localhost';
  if (url.protocol === 'https:' || (url.protocol === 'http:' && local)) return { ok: true, url };
  return { ok: false, why: `${HOOK_URL_ENV} must be an https address (plain http only for 127.0.0.1 and localhost)` };
}

const oneLine = (text, token, max = 200) => {
  let s = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (token) s = s.split(token).join('***');
  return s.length > max ? `${s.slice(0, max)}...` : s;
};

/** What a server's answer body says, as text for a person (never the token). */
async function errorText(res, token) {
  try {
    const raw = await res.text();
    try {
      const j = JSON.parse(raw);
      return oneLine(j?.error ?? j?.message ?? raw, token);
    } catch {
      return oneLine(raw, token);
    }
  } catch {
    return '';
  }
}

/**
 * @param {{ url: string, token: string, body: object, scope?: string, fetch?: typeof fetch, sleep?: (ms: number) => Promise<void>, timeoutMs?: number, log?: (line: string) => void }} o
 * @returns {Promise<{ ok: boolean, status: number, outcome: string, result?: any }>}
 *
 * One announcement. Returns `{ ok, status, outcome }`; never throws. `log` gets the lines a person reads. Retries (twice, with a pause) only
 * on network errors and 502/503/504.
 */
export async function postNotification({
  url,
  token,
  body,
  scope = '',
  fetch: doFetch = globalThis.fetch,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  timeoutMs = NOTIFY_TIMEOUT_MS,
  log = () => {},
}) {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    let res;
    try {
      res = await doFetch(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
        redirect: 'error',
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
      if (timedOut) {
        log(
          `Books notification: no answer within ${Math.round(timeoutMs / 60000)} minutes; the update may still be running on the server. Check it before repeating.`,
        );
        return { ok: false, status: 0, outcome: 'timeout' };
      }
      const redirected = /redirect/i.test(String(err?.message)) || /redirect/i.test(String(err?.cause?.message));
      if (redirected) {
        log(
          'Books notification: the address answered with a redirect, which is refused (it could send the token to another host). Use the final address.',
        );
        return { ok: false, status: 0, outcome: 'redirect' };
      }
      if (attempt < RETRIES) {
        log(
          `Books notification: could not reach the server (${oneLine(err?.cause?.code ?? err?.message, token, 80)}); trying again in ${BACKOFF_MS[attempt] / 1000} s`,
        );
        await sleep(BACKOFF_MS[attempt]);
        continue;
      }
      log(`Books notification: could not reach the server (${oneLine(err?.cause?.code ?? err?.message, token, 80)}).`);
      return { ok: false, status: 0, outcome: 'unreachable' };
    }

    if (res.status === 200) {
      let j = null;
      try {
        j = await res.json();
      } catch {
        /* an answer that is not JSON still means it worked */
      }
      const n = (v) => (Number.isFinite(v) ? v : '?');
      // a server that answers for everything although a list was sent (an older one) is believed over what was sent
      const shown = j?.scope === 'all' ? '(all figures)' : scope;
      log(`Books updated: ${n(j?.applied)} applied, ${n(j?.review)} need review, ${n(j?.failed)} failed${shown ? ` ${shown}` : ''}`);
      return {
        ok: true,
        status: 200,
        outcome: 'updated',
        result: j && typeof j === 'object' ? { applied: j.applied, review: j.review, failed: j.failed, books: j.books } : null,
      };
    }
    if (res.status === 409) {
      log(
        'Books update already running: a run was already in progress on the server, so this sync was not announced. Repeat later with: npm run library:sync -- --notify',
      );
      return { ok: false, status: 409, outcome: 'busy' };
    }
    if (RETRY_STATUSES.has(res.status) && attempt < RETRIES) {
      log(`Books notification: the server answered ${res.status}; trying again in ${BACKOFF_MS[attempt] / 1000} s`);
      await sleep(BACKOFF_MS[attempt]);
      continue;
    }
    const text = await errorText(res, token);
    const hint =
      res.status === 401 || res.status === 403
        ? `check ${HOOK_TOKEN_ENV}`
        : res.status === 503
          ? 'the Books server is not set up to take this call (or is starting); try again later'
          : res.status === 404
            ? `check ${HOOK_URL_ENV}`
            : 'see the Books server log';
    log(`Books notification: the server answered ${res.status}${text ? `: ${text}` : ''} (${hint})`);
    return { ok: false, status: res.status, outcome: 'refused' };
  }
  return { ok: false, status: 0, outcome: 'unreachable' };
}

/**
 * @param {{ report: any, flags?: { notify?: boolean, noNotify?: boolean }, env?: Record<string, string | undefined>, log?: (line: string) => void, now?: () => Date, cacheDir?: string, fetch?: typeof fetch, sleep?: (ms: number) => Promise<void>, timeoutMs?: number }} o
 * @returns {Promise<{ sent: boolean, ok?: boolean, status?: number, outcome?: string }>}
 *
 * What `library:sync` does at its end. Reads the settings from `env`, decides, announces, records the outcome in the cache folder. Never throws
 * and returns nothing the caller needs for its exit code: a failed announcement does not change it.
 */
export async function announceSync({
  report,
  flags = {},
  env = process.env,
  log = console.log,
  now = () => new Date(),
  cacheDir,
  fetch: doFetch,
  sleep,
  timeoutMs,
}) {
  try {
    const d = decide(report, flags);
    if (d.why) log(`Books notification: ${d.why}`);
    if (!d.send) return { sent: false };

    const rawUrl = env[HOOK_URL_ENV];
    const token = env[HOOK_TOKEN_ENV];
    if (!rawUrl && !token) {
      log(`Books notification: not configured (${HOOK_URL_ENV})`);
      return { sent: false };
    }
    if (!rawUrl || !token) {
      log(
        `Books notification: both ${HOOK_URL_ENV} and ${HOOK_TOKEN_ENV} must be set, only ${rawUrl ? HOOK_URL_ENV : HOOK_TOKEN_ENV} is. The sync itself is fine. ${REPEAT}`,
      );
      return { sent: false };
    }
    const target = checkHookUrl(rawUrl);
    if (!target.ok) {
      log(`Books notification: ${target.why}. ${REPEAT}`);
      return { sent: false };
    }

    if (d.skipped.length) log(`Books notification: left out of the figures list (not a valid figure id): ${d.skipped.join(', ')}`);
    const at = now().toISOString();
    const result = await postNotification({
      url: target.url.href,
      token,
      body: { tier: 'production', syncedAt: at, published: d.published, withdrawn: d.withdrawn, ...(d.figures ? { figures: d.figures } : {}) },
      scope: scopeText(d.figures),
      log,
      ...(doFetch ? { fetch: doFetch } : {}),
      ...(sleep ? { sleep } : {}),
      ...(timeoutMs ? { timeoutMs } : {}),
    });
    if (!result.ok) log(REPEAT);
    record(cacheDir, {
      at,
      ok: result.ok,
      status: result.status,
      outcome: result.outcome,
      published: d.published,
      withdrawn: d.withdrawn,
      scope: d.figures ? 'figures' : 'all',
      ...(d.figures ? { figures: d.figures.length } : {}),
      ...(result.result ? { books: result.result } : {}),
    });
    return { sent: true, ...result };
  } catch (err) {
    log(`Books notification: failed (${oneLine(err?.message, env?.[HOOK_TOKEN_ENV])}). ${REPEAT}`);
    return { sent: false, ok: false };
  }
}

/** The last announcement, kept next to the sync's own state (no secrets in it); a failure to write it is not worth a line. */
function record(cacheDir, entry) {
  if (!cacheDir) return;
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(path.join(cacheDir, 'last-notification.json'), `${JSON.stringify(entry, null, 2)}\n`);
  } catch {
    /* it is a convenience */
  }
}
