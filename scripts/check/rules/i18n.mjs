// Every user-facing string lives in src/i18n.js, in Bangla and English, with the same keys.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { stripJsComments } from '../../lib/depgraph.mjs';
import { walkFiles } from '../../lib/fsutil.mjs';

const BANGLA = /[ঀ-৿]/;
const ALLOW = 'check:allow-bangla';

/** Lines of JavaScript (comments removed) that contain Bangla, unless marked with `// check:allow-bangla`. */
export function banglaLines(src) {
  const raw = src.split('\n');
  return stripJsComments(src)
    .split('\n')
    .map((line, i) => ({ line: i + 1, text: line }))
    .filter(({ text, line }) => BANGLA.test(text) && !raw[line - 1]?.includes(ALLOW));
}

export default {
  name: 'i18n',
  scope: 'figure',
  async run({ dir }) {
    const out = [];
    const file = path.join(dir, 'src', 'i18n.js');
    if (fs.existsSync(file)) {
      try {
        const { STRINGS } = await import(`${pathToFileURL(file).href}?t=${fs.statSync(file).mtimeMs}`);
        if (!STRINGS?.bn || !STRINGS?.en) out.push({ level: 'error', file: 'src/i18n.js', message: 'must export STRINGS with "bn" and "en"' });
        else {
          const bn = new Set(Object.keys(STRINGS.bn));
          const en = new Set(Object.keys(STRINGS.en));
          const onlyBn = [...bn].filter((k) => !en.has(k));
          const onlyEn = [...en].filter((k) => !bn.has(k));
          if (onlyBn.length) out.push({ level: 'error', file: 'src/i18n.js', message: `no English for: ${onlyBn.join(', ')}` });
          if (onlyEn.length) out.push({ level: 'error', file: 'src/i18n.js', message: `no Bangla for: ${onlyEn.join(', ')}` });
        }
      } catch (err) {
        out.push({ level: 'error', file: 'src/i18n.js', message: `could not load it: ${err.message}` });
      }
    }
    for (const rel of (await walkFiles(dir)).filter((f) => /\.m?js$/.test(f) && !f.endsWith('i18n.js') && !f.startsWith('tests'))) {
      for (const { line } of banglaLines(fs.readFileSync(path.join(dir, rel), 'utf8')).slice(0, 3)) {
        out.push({ level: 'error', file: `${rel}:${line}`, message: 'Bangla text in code: move it to src/i18n.js and use t()' });
      }
    }
    return out;
  },
};
