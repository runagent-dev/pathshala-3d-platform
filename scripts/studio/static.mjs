// Static files of the studio. Figure files are public (read-only, any origin): the dashboard previews figures in a
// sandboxed iframe, which has no cookies and no access to the API, so contributors' figure code can never act
// with the viewer's rights. Everything else (the dashboard, notes, reviews, status, exports) needs a login.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { DEV_ONLY_DIRS, DEV_ONLY_FILES } from '../lib/assets.mjs';
import { MIME } from '../lib/mime.mjs';
import { send } from './http.mjs';

// Injected into figure pages opened directly by a logged-in person (not in the dashboard), so they reload on save.
const RELOAD_SNIPPET = `<script>(()=>{if(window.top!==window)return;const es=new EventSource('/__dev/events');
es.addEventListener('reload',e=>{const d=JSON.parse(e.data);if(d.scope==='shared'||location.pathname.startsWith('/assets/'+d.id+'/'))location.reload();});})();</script>`;

const HIDDEN = new Set(['node_modules', 'scripts', 'data']);
const PUBLIC_PAGES = new Set(['/login/', '/login/index.html', '/dashboard/login.css']);

/**
 * Is this path a public figure file? /shared/… and the deliverable files of /assets/<id>/… (not notes, status,
 * reviews, reference pictures, tests or studio exports).
 */
export function isPublicFile(pathname) {
  if (pathname.startsWith('/shared/')) return !pathname.startsWith('/shared/viewer/');
  const m = /^\/assets\/([^/]+)\/(.*)$/.exec(pathname);
  if (!m) return false;
  const rest = m[2];
  const top = rest.split('/')[0];
  return !DEV_ONLY_FILES.has(path.basename(rest)) && !(rest.includes('/') && DEV_ONLY_DIRS.has(top));
}

export function createStatic({ root, exportsDir }) {
  async function sendFile(res, file, pathname, { search = '', live = false, headers = {} } = {}) {
    let target = file;
    let stat = await fsp.stat(target).catch(() => null);
    if (stat?.isDirectory()) {
      if (!pathname.endsWith('/')) return send(res, 301, '', { Location: `${pathname}/${search}`, ...headers });
      target = path.join(target, 'index.html');
      stat = await fsp.stat(target).catch(() => null);
    }
    if (!stat?.isFile()) return send(res, 404, 'Not found', headers);
    const ext = path.extname(target).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    if (live && ext === '.html' && pathname.startsWith('/assets/')) {
      const html = (await fsp.readFile(target, 'utf8')).replace(/<\/body>/i, `${RELOAD_SNIPPET}</body>`);
      return send(res, 200, html, { 'Content-Type': type, ...headers });
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Cache-Control': 'no-store', ...headers });
    fs.createReadStream(target).pipe(res);
  }

  /** Serves `url` for `user` (null when not logged in). Returns false when a login is needed. */
  async function serve(res, url, user) {
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') return send(res, 302, '', { Location: user ? '/dashboard/' : '/login/' });
    if (pathname === '/login' || pathname.startsWith('/login/')) return sendFile(res, path.join(root, 'dashboard', 'login.html'), '/login.html');
    const file = path.normalize(path.join(root, pathname));
    if (!file.startsWith(root + path.sep) && file !== root) return send(res, 403, 'Forbidden');
    if (
      path
        .relative(root, file)
        .split(path.sep)
        .some((p) => p.startsWith('.') || HIDDEN.has(p))
    )
      return send(res, 404, 'Not found');

    if (isPublicFile(pathname))
      return sendFile(res, file, pathname, { search: url.search, live: Boolean(user), headers: { 'Access-Control-Allow-Origin': '*' } });
    if (!user && !PUBLIC_PAGES.has(pathname)) return false;
    if (user?.role === 'reviewer' && (path.basename(file) === 'NOTES.md' || pathname.startsWith('/exports/'))) return send(res, 404, 'Not found');
    if (pathname.startsWith('/exports/')) {
      const exported = path.normalize(path.join(exportsDir, pathname.slice('/exports/'.length)));
      if (!exported.startsWith(exportsDir + path.sep)) return send(res, 403, 'Forbidden');
      return sendFile(res, exported, pathname);
    }
    return sendFile(res, file, pathname, { search: url.search, live: true });
  }
  return { serve };
}
