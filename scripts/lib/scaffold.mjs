// Creates a new figure folder from templates/<type>/ and checks the result against the manifest contract.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { ID_RE, ASSETS_DIR, TEMPLATES_DIR, REAL_ASSETS } from './paths.mjs';
import { walkFiles } from './fsutil.mjs';
import { formatManifest, validateManifest, describe } from './manifest/index.mjs';
import { formatStatus, statusRecord } from './status.mjs';
import { loadBooks, DEFAULT_BOOK, bookRef } from './books.mjs';
import { applySections, readmeSections } from '../docs.mjs';
import { generatedFiles } from '../generate.mjs';

const TYPES = ['interactive', 'animation', 'model'];
const fail = (message) => Object.assign(new Error(message), { status: 400 });

/**
 * scaffoldAsset({ id, title, type, book, page, topic, placement, maintainers }) → { id, dir }
 * The figure starts as an "idea". Throws (status 400) on bad input; nothing is written then.
 *
 * @param {{ id?: string, title?: string, type?: string, book?: string, page?: number | string | null, topic?: string,
 *           placement?: string, maintainers?: string[] }} [options]
 */
export async function scaffoldAsset({
  id,
  title,
  type = 'interactive',
  book = DEFAULT_BOOK,
  page = null,
  topic = '',
  placement = '',
  maintainers = [],
} = {}) {
  if (!ID_RE.test(id || '')) throw fail('Id must be lowercase letters, numbers and dashes (e.g. "convex-lens").');
  if (!TYPES.includes(type)) throw fail(`Unknown type "${type}" (use ${TYPES.join(', ')})`);
  const templateDir = path.join(TEMPLATES_DIR, type);
  const dest = path.join(ASSETS_DIR, id);
  if (fs.existsSync(dest)) throw fail(`assets/${id} already exists`);

  const pageNumber = page === '' || page == null ? null : Number(page);
  if (pageNumber !== null && !(Number.isInteger(pageNumber) && pageNumber > 0)) throw fail(`Page must be a whole number, like 21 (got "${page}").`);
  const ref = bookRef({ book, topic, page: pageNumber });
  const vars = { id, title: title || id, ref, date: new Date().toISOString().slice(0, 10) };
  const fill = (s) => s.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));

  // Build the manifest first and validate it, so a bad page or topic never leaves a half-made folder.
  const manifest = JSON.parse(fill(await fsp.readFile(path.join(templateDir, 'asset.json'), 'utf8')));
  Object.assign(manifest, { type, book, page: pageNumber, topic: String(topic || ''), maintainers: [].concat(maintainers).filter(Boolean) });
  manifest.placement = placement || (pageNumber || topic ? `Book page ${pageNumber ?? '?'}, topic ${topic || '?'}.` : '');
  const { errors } = validateManifest(manifest, { folder: id, books: loadBooks() });
  if (errors.length) throw fail(describe(errors).join('; '));

  for (const rel of await walkFiles(templateDir)) {
    const to = path.join(dest, rel);
    await fsp.mkdir(path.dirname(to), { recursive: true });
    const buf = await fsp.readFile(path.join(templateDir, rel));
    if (rel === 'asset.json') continue;
    if (/\.(html|m?js|css|json|md)$/.test(rel)) await fsp.writeFile(to, fill(buf.toString('utf8')));
    else await fsp.writeFile(to, buf);
  }
  await fsp.writeFile(path.join(dest, 'asset.json'), formatManifest(manifest));
  await fsp.writeFile(
    path.join(dest, 'status.json'),
    formatStatus({ status: 'idea', history: [statusRecord('idea', { by: 'scaffold', version: manifest.version })] }),
  );

  // The README: where it goes in the book (at the top, so the developer finds the spot) and the tables made from
  // asset.json. Then the files generated from all figures (CODEOWNERS).
  const readme = path.join(dest, 'README.md');
  if (fs.existsSync(readme)) {
    let text = await fsp.readFile(readme, 'utf8');
    if (ref && !text.includes('**Where it goes in the book:**'))
      text = text.replace(/^(# .*\n)/, `$1\n**Where it goes in the book:** ${manifest.placement}\n`);
    await fsp.writeFile(readme, applySections(text, readmeSections(manifest)));
  }
  if (REAL_ASSETS) {
    for (const g of generatedFiles()) {
      await fsp.mkdir(path.dirname(g.file), { recursive: true });
      await fsp.writeFile(g.file, g.content);
    }
  }
  return { id, dir: dest };
}
