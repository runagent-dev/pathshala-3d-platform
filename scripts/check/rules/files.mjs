// The files every figure needs, and size budgets (the zip goes into a book that students download).
import fs from 'node:fs';
import path from 'node:path';
import { walkFiles } from '../../lib/fsutil.mjs';
import { DEV_ONLY_DIRS, DEV_ONLY_FILES } from '../../lib/assets.mjs';

const REQUIRED = {
  interactive: ['index.html', 'src/main.js', 'src/i18n.js', 'README.md', 'NOTES.md'],
  animation: ['index.html', 'src/main.js', 'src/i18n.js', 'README.md', 'NOTES.md'],
  model: ['index.html', 'src/main.js', 'src/i18n.js', 'model.glb', 'README.md', 'NOTES.md'],
};
const MB = 1024 * 1024;
export const BUDGETS = { figure: 8 * MB, file: 5 * MB, glb: 15 * MB, reference: 2 * MB, reviewImage: 1 * MB };

export default {
  name: 'files',
  scope: 'figure',
  async run({ dir, manifest }) {
    const out = [];
    for (const rel of REQUIRED[manifest?.type] || REQUIRED.interactive) {
      if (!fs.existsSync(path.join(dir, rel))) out.push({ level: 'error', file: rel, message: 'missing (every figure has it; see templates/)' });
    }
    let total = 0;
    for (const rel of await walkFiles(dir)) {
      const size = fs.statSync(path.join(dir, rel)).size;
      const top = rel.split(path.sep)[0];
      const mb = (n) => `${(n / MB).toFixed(1)} MB`;
      if (top === 'reviews') {
        if (/\.(png|jpe?g|webp)$/i.test(rel) && size > BUDGETS.reviewImage)
          out.push({ level: 'error', file: rel, message: `review picture is ${mb(size)} (max ${mb(BUDGETS.reviewImage)})` });
        continue;
      }
      if (top === 'reference') {
        if (size > BUDGETS.reference)
          out.push({
            level: 'error',
            file: rel,
            message: `reference image is ${mb(size)} (max ${mb(BUDGETS.reference)}); save it as a smaller JPEG/WebP`,
          });
        continue;
      }
      if (DEV_ONLY_DIRS.has(top) || DEV_ONLY_FILES.has(path.basename(rel))) continue;
      total += size;
      const max = rel.endsWith('.glb') ? BUDGETS.glb : BUDGETS.file;
      if (size > max) out.push({ level: 'error', file: rel, message: `${mb(size)} is over the ${mb(max)} limit for one file` });
    }
    if (total > BUDGETS.figure)
      out.push({ level: 'error', message: `the figure's own files add up to ${(total / MB).toFixed(1)} MB (max ${BUDGETS.figure / MB} MB)` });
    return out;
  },
};
