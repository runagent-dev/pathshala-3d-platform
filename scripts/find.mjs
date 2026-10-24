#!/usr/bin/env node
// Finds figures by where they go in the book or by name.
//
//   npm run find -- p21            figures on page 21
//   npm run find -- 1.6            figures in topic 1.6 (and 1.6.1, 1.6.2, …)
//   npm run find -- physics-9-10   figures of a book
//   npm run find -- caliper        id, title or tags containing the text
//   npm run find                   every figure, in book order
import { listAssets } from './lib/assets.mjs';

export function matches(a, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const page = /^p(?:age)?\s*(\d+)$/.exec(q);
  if (page) return Number(a.page) === Number(page[1]);
  if (/^\d+(\.\d+)*$/.test(q)) return a.topic === q || String(a.topic || '').startsWith(`${q}.`);
  if (a.book === q) return true;
  return [a.id, a.title, ...(a.tags || [])].join(' ').toLowerCase().includes(q);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const query = process.argv.slice(2).join(' ');
  const found = (await listAssets()).filter((a) => !a.error && matches(a, query));
  if (!found.length) {
    console.log(`No figure matches "${query}".`);
    process.exitCode = 1;
  }
  const rows = found.map((a) => [a.ref || '(no book reference)', a.id, a.status, `v${a.version}`, a.title]);
  const widths = [0, 1, 2, 3].map((i) => Math.max(...rows.map((r) => r[i].length)));
  for (const r of rows) console.log(r.map((c, i) => (i < 4 ? c.padEnd(widths[i]) : c)).join('  '));
}
