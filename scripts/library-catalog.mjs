#!/usr/bin/env node
// Refreshes the pinned catalog of shared lab libraries from chalk-format (docs/library-sync.md, decision 0008).
//
//   npm run library:catalog -- --from ../chalk-format/libraries/catalog.json     a file, or a chalk-format checkout
//   npm run library:catalog -- --from https://raw.githubusercontent.com/runagent-dev/chalk-format/<ref>/libraries/catalog.json
//   npm run library:catalog -- --from <file> --dry-run                            only show the difference
//
// It validates the catalog, shows what changes (a different key is a different copy of three.js in the book), writes
// scripts/lib/library/lab-library-catalog.json and says what else must move with it (three, esbuild-catalog). Nothing else is
// written, and no library is contacted. With --from a URL the only network request is that one GET.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { parseArgs } from 'node:util';
import * as esbuildCatalog from 'esbuild-catalog';
import { CATALOG_FILE, catalogVersion, diffCatalogs, libraryPreflight, loadCatalog, validateCatalog } from './lib/library/catalog.mjs';

const HELP =
  'Usage: npm run library:catalog -- --from <catalog.json | chalk-format checkout | https URL> [--ref <name>] [--commit <sha>] [--dry-run]';
let values;
try {
  ({ values } = parseArgs({
    options: {
      from: { type: 'string' },
      ref: { type: 'string' },
      commit: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: false,
  }));
} catch (err) {
  console.error(`${err.message}\n${HELP}`);
  process.exit(2);
}
if (values.help || !values.from) {
  console.log(HELP);
  process.exit(values.help ? 0 : 2);
}

const git = (cwd, ...args) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};

try {
  let text;
  let commit = values.commit;
  let ref = values.ref;
  if (/^https?:\/\//.test(values.from)) {
    const res = await fetch(values.from);
    if (!res.ok) throw new Error(`${values.from}: HTTP ${res.status}`);
    text = await res.text();
    const m = /raw\.githubusercontent\.com\/[^/]+\/[^/]+\/([^/]+)\//.exec(values.from);
    if (m) {
      if (/^[0-9a-f]{40}$/.test(m[1])) commit ??= m[1];
      else ref ??= m[1];
    }
  } else {
    let file = path.resolve(values.from);
    if (fs.statSync(file).isDirectory())
      file = fs.existsSync(path.join(file, 'libraries', 'catalog.json'))
        ? path.join(file, 'libraries', 'catalog.json')
        : path.join(file, 'catalog.json');
    text = fs.readFileSync(file, 'utf8');
    const dir = path.dirname(file);
    commit ??= git(dir, 'rev-parse', 'HEAD') ?? undefined;
    ref ??= git(dir, 'rev-parse', '--abbrev-ref', 'HEAD') ?? undefined;
    if (commit && git(dir, 'status', '--porcelain', '--', file))
      console.log('note: the catalog file has uncommitted changes, so the commit recorded does not describe it');
  }

  const incoming = JSON.parse(text);
  const doc = {
    about:
      'The shared lab libraries (spec 1.5 §2), pinned from chalk-format. Do not edit by hand: npm run library:catalog -- --from <chalk-format>/libraries/catalog.json',
    source: {
      repo: 'runagent-dev/chalk-format',
      path: 'libraries/catalog.json',
      ...(ref ? { ref } : {}),
      ...(commit ? { commit } : {}),
      // chalk-format's catalog does not say which esbuild built it; this is the one this repo builds the libraries with
      esbuild: esbuildCatalog.version,
    },
    libraries: (incoming.libraries ?? []).map(({ specifier, version, file, size, key }) => ({ specifier, version, file, size, key })),
  };
  const problems = validateCatalog(doc);
  if (problems.length) {
    console.error(`library:catalog: that is not a usable catalog:\n  - ${problems.join('\n  - ')}`);
    process.exit(1);
  }

  const before = fs.existsSync(CATALOG_FILE) ? loadCatalog() : null;
  const diff = diffCatalogs(before, doc);
  if (!diff.length) console.log(`library:catalog: no change (three ${catalogVersion(doc)}, ${doc.libraries.length} libraries).`);
  else {
    console.log(
      `library:catalog: ${diff.length} change${diff.length === 1 ? '' : 's'} (a changed key is a different copy of the library in every book):`,
    );
    for (const line of diff) console.log(`  ${line}`);
  }
  if (values['dry-run']) {
    console.log('dry run: nothing written.');
  } else {
    fs.writeFileSync(CATALOG_FILE, `${JSON.stringify(doc, null, 2)}\n`);
    console.log(`written: ${path.relative(process.cwd(), CATALOG_FILE)}`);
  }
  const todo = libraryPreflight({ catalog: doc });
  if (todo.length) {
    console.log('\nThis repo does not match that catalog yet:');
    for (const t of todo) console.log(`  - ${t}`);
  }
  if (diff.length && before && catalogVersion(before) !== catalogVersion(doc))
    console.log('\nThe three.js version changed: every lab is rebuilt by the next `npm run library:sync` (the fingerprints include the catalog).');
} catch (err) {
  console.error(`library:catalog: ${err.message}`);
  process.exit(2);
}
