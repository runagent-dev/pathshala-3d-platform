// Creates a new asset folder from templates/<type>/.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { ID_RE, ASSETS_DIR, TEMPLATES_DIR, walkFiles } from './assets.mjs';

export async function scaffoldAsset({ id, title, type = 'interactive', subject = '', chapter = '', page = '', topic = '' }) {
  if (!ID_RE.test(id)) throw new Error('Id must be lowercase letters, numbers and dashes (e.g. "convex-lens").');
  const templateDir = path.join(TEMPLATES_DIR, type === 'animation' ? 'interactive' : type); // an animation starts from the interactive template
  if (!fs.existsSync(templateDir)) throw new Error(`Unknown asset type "${type}"`);
  const dest = path.join(ASSETS_DIR, id);
  if (fs.existsSync(dest)) throw new Error(`assets/${id} already exists`);

  const today = new Date().toISOString().slice(0, 10);
  const vars = { id, title: title || id, subject, chapter, date: today };
  const fill = (s) => s.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));

  for (const rel of await walkFiles(templateDir)) {
    const to = path.join(dest, rel);
    await fsp.mkdir(path.dirname(to), { recursive: true });
    const buf = await fsp.readFile(path.join(templateDir, rel));
    if (/\.(html|js|css|json|md)$/.test(rel)) await fsp.writeFile(to, fill(buf.toString('utf8')));
    else await fsp.writeFile(to, buf);
  }

  const file = path.join(dest, 'asset.json');
  if (type === 'animation') {
    const manifest = JSON.parse(await fsp.readFile(file, 'utf8'));
    manifest.type = 'animation';
    await fsp.writeFile(file, JSON.stringify(manifest, null, 2) + '\n');
  }

  // Where it goes in the book, so the developer can find the spot.
  if (page || topic) {
    const manifest = JSON.parse(await fsp.readFile(file, 'utf8'));
    manifest.page = page === '' ? null : Number(page) || page;
    manifest.topic = String(topic || '');
    manifest.placement = `Book page ${page || '?'}, topic ${topic || '?'}.`;
    await fsp.writeFile(file, JSON.stringify(manifest, null, 2) + '\n');
    const readme = path.join(dest, 'README.md');
    if (fs.existsSync(readme)) {
      const text = await fsp.readFile(readme, 'utf8');
      await fsp.writeFile(readme, text.replace(/^(# .*\n)/, `$1\n**Where it goes in the book:** page ${page || '?'}, topic ${topic || '?'}.\n`));
    }
  }
  return { id, dir: dest };
}
