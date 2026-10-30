// The libraries a lab imports by name (spec 1.5 §2): three.js and the add-ons the figures use, each as ONE bundled ES module
// (no relative imports; an add-on imports the bare specifier `three`, which the reader maps to the lab's own `three`).
//
// Default (`--libraries catalog`): built with chalk-format's exact recipe (tools/lab-libraries.ts) from the npm `three` package
// and checked against the pinned catalog (lab-library-catalog.json). The same bytes are the same `c1:` key, so a book that
// holds labs made here and labs made with chalk-format carries ONE copy of three.js. A build whose key differs from the catalog
// is never published: it throws, with the cause (three or esbuild is not the version the catalog was built with) and the fix.
//   catalog:shared  in the catalog and built to the catalog's key
//   catalog:extra   an add-on the catalog does not list yet, built the same way (a candidate for the catalog)
// `--libraries own`: the old behaviour, built from shared/vendor/three with this repo's esbuild; own copies, nothing shared.
//   catalog:own
import fs from 'node:fs';
import path from 'node:path';
import { assetKey } from '@chalk-format/core';
import * as esbuildOwn from 'esbuild';
// The catalog's bytes depend on the esbuild that built them, so that esbuild is pinned apart from the one that bundles labs
// (package.json: "esbuild-catalog": "npm:esbuild@<chalk-format's version>").
import * as esbuildCatalog from 'esbuild-catalog';
import { ROOT, SHARED_DIR } from '../paths.mjs';
import { CATALOG_FILE, catalogVersion, loadCatalog } from './catalog.mjs';

export const LIBRARY_MODES = ['catalog', 'own'];

/** chalk-format's recipe, field for field (tools/lab-libraries.ts). Changing any of it changes every key.
 * @returns {import('esbuild-catalog').BuildOptions} */
const catalogRecipe = (specifier) => ({
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2020',
  external: specifier === 'three' ? [] : ['three'],
  write: false,
  legalComments: 'inline',
  logLevel: 'error',
});

/** The three.js version in shared/vendor/three/VERSION ("three r185.1 (npm three@0.185.1)" → "0.185.1"). */
export function vendoredThreeVersion(sharedDir = SHARED_DIR) {
  const text = fs.readFileSync(path.join(sharedDir, 'vendor', 'three', 'VERSION'), 'utf8');
  const m = /three@(\d+\.\d+\.\d+)/.exec(text);
  if (!m) throw new Error(`cannot read the three.js version from shared/vendor/three/VERSION: ${text.trim()}`);
  return m[1];
}

/** The installed npm package: { dir, version }. (three's exports do not list package.json, so it is read from the folder.) */
export function installedThree(root = ROOT) {
  const dir = path.join(root, 'node_modules', 'three');
  const file = path.join(dir, 'package.json');
  if (!fs.existsSync(file)) throw new Error('three is not installed: run `npm install`');
  return { dir, version: JSON.parse(fs.readFileSync(file, 'utf8')).version };
}

/** The file in the npm package a specifier is built from (chalk-format's table), or null when it is not a three.js specifier. */
export function packageEntry(specifier, threeDir) {
  if (specifier === 'three') return path.join(threeDir, 'build', 'three.module.js');
  if (specifier.startsWith('three/addons/')) return path.join(threeDir, 'examples', 'jsm', specifier.slice('three/addons/'.length));
  return null;
}

/** The vendored file a specifier names for `--libraries own`, or null when it is not a three.js specifier. */
export function libraryEntry(specifier, sharedDir = SHARED_DIR) {
  const base = path.join(sharedDir, 'vendor', 'three');
  if (specifier === 'three') return path.join(base, 'three.module.min.js');
  if (specifier.startsWith('three/addons/')) return path.join(base, 'addons', specifier.slice('three/addons/'.length));
  return null;
}

/** Thrown when a build is not the bytes the catalog names. Carries the reason and the fix in its message. */
export class CatalogMismatch extends Error {
  constructor(specifier, got, catalog, lib, root) {
    const tree = (() => {
      try {
        return `this repo built it with three ${installedThree(root).version} and esbuild ${esbuildCatalog.version}`;
      } catch {
        return 'three is not installed';
      }
    })();
    const built = catalog.source?.esbuild ? ` and esbuild ${catalog.source.esbuild}` : '';
    super(
      `${specifier} built to ${got} but the catalog pins ${lib.key}: ${tree}; the catalog was built with three ${lib.version}${built}. ` +
        `Install exactly those (npm install --save-exact three@${lib.version} esbuild-catalog@npm:esbuild@${catalog.source?.esbuild ?? "<chalk-format's version>"}), ` +
        'or refresh the catalog (npm run library:catalog -- --from <chalk-format>/libraries/catalog.json), or publish own copies with --libraries own.',
    );
    this.name = 'CatalogMismatch';
    this.specifier = specifier;
  }
}

/**
 * Builds one library: { specifier, version, bytes (Buffer), key, origin: 'shared' | 'extra' | 'own' }.
 * Throws CatalogMismatch when a catalog library does not build to the catalog's key, and for a specifier that does not exist.
 * @param {string} specifier
 * @param {{ libraries?: 'catalog' | 'own', catalog?: import('./catalog.mjs').Catalog, root?: string, sharedDir?: string }} [o]
 */
export async function buildLibrary(specifier, { libraries = 'catalog', catalog, root = ROOT, sharedDir = SHARED_DIR } = {}) {
  if (libraries === 'own') {
    const entry = libraryEntry(specifier, sharedDir);
    if (!entry || !fs.existsSync(entry))
      throw new Error(`no vendored library for "${specifier}": a lab may import only what shared/vendor/three provides`);
    const result = await esbuildOwn.build({
      entryPoints: [entry],
      bundle: true,
      write: false,
      format: 'esm',
      target: 'es2022',
      minify: true,
      legalComments: 'inline',
      external: specifier === 'three' ? [] : ['three'],
      logLevel: 'silent',
    });
    const bytes = Buffer.from(result.outputFiles[0].contents);
    return { specifier, version: vendoredThreeVersion(sharedDir), bytes, key: await assetKey(bytes), origin: 'own' };
  }

  const pinned = catalog ?? loadCatalog(path.join(root, path.relative(ROOT, CATALOG_FILE)));
  const three = installedThree(root);
  const entry = packageEntry(specifier, three.dir);
  if (!entry || !fs.existsSync(entry))
    throw new Error(`no library "${specifier}": a lab may import only three and the add-ons of the three package (three/addons/…)`);
  const lib = pinned.libraries.find((l) => l.specifier === specifier);
  const want = catalogVersion(pinned);
  if (three.version !== want)
    throw new Error(
      `three ${three.version} is installed but the catalog is of three ${want}: run \`npm install --save-exact three@${want}\` (or refresh the catalog with npm run library:catalog)`,
    );
  const result = await esbuildCatalog.build({ entryPoints: [entry], ...catalogRecipe(specifier) });
  const bytes = Buffer.from(result.outputFiles[0].contents);
  const key = await assetKey(bytes);
  if (lib && key !== lib.key) throw new CatalogMismatch(specifier, key, pinned, lib, root);
  return { specifier, version: three.version, bytes, key, origin: lib ? 'shared' : 'extra' };
}

/** The tag a published library carries for its origin: catalog:shared | catalog:extra | catalog:own. */
export const catalogTag = (origin) => `catalog:${origin}`;
