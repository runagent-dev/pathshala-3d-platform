// Builds a figure into a Chalk lab: ONE self-contained HTML file (spec 1.1 §3.1) that runs in the reader's sandbox, with no
// network. Nothing in the figure or the kit is changed: the figure's page (index.html) is the template, its scripts and
// stylesheets are bundled and inlined (fonts and small images as data: URLs), and three.js and its add-ons stay
// OUT of the file, imported by name and supplied by the reader as the lab's `libraries` (spec 1.5 §2).
//
// Build-time substitutions (esbuild plugin and defines, see runtime/):
//   shared/lib/bridge.js       → runtime/lab-bridge.js  (the figure's commands and events go to the lab adapter, not postMessage)
//   shared/lib/export-glb.js   → runtime/lab-export-glb.js (a lab has no GLB export; keeps GLTFExporter out of the libraries)
//   location.search            → what the designer's settings (and the reader's language) make of it
//   an entry that first runs runtime/lab-prelude.js (the Host API adapter), then the figure's own main.js
//
// The output is deterministic: the same inputs give the same bytes (no dates, no paths).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import * as esbuild from 'esbuild';
import { ASSETS_DIR, ROOT, SHARED_DIR } from '../paths.mjs';
import { labRuntimeManifest } from './fingerprint.mjs';

export const LAB_HTML_MAX_BYTES = 2 * 1024 * 1024; // spec 1.1 §3.4: a lab's HTML, hard limit
export const LAB_HTML_RECOMMENDED_BYTES = 300 * 1024; // spec 1.1 §3.4: recommended

const RUNTIME = path.join(ROOT, 'scripts', 'lib', 'library', 'runtime');
/** @type {Record<string, import('esbuild').Loader>} */
const DATA_URL = {
  '.woff2': 'dataurl',
  '.woff': 'dataurl',
  '.ttf': 'dataurl',
  '.png': 'dataurl',
  '.jpg': 'dataurl',
  '.jpeg': 'dataurl',
  '.webp': 'dataurl',
  '.svg': 'dataurl',
  '.gif': 'dataurl',
};
const EXTERNAL = ['three', 'three/addons/*'];

/** What a figure's index.html says: language, title, stylesheet and module script URLs (in order), and the body markup. */
export function readPage(html) {
  const text = html.replace(/<!--[\s\S]*?-->/g, '');
  const attr = (tag, name) => new RegExp(`\\b${name}\\s*=\\s*(["'])([^"']*)\\1`, 'i').exec(tag)?.[2];
  const styles = [];
  for (const m of text.matchAll(/<link\b[^>]*>/gi)) if (/\brel\s*=\s*(["'])stylesheet\1/i.test(m[0])) styles.push(attr(m[0], 'href'));
  let module = null;
  const inline = [];
  for (const m of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\btype\s*=\s*(["'])importmap\1/i.test(m[1])) continue;
    const src = attr(m[1], 'src');
    if (/\btype\s*=\s*(["'])module\1/i.test(m[1])) {
      if (src) module = src;
      else inline.push(m[2]);
    }
  }
  const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(text)?.[1] ?? '';
  return {
    lang: attr(/<html\b[^>]*>/i.exec(text)?.[0] ?? '', 'lang') || 'en',
    title: (/<title>([\s\S]*?)<\/title>/i.exec(text)?.[1] ?? '').trim(),
    viewport: attr(/<meta\b[^>]*name\s*=\s*(["'])viewport\1[^>]*>/i.exec(text)?.[0] ?? '', 'content') || 'width=device-width, initial-scale=1',
    styles: styles.filter(Boolean),
    module,
    inline,
    body: body.replace(/<script\b[\s\S]*?<\/script>/gi, '').trim(),
  };
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inScript = (code) => code.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
const inStyle = (css) => css.replace(/<\/(style)/gi, '<\\/$1');

/** esbuild plugin: the build-time substitutions listed at the top of this file. */
function labPlugin({ sharedDir }) {
  const bridge = path.join(sharedDir, 'lib', 'bridge.js');
  const exportGlb = path.join(sharedDir, 'lib', 'export-glb.js');
  return {
    name: 'pathshala-lab',
    setup(build) {
      build.onResolve({ filter: /^pathshala-lab-prelude$/ }, () => ({ path: path.join(RUNTIME, 'lab-prelude.js') }));
      build.onResolve({ filter: /(^|\/)(bridge|export-glb)\.js$/ }, async (args) => {
        if (args.pluginData?.pathshalaSkip) return null;
        const resolved = await build.resolve(args.path, { kind: args.kind, resolveDir: args.resolveDir, pluginData: { pathshalaSkip: true } });
        if (resolved.path === bridge) return { path: path.join(RUNTIME, 'lab-bridge.js') };
        if (resolved.path === exportGlb) return { path: path.join(RUNTIME, 'lab-export-glb.js') };
        return resolved;
      });
    },
  };
}

/** The figure's stylesheets, in page order, bundled into one string (fonts and images inlined as data: URLs). */
async function bundleCss(dir, hrefs) {
  if (!hrefs.length) return '';
  const result = await esbuild.build({
    stdin: { contents: hrefs.map((h) => `@import ${JSON.stringify(h)};`).join('\n'), resolveDir: dir, loader: 'css', sourcefile: 'lab-styles.css' },
    bundle: true,
    write: false,
    minify: true,
    loader: DATA_URL,
    legalComments: 'none',
    logLevel: 'silent',
  });
  return result.outputFiles[0].text.trim();
}

/** The figure's code, bundled to one ES module string; bare imports of three stay (they are the lab's libraries). */
async function bundleJs(dir, page, { sharedDir, lab }) {
  const mainPath = page.module ? path.resolve(dir, page.module) : null;
  const entry = [
    "import { labReady } from 'pathshala-lab-prelude';",
    'await labReady;',
    mainPath ? `await import(${JSON.stringify(mainPath)});` : page.inline.join('\n'),
  ].join('\n');
  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: dir, sourcefile: 'lab-entry.js' },
    bundle: true,
    write: false,
    format: 'esm',
    target: 'es2022',
    minify: true,
    legalComments: 'none',
    metafile: true,
    external: EXTERNAL,
    alias: { '@shared': path.join(sharedDir, 'lib') },
    define: { __PATHSHALA_LAB__: JSON.stringify(lab), 'location.search': 'globalThis.__pathshalaLab.search' },
    plugins: [labPlugin({ sharedDir })],
    logLevel: 'silent',
  });
  const externals = new Set();
  for (const out of Object.values(result.metafile.outputs)) for (const imp of out.imports) if (imp.external) externals.add(imp.path);
  return { code: result.outputFiles[0].text.trim(), externals: [...externals].sort(), warnings: result.warnings.map((w) => w.text) };
}

/** URLs in the finished file that would be fetched from the network (namespaces such as the SVG one do not count). */
export function networkReferences(html) {
  const found = new Set();
  for (const m of html.matchAll(/https?:\/\/[^\s"'`)<>\\]+/g)) {
    if (/^https?:\/\/(www\.w3\.org|w3\.org|schemas\.|purl\.org)/i.test(m[0])) continue;
    found.add(m[0].slice(0, 80));
  }
  return [...found].sort();
}

/**
 * Builds the lab file of one figure.
 *
 * @param {string} id
 * @param {{ assetsDir?: string, sharedDir?: string, labId: string, version: string }} options
 * @returns {Promise<{ html: string, bytes: number, gzipBytes: number, libraries: string[], warnings: string[], errors: string[] }>}
 *   `errors` is non-empty when the file cannot be published (over the size limit, network references): the caller fails that figure only.
 */
export async function bundleLab(id, { assetsDir = ASSETS_DIR, sharedDir = SHARED_DIR, labId, version }) {
  const dir = path.join(assetsDir, id);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'asset.json'), 'utf8'));
  const entry = manifest.entry || 'index.html';
  if (!/\.html?$/i.test(entry)) throw new Error(`${id} is not a page (its entry is ${entry}): it cannot be a lab`);
  const page = readPage(fs.readFileSync(path.join(dir, entry), 'utf8'));
  const css = await bundleCss(dir, page.styles);
  const js = await bundleJs(dir, page, { sharedDir, lab: { id: labId, version, manifest: labRuntimeManifest(manifest) } });

  const html = [
    '<!doctype html>',
    `<html lang="${escapeHtml(page.lang)}">`,
    '<head>',
    '<meta charset="utf-8">',
    `<meta name="viewport" content="${escapeHtml(page.viewport)}">`,
    `<title>${escapeHtml(page.title)}</title>`,
    `<style>${inStyle(css)}</style>`,
    '</head>',
    '<body>',
    page.body,
    `<script type="module">${inScript(js.code)}</script>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');

  const bytes = Buffer.byteLength(html, 'utf8');
  const gzipBytes = zlib.gzipSync(html, { level: 9 }).length;
  const warnings = [...js.warnings];
  const errors = [];
  if (bytes > LAB_HTML_MAX_BYTES) errors.push(`the lab is ${(bytes / 1024).toFixed(0)} KiB: over the 2 MiB limit (spec 1.1 §3.4)`);
  else if (bytes > LAB_HTML_RECOMMENDED_BYTES) warnings.push(`the lab is ${(bytes / 1024).toFixed(0)} KiB: over the recommended 300 KiB`);
  const network = networkReferences(html);
  if (network.length) errors.push(`the lab refers to the network (${network.slice(0, 3).join(', ')}): a lab has none`);
  return { html, bytes, gzipBytes, libraries: js.externals, warnings, errors };
}
