// The libraries a lab imports by name (spec 1.5 §2): three.js and the add-ons the figures use, each as ONE bundled ES module
// (no relative imports; an add-on imports the bare specifier `three`, which the reader maps to the lab's own `three`). They are
// built from the vendored copy in shared/vendor/three, so the lab runs the exact three.js this repo's figures were made and
// tested with, and they are published once and shared by every lab that names them (the same bytes are the same key).
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { SHARED_DIR } from '../paths.mjs';

/** The three.js version in shared/vendor/three/VERSION ("three r185.1 (npm three@0.185.1)" → "0.185.1"). */
export function vendoredThreeVersion(sharedDir = SHARED_DIR) {
  const text = fs.readFileSync(path.join(sharedDir, 'vendor', 'three', 'VERSION'), 'utf8');
  const m = /three@(\d+\.\d+\.\d+)/.exec(text);
  if (!m) throw new Error(`cannot read the three.js version from shared/vendor/three/VERSION: ${text.trim()}`);
  return m[1];
}

/** The vendored file a library specifier names, or null when it is not a three.js specifier. */
export function libraryEntry(specifier, sharedDir = SHARED_DIR) {
  const base = path.join(sharedDir, 'vendor', 'three');
  if (specifier === 'three') return path.join(base, 'three.module.min.js');
  if (specifier.startsWith('three/addons/')) return path.join(base, 'addons', specifier.slice('three/addons/'.length));
  return null;
}

/** Builds one library: { specifier, version, bytes (Buffer) }. Throws for a specifier this repo does not vendor. */
export async function buildLibrary(specifier, { sharedDir = SHARED_DIR } = {}) {
  const entry = libraryEntry(specifier, sharedDir);
  if (!entry || !fs.existsSync(entry))
    throw new Error(`no vendored library for "${specifier}": a lab may import only what shared/vendor/three provides`);
  const result = await esbuild.build({
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
  return { specifier, version: vendoredThreeVersion(sharedDir), bytes: Buffer.from(result.outputFiles[0].contents) };
}
