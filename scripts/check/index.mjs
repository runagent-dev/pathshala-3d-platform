#!/usr/bin/env node
// `npm run check`: fast static checks of every figure and of the repo (no browser, no install needed).
//
//   npm run check                      everything
//   npm run check -- screw-gauge       only these figures (plus the repo rules)
//   npm run check -- --changed         figures with uncommitted changes (all of them if shared/ or scripts/ changed)
//   npm run check -- --staged          figures with staged changes (what the pre-commit hook runs)
//   npm run check -- --profile release warnings count as errors (before a figure is approved)
//   npm run check -- --fix             fix what can be fixed automatically (asset.json formatting)
//   npm run check -- --json            machine-readable result
//
// Exit code 1 when there is any error. Rules live in scripts/check/rules/, one per file.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ASSETS_DIR, ID_RE, ROOT } from '../lib/paths.mjs';
import { loadBooks } from '../lib/books.mjs';
import { changedFiles } from '../lib/git.mjs';
import { execFileSync } from 'node:child_process';

const RULES_DIR = path.join(import.meta.dirname, 'rules');

export async function loadRules() {
  const rules = [];
  for (const name of fs
    .readdirSync(RULES_DIR)
    .filter((f) => f.endsWith('.mjs'))
    .sort()) {
    rules.push((await import(pathToFileURL(path.join(RULES_DIR, name)).href)).default);
  }
  return rules;
}

export function allFigures() {
  if (!fs.existsSync(ASSETS_DIR)) return [];
  return fs
    .readdirSync(ASSETS_DIR)
    .filter((id) => ID_RE.test(id) && fs.existsSync(path.join(ASSETS_DIR, id, 'asset.json')))
    .sort();
}

/** Which figures a set of changed paths touches; shared code, tooling or templates touch all of them. */
export function figuresTouched(files) {
  const all = allFigures();
  if (files.some((f) => /^(shared|scripts|templates|books|schemas)\//.test(f) || f === 'package.json')) return all;
  const ids = new Set();
  for (const f of files) {
    const m = /^assets\/([^/]+)\//.exec(f);
    if (m && all.includes(m[1])) ids.add(m[1]);
  }
  return [...ids].sort();
}

function stagedFiles() {
  try {
    return execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
  } catch {
    return null;
  }
}

/** Runs the rules. Returns [{ scope: id | 'repo', rule, level, file?, message }]. */
export async function runChecks({ ids = allFigures(), profile = 'default', repo = true, fix = false } = {}) {
  const rules = await loadRules();
  const books = loadBooks();
  const results = [];
  for (const id of ids) {
    const dir = path.join(ASSETS_DIR, id);
    const text = fs.readFileSync(path.join(dir, 'asset.json'), 'utf8');
    let manifest = null;
    const manifestText = { text };
    try {
      manifest = JSON.parse(text);
    } catch (err) {
      manifestText.error = err.message;
    }
    for (const rule of rules.filter((r) => r.scope === 'figure')) {
      for (const r of await rule.run({ id, dir, manifest, manifestText, books, profile })) {
        if (fix && r.fix) {
          r.fix();
          continue;
        }
        results.push({ scope: id, rule: rule.name, ...r, fix: undefined });
      }
    }
  }
  if (repo) {
    for (const rule of rules.filter((r) => r.scope === 'repo')) {
      for (const r of await rule.run({ books, profile })) {
        if (fix && r.fix) r.fix();
        else results.push({ scope: 'repo', rule: rule.name, ...r, fix: undefined });
      }
    }
  }
  return results;
}

function print(results, ids) {
  const scopes = [...ids, 'repo'];
  let errors = 0;
  let warnings = 0;
  for (const scope of scopes) {
    const mine = results.filter((r) => r.scope === scope);
    const e = mine.filter((r) => r.level === 'error').length;
    const w = mine.length - e;
    errors += e;
    warnings += w;
    console.log(`${e ? '✗' : w ? '!' : '✓'} ${scope === 'repo' ? 'repository' : scope}`);
    for (const r of mine.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))) {
      console.log(`    ${r.level === 'error' ? 'error  ' : 'warning'} ${r.file ? `${r.file}: ` : ''}${r.message}  [${r.rule}]`);
    }
  }
  console.log(
    `\n${ids.length} figure${ids.length === 1 ? '' : 's'} checked: ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`,
  );
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const opt = (name) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args.splice(i, 2)[1] : undefined;
  };
  const profile = opt('profile') || 'default';
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const named = args.filter((a) => !a.startsWith('--'));
  let ids = named.length ? named : allFigures();
  for (const id of named) {
    if (!allFigures().includes(id)) {
      console.error(`✗ No figure "${id}" in assets/`);
      process.exit(2);
    }
  }
  if (flags.has('--changed') || flags.has('--staged')) {
    const files = flags.has('--staged') ? stagedFiles() : changedFiles();
    if (files) ids = figuresTouched(files);
  }
  const results = await runChecks({ ids, profile, fix: flags.has('--fix') });
  if (flags.has('--json')) console.log(JSON.stringify({ figures: ids, results }, null, 2));
  else if (print(results, ids)) process.exitCode = 1;
  if (flags.has('--json') && results.some((r) => r.level === 'error')) process.exitCode = 1;
}
