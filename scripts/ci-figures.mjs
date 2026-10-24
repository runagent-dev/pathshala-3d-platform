#!/usr/bin/env node
// For CI: which figures a change touches, as `figures=<ids>` (for $GITHUB_OUTPUT), plus `templates=true|false`.
// A change to shared code, tooling or templates touches every figure; a studio-only change (reviews, status,
// notes) touches none, so the slow browser jobs are skipped.
//
//   node scripts/ci-figures.mjs <base-ref>
import { execFileSync } from 'node:child_process';
import { figuresTouched } from './check/index.mjs';
import { ROOT } from './lib/paths.mjs';

const base = process.argv[2] || 'HEAD~1';
const files = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
const STUDIO_ONLY = /^assets\/[^/]+\/(reviews\/|status\.json$|NOTES\.md$)/;
const relevant = files.filter((f) => !STUDIO_ONLY.test(f));
console.log(`figures=${figuresTouched(relevant).join(',')}`);
console.log(`templates=${relevant.some((f) => /^(templates|shared|scripts)\//.test(f) || f === 'package-lock.json')}`);
