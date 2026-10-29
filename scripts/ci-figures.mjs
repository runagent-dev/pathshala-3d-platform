#!/usr/bin/env node
// For CI: which figures the browser tests must run for, as `figures=<ids>` (for $GITHUB_OUTPUT), plus `templates=true|false`.
// A change to the studio's own files (reviews, status, notes) or to the library sync and CI scripts touches no figure;
// a change to the kit, other tooling or the templates touches every figure that can be reached from it. With a folder of
// markers from earlier runs (--markers), a figure that already passed with exactly these inputs is left out.
//
//   node scripts/ci-figures.mjs <base-ref> [--markers <dir>]        plan (prints figures=, templates=, skipped=)
//   node scripts/ci-figures.mjs --record --markers <dir> --results <playwright.json>   remember the figures that passed
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { allFigures } from './check/index.mjs';
import { passedFigures, planRun, recordPassed } from './lib/ci/figure-tests.mjs';
import { CACHE_DIR, ROOT } from './lib/paths.mjs';

const { values, positionals } = parseArgs({
  options: { markers: { type: 'string' }, record: { type: 'boolean', default: false }, results: { type: 'string' } },
  allowPositionals: true,
});
const markersDir = path.resolve(values.markers || path.join(CACHE_DIR, 'figure-tests'));

if (values.record) {
  if (!values.results || !fs.existsSync(values.results)) {
    console.error('ci-figures: no test results to record (the tests did not get as far as writing them)');
    process.exit(0);
  }
  const passed = passedFigures(JSON.parse(fs.readFileSync(values.results, 'utf8')));
  const { written, pruned } = recordPassed({ root: ROOT, ids: allFigures(), passed, markersDir });
  console.error(`ci-figures: ${passed.length} figure(s) passed; ${written} new marker(s), ${pruned} old one(s) removed`);
} else {
  const base = positionals[0] || 'HEAD~1';
  const changedFiles = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  const plan = planRun({ root: ROOT, ids: allFigures(), changedFiles, markersDir });
  console.error(
    `ci-figures: ${plan.touched.length} figure(s) touched by the change, ${plan.skipped} already passed with the same inputs${plan.warm ? '' : ' (no earlier results: cold cache)'}, ${plan.figures.length} to test`,
  );
  console.log(`figures=${plan.figures.join(',')}`);
  console.log(`templates=${plan.templates}`);
  console.log(`skipped=${plan.skipped}`);
}
