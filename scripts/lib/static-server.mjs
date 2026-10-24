// A plain static file server for a folder (no studio API, no live reload), used by the visual comparison and the
// exporter to serve a git worktree. serveStatic(root) → { url, close() } on a free port of 127.0.0.1.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { MIME } from './mime.mjs';

export function serveStatic(root, { port = 0 } = {}) {
  const base = path.resolve(root);
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.normalize(path.join(base, pathname));
    if (!file.startsWith(base)) return void res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return void res.writeHead(404).end('Not found');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const { port: actual } = /** @type {import('node:net').AddressInfo} */ (server.address());
      resolve({ url: `http://127.0.0.1:${actual}`, close: () => new Promise((r) => server.close(() => r())) });
    });
  });
}
