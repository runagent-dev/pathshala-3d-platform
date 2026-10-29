// asset.json → the library's records: the `chalk.lab` manifest (spec 1.5 §4) and the tags every published item carries.
//
// The manifest is bytes in the library (type application/vnd.chalk.lab+json), so it is built to be deterministic: the same figure
// at the same version gives the same bytes. Nothing in it is a date, a commit or a path. What changes with every publish
// (commit, fingerprints, when) lives in the item's tags, which the library lets us update.
import { checkLabParams, labManifestSchema, labParams } from '@chalk-format/core';
import { LIBRARY_FORMAT_VERSION } from './fingerprint.mjs';

export const LAB_MANIFEST_TYPE = 'application/vnd.chalk.lab+json';
export const LAB_HTML_TYPE = 'text/html';
export const LIBRARY_JS_TYPE = 'text/javascript';
export const VIDEO_TYPE = 'video/mp4';
export const POSTER_TYPE = 'image/webp';
export const GLB_TYPE = 'model/gltf-binary';

/** Marks everything this tool publishes, so the library can be asked for "all of it" in a few pages. */
export const ORIGIN_TAG = 'origin:pathshala-3d';

const KEY_RE = /^(?:sha256:[0-9a-f]{64}|c1:[a-z2-7]{25}[aeimquy4])$/;
const SPDX_RE = /^(?:LicenseRef-[A-Za-z0-9.-]+|[A-Za-z0-9.+-]+(?: (?:AND|OR|WITH) [A-Za-z0-9.+-]+)*)$/;

/** The lab's id in the library: org.pathshalax.<subject>.<slug> (the figure id is the stable English slug). */
export function labId(subject, slug) {
  const part = (s) =>
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  if (!part(subject) || !part(slug)) throw new Error(`cannot make a lab id from subject "${subject}" and figure "${slug}"`);
  return `org.pathshalax.${part(subject)}.${part(slug)}`;
}

/** "Screw gauge (স্ক্রু-গেইজ)" → { en: "Screw gauge", bn: "স্ক্রু-গেইজ" }. A title in one language stays a plain string. */
export function splitTitle(title) {
  const m = /^(.+?)\s*\(([^()]*[ঀ-৿][^()]*)\)\s*$/.exec(String(title).trim());
  return m ? { bn: m[2].trim(), en: m[1].trim() } : String(title).trim();
}

const optionValue = (o) => (Array.isArray(o) ? o[0] : o);

function asBoolean(v) {
  if (typeof v === 'boolean') return v;
  return !['', '0', 'false', 'no', 'off'].includes(String(v).trim().toLowerCase());
}

/**
 * The figure's URL parameters as a lab's `params` (a JSON Schema subset, spec 1.5 §4). Types: select → string with an enum,
 * boolean → boolean (asset.json writes "1"/"0"), number → number, text → string. A default that is not a number stays out.
 */
export function paramsSchema(params = []) {
  const properties = {};
  for (const p of params) {
    if (!p?.name) continue;
    const base = { ...(p.label ? { title: p.label } : {}), ...(p.help ? { description: p.help } : {}) };
    if (p.type === 'boolean') {
      properties[p.name] = { type: 'boolean', ...base, ...(p.default !== undefined ? { default: asBoolean(p.default) } : {}) };
    } else if (p.type === 'number') {
      const n = Number(p.default);
      properties[p.name] = { type: 'number', ...base, ...(p.default !== undefined && p.default !== '' && Number.isFinite(n) ? { default: n } : {}) };
    } else if (p.type === 'select') {
      const values = (p.options || []).map(optionValue).map(String);
      properties[p.name] = {
        type: 'string',
        ...base,
        ...(values.length ? { enum: values } : {}),
        ...(p.default !== undefined ? { default: String(p.default) } : {}),
      };
    } else {
      properties[p.name] = { type: 'string', ...base, ...(p.default !== undefined ? { default: String(p.default) } : {}) };
    }
  }
  return { type: 'object', properties };
}

/** The version a figure is published under: asset.json's version, plus `+<fp8>` for work in progress (see decisions/0007). */
export function publishedVersion(figureVersion, fp8, { unbumped = false } = {}) {
  return unbumped ? `${figureVersion}+${fp8}` : figureVersion;
}

/**
 * Chooses the license text. The command line beats the config file. A license is optional in every tier: without one the items simply
 * carry no `license` field (this is the owners' own work; set one when it is decided). One that is given must be an SPDX expression.
 * @param {{ cli?: string|null, config?: string|null, tier?: string }} o
 * @returns {{ license: string|null, problems: string[], warnings: string[] }}
 */
export function resolveLicense({ cli, config }) {
  const license = (cli || config || '').trim() || null;
  const problems = [];
  const warnings = [];
  if (license && !SPDX_RE.test(license))
    problems.push(`the license "${license}" is not an SPDX expression (for example CC-BY-4.0, Apache-2.0 or LicenseRef-pathshala)`);
  return { license, problems, warnings };
}

/**
 * The lab manifest of a figure.
 * @param {object} o
 * @param {object} o.asset        the figure's asset.json
 * @param {object} o.book         its entry in books/books.json (subject, classes)
 * @param {string} o.version      the version to publish under
 * @param {string} o.fp8          first eight characters of the figure's source hash
 * @param {{ entry: string, poster?: string, libraries: Array<{ specifier: string, version: string, asset: string }> }} o.keys
 * @param {Array<{ pose: string, asset: string }>} [o.glb]
 * @param {string|null} o.license
 * @param {{ width?: number, height?: number, minWidth?: number, minHeight?: number }} [o.size]
 * @returns {Record<string, any>}
 */
export function labManifest({ asset, book, version, fp8, keys, glb = [], license, size = {} }) {
  const subject = book?.subject || 'physics';
  const manifest = {
    format: 'chalk.lab',
    manifestVersion: 1,
    id: labId(subject, asset.id),
    version,
    title: splitTitle(asset.title),
    ...(asset.description ? { description: { en: asset.description } } : {}),
    subject,
    classes: (book?.classes || []).map(String),
    tags: [...new Set(asset.tags || [])],
    entry: keys.entry,
    ...(keys.poster ? { poster: keys.poster } : {}),
    libraries: keys.libraries,
    capabilities: [],
    size: { width: size.width ?? 800, height: size.height ?? 500, minWidth: size.minWidth ?? 390, minHeight: size.minHeight ?? 390 },
    params: paramsSchema(asset.params),
    ...(license ? { license } : {}),
    ...(asset.maintainers?.length ? { authors: [...asset.maintainers] } : {}),
    // our own block: the manifest format ignores keys it does not know (spec 1.5 §4)
    'x-pathshala': {
      figure: asset.id,
      figureVersion: asset.version,
      type: asset.type,
      book: asset.book,
      page: asset.page,
      topic: asset.topic,
      ...(asset.units ? { units: asset.units } : {}),
      source: fp8,
      format: LIBRARY_FORMAT_VERSION,
      glb: glb.map((g) => ({ pose: g.pose, asset: g.asset })),
    },
  };
  return manifest;
}

/**
 * Problems that would make the library (or a reader) refuse the manifest; empty means fine. The checks are the spec's lab manifest
 * (the schema of @chalk-format/core, which a reader uses) and that the manifest's own default settings are valid settings.
 */
export function validateLabManifest(m) {
  const problems = [];
  const need = (ok, text) => ok || problems.push(text);
  need(m?.format === 'chalk.lab' && m?.manifestVersion === 1, 'format must be "chalk.lab" and manifestVersion 1');
  need(typeof m?.id === 'string' && m.id.length > 0 && m.id.length <= 200, 'id is missing or too long');
  need(typeof m?.version === 'string' && m.version.length > 0 && m.version.length <= 64, 'version is missing or too long');
  need(typeof m?.title === 'string' || (m?.title && typeof m.title === 'object'), 'title is missing');
  need(KEY_RE.test(m?.entry || ''), 'entry is not an asset key');
  if (m?.poster !== undefined) need(KEY_RE.test(m.poster), 'poster is not an asset key');
  for (const l of m?.libraries || [])
    need(l.specifier && l.version && KEY_RE.test(l.asset || ''), `library ${l.specifier}: needs specifier, version and an asset key`);
  for (const [name, p] of Object.entries(m?.params?.properties || {})) {
    need(['number', 'integer', 'boolean', 'string'].includes(p.type), `param ${name}: type ${p.type} is not allowed`);
    if (p.enum) need(p.enum.length > 0, `param ${name}: empty enum`);
  }
  const parsed = labManifestSchema.safeParse(m);
  if (!parsed.success) for (const issue of parsed.error.issues) problems.push(`${issue.path.join('.') || 'manifest'}: ${issue.message}`);
  else problems.push(...checkLabParams(parsed.data, labParams(parsed.data)));
  return [...new Set(problems)];
}

/** The settings a lab starts with: the defaults of `params`. Used to check the lab runs on its own defaults. */
export function defaultParams(manifest) {
  return Object.fromEntries(
    Object.entries(manifest.params?.properties || {})
      .filter(([, p]) => p.default !== undefined)
      .map(([k, p]) => [k, p.default]),
  );
}

const tag = (key, value) => `${key}:${value}`;

/**
 * The tags of one published item.
 * @param {Record<string, any>} o `kind` is manifest | lab | poster | glb | library; `state` (current | superseded) is only on
 * manifests. Everything is searchable by exact tag, which is how the next run finds what is already there.
 */
export function recordTags({
  kind,
  figure,
  figureVersion,
  page,
  topic,
  book,
  subject,
  license,
  fp8,
  fingerprints,
  commit,
  pose,
  specifier,
  libraryVersion,
  state,
  published,
  needs,
}) {
  const tags = [ORIGIN_TAG, tag('kind', kind)];
  for (const need of needs || []) tags.push(tag('needs', need));
  if (subject) tags.push(subject);
  if (book) tags.push(tag('book', book));
  if (license) tags.push(tag('license', license));
  if (figure) tags.push(tag('figure', figure), tag('figure-version', figureVersion), tag('source', fp8));
  if (page !== undefined && page !== null) tags.push(tag('page', page));
  if (topic) tags.push(tag('topic', topic));
  if (pose) tags.push(tag('pose', pose));
  if (specifier) tags.push(tag('library', specifier), tag('library-version', libraryVersion));
  if (fingerprints?.lab) tags.push(tag('fp-lab', fingerprints.lab.slice(0, 16)));
  if (fingerprints?.glb) tags.push(tag('fp-glb', fingerprints.glb.slice(0, 16)));
  if (fingerprints?.poster) tags.push(tag('fp-poster', fingerprints.poster.slice(0, 16)));
  if (fingerprints?.video) tags.push(tag('fp-video', fingerprints.video.slice(0, 16)));
  if (commit) tags.push(tag('commit', commit.slice(0, 12)));
  if (state) tags.push(tag('state', state));
  if (published) tags.push(tag('published', published));
  return tags;
}

/** The value of a `key:value` tag on a record, or undefined. */
export function tagValue(record, key) {
  const prefix = `${key}:`;
  return (record?.tags || []).find((t) => t.startsWith(prefix))?.slice(prefix.length);
}
