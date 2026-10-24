// What a figure page really loads, found by reading its files: the entry HTML (import map, <script>, <link>,
// inline modules), then every JavaScript import (static, `export … from`, literal dynamic `import()`,
// `new URL('…', import.meta.url)`) and every CSS `@import` / `url()`, recursively.
//
// The packager copies exactly the shared files reached (plus the licences next to them), and the checker uses the
// same walk to refuse imports that don't resolve, reach outside the figure and shared/, or go to the internet.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SHARED_DIR } from './paths.mjs';

const LICENCE_RE = /^(LICEN[CS]E|COPYING|NOTICE|OFL|VERSION)(\.[\w-]+)?$/i;

/**
 * Removes comments from JavaScript, keeping strings, template literals and regular expressions intact (three.js
 * addons have example `import … from 'https://…'` lines inside their doc comments).
 */
export function stripJsComments(src) {
  let out = '';
  let i = 0;
  let lastSignificant = '';
  const n = src.length;
  const regexCanStart = () =>
    !lastSignificant ||
    /[(,=:[!&|?{};+\-*%<>~^]$/.test(lastSignificant) ||
    /\b(return|typeof|case|do|else|in|of|void|yield|await)$/.test(lastSignificant);
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && d === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end < 0 ? n : end + 2;
      out += ' ';
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < n && src[j] !== c) j += src[j] === '\\' ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
      lastSignificant = c;
      continue;
    }
    if (c === '/' && regexCanStart()) {
      let j = i + 1;
      let inClass = false;
      while (j < n && src[j] !== '\n' && (inClass || src[j] !== '/')) {
        if (src[j] === '\\') j++;
        else if (src[j] === '[') inClass = true;
        else if (src[j] === ']') inClass = false;
        j++;
      }
      out += src.slice(i, j + 1);
      i = j + 1;
      lastSignificant = '/';
      continue;
    }
    out += c;
    if (!/\s/.test(c)) lastSignificant = /[\w$]/.test(c) ? (/[\w$]/.test(lastSignificant.slice(-1)) ? lastSignificant + c : c).slice(-8) : c;
    i++;
  }
  return out;
}

/** Module specifiers a JavaScript file loads, each with how it loads it. */
export function jsSpecifiers(src) {
  const code = stripJsComments(src);
  const found = [];
  const add = (re, kind) => {
    for (const m of code.matchAll(re)) found.push({ spec: m[2], kind });
  };
  add(/(?:^|[;\n}])\s*import\s*(?:[\w$*{}\s,]+?from\s*)?(['"])([^'"\n]+)\1/gm, 'import');
  add(/(?:^|[;\n}])\s*export\s*(?:\*(?:\s*as\s+[\w$]+)?|\{[^}]*\})\s*from\s*(['"])([^'"\n]+)\1/gm, 'import');
  add(/\bimport\(\s*(['"])([^'"\n]+)\1\s*\)/g, 'import');
  add(/\bnew\s+URL\(\s*(['"])([^'"\n]+)\1\s*,\s*import\.meta\.url\s*\)/g, 'url');
  return found;
}

/** URLs a stylesheet loads (@import and url()). */
export function cssUrls(src) {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const found = [];
  for (const m of code.matchAll(/@import\s+(?:url\(\s*)?(['"]?)([^'")\s;]+)\1/g)) found.push(m[2]);
  for (const m of code.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) found.push(m[2].trim());
  return [...new Set(found)];
}

/** What an HTML page loads: its import map, script/link/media URLs, and the code of inline modules. */
export function htmlRefs(src) {
  const html = src.replace(/<!--[\s\S]*?-->/g, ' ');
  let importMap = {};
  const inline = [];
  const urls = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    const srcAttr = /\bsrc\s*=\s*(['"])([^'"]+)\1/i.exec(attrs);
    if (/\btype\s*=\s*(['"])importmap\1/i.test(attrs)) importMap = JSON.parse(m[2]).imports || {};
    else if (srcAttr) urls.push(srcAttr[2]);
    else if (/\btype\s*=\s*(['"])module\1/i.test(attrs)) inline.push(m[2]);
  }
  for (const m of html.matchAll(/<link\b([^>]*)>/gi)) {
    const href = /\bhref\s*=\s*(['"])([^'"]+)\1/i.exec(m[1]);
    if (href && /\brel\s*=\s*(['"])[^'"]*(stylesheet|modulepreload|preload|icon|manifest)[^'"]*\1/i.test(m[1])) urls.push(href[2]);
  }
  for (const m of html.matchAll(/<(?:img|source|video|audio|track)\b[^>]*\bsrc\s*=\s*(['"])([^'"]+)\1/gi)) urls.push(m[2]);
  return { importMap, inline, urls };
}

const isExternal = (u) => /^[a-z][a-z0-9+.-]*:/i.test(u) && !/^(data|blob):/i.test(u);
const isIgnorable = (u) => /^(data|blob):/i.test(u) || u.startsWith('#') || u === '';
const clean = (u) => u.split(/[?#]/)[0];

/**
 * Walks a figure from its entry page. Returns:
 *   files     Set of absolute paths reached (the entry included)
 *   problems  [{ file, ref, kind: 'missing' | 'external' | 'bare' | 'absolute' | 'outside', message }]
 * `allowed` are the folders a figure may load from (its own folder and shared/).
 */
export function figureGraph(dir, entry = 'index.html', { allowed = [dir, SHARED_DIR] } = {}) {
  const files = new Set();
  const problems = [];
  const start = path.join(dir, entry);
  const rel = (f) => path.relative(ROOT, f);
  const problem = (file, ref, kind, message) => problems.push({ file: rel(file), ref, kind, message });
  let importMap = {};
  let mapBase = dir;

  function resolveUrl(from, ref, { bare = false } = {}) {
    if (isIgnorable(ref)) return null;
    if (isExternal(ref)) return problem(from, ref, 'external', `loads ${ref} from the internet; the book must work offline`), null;
    if (ref.startsWith('/'))
      return problem(from, ref, 'absolute', `uses the absolute path ${ref}; use a relative path so the zip works anywhere`), null;
    let target;
    if (bare && !ref.startsWith('./') && !ref.startsWith('../')) {
      const key = importMap[ref]
        ? ref
        : Object.keys(importMap)
            .filter((k) => k.endsWith('/') && ref.startsWith(k))
            .sort((a, b) => b.length - a.length)[0];
      if (!key) return problem(from, ref, 'bare', `imports "${ref}", which the import map does not define`), null;
      const mapped = importMap[key] + ref.slice(key.length);
      if (isExternal(mapped)) return problem(from, ref, 'external', `the import map sends "${ref}" to ${mapped}; the book must work offline`), null;
      target = path.resolve(mapBase, clean(mapped));
    } else {
      target = path.resolve(path.dirname(from), decodeURI(clean(ref)));
    }
    if (!allowed.some((a) => target === a || target.startsWith(a + path.sep))) {
      return problem(from, ref, 'outside', `reaches ${rel(target)}, outside the figure and shared/`), null;
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return problem(from, ref, 'missing', `${ref} does not exist (${rel(target)})`), null;
    return target;
  }

  function visit(file) {
    if (files.has(file)) return;
    files.add(file);
    const ext = path.extname(file).toLowerCase();
    if (ext === '.js' || ext === '.mjs') {
      for (const { spec, kind } of jsSpecifiers(fs.readFileSync(file, 'utf8'))) {
        const t = resolveUrl(file, spec, { bare: kind === 'import' });
        if (t) visit(t);
      }
    } else if (ext === '.css') {
      for (const u of cssUrls(fs.readFileSync(file, 'utf8'))) {
        const t = resolveUrl(file, u);
        if (t) visit(t);
      }
    }
  }

  if (!fs.existsSync(start)) {
    problem(start, entry, 'missing', `entry ${entry} does not exist`);
    return { files, problems };
  }
  files.add(start);
  if (/\.html?$/i.test(entry)) {
    const { importMap: map, inline, urls } = htmlRefs(fs.readFileSync(start, 'utf8'));
    importMap = map;
    mapBase = path.dirname(start);
    for (const [k, v] of Object.entries(importMap)) {
      if (isExternal(v)) problem(start, v, 'external', `the import map sends "${k}" to ${v}; the book must work offline`);
    }
    for (const u of urls) {
      const t = resolveUrl(start, u);
      if (t) visit(t);
    }
    for (const code of inline) {
      for (const { spec, kind } of jsSpecifiers(code)) {
        const t = resolveUrl(start, spec, { bare: kind === 'import' });
        if (t) visit(t);
      }
    }
  }
  return { files, problems };
}

/** Licence and version files that must travel with the shared files reached (three's LICENSE, the font's OFL). */
export function licenceFiles(files) {
  const extra = new Set();
  for (const f of files) {
    if (!f.startsWith(SHARED_DIR + path.sep)) continue;
    for (let d = path.dirname(f); d.startsWith(SHARED_DIR + path.sep); d = path.dirname(d)) {
      for (const name of fs.readdirSync(d)) {
        const p = path.join(d, name);
        if (LICENCE_RE.test(name) && fs.statSync(p).isFile()) extra.add(p);
      }
    }
  }
  return extra;
}
