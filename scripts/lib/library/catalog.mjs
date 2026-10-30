// The pinned catalog of shared lab libraries (docs/library-sync.md, decision 0008). chalk-format builds three.js and a few add-ons
// ONCE (tools/lab-libraries.ts, libraries/catalog.json) so that every lab in every book names the same bytes, the same `c1:` key,
// and a book carries one copy. This repo pins a copy of that catalog and builds its libraries to match it, byte for byte.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../paths.mjs';

export const CATALOG_FILE = path.join(ROOT, 'scripts', 'lib', 'library', 'lab-library-catalog.json');
const KEY_RE = /^c1:[a-z2-7]{26}$/;

/** @typedef {{ specifier: string, version: string, key: string, size?: number, file?: string }} CatalogLibrary */
/** @typedef {{ about?: string, source: { repo: string, path: string, ref?: string, commit?: string, from?: string, esbuild?: string }, libraries: CatalogLibrary[] }} Catalog */

/** Problems with a catalog document; empty means it can be used. */
export function validateCatalog(doc) {
  const problems = [];
  const need = (ok, text) => ok || problems.push(text);
  need(doc && typeof doc === 'object', 'the catalog is not an object');
  need(doc?.source && typeof doc.source.repo === 'string' && typeof doc.source.path === 'string', 'source.repo and source.path are missing');
  need(Array.isArray(doc?.libraries) && doc.libraries.length > 0, 'libraries is empty');
  const seen = new Set();
  const versions = new Set();
  for (const l of doc?.libraries || []) {
    need(
      typeof l.specifier === 'string' && (l.specifier === 'three' || l.specifier.startsWith('three/addons/')),
      `library ${l.specifier}: only three and three/addons/* are shared`,
    );
    need(/^\d+\.\d+\.\d+$/.test(l.version || ''), `library ${l.specifier}: version "${l.version}" is not x.y.z`);
    need(KEY_RE.test(l.key || ''), `library ${l.specifier}: key "${l.key}" is not an asset key (c1:…)`);
    need(!seen.has(l.specifier), `library ${l.specifier}: listed twice`);
    seen.add(l.specifier);
    versions.add(l.version);
  }
  need(seen.has('three'), 'the catalog has no "three" core library');
  need(versions.size <= 1, `the libraries are of different three.js versions (${[...versions].join(', ')})`);
  return problems;
}

/** The pinned catalog, validated. Throws with the problems when it is not usable. */
export function loadCatalog(file = CATALOG_FILE) {
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const problems = validateCatalog(doc);
  if (problems.length) throw new Error(`${path.relative(ROOT, file)} is not a valid catalog: ${problems.join('; ')}`);
  return doc;
}

/** The three.js version the catalog is of. */
export const catalogVersion = (catalog) => catalog.libraries.find((l) => l.specifier === 'three').version;

/** A short hash of what the catalog says (specifier, version, key), not of how it was fetched: it goes in every lab fingerprint. */
export function catalogHash(catalog) {
  const rows = catalog.libraries.map((l) => `${l.specifier}\0${l.version}\0${l.key}`).sort();
  return crypto.createHash('sha256').update(rows.join('\n')).digest('hex').slice(0, 16);
}

/** The catalog of a repo copy (`root`), or null when it has none (a test copy). */
export function catalogHashOf(root = ROOT) {
  const file = path.join(root, 'scripts', 'lib', 'library', 'lab-library-catalog.json');
  try {
    return catalogHash(loadCatalog(file));
  } catch {
    return null;
  }
}

/** What differs between two catalogs, one line each. */
export function diffCatalogs(before, after) {
  const lines = [];
  const a = new Map((before?.libraries || []).map((l) => [l.specifier, l]));
  const b = new Map((after?.libraries || []).map((l) => [l.specifier, l]));
  for (const [s, l] of b) {
    const old = a.get(s);
    if (!old) lines.push(`+ ${s} ${l.version} ${l.key}`);
    else if (old.key !== l.key || old.version !== l.version) lines.push(`~ ${s} ${old.version} ${old.key} → ${l.version} ${l.key}`);
  }
  for (const [s, l] of a) if (!b.has(s)) lines.push(`- ${s} ${l.version} ${l.key}`);
  return lines;
}

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

/**
 * What stops this repo from building the catalog's libraries: its three.js (package.json, the vendored copy the figures run,
 * the installed package) must be the version the catalog is of. Each problem is ONE line that says how to fix it.
 * @returns {string[]}
 */
export function libraryPreflight({
  root = ROOT,
  catalog = loadCatalog(path.join(root, 'scripts', 'lib', 'library', 'lab-library-catalog.json')),
} = {}) {
  const want = catalogVersion(catalog);
  const problems = [];
  const declared =
    readJson(path.join(root, 'package.json'))?.devDependencies?.three ?? readJson(path.join(root, 'package.json'))?.dependencies?.three;
  if (declared !== want)
    problems.push(
      `package.json has three ${declared ?? '(none)'} but the pinned catalog is three ${want}: run \`npm install --save-exact three@${want} && npm run vendor:three\`, or refresh the catalog with \`npm run library:catalog -- --from <chalk-format>/libraries/catalog.json\``,
    );
  const vendored = /three@(\d+\.\d+\.\d+)/.exec(
    fs.existsSync(path.join(root, 'shared/vendor/three/VERSION')) ? fs.readFileSync(path.join(root, 'shared/vendor/three/VERSION'), 'utf8') : '',
  )?.[1];
  if (vendored !== want)
    problems.push(
      `shared/vendor/three is three ${vendored ?? '(unknown)'} but the pinned catalog is three ${want}: run \`npm run vendor:three\` after installing three@${want}`,
    );
  const installed = readJson(path.join(root, 'node_modules', 'three', 'package.json'))?.version;
  if (installed && installed !== want)
    problems.push(`node_modules/three is ${installed} but the pinned catalog is three ${want}: run \`npm install\``);
  return problems;
}
