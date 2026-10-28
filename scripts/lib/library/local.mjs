// What the repo says about each figure, in the form the planner takes (plan.mjs): its fingerprints, what would be published, and
// the reasons it may not be published at all (gates). Reads files and git; never the network.
import fs from 'node:fs';
import path from 'node:path';
import { loadBooks } from '../books.mjs';
import { gitInfo } from '../git.mjs';
import { ASSETS_DIR, ID_RE, ROOT, SHARED_DIR } from '../paths.mjs';
import { readStatus } from '../status.mjs';
import { explainChange, fingerprintFigure } from './fingerprint.mjs';
import { labId, publishedVersion, resolveLicense } from './manifest.mjs';
import { tagValue } from './manifest.mjs';

/** The ids of the figures in the repo (folders with an asset.json), sorted. */
export function figureIds(assetsDir = ASSETS_DIR) {
  if (!fs.existsSync(assetsDir)) return [];
  return fs
    .readdirSync(assetsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && ID_RE.test(e.name) && fs.existsSync(path.join(assetsDir, e.name, 'asset.json')))
    .map((e) => e.name)
    .sort();
}

/** The poses a figure exports as models: its export.glb list, one "default" for a model figure, none when skipped. */
export function posesOf(asset) {
  if (Array.isArray(asset.export?.glb)) return asset.export.glb.map((p) => p.name);
  return asset.type === 'model' ? ['default'] : [];
}

/** Figures whose fingerprinted files include one of `files` (paths relative to the repo root, as git prints them). */
export function figuresTouchedBy(files, locals) {
  const changed = new Set(files);
  return locals
    .filter((l) => {
      const own = Object.keys(l.fp.files.own).map((f) => `assets/${l.id}/${f}`);
      const shared = Object.keys(l.fp.files.shared).map((f) => `shared/${f}`);
      return [...own, `assets/${l.id}/asset.json`, ...shared].some((f) => changed.has(f));
    })
    .map((l) => l.id);
}

/**
 * Describes one figure for the sync.
 * @param {string} id
 * @param {{ tier: 'staging'|'production', formats: Set<string>, license: string|null, remote?: { manifests: object[] },
 *           tools?: object, code?: object, books?: object[], state?: object|null, assetsDir?: string, sharedDir?: string, root?: string }} ctx
 */
export async function describeFigure(id, ctx) {
  const { tier, formats, license, remote, assetsDir = ASSETS_DIR, sharedDir = SHARED_DIR, root = ROOT } = ctx;
  const problems = [];
  const warnings = [];
  const manifestFile = path.join(assetsDir, id, 'asset.json');
  let asset;
  try {
    asset = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  } catch (err) {
    return { id, asset: null, problems: [`asset.json cannot be read: ${err.message}`], warnings, formats, fp: null };
  }
  if (asset.id !== id) problems.push(`asset.json says id "${asset.id}", the folder is "${id}"`);
  if (!asset.version) problems.push('asset.json has no version');

  const fp = fingerprintFigure(id, { assetsDir, sharedDir, root, tools: ctx.tools, code: ctx.code });
  for (const p of fp.problems) problems.push(`its imports: ${typeof p === 'string' ? p : p.message || JSON.stringify(p)}`);
  const fp8 = fp.sourceHash.slice(0, 8);
  const isPage = /\.html?$/i.test(asset.entry || 'index.html');
  const book = (ctx.books || loadBooks()).find((b) => b.id === asset.book) || null;
  if (!book) problems.push(`book "${asset.book}" is not in books/books.json`);
  const poses = posesOf(asset);

  // the library already has this version of the figure with other contents (in any state): the version was not bumped
  const unbumped = (remote?.manifests || []).some((r) => tagValue(r, 'figure-version') === asset.version && tagValue(r, 'source') !== fp8);

  const git = gitInfo([
    ...Object.keys(fp.files.own).map((f) => path.join('assets', id, f)),
    path.join('assets', id, 'asset.json'),
    ...Object.keys(fp.files.shared).map((f) => path.join('shared', f)),
  ]);
  const status = (await readStatus(id)).status;
  if (tier === 'production') {
    if (!git) problems.push('not a git checkout: production needs the commit it publishes');
    else if (git.dirty) problems.push('the figure or the kit files it imports have uncommitted changes: production publishes from a clean worktree');
    if (unbumped) problems.push(`the library already has ${asset.version} with other contents: bump the version in asset.json`);
    const lic = resolveLicense({ cli: license, config: null, tier });
    problems.push(...lic.problems);
  } else if (unbumped) {
    warnings.push(
      `version ${asset.version} is already in the library with other contents: published as ${publishedVersion(asset.version, fp.lab?.slice(0, 8) || fp8, { unbumped })}`,
    );
  }
  if (!isPage && asset.type !== 'model') problems.push(`its entry ${asset.entry} is not a page`);

  const before = ctx.state?.fp ? ctx.state : null;
  return {
    id,
    asset,
    book,
    isPage,
    labId: book ? labId(book.subject, id) : null,
    poses,
    hasVideo: Boolean(asset.export?.video),
    status,
    fp,
    fp8,
    version: publishedVersion(asset.version, fp.lab?.slice(0, 8) || fp8, { unbumped }),
    unbumped,
    commit: git?.commit || null,
    formats,
    problems,
    warnings,
    changes: before ? explainChange(before.fp, { files: fp.files, tools: fp.tools }) : [],
  };
}
