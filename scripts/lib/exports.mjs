// What has been exported for a figure: the latest preview and every release, read from their export.json files.
import fs from 'node:fs';
import path from 'node:path';
import { EXPORTS_DIR } from './paths.mjs';

const read = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};
const withUrls = (record, urlBase) =>
  record && { ...record, files: record.files.map((f) => ({ ...f, url: `${urlBase}/${encodeURIComponent(f.name)}` })) };

/** { preview: export.json + file URLs | null, releases: [newest first] }. URLs are served at /exports/…. */
export function listExports(id, book) {
  const preview = withUrls(read(path.join(EXPORTS_DIR, '_preview', id, 'export.json')), `/exports/_preview/${id}`);
  const dir = path.join(EXPORTS_DIR, book || '', id);
  const releases = [];
  if (book && fs.existsSync(dir)) {
    for (const version of fs.readdirSync(dir)) {
      if (version === 'latest') continue;
      const r = withUrls(read(path.join(dir, version, 'export.json')), `/exports/${book}/${id}/${version}`);
      if (r) releases.push(r);
    }
  }
  releases.sort((a, b) => String(b.exportedAt).localeCompare(String(a.exportedAt)));
  return { preview, releases };
}
