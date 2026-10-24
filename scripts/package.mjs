#!/usr/bin/env node
// Usage: npm run package -- <asset-id> [more-ids...]   |   npm run package:all
import { listAssets } from './lib/assets.mjs';
import { packageAsset } from './lib/package.mjs';

const args = process.argv.slice(2);
const ids = args.includes('--all') ? (await listAssets()).map((a) => a.id) : args.filter((a) => !a.startsWith('-'));

if (!ids.length) {
  console.log('Usage: npm run package -- <asset-id> [more-ids...]\n       npm run package:all');
  process.exit(1);
}

for (const id of ids) {
  try {
    const r = await packageAsset(id);
    console.log(`✓ ${id}: ${r.files} files, ${(r.bytes / 1024).toFixed(0)} KB → ${r.zip}`);
  } catch (err) {
    console.error(`✗ ${id}: ${err.message}`);
    process.exitCode = 1;
  }
}
