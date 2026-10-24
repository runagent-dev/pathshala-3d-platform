// README sections generated from asset.json (URL parameters, commands, events) must be current.
import fs from 'node:fs';
import path from 'node:path';
import { applySections, readmeSections } from '../../docs.mjs';

export default {
  name: 'readme',
  scope: 'figure',
  run({ dir, manifest }) {
    const file = path.join(dir, 'README.md');
    if (!manifest || !fs.existsSync(file)) return [];
    const text = fs.readFileSync(file, 'utf8');
    const next = applySections(text, readmeSections(manifest));
    if (next === text) return [];
    return [
      {
        level: 'error',
        file: 'README.md',
        message: 'generated sections are out of date: run `npm run docs` (or npm run check -- --fix)',
        fix: () => fs.writeFileSync(file, next),
      },
    ];
  },
};
