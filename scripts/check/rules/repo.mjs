// Repository-wide rules: generated files current, books.json valid, no build output or secrets in git, and the
// shared kit free of hard-coded Bangla (figures pass their strings in).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { staleFiles } from '../../generate.mjs';
import { BOOKS_FILE, loadBooks } from '../../lib/books.mjs';
import { walkFiles } from '../../lib/fsutil.mjs';
import { ROOT, SHARED_DIR } from '../../lib/paths.mjs';
import { banglaLines } from './i18n.mjs';

/** @type {Array<[RegExp, string]>} */
const SECRET_PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, 'a GitHub token'],
  [/\bgithub_pat_[A-Za-z0-9_]{40,}\b/, 'a GitHub token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'an AWS access key'],
  [/\bsk-ant-[A-Za-z0-9_-]{20,}\b/, 'an Anthropic API key'],
];
const NEVER_TRACKED = [/^\.studio-auth\.json$/, /^data\//, /^dist\//, /^\.cache\//, /^exports\//, /(^|\/)\.env(\..*)?$/, /(^|\/)node_modules\//];

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\0')
      .filter(Boolean);
  } catch {
    return null;
  }
}

export default {
  name: 'repo',
  scope: 'repo',
  async run() {
    const out = [];
    for (const g of staleFiles()) {
      out.push({
        level: 'error',
        file: path.relative(ROOT, g.file),
        message: `out of date (made from ${g.source}): run \`npm run generate\``,
        fix: () => {
          fs.mkdirSync(path.dirname(g.file), { recursive: true });
          fs.writeFileSync(g.file, g.content);
        },
      });
    }
    try {
      loadBooks();
    } catch (err) {
      out.push({ level: 'error', file: path.relative(ROOT, BOOKS_FILE), message: err.message });
    }
    const tracked = trackedFiles();
    for (const f of tracked || []) {
      if (NEVER_TRACKED.some((re) => re.test(f)))
        out.push({ level: 'error', file: f, message: 'must not be in git (build output, local data or a secret)' });
      if (!/\.(m?js|json|md|html|css|txt|ya?ml|sh)$/.test(f) || f.startsWith('shared/vendor/') || !fs.existsSync(path.join(ROOT, f))) continue;
      const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
      for (const [re, what] of SECRET_PATTERNS) if (re.test(text)) out.push({ level: 'error', file: f, message: `looks like it contains ${what}` });
    }
    for (const rel of (await walkFiles(path.join(SHARED_DIR, 'lib'))).filter((f) => /\.m?js$/.test(f))) {
      for (const { line } of banglaLines(fs.readFileSync(path.join(SHARED_DIR, 'lib', rel), 'utf8')).slice(0, 3)) {
        out.push({ level: 'error', file: `shared/lib/${rel}:${line}`, message: 'Bangla text in the shared kit: take it from the figure (t())' });
      }
    }
    return out;
  },
};
