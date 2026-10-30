// What a figure is made of, as hashes: the library sync republishes a figure only when these change.
//
//   sourceHash   all the inputs together: the figure's own deliverable files, the shared files in ITS import closure,
//                its asset.json and the tool versions
//   lab / glb / poster   one hash per kind of artifact, over only what that artifact depends on (a change to the
//                exporter does not rebuild labs; a change to the lab adapter does not re-export GLBs)
//
// A change to a kit module under shared/lib/ changes exactly the figures whose import closure reaches that module
// (found by reading their imports: scripts/lib/depgraph.mjs), not every figure. Node built-ins and the repo's own
// modules only.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DEV_ONLY_DIRS, DEV_ONLY_FILES } from '../assets.mjs';
import { figureGraph } from '../depgraph.mjs';
import { ASSETS_DIR, ROOT, SHARED_DIR } from '../paths.mjs';
import { catalogHashOf } from './catalog.mjs';
import { walkFilesSync } from './files.mjs';

/** Bump when the shape of what the sync publishes changes (tags, manifest fields, artifact set): everything is rebuilt. */
export const LIBRARY_FORMAT_VERSION = 1;

export const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const readText = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : '');

/** asset.json fields that say nothing about how a figure runs, looks or exports (docs, people, ordering). */
export const DESCRIPTIVE_FIELDS = [
  '$schema',
  'title',
  'description',
  'tags',
  'maintainers',
  'placement',
  'order',
  'commands',
  'events',
  'packageExclude',
];

/** The asset.json fields a lab needs at run time (the kit reads these); everything else about the figure goes in the lab's manifest, not its bytes. */
export const LAB_RUNTIME_FIELDS = ['id', 'version', 'type', 'units', 'book', 'page', 'topic', 'params'];
export const labRuntimeManifest = (manifest) => Object.fromEntries(LAB_RUNTIME_FIELDS.filter((k) => k in manifest).map((k) => [k, manifest[k]]));

/** The tool and dependency versions that change what is built. `root` is the repo root (tests use a copy). */
export function toolVersions(root = ROOT, { libraries = 'catalog' } = {}) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const dev = pkg.devDependencies || {};
  const installed = (name) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8')).version;
    } catch {
      return dev[name] || null;
    }
  };
  return {
    format: LIBRARY_FORMAT_VERSION,
    esbuild: installed('esbuild'),
    chalkCore: installed('@chalk-format/core'),
    playwright: installed('@playwright/test'),
    gltfTransform: installed('@gltf-transform/core'),
    gltfValidator: installed('gltf-validator'),
    three: readText(path.join(root, 'shared/vendor/three/VERSION')),
    // the shared libraries a lab imports: the pinned catalog (specifiers, versions, keys), or own copies built here
    libraries: libraries === 'own' ? 'own' : `catalog:${catalogHashOf(root)}`,
    kit: readText(path.join(root, 'shared/lib/VERSION')),
  };
}

/** One hash over the code that builds the artifacts: the lab bundler and its runtime, and the exporter. */
export function buildCodeHashes(root = ROOT) {
  const hashFiles = (files) =>
    sha256(
      files
        .filter((f) => fs.existsSync(f))
        .sort()
        .map((f) => `${path.relative(root, f)}\0${sha256(fs.readFileSync(f))}`)
        .join('\n'),
    );
  const runtimeDir = path.join(root, 'scripts/lib/library/runtime');
  const lab = [...walkFilesSync(runtimeDir).map((f) => path.join(runtimeDir, f)), path.join(root, 'scripts/lib/library/bundle-lab.mjs')];
  const exporter = [
    'scripts/lib/export/exporter.mjs',
    'scripts/lib/export/glb.mjs',
    'scripts/lib/export/driver.mjs',
    'scripts/lib/export/virtual-time.js',
  ].map((f) => path.join(root, f));
  return { lab: hashFiles(lab), exporter: hashFiles(exporter) };
}

/**
 * The files a figure's artifacts depend on, each with its hash:
 *   own      the figure's deliverable files (its folder minus dev-only files and folders, packageExclude and documents)
 *   shared   shared/ files its page reaches (import closure), apart from vendored libraries
 * and the figure's asset.json. Vendored three.js is covered by its version (toolVersions().three), not hashed.
 */
export function figureInputs(id, { assetsDir = ASSETS_DIR, sharedDir = SHARED_DIR } = {}) {
  const dir = path.join(assetsDir, id);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'asset.json'), 'utf8'));
  const entry = manifest.entry || (manifest.type === 'model' ? 'model.glb' : 'index.html');
  const exclude = new Set(manifest.packageExclude || []);
  const own = {};
  for (const rel of walkFilesSync(dir)) {
    const base = path.basename(rel);
    if (rel === 'asset.json') continue; // counted through its fields below, so a changed description does not rebuild a lab
    if (
      DEV_ONLY_FILES.has(base) ||
      DEV_ONLY_DIRS.has(rel.split(path.sep)[0]) ||
      exclude.has(rel) ||
      base.startsWith('.') ||
      /\.(md|tmp)$/i.test(base)
    )
      continue;
    own[rel.split(path.sep).join('/')] = sha256(fs.readFileSync(path.join(dir, rel)));
  }
  const shared = {};
  const problems = [];
  if (/\.html?$/i.test(entry)) {
    const graph = figureGraph(dir, entry, { allowed: [dir, sharedDir] });
    problems.push(...graph.problems);
    for (const f of graph.files) {
      if (!f.startsWith(sharedDir + path.sep)) continue;
      const rel = path.relative(sharedDir, f).split(path.sep).join('/');
      if (rel.startsWith('vendor/')) continue;
      shared[rel] = sha256(fs.readFileSync(f));
    }
  }
  return { id, manifest, entry, own, shared, problems };
}

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, stable(value[k])]),
    );
  return value;
};
export const hashJson = (value) => sha256(JSON.stringify(stable(value)));

/**
 * The fingerprints of a figure: { sourceHash, lab, glb, poster, video, files, tools } (the hashes are hex SHA-256; `lab` is null
 * for a figure that is not a page). `files` lists every file hash, so a later run can say which files changed.
 */
export function fingerprintFigure(
  id,
  { assetsDir = ASSETS_DIR, sharedDir = SHARED_DIR, root = ROOT, tools = toolVersions(root), code = buildCodeHashes(root) } = {},
) {
  const inputs = figureInputs(id, { assetsDir, sharedDir });
  const files = { own: inputs.own, shared: inputs.shared };
  // what the exporter reads: everything but the descriptive fields; the version is left out (a change that matters is in the files)
  const runtimeManifest = Object.fromEntries(Object.entries(inputs.manifest).filter(([k]) => !DESCRIPTIVE_FIELDS.includes(k) && k !== 'version'));
  const isPage = /\.html?$/i.test(inputs.entry);
  // a lab inlines the runtime fields of asset.json (and its version), so those count for the lab; a changed description does not rebuild it
  const lab = hashJson({
    kind: 'lab',
    files,
    manifest: labRuntimeManifest(inputs.manifest),
    tools: {
      format: tools.format,
      esbuild: tools.esbuild,
      chalkCore: tools.chalkCore,
      three: tools.three,
      libraries: tools.libraries,
      kit: tools.kit,
    },
    code: code.lab,
  });
  const glb = hashJson({
    kind: 'glb',
    files,
    manifest: runtimeManifest,
    tools: {
      format: tools.format,
      playwright: tools.playwright,
      gltfTransform: tools.gltfTransform,
      gltfValidator: tools.gltfValidator,
      three: tools.three,
      kit: tools.kit,
    },
    code: code.exporter,
  });
  const poster = hashJson({
    kind: 'poster',
    files,
    manifest: runtimeManifest,
    tools: { format: tools.format, playwright: tools.playwright, three: tools.three, kit: tools.kit },
    code: code.exporter,
  });
  const video = hashJson({
    kind: 'video',
    files,
    manifest: runtimeManifest,
    tools: { format: tools.format, playwright: tools.playwright, three: tools.three, kit: tools.kit },
    code: code.exporter,
  });
  const sourceHash = hashJson({ files, manifest: inputs.manifest, tools });
  return { id, sourceHash, lab: isPage ? lab : null, glb, poster, video, files, tools, problems: inputs.problems };
}

/** Why two fingerprints differ: which files were added, removed or changed, and which tool versions moved. */
export function explainChange(before, after) {
  const reasons = [];
  for (const group of ['own', 'shared']) {
    const a = before?.files?.[group] || {};
    const b = after?.files?.[group] || {};
    const prefix = group === 'shared' ? 'shared/' : '';
    for (const f of Object.keys(b)) if (!(f in a)) reasons.push(`added ${prefix}${f}`);
    for (const f of Object.keys(a)) if (!(f in b)) reasons.push(`removed ${prefix}${f}`);
    for (const f of Object.keys(b)) if (f in a && a[f] !== b[f]) reasons.push(group === 'shared' ? `kit module shared/${f}` : `file ${f}`);
  }
  for (const [k, v] of Object.entries(after?.tools || {}))
    if (before?.tools && before.tools[k] !== v) reasons.push(`tool ${k} ${before.tools[k]} → ${v}`);
  return reasons;
}
