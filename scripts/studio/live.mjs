// Live updates for the studio: file changes (reload a figure, refresh its info) and job progress, sent to the
// dashboard as server-sent events on /__dev/events.
import fs from 'node:fs';
import path from 'node:path';
import { ID_RE } from '../lib/paths.mjs';

const META_FILES = new Set(['asset.json', 'NOTES.md', 'status.json', 'thumbnail.png', 'source.json']);

export function createLive({ assetsDir, sharedDir, dashboardDir }) {
  const clients = new Set();
  const watchers = [];
  const queued = new Map();
  let flushTimer = null;

  function broadcast(event, data) {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) res.write(msg);
  }
  /** Coalesces bursts of file events (editors write several times) into one message per key. */
  function queue(key, event, data) {
    queued.set(key, [event, data]);
    clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
      for (const [e, d] of queued.values()) broadcast(e, d);
      queued.clear();
    }, 120);
  }

  function watch(dir, scope) {
    if (!fs.existsSync(dir)) return;
    watchers.push(
      fs.watch(dir, { recursive: true }, (_type, file) => {
        if (!file) return;
        const rel = file.split(path.sep).join('/');
        if (rel.split('/').some((p) => p.startsWith('.')) || rel.endsWith('~') || rel.endsWith('.tmp')) return; // .tmp: atomic writes
        if (scope === 'assets') {
          const [id, ...rest] = rel.split('/');
          if (!ID_RE.test(id)) return;
          const name = rest.join('/');
          if (!name || META_FILES.has(name) || name.startsWith('reviews/'))
            queue(`meta:${id}`, 'meta', { id }); // never reloads the preview
          else if (!/^(exports|reference|tests)\//.test(name)) queue(`reload:${id}`, 'reload', { scope: 'asset', id, file: name });
        } else queue(`reload:${scope}`, 'reload', { scope, file: rel });
      }),
    );
  }
  watch(assetsDir, 'assets');
  watch(sharedDir, 'shared');
  watch(dashboardDir, 'dashboard');

  return {
    broadcast,
    queue,
    /** GET /__dev/events */
    handle(req, res) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write('retry: 1000\n\n');
      clients.add(res);
      const ping = setInterval(() => res.write(': ping\n\n'), 25000);
      req.on('close', () => {
        clearInterval(ping);
        clients.delete(res);
      });
    },
    close() {
      for (const w of watchers) w.close();
      for (const res of clients) res.end();
      clients.clear();
    },
  };
}
