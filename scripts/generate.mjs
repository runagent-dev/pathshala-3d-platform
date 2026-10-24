#!/usr/bin/env node
// Writes the files that are generated from other files in the repo. `npm run check` fails when one of them
// is out of date, so run this after changing their source.
//
//   npm run generate            write them
//   npm run generate -- --check only report which are stale (exit 1 if any)
//
//   schemas/asset.schema.json   ← scripts/lib/manifest/spec.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/paths.mjs';
import { MANIFEST_SCHEMA } from './lib/manifest/index.mjs';

export function generatedFiles() {
  return [
    {
      file: path.join(ROOT, 'schemas', 'asset.schema.json'),
      source: 'scripts/lib/manifest/spec.mjs',
      content: `${JSON.stringify(MANIFEST_SCHEMA, null, 2)}\n`,
    },
  ];
}

/** The generated files whose content on disk differs from what they should be. */
export function staleFiles() {
  return generatedFiles().filter((g) => !fs.existsSync(g.file) || fs.readFileSync(g.file, 'utf8') !== g.content);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const checkOnly = process.argv.includes('--check');
  const stale = staleFiles();
  for (const g of stale) {
    const rel = path.relative(ROOT, g.file);
    if (checkOnly) console.log(`✗ ${rel} is out of date (from ${g.source}): run npm run generate`);
    else {
      fs.mkdirSync(path.dirname(g.file), { recursive: true });
      fs.writeFileSync(g.file, g.content);
      console.log(`✓ wrote ${rel}`);
    }
  }
  if (!stale.length) console.log('Generated files are up to date.');
  if (checkOnly && stale.length) process.exitCode = 1;
}
