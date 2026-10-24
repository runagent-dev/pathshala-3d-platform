// asset.json: validation against the contract (spec.mjs) plus the rules that need context, and the one
// canonical way to write the file (key order + compact JSON), so every writer produces the same bytes.
import fs from 'node:fs';
import path from 'node:path';
import { MANIFEST_SCHEMA, SCHEMA_VERSION, KEY_ORDER, PARAM_KEY_ORDER } from './spec.mjs';
import { validateSchema } from './schema.mjs';

export { MANIFEST_SCHEMA, SCHEMA_VERSION };
export const SCHEMA_REF = '../../schemas/asset.schema.json';

/**
 * Checks a manifest. Context (all optional):
 *   folder   the folder name (the id must equal it)
 *   books    the list from books/books.json (the book must exist)
 *   dir      the figure folder (the entry file must exist)
 *   profile  'default' | 'release' (release turns warnings into errors: used before approval)
 * Returns { errors, warnings } as lists of { path, message }.
 */
export function validateManifest(manifest, { folder, books, dir, profile = 'default' } = {}) {
  const errors = validateSchema(MANIFEST_SCHEMA, manifest);
  const warnings = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return { errors, warnings };
  const err = (p, message) => errors.push({ path: p, message });
  const warn = (p, message) => warnings.push({ path: p, message });

  if (folder && manifest.id !== folder) err('id', `must equal the folder name "${folder}"`);
  if (books && typeof manifest.book === 'string' && !books.some((b) => b.id === manifest.book)) {
    err('book', `"${manifest.book}" is not in books/books.json (known: ${books.map((b) => b.id).join(', ')})`);
  }
  if (dir && typeof manifest.entry === 'string' && !fs.existsSync(path.join(dir, manifest.entry))) {
    err('entry', `file "${manifest.entry}" does not exist`);
  }

  // params: names unique; a select lists its options; defaults fit the type
  const names = new Set();
  (Array.isArray(manifest.params) ? manifest.params : []).forEach((p, i) => {
    const at = `params[${i}]`;
    if (!p || typeof p !== 'object') return;
    if (names.has(p.name)) err(`${at}.name`, `"${p.name}" is declared twice`);
    names.add(p.name);
    if (p.type === 'select') {
      if (!Array.isArray(p.options)) return err(`${at}.options`, 'a select needs options');
      const values = p.options.map((o) => (Array.isArray(o) ? o[0] : o));
      if (p.default != null && !values.includes(String(p.default))) err(`${at}.default`, `${JSON.stringify(p.default)} is not one of the options`);
    } else if (p.options) {
      err(`${at}.options`, `only a select has options (this is "${p.type}")`);
    }
    if (p.type === 'boolean' && p.default != null && !['0', '1', true, false].includes(p.default)) err(`${at}.default`, 'a boolean default is "0" or "1"');
    if (p.type === 'number' && p.default != null && p.default !== '' && !Number.isFinite(Number(p.default))) err(`${at}.default`, 'must be a number');
  });

  // export: pose names unique; a script video has a script
  const ex = manifest.export;
  if (ex && typeof ex === 'object') {
    if (Array.isArray(ex.glb)) {
      const poses = new Set();
      ex.glb.forEach((g, i) => {
        if (poses.has(g?.name)) err(`export.glb[${i}].name`, `"${g.name}" is used twice`);
        poses.add(g?.name);
      });
    }
    const v = ex.video;
    if (v?.kind === 'script' && !v.script?.length) err('export.video.script', 'a "script" video needs a script');
    if (v?.kind === 'timeline' && manifest.type !== 'animation') warn('export.video.kind', '"timeline" is meant for animations');
    if (v?.script) for (let i = 1; i < v.script.length; i++) {
      if (v.script[i].at < v.script[i - 1].at) err(`export.video.script[${i}].at`, 'steps must be in time order');
      if (v.script[i].at > v.seconds) err(`export.video.script[${i}].at`, `is after the end of the video (${v.seconds} s)`);
    }
  }

  // what a figure needs before it is approved
  if (manifest.page == null) warn('page', 'no book page yet');
  if (!manifest.topic) warn('topic', 'no topic number yet');
  if (!manifest.placement?.trim()) warn('placement', 'say where on the page the figure goes');
  if (!manifest.maintainers?.length) warn('maintainers', 'add the GitHub username of whoever looks after it');
  if (!manifest.description?.trim()) warn('description', 'add a short description');
  if (manifest.type !== 'model' && !ex?.glb) warn('export.glb', 'decide whether it exports a GLB (poses, or { "skip": "why" })');

  if (profile === 'release') return { errors: [...errors, ...warnings], warnings: [] };
  return { errors, warnings };
}

/** Puts the keys in the canonical order (unknown keys at the end, in their original order). */
export function orderManifest(manifest) {
  const sortKeys = (obj, order) => {
    const out = {};
    for (const k of order) if (k in obj) out[k] = obj[k];
    for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k];
    return out;
  };
  const m = sortKeys(manifest, KEY_ORDER);
  if (Array.isArray(m.params)) m.params = m.params.map((p) => (p && typeof p === 'object' ? sortKeys(p, PARAM_KEY_ORDER) : p));
  return m;
}

/** The canonical text of an asset.json. */
export const formatManifest = (manifest) => stringifyJson(orderManifest(manifest)) + '\n';

/**
 * JSON with 2-space indent where every array or object that fits on one line (within `width`) is written on
 * one line: params read as one line each instead of a dozen. Deterministic, so formatting is checkable.
 */
export function stringifyJson(value, width = 120) {
  const inline = (v) => {
    if (Array.isArray(v)) return v.length ? `[${v.map(inline).join(', ')}]` : '[]';
    if (v && typeof v === 'object') {
      const entries = Object.entries(v).filter(([, x]) => x !== undefined);
      return entries.length ? `{ ${entries.map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`).join(', ')} }` : '{}';
    }
    return JSON.stringify(v);
  };
  const write = (v, indent, prefixLen, top) => {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    const flat = inline(v);
    if (!top && indent.length + prefixLen + flat.length <= width) return flat;
    const inner = indent + '  ';
    if (Array.isArray(v)) {
      if (!v.length) return '[]';
      return `[\n${v.map((x) => inner + write(x, inner, 0, false)).join(',\n')}\n${indent}]`;
    }
    const entries = Object.entries(v).filter(([, x]) => x !== undefined);
    if (!entries.length) return '{}';
    return `{\n${entries.map(([k, x]) => `${inner}${JSON.stringify(k)}: ${write(x, inner, JSON.stringify(k).length + 2, false)}`).join(',\n')}\n${indent}}`;
  };
  return write(value, '', 0, true);
}

/** Formats a list of problems for a terminal. */
export const describe = (problems) => problems.map((p) => `${p.path}: ${p.message}`);
